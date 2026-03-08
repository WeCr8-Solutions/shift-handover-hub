import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrganization } from "./useUserOrganization";
import { toast } from "sonner";

export type DNCProtocol = "ftp" | "serial" | "ethernet" | "websocket" | "usb";
export type DNCConnectionStatus = "disconnected" | "connecting" | "connected" | "error" | "transferring";

export interface DNCConfig {
  protocol: DNCProtocol;
  host?: string;
  port?: number;
  baudRate?: number;
  machineId?: string;
  stationId: string;
  programDirectory?: string;
}

export interface DNCSession {
  id: string;
  stationId: string;
  protocol: DNCProtocol;
  status: DNCConnectionStatus;
  connectedAt: string | null;
  lastActivity: string | null;
  activeProgramName: string | null;
  activeProgramLine: number | null;
  transferProgress: number | null;
}

export function useDNCConnector(stationId?: string) {
  const { user } = useAuth();
  const { organization } = useUserOrganization();
  const [status, setStatus] = useState<DNCConnectionStatus>("disconnected");
  const [session, setSession] = useState<DNCSession | null>(null);
  const [connecting, setConnecting] = useState(false);

  const initializeConnection = useCallback(async (config: DNCConfig) => {
    if (!user || !organization?.id) {
      toast.error("Authentication required");
      return null;
    }

    setConnecting(true);
    setStatus("connecting");

    try {
      // Register DNC session via edge function (future)
      // For now, record intent in app_settings as a DNC config entry
      const { data, error } = await supabase
        .from("app_settings")
        .upsert({
          organization_id: organization.id,
          setting_key: `dnc_config_${config.stationId}`,
          setting_type: "json",
          setting_value: {
            protocol: config.protocol,
            host: config.host || null,
            port: config.port || null,
            baudRate: config.baudRate || null,
            machineId: config.machineId || null,
            programDirectory: config.programDirectory || null,
            configuredBy: user.id,
            configuredAt: new Date().toISOString(),
          },
          updated_by: user.id,
        }, { onConflict: "organization_id,setting_key" })
        .select()
        .single();

      if (error) throw error;

      const newSession: DNCSession = {
        id: data.id,
        stationId: config.stationId,
        protocol: config.protocol,
        status: "connected",
        connectedAt: new Date().toISOString(),
        lastActivity: null,
        activeProgramName: null,
        activeProgramLine: null,
        transferProgress: null,
      };

      setSession(newSession);
      setStatus("connected");
      toast.success(`DNC ${config.protocol.toUpperCase()} configured for station`);
      return newSession;
    } catch (err: any) {
      console.error("DNC connection error:", err);
      setStatus("error");
      toast.error("Failed to configure DNC connection");
      return null;
    } finally {
      setConnecting(false);
    }
  }, [user, organization]);

  const getStationDNCConfig = useCallback(async (targetStationId: string) => {
    if (!organization?.id) return null;

    const { data } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("organization_id", organization.id)
      .eq("setting_key", `dnc_config_${targetStationId}`)
      .maybeSingle();

    return data?.setting_value as Record<string, unknown> | null;
  }, [organization]);

  const disconnect = useCallback(async (targetStationId: string) => {
    if (!organization?.id) return;

    await supabase
      .from("app_settings")
      .delete()
      .eq("organization_id", organization.id)
      .eq("setting_key", `dnc_config_${targetStationId}`);

    setSession(null);
    setStatus("disconnected");
    toast.success("DNC connection removed");
  }, [organization]);

  return {
    status,
    session,
    connecting,
    initializeConnection,
    getStationDNCConfig,
    disconnect,
  };
}

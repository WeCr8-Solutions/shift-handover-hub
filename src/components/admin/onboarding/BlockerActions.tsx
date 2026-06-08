import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowDown, CheckCircle2, Gift, ImageIcon, Loader2, Send, Sparkles, Upload, Users } from "lucide-react";
import { woToast } from "@/lib/woToast";
import { useQueryClient } from "@tanstack/react-query";

type Action = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void | Promise<void>;
  variant?: "default" | "outline" | "secondary";
};

interface Props {
  organizationId: string;
  blockers: string[];
  onScrollTo: (sectionId: string) => void;
  onChanged?: () => void;
}

const scrollTarget = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("ring-2", "ring-primary");
    setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 1600);
  }
};

export function BlockerActions({ organizationId, blockers, onScrollTo, onChanged }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (!blockers.length) {
    return (
      <div className="rounded border border-status-ok/40 p-3 text-xs flex items-center gap-2 text-status-ok">
        <CheckCircle2 className="w-4 h-4" /> No blockers — ready to activate.
      </div>
    );
  }

  async function uploadLogo(file: File) {
    setBusy("branding");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${organizationId}/logo-light.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("org-branding")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("org-branding").getPublicUrl(path);
      const { error: brErr } = await supabase
        .from("organization_branding")
        .upsert(
          { organization_id: organizationId, logo_light_url: pub.publicUrl },
          { onConflict: "organization_id" },
        );
      if (brErr) throw brErr;
      woToast.success("Logo uploaded");
      await qc.invalidateQueries({ queryKey: ["production-readiness", organizationId] });
      onChanged?.();
    } catch (e: any) {
      woToast.error(e?.message ?? "Logo upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function grantComp() {
    if (!confirm("Grant complimentary Team-tier access to this organization?")) return;
    setBusy("subscription");
    try {
      const { error } = await (supabase.rpc as any)("admin_grant_complimentary_access", {
        p_org_id: organizationId,
        p_tier: "team",
      });
      if (error) throw error;
      woToast.success("Complimentary access granted");
      await qc.invalidateQueries({ queryKey: ["production-readiness", organizationId] });
      onChanged?.();
    } catch (e: any) {
      woToast.error(e?.message ?? "Grant failed");
    } finally {
      setBusy(null);
    }
  }

  function actionsFor(b: string): Action[] {
    const lower = b.toLowerCase();
    if (lower.includes("branding") || lower.includes("logo")) {
      return [
        {
          label: busy === "branding" ? "Uploading…" : "Upload logo",
          icon: busy === "branding" ? Loader2 : Upload,
          onClick: () => fileRef.current?.click(),
        },
      ];
    }
    if (lower.includes("subscription")) {
      return [
        {
          label: busy === "subscription" ? "Granting…" : "Grant complimentary",
          icon: busy === "subscription" ? Loader2 : Gift,
          onClick: grantComp,
        },
        { label: "Open billing", icon: Sparkles, variant: "outline", onClick: () => onScrollTo("payment-panel") },
      ];
    }
    if (lower.includes("admin") && lower.includes("assigned")) {
      return [
        { label: "Invite owner", icon: Send, onClick: () => onScrollTo("owner-invite-panel") },
      ];
    }
    if (lower.includes("operator") || lower.includes("supervisor") || lower.includes("signed in")) {
      return [
        { label: "Owner & team invites", icon: Users, onClick: () => onScrollTo("owner-invite-panel") },
      ];
    }
    if (lower.includes("queue") || lower.includes("routing applied")) {
      return [
        { label: "Seed shop & smoke test", icon: Sparkles, onClick: () => onScrollTo("readiness-panel") },
      ];
    }
    if (lower.includes("payment")) {
      return [{ label: "Open payment", icon: ArrowDown, onClick: () => onScrollTo("payment-panel") }];
    }
    if (lower.includes("contract")) {
      return [{ label: "Open contract", icon: ArrowDown, onClick: () => onScrollTo("contract-panel") }];
    }
    if (lower.includes("erp")) {
      return [{ label: "Configure ERP", icon: ArrowDown, onClick: () => onScrollTo("readiness-panel") }];
    }
    return [];
  }

  return (
    <div className="rounded border border-destructive/40 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-destructive">
        <AlertTriangle className="w-3.5 h-3.5" /> Blockers — click to resolve
      </div>
      <ul className="space-y-1.5">
        {blockers.map((b, i) => {
          const actions = actionsFor(b);
          return (
            <li
              key={i}
              className="flex items-center gap-2 flex-wrap text-xs border-b last:border-0 pb-1.5 last:pb-0"
            >
              <Badge variant="outline" className="text-destructive border-destructive/40 shrink-0">
                <ImageIcon className="w-3 h-3 mr-1 opacity-50" /> Open
              </Badge>
              <span className="flex-1 min-w-[160px]">{b}</span>
              <div className="flex items-center gap-1 flex-wrap">
                {actions.length === 0 ? (
                  <span className="text-muted-foreground italic">Manual</span>
                ) : (
                  actions.map((a, idx) => {
                    const Icon = a.icon;
                    const isLoading =
                      (a.label.includes("Uploading") || a.label.includes("Granting"));
                    return (
                      <Button
                        key={idx}
                        size="sm"
                        variant={a.variant ?? "default"}
                        onClick={() => a.onClick()}
                        disabled={!!busy}
                        className="h-7 px-2 text-xs gap-1"
                      >
                        <Icon className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                        {a.label}
                      </Button>
                    );
                  })
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadLogo(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

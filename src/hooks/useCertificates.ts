import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CertificateProgram, CertificateRecord, OapVertical } from "@/lib/certificates";

interface IssueArgs {
  program: CertificateProgram;
  vertical?: OapVertical;
  recipientName: string;
  recipientEmail: string;
  programName: string;
  organizationId?: string | null;
  rolePragramId?: string | null;
  bankId?: string | null;
  validUntil?: string | null;
  amountCents?: number;
  items?: Array<{
    item_type:
      | "machine"
      | "inspection_tool"
      | "machining_operation"
      | "safety_credential"
      | "course"
      | "vertical_role"
      | "trade_tool"
      | "license";
    item_slug?: string | null;
    display_label: string;
  }>;
  sendEmail?: boolean;
}

export function useCertificates() {
  const { session } = useAuth();
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issueCertificate = useCallback(async (args: IssueArgs) => {
    setIssuing(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("issue-certificate", {
        body: args,
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error ?? "Failed to issue certificate");
      return data as { ok: true; certId: string; program: CertificateProgram; record: any };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      throw e;
    } finally {
      setIssuing(false);
    }
  }, [session]);

  /** Public lookup — works without auth (RLS is `USING (true)` for SELECT). */
  const lookupCertificate = useCallback(async (certId: string): Promise<CertificateRecord | null> => {
    const program: CertificateProgram | null = certId.startsWith("OAP-") ? "OAP" : certId.startsWith("GCA-") ? "GCA" : null;
    if (!program) return null;
    const table = program === "OAP" ? "oap_certificates" : "gca_certificates";

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("cert_id", certId)
      .maybeSingle();
    if (error || !data) return null;

    let items: CertificateRecord["items"] = [];
    if (program === "OAP") {
      const { data: rows } = await supabase
        .from("oap_certificate_items")
        .select("item_type, display_label, sort_order")
        .eq("certificate_id", data.id)
        .order("sort_order", { ascending: true });
      items = (rows ?? []).map((r: any) => ({ type: r.item_type, label: r.display_label }));
    }

    return {
      certId: data.cert_id,
      qrToken: data.qr_token,
      program,
      programName: data.program_name,
      recipientName: data.recipient_name,
      recipientEmail: data.recipient_email,
      organizationName: null,
      status: data.status as CertificateRecord["status"],
      validFrom: data.valid_from,
      validUntil: data.valid_until,
      issuedAt: data.issued_at,
      pdfUrl: data.pdf_url,
      items,
    };
  }, []);

  return { issueCertificate, lookupCertificate, issuing, error };
}

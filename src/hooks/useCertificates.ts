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

  /**
   * Public lookup — uses SECURITY DEFINER RPC so anonymous visitors can verify
   * without exposing recipient_email or stripe_session_id.
   */
  const lookupCertificate = useCallback(async (certId: string): Promise<CertificateRecord | null> => {
    const program: CertificateProgram | null = certId.startsWith("OAP-") ? "OAP" : certId.startsWith("GCA-") ? "GCA" : null;
    if (!program) return null;

    const rpc = program === "OAP" ? "verify_oap_certificate" : "verify_gca_certificate";
    const { data, error } = await supabase.rpc(rpc, { _cert_id: certId });
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row) return null;

    let items: CertificateRecord["items"] = [];
    if (program === "OAP") {
      const { data: rows } = await supabase
        .from("oap_certificate_items")
        .select("item_type, display_label, sort_order")
        .eq("certificate_id", row.cert_id) // FK is on id; if items lookup needs id, owner-auth context required
        .order("sort_order", { ascending: true });
      items = (rows ?? []).map((r: any) => ({ type: r.item_type, label: r.display_label }));
    }

    return {
      certId: row.cert_id,
      qrToken: row.qr_token,
      program,
      programName: row.program_name,
      recipientName: row.recipient_name,
      recipientEmail: null, // intentionally hidden on public verification
      organizationName: null,
      status: row.status as CertificateRecord["status"],
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      issuedAt: row.issued_at,
      pdfUrl: row.pdf_url,
      items,
    };
  }, []);

  return { issueCertificate, lookupCertificate, issuing, error };
}

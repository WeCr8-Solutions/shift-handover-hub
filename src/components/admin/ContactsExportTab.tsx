import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, Mail, Phone, MapPin, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { downloadVistaPrintXlsx, parseUsAddressLine } from "@/lib/vistaPrintExport";

interface ContactRecord {
  id: string;
  stop_name: string;
  zone_number: number;
  contact_name: string | null;
  contact_title: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  mailing_consent: boolean;
  medium_name: string | null;
  flyer_design: string | null;
  visited_at: string;
  interaction_flags: string[];
}

interface Props {
  campaignId: string | null;
}

type ExportType = "all" | "email" | "postcard" | "consented";

export function ContactsExportTab({ campaignId }: Props) {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportType, setExportType] = useState<ExportType>("all");

  const load = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    const { data } = await supabase
      .from("flyer_stop_visits" as never)
      .select("id,stop_name,zone_number,contact_name,contact_title,business_email,business_phone,business_address,mailing_consent,medium_name,flyer_design,visited_at,interaction_flags")
      .eq("campaign_id" as never, campaignId as never)
      .order("visited_at" as never, { ascending: false }) as unknown as { data: ContactRecord[] | null };
    setContacts(data ?? []);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { load(); }, [load]);

  // Deduplicate by stop_name, keeping the most recent visit per business
  const uniqueMap = new Map<string, ContactRecord>();
  for (const c of contacts) {
    const key = c.stop_name.toLowerCase();
    if (!uniqueMap.has(key)) uniqueMap.set(key, c);
  }
  const unique = Array.from(uniqueMap.values());

  const filtered = unique.filter(c => {
    if (exportType === "email") return !!c.business_email;
    if (exportType === "postcard") return !!c.business_address;
    if (exportType === "consented") return c.mailing_consent;
    return true;
  });

  const emailCount = unique.filter(c => c.business_email).length;
  const addressCount = unique.filter(c => c.business_address).length;
  const consentCount = unique.filter(c => c.mailing_consent).length;

  function exportCsv() {
    if (filtered.length === 0) {
      toast.error("No contacts to export");
      return;
    }
    const headers = [
      "Business Name", "Zone", "Contact Name", "Contact Title",
      "Email", "Phone", "Mailing Address", "Mailing Consent",
      "Flyer Type", "Last Medium", "Last Visit", "Interaction",
    ];
    const rows = filtered.map(c => [
      c.stop_name,
      `Zone ${c.zone_number}`,
      c.contact_name ?? "",
      c.contact_title ?? "",
      c.business_email ?? "",
      c.business_phone ?? "",
      c.business_address ?? "",
      c.mailing_consent ? "Yes" : "No",
      c.flyer_design ?? "",
      c.medium_name ?? "",
      new Date(c.visited_at).toLocaleDateString(),
      (c.interaction_flags ?? []).join("; "),
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts_${exportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} contacts`);
  }

  async function exportVistaXlsx() {
    const eligible = unique.filter(c => !!c.business_address);
    if (eligible.length === 0) {
      toast.error("No contacts have a mailing address.");
      return;
    }
    const rows = eligible.map(c => {
      const parsed = parseUsAddressLine(c.business_address ?? "");
      return {
        recipient: c.contact_name ?? "",
        company: c.stop_name,
        address: parsed.address,
        city: parsed.city,
        state: parsed.state,
        zip: parsed.zip,
      };
    });
    const count = await downloadVistaPrintXlsx(rows, "vista_postcard_list");
    toast.success(`Vista Print list exported — ${count} recipients.`);
  }

  if (!campaignId) {
    return <p className="text-sm text-muted-foreground p-4">No campaign selected.</p>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-base">Business Contacts</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={exportType} onValueChange={v => setExportType(v as ExportType)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contacts ({unique.length})</SelectItem>
                <SelectItem value="email">With Email ({emailCount})</SelectItem>
                <SelectItem value="postcard">With Address ({addressCount})</SelectItem>
                <SelectItem value="consented">Mailing Consent ({consentCount})</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={exportVistaXlsx}
              className="gap-1.5"
              title={`Vista Print upload template — ${addressCount} address${addressCount === 1 ? "" : "es"} ready`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Vista Print XLSX ({addressCount})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4 flex-wrap text-sm">
          <span className="flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-primary" /> {emailCount} emails
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" /> {addressCount} addresses
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> {consentCount} consented
          </span>
          <span className="flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-muted-foreground" /> {unique.filter(c => c.business_phone).length} phones
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading contacts…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No contacts found. Business emails and addresses are collected during field visits.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">Business</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="w-[60px]">Consent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium text-sm">{c.stop_name}</span>
                        <span className="block text-xs text-muted-foreground">Zone {c.zone_number}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.contact_name ?? "—"}
                      {c.contact_title && (
                        <span className="block text-xs text-muted-foreground">{c.contact_title}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{c.business_email ?? "—"}</TableCell>
                    <TableCell className="text-sm">{c.business_phone ?? "—"}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{c.business_address ?? "—"}</TableCell>
                    <TableCell>
                      {c.mailing_consent ? (
                        <Badge variant="default" className="text-[10px]">Yes</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">No</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useAdminAccess } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function ManualUpload() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { hasOrgAdminAccess } = useAdminAccess();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  if (user && !hasOrgAdminAccess) {
    return <Navigate to="/manuals" replace />;
  }
  const [form, setForm] = useState({
    manufacturer: "",
    controller_family: "",
    machine_model: "",
    manual_type: "operator",
    title: "",
    edition: "",
    source_url: "",
    copyright_notice: "",
    tags: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !organization?.id) return toast.error("Sign in required");
    if (!file) return toast.error("Select a PDF file");
    if (!confirmed) return toast.error("Please confirm copyright disclosure");
    if (!form.copyright_notice.trim()) return toast.error("Copyright notice is required");

    setSubmitting(true);
    try {
      const slug = `${form.manufacturer}-${form.machine_model || form.controller_family || "manual"}-${form.manual_type}`
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const storagePath = `${organization.id}/${slug}-${Date.now()}.pdf`;

      const { error: upErr } = await supabase.storage
        .from("machine-manuals")
        .upload(storagePath, file, { contentType: "application/pdf" });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("machine_manuals").insert({
        organization_id: organization.id,
        is_canonical: false,
        slug,
        manufacturer: form.manufacturer,
        controller_family: form.controller_family || null,
        machine_model: form.machine_model || null,
        manual_type: form.manual_type,
        title: form.title,
        edition: form.edition || null,
        source_url: form.source_url || null,
        storage_path: storagePath,
        file_size_bytes: file.size,
        copyright_notice: form.copyright_notice,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        uploaded_by: user.id,
      });
      if (insErr) throw insErr;

      toast.success("Manual uploaded");
      navigate(`/manuals/${slug}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Helmet>
        <title>Upload Manual — JobLine</title>
      </Helmet>
      <Card>
        <CardHeader>
          <CardTitle>Upload Machine or Control Manual</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Manufacturer *</Label>
                <Input required value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} placeholder="Haas" />
              </div>
              <div>
                <Label>Manual type *</Label>
                <select className="w-full border border-input bg-background rounded-md h-10 px-3" value={form.manual_type} onChange={(e) => setForm({ ...form, manual_type: e.target.value })}>
                  <option value="operator">Operator</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="programming">Programming</option>
                  <option value="parameters">Parameters</option>
                  <option value="alarms">Alarms</option>
                  <option value="installation">Installation</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Machine model</Label>
                <Input value={form.machine_model} onChange={(e) => setForm({ ...form, machine_model: e.target.value })} placeholder="VF-2" />
              </div>
              <div>
                <Label>Controller family</Label>
                <Input value={form.controller_family} onChange={(e) => setForm({ ...form, controller_family: e.target.value })} placeholder="Haas NGC" />
              </div>
            </div>
            <div>
              <Label>Title *</Label>
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Haas VF-2 Operator's Manual" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Edition</Label>
                <Input value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value })} placeholder="2024 Rev A" />
              </div>
              <div>
                <Label>Source URL</Label>
                <Input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} placeholder="https://www.haascnc.com/..." />
              </div>
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="vmc, fanuc, alarms" />
            </div>
            <div>
              <Label>Copyright notice *</Label>
              <Textarea required value={form.copyright_notice} onChange={(e) => setForm({ ...form, copyright_notice: e.target.value })} placeholder="© 2024 Haas Automation, Inc. All rights reserved." />
            </div>
            <div>
              <Label>PDF file *</Label>
              <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
            </div>
            <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
              <Checkbox id="confirm" checked={confirmed} onCheckedChange={(c) => setConfirmed(c === true)} />
              <Label htmlFor="confirm" className="text-sm leading-snug cursor-pointer">
                I confirm this PDF is publicly distributed by the OEM and the copyright notice above has been preserved from the original.
              </Label>
            </div>
            <Button type="submit" disabled={submitting || !confirmed} className="w-full">
              {submitting ? "Uploading…" : "Upload Manual"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

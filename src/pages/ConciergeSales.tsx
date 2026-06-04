import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, FileText, Loader2, Mail, Phone, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConciergeButton } from "@/components/marketing/ConciergeCTA";

const PAYMENT_METHODS = [
  "Check (mailed)",
  "ACH / Wire transfer",
  "Purchase order (Net 30)",
  "Credit card (over the phone)",
  "Stripe (online)",
];

const INCLUDES = [
  "On-site or remote kickoff with your supervisor team",
  "Equipment, stations, and routing configured by our team",
  "Users, roles, and ERP connector set up before go-live",
  "Printed Master Services Agreement & onboarding worksheets",
  "Production-ready handoff certified by JobLine.ai",
];

export default function ConciergeSales() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    company: "",
    contact_name: "",
    email: "",
    phone: "",
    shop_size: "",
    itar: false,
    notes: "",
  });

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company.trim() || !form.email.trim() || !form.contact_name.trim()) {
      toast.error("Company, contact name, and email are required");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("email_leads" as any).insert({
        email: form.email.trim(),
        source: "concierge_sales",
        metadata: {
          company: form.company.trim(),
          contact_name: form.contact_name.trim(),
          phone: form.phone.trim() || null,
          shop_size: form.shop_size || null,
          itar: form.itar,
          notes: form.notes.trim() || null,
        },
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Thanks — a sales rep will reach out within one business day.");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not submit. Please email sales@jobline.ai");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Concierge Setup — Pay by Check or Talk to Sales | JobLine.ai</title>
        <meta
          name="description"
          content="Prefer paper? Our concierge onboarding can be paid by check, ACH, wire, or PO. Talk to a JobLine.ai sales rep about white-glove setup for your shop."
        />
        <link rel="canonical" href="https://jobline.ai/concierge/sales" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-16 space-y-10">
        <header className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Concierge onboarding</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Prefer to pay by check or talk to a human?
          </h1>
          <p className="text-muted-foreground">
            Our concierge setup is $1,500 one-time. We accept check, ACH, wire, purchase order, and
            credit card — and a JobLine.ai sales rep can walk your supervisor through the contract
            and onboarding worksheets in person or on a call.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What's included</CardTitle>
              <CardDescription>End-to-end setup, paid however works for your AP team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {INCLUDES.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Accepted payment</div>
                <ul className="text-sm space-y-0.5">
                  {PAYMENT_METHODS.map((m) => (
                    <li key={m} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-foreground/40" /> {m}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground pt-1">
                  Production access is gated until payment clears and a signed agreement is on file.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <ConciergeButton>Prefer to pay online?</ConciergeButton>
                <a href="mailto:sales@jobline.ai" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> sales@jobline.ai
                </a>
                <a href="tel:+18005551212" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Call sales
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-4 h-4" /> Request a sales contact
              </CardTitle>
              <CardDescription>
                We'll send a printed contract & onboarding pack within one business day.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="rounded border border-status-ok/40 bg-status-ok/5 p-4 text-sm text-status-ok">
                  Thanks — we've routed your request. A sales rep will reach out shortly.
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Company *</Label>
                      <Input value={form.company} onChange={(e) => update("company", e.target.value)} required />
                    </div>
                    <div>
                      <Label className="text-xs">Contact name *</Label>
                      <Input value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} required />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Email *</Label>
                      <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Estimated shop size</Label>
                      <Select value={form.shop_size} onValueChange={(v) => update("shop_size", v)}>
                        <SelectTrigger><SelectValue placeholder="Select shop size" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-5">1–5 machines</SelectItem>
                          <SelectItem value="6-15">6–15 machines</SelectItem>
                          <SelectItem value="16-40">16–40 machines</SelectItem>
                          <SelectItem value="40+">40+ machines</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 flex items-start gap-2 pt-1">
                      <Checkbox
                        id="itar"
                        checked={form.itar}
                        onCheckedChange={(v) => update("itar", v === true)}
                      />
                      <Label htmlFor="itar" className="text-xs font-normal leading-snug">
                        Our shop handles ITAR-controlled work and requires US-Person verification.
                      </Label>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Notes</Label>
                      <Textarea
                        rows={3}
                        value={form.notes}
                        onChange={(e) => update("notes", e.target.value)}
                        placeholder="What ERP do you run? Any specific requirements?"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Request sales contact
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    We'll only use this to follow up on your concierge request. See our{" "}
                    <a href="/privacy" className="underline">privacy policy</a>.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

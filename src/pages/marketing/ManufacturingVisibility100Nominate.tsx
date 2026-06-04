import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Shop-Floor Innovators",
  "CNC and CAM Leaders",
  "Manufacturing Educators",
  "Small and Mid-Size Shop Leaders",
  "Automation and Robotics Leaders",
  "Tooling and Metrology Leaders",
  "Manufacturing Software Builders",
  "Workforce Development Leaders",
  "Rising Manufacturing Professionals",
  "Legacy Builders",
  "Industry Catalysts",
];

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(""))
  .refine(
    (v) => !v || /^https?:\/\//i.test(v),
    "Must start with http:// or https://",
  );

const schema = z.object({
  nominee_name: z.string().trim().min(1, "Required").max(160),
  nominee_company: z.string().trim().max(160).optional().or(z.literal("")),
  nominee_role: z.string().trim().max(160).optional().or(z.literal("")),
  nominee_linkedin: optionalUrl,
  nominee_website: optionalUrl,
  category: z.string().min(1, "Pick a category"),
  reason: z.string().trim().min(20, "Tell us a bit more (20+ chars)").max(1000),
  evidence_links_text: z.string().trim().max(2000).optional().or(z.literal("")),
  nominator_name: z.string().trim().min(1, "Required").max(160),
  nominator_email: z.string().trim().email("Valid email required").max(255),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consent is required" }),
  }),
});

type FormState = {
  nominee_name: string;
  nominee_company: string;
  nominee_role: string;
  nominee_linkedin: string;
  nominee_website: string;
  category: string;
  reason: string;
  evidence_links_text: string;
  nominator_name: string;
  nominator_email: string;
  consent: boolean;
  interest_talent: boolean;
  interest_oap: boolean;
  interest_gca: boolean;
  interest_demo: boolean;
};

const EMPTY: FormState = {
  nominee_name: "",
  nominee_company: "",
  nominee_role: "",
  nominee_linkedin: "",
  nominee_website: "",
  category: "",
  reason: "",
  evidence_links_text: "",
  nominator_name: "",
  nominator_email: "",
  consent: false,
  interest_talent: false,
  interest_oap: false,
  interest_gca: false,
  interest_demo: false,
};

export default function ManufacturingVisibility100Nominate() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Please review the form");
      return;
    }
    setSubmitting(true);
    try {
      const evidence_links = (form.evidence_links_text || "")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => /^https?:\/\//i.test(s))
        .slice(0, 10);

      const { error } = await supabase.from("mfg_100_nominations").insert({
        nominee_name: form.nominee_name.trim(),
        nominee_company: form.nominee_company.trim() || null,
        nominee_role: form.nominee_role.trim() || null,
        nominee_linkedin: form.nominee_linkedin.trim() || null,
        nominee_website: form.nominee_website.trim() || null,
        category: form.category,
        reason: form.reason.trim(),
        evidence_links,
        nominator_name: form.nominator_name.trim(),
        nominator_email: form.nominator_email.trim().toLowerCase(),
        consent: form.consent,
        interest_flags: {
          talent: form.interest_talent,
          oap: form.interest_oap,
          gca: form.interest_gca,
          demo: form.interest_demo,
        },
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Nomination received — thank you.");
    } catch (err: any) {
      console.error("[mfg-100] nomination submit failed", err);
      toast.error(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Helmet>
          <title>Thanks — Manufacturing Visibility 100</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
          <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-3">Nomination received</h1>
          <p className="text-muted-foreground mb-8">
            Thank you. Our editorial team reviews every entry and will reach out if we need additional context. Shortlisted nominees are notified by email before publish.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild variant="outline">
              <Link to="/manufacturing-100">Back to the list</Link>
            </Button>
            <Button asChild>
              <Link to="/manufacturing-100/nominate" onClick={() => setSubmitted(false)}>
                Nominate someone else
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Nominate — Manufacturing Visibility 100</title>
        <meta
          name="description"
          content="Nominate a person, shop, educator, or company for the Manufacturing Visibility 100."
        />
        <link rel="canonical" href="https://jobline.ai/manufacturing-100/nominate" />
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/manufacturing-100">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>

        <h1 className="text-4xl font-bold mb-3">Nominate someone</h1>
        <p className="text-muted-foreground mb-8">
          Nominations are free and reviewed editorially. Peer nominations carry more weight than self-nominations, but both are welcome. See the{" "}
          <Link to="/manufacturing-100/methodology" className="text-primary hover:underline">
            methodology
          </Link>{" "}
          for scoring and guardrails.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>About the nominee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Name *">
                  <Input
                    value={form.nominee_name}
                    onChange={(e) => update("nominee_name", e.target.value)}
                    maxLength={160}
                    required
                  />
                </Field>
                <Field label="Company">
                  <Input
                    value={form.nominee_company}
                    onChange={(e) => update("nominee_company", e.target.value)}
                    maxLength={160}
                  />
                </Field>
              </div>
              <Field label="Role / title">
                <Input
                  value={form.nominee_role}
                  onChange={(e) => update("nominee_role", e.target.value)}
                  maxLength={160}
                  placeholder="e.g. CNC Programmer, Shop Owner, Manufacturing Engineer"
                />
              </Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="LinkedIn URL">
                  <Input
                    type="url"
                    value={form.nominee_linkedin}
                    onChange={(e) => update("nominee_linkedin", e.target.value)}
                    placeholder="https://linkedin.com/in/…"
                  />
                </Field>
                <Field label="Website / portfolio URL">
                  <Input
                    type="url"
                    value={form.nominee_website}
                    onChange={(e) => update("nominee_website", e.target.value)}
                    placeholder="https://…"
                  />
                </Field>
              </div>
              <Field label="Category *">
                <Select value={form.category} onValueChange={(v) => update("category", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Why this nominee? *" hint="2–4 sentences. What real impact have they had?">
                <Textarea
                  value={form.reason}
                  onChange={(e) => update("reason", e.target.value)}
                  rows={5}
                  maxLength={1000}
                  required
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {form.reason.length}/1000
                </div>
              </Field>
              <Field
                label="Evidence links"
                hint="One per line. Public URLs only (LinkedIn posts, YouTube videos, articles, talks)."
              >
                <Textarea
                  value={form.evidence_links_text}
                  onChange={(e) => update("evidence_links_text", e.target.value)}
                  rows={4}
                  placeholder={"https://www.linkedin.com/posts/…\nhttps://www.youtube.com/watch?v=…"}
                  maxLength={2000}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About you</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Your name *">
                  <Input
                    value={form.nominator_name}
                    onChange={(e) => update("nominator_name", e.target.value)}
                    maxLength={160}
                    required
                  />
                </Field>
                <Field label="Your email *">
                  <Input
                    type="email"
                    value={form.nominator_email}
                    onChange={(e) => update("nominator_email", e.target.value)}
                    maxLength={255}
                    required
                  />
                </Field>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Optional — let us follow up on these too</Label>
                <InterestCheckbox
                  label="I'd like a JobLine Talent profile"
                  checked={form.interest_talent}
                  onChange={(v) => update("interest_talent", v)}
                />
                <InterestCheckbox
                  label="I'm interested in the Operator Acceptance Program (OAP)"
                  checked={form.interest_oap}
                  onChange={(v) => update("interest_oap", v)}
                />
                <InterestCheckbox
                  label="I'm interested in the G-Code Academy (GCA)"
                  checked={form.interest_gca}
                  onChange={(v) => update("interest_gca", v)}
                />
                <InterestCheckbox
                  label="I'd like a JobLine.ai demo for my shop"
                  checked={form.interest_demo}
                  onChange={(v) => update("interest_demo", v)}
                />
              </div>

              <div className="flex items-start gap-3 pt-4 border-t border-border">
                <Checkbox
                  id="consent"
                  checked={form.consent}
                  onCheckedChange={(v) => update("consent", v === true)}
                />
                <Label htmlFor="consent" className="text-sm font-normal leading-relaxed">
                  I confirm this nomination is in good faith, based on public evidence, and that JobLine.ai's editorial team may contact the nominee. Nominees may opt out at any time. *
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                "Submit nomination"
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function InterestCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

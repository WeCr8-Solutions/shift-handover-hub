import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { getUtmParams } from "@/lib/utm";
import { CheckCircle2, Loader2, ArrowRight, Factory, Clock, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  company: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().max(1000).optional(),
});

export default function Demo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = formSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("email_leads").insert({
        email: result.data.email,
        source_page: "demo",
        lead_type: "demo_request",
      });
      if (error) throw error;

      const utm = getUtmParams();
      trackEvent("demo_form_submit", {
        page_path: "/demo",
        ...utm,
      });
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const benefits = [
    { icon: Factory, text: "See real-time station monitoring in action" },
    { icon: Clock, text: "Watch a live shift handoff workflow" },
    { icon: BarChart3, text: "Explore production dashboards & analytics" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Book a Demo | JobLine.ai"
        description="See JobLine.ai in action. Book a personalized demo to explore shift handoffs, work order tracking, and production management for your shop floor."
        canonical="/demo"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Book a Demo - JobLine.ai",
          "description": "Request a personalized demo of JobLine.ai's digital expeditor and shift handoff system.",
          "url": "https://jobline.ai/demo",
          "mainEntity": {
            "@type": "ContactPoint",
            "contactType": "sales",
            "availableLanguage": "English"
          }
        }}
      />
      <MarketingNav showPricing />

      <main className="container mx-auto px-4 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          {/* Left – Value prop */}
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              See JobLine.ai on Your Shop Floor
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Get a personalized walkthrough tailored to your operation — whether you run 5 machines or 500.
            </p>
            <ul className="space-y-4">
              {benefits.map((b) => (
                <li key={b.text} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <b.icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <span className="text-sm">{b.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right – Form or success */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-lg">
            {submitted ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <CheckCircle2 className="w-14 h-14 text-green-500" />
                <h2 className="text-2xl font-bold">We'll be in touch!</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Thanks for your interest. A team member will reach out within one business day.
                </p>
                <Button variant="outline" onClick={() => navigate("/")} className="gap-2 mt-2">
                  Back to Home <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-semibold mb-1">Request a Demo</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" value={form.name} onChange={update("name")} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Work Email *</Label>
                    <Input id="email" type="email" value={form.email} onChange={update("email")} required />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" value={form.company} onChange={update("company")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" value={form.phone} onChange={update("phone")} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Anything specific you'd like to see?</Label>
                  <Textarea id="message" rows={3} value={form.message} onChange={update("message")} />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Request Demo
                </Button>
                <p className="text-xs text-muted-foreground text-center">No credit card required. Free forever plan available.</p>
              </form>
            )}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

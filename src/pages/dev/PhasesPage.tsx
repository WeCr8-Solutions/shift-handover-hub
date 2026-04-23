import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";

const PHASES = [
  { n: 1, name: "OAP / GCA / Certificate core", status: "✅", note: "Question banks, test player, mentor sign-off, $12 cert checkout" },
  { n: 2, name: "Cert lifecycle E2E (Playwright)", status: "✅", note: "e2e/cert-lifecycle.spec.ts — 5 scenarios" },
  { n: 3, name: "Media overlays + release log", status: "✅", note: "Cover-image overlays, content_year tracking" },
  { n: 4, name: "Help docs for certificates", status: "✅", note: "/help certificate articles" },
  { n: 5, name: "Handbook v1 schema + reference layer", status: "✅", note: "categories, references, links tables" },
  { n: 6, name: "Handbook v2 — category cleanup", status: "✅", note: "Consolidated to 8 canonical categories" },
  { n: 7, name: "Handbook v2 — curated content", status: "✅", note: "200 entries with source citations" },
  { n: 8, name: "Handbook v2 — auto-linkers", status: "✅", note: "30 operator-tool + 432 GCA + 448 OAP refs" },
  { n: 9, name: "Machine & Control Manuals library", status: "✅", note: "Schema + RLS + bucket + viewer + upload" },
  { n: 10, name: "Manual ingest of canonical manuals", status: "⏳", note: "Per-shop admin task at /manuals/upload" },
  { n: 11, name: "Future: PDF auto-extract for handbook", status: "⛔", note: "Deferred — Machinery's Handbook is copyrighted" },
];

export default function PhasesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>Project Phases — JobLine Dev</title>
      </Helmet>
      <h1 className="text-3xl font-bold mb-2">Project Phases</h1>
      <p className="text-muted-foreground mb-6">Build progress across handbook, OAP/GCA/certificates, and the manuals library.</p>
      <div className="space-y-2">
        {PHASES.map((p) => (
          <Card key={p.n}>
            <CardContent className="py-3 px-4 flex items-start gap-3">
              <span className="text-xl">{p.status}</span>
              <div className="flex-1">
                <p className="font-medium">{p.n}. {p.name}</p>
                <p className="text-sm text-muted-foreground">{p.note}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 text-xs text-muted-foreground">
        Categories: materials (31), feeds-speeds (23), threads (34), fits-tolerances (22), gdt (27), formulas (21), inspection-measurement (24), safety-standards (18) — <strong>200 total</strong>.
      </div>
    </div>
  );
}

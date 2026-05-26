/**
 * BrandSystemPanel — admin-facing surface for the JobLine.ai brand system.
 *
 * Modular tabs:
 *   - Logo & Tokens  → identity primitives + color swatches
 *   - Flyers         → live previews of all 5 print flyer variants
 *   - Business Cards → front/back card previews (dark + light theme)
 *   - Videos         → brand video library (YouTube / Vimeo / MP4)
 *
 * The cleaned web components live in src/components/brand/ and use the
 * brand-print color tokens directly (intentionally — print collateral
 * must always render with exact brand hex values regardless of theme).
 * Admin chrome around them uses semantic tokens.
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Palette, Layout, CreditCard, Film, Sparkles } from "lucide-react";
import {
  JobLineLogo,
  LogoMark,
  BrandFlyer,
  BusinessCard,
  BrandPrintColors,
  FLYER_CONFIGS,
  FLYER_VARIANTS,
  type FlyerVariant,
} from "@/components/brand";
import { BrandVideoLibrary } from "./BrandVideoLibrary";

const SWATCH_GROUPS: { label: string; entries: [string, string][] }[] = [
  {
    label: "Backgrounds",
    entries: [
      ["navyDeep", BrandPrintColors.navyDeep],
      ["navyCard", BrandPrintColors.navyCard],
      ["navyMid", BrandPrintColors.navyMid],
      ["navyBorder", BrandPrintColors.navyBorder],
    ],
  },
  {
    label: "Accents",
    entries: [
      ["teal", BrandPrintColors.teal],
      ["tealLight", BrandPrintColors.tealLight],
      ["green", BrandPrintColors.green],
      ["greenLight", BrandPrintColors.greenLight],
    ],
  },
  {
    label: "Text",
    entries: [
      ["white", BrandPrintColors.white],
      ["whiteOff", BrandPrintColors.whiteOff],
      ["subtext", BrandPrintColors.subtext],
      ["muted", BrandPrintColors.muted],
    ],
  },
  {
    label: "Light variant",
    entries: [
      ["lightBg", BrandPrintColors.lightBg],
      ["lightText", BrandPrintColors.lightText],
      ["lightAccent", BrandPrintColors.lightAccent],
      ["lightSubtext", BrandPrintColors.lightSubtext],
    ],
  },
];

function Swatch({ name, hex }: { name: string; hex: string }) {
  return (
    <div className="border border-border rounded-md overflow-hidden bg-card">
      <div className="h-16" style={{ backgroundColor: hex }} />
      <div className="p-2 text-xs">
        <div className="font-mono font-medium truncate">{name}</div>
        <div className="font-mono text-muted-foreground">{hex}</div>
      </div>
    </div>
  );
}

export function BrandSystemPanel() {
  const [previewVariant, setPreviewVariant] = useState<FlyerVariant>("oap");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4" />
            Brand System
          </CardTitle>
          <CardDescription>
            JobLine.ai visual identity — logo, color tokens, print flyers, business cards, and brand video library.
            Source kit preserved at <code className="text-xs">src/brand-system/_source/</code>.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="identity" className="space-y-3">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="identity" className="gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Logo & Tokens
          </TabsTrigger>
          <TabsTrigger value="flyers" className="gap-1.5">
            <Layout className="w-3.5 h-3.5" /> Flyers
          </TabsTrigger>
          <TabsTrigger value="cards" className="gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Business Cards
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-1.5">
            <Film className="w-3.5 h-3.5" /> Videos
          </TabsTrigger>
        </TabsList>

        {/* IDENTITY */}
        <TabsContent value="identity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Logo lockups</CardTitle>
              <CardDescription>Renders with exact brand colors regardless of theme.</CardDescription>
            </CardHeader>
            <CardContent
              className="flex flex-wrap items-center gap-8 p-6 rounded-b-md"
              style={{ backgroundColor: BrandPrintColors.navyDeep }}
            >
              <div className="flex flex-col items-center gap-2">
                <JobLineLogo scale={1.6} />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: BrandPrintColors.subtext }}>
                  Default
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <JobLineLogo scale={1.6} variant="teal" />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: BrandPrintColors.subtext }}>
                  Teal
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LogoMark size={48} />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: BrandPrintColors.subtext }}>
                  Mark · 48
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LogoMark size={64} variant="teal" />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: BrandPrintColors.subtext }}>
                  Mark · teal 64
                </span>
              </div>
            </CardContent>
          </Card>

          {SWATCH_GROUPS.map((group) => (
            <Card key={group.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{group.label}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {group.entries.map(([name, hex]) => (
                  <Swatch key={name} name={name} hex={hex} />
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* FLYERS */}
        <TabsContent value="flyers" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Flyer preview</CardTitle>
              <CardDescription>
                All 5 print flyer variants share one data-driven renderer. Pick a variant to preview the
                live 8.5x11 layout.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Label htmlFor="flyer-variant" className="text-xs">Variant</Label>
                <Select value={previewVariant} onValueChange={(v) => setPreviewVariant(v as FlyerVariant)}>
                  <SelectTrigger id="flyer-variant" className="w-[260px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FLYER_VARIANTS.map((v) => (
                      <SelectItem key={v} value={v}>{FLYER_CONFIGS[v].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-center bg-muted/30 rounded-md p-4 border border-border">
                <BrandFlyer variant={previewVariant} width={420} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">All variants</CardTitle>
              <CardDescription>Thumbnail grid of every flyer in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {FLYER_VARIANTS.map((v) => (
                  <div key={v} className="flex flex-col items-center gap-2">
                    <BrandFlyer variant={v} width={240} />
                    <span className="text-xs text-muted-foreground text-center">
                      {FLYER_CONFIGS[v].label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CARDS */}
        <TabsContent value="cards" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Business cards</CardTitle>
              <CardDescription>3.5"x2" print spec, front + back, dark and light themes.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col items-center gap-2">
                <BusinessCard side="front" theme="dark" width={360} />
                <span className="text-xs text-muted-foreground">Front · Dark</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <BusinessCard side="back" theme="dark" width={360} />
                <span className="text-xs text-muted-foreground">Back · Dark</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <BusinessCard side="front" theme="light" width={360} />
                <span className="text-xs text-muted-foreground">Front · Light</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <BusinessCard side="back" theme="light" width={360} />
                <span className="text-xs text-muted-foreground">Back · Light</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VIDEOS */}
        <TabsContent value="videos">
          <BrandVideoLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}

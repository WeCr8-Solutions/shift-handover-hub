import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Code2,
  Ruler,
  Sparkles,
} from "lucide-react";
import {
  PROFESSION_PRESETS,
  type ProfessionPreset,
} from "@/lib/professionPresets";
import { useCloneRoleProgramTemplate } from "@/hooks/useOapProgram";
import { useAuth } from "@/contexts/AuthContext";

interface RoleProgramRow {
  id: string;
  name: string;
  description: string | null;
  vertical: string | null;
  vertical_role_slug: string | null;
}

interface OapCourseRow {
  id: string;
  slug: string;
  title: string;
  section_number: number | null;
  estimated_minutes: number | null;
}

interface GcaBankRow {
  id: string;
  slug: string;
  title: string;
  topic: string;
  difficulty: string;
  is_pro_only: boolean;
}

interface Props {
  /**
   * If true, shows the "Add to my shop" clone button on each role-program
   * card (org-admin entry point). Defaults to false on public landings.
   */
  enableClone?: boolean;
  /** Tighter padding when embedded inside an authenticated hub. */
  compact?: boolean;
}

/**
 * Preset profession quick-start showcase.
 *
 * Surfaces the 50+ canonical OAP role programs grouped by trade vertical
 * and pairs each vertical with the matching GCA banks, OAP study sections,
 * and inspection-tool videos so the screen never feels empty even before
 * a user enrolls.
 *
 * Used on:
 *   - GCALanding (public, anonymous)
 *   - OAPLanding (public, anonymous)
 *   - OapHub (authenticated, with clone-to-shop enabled for admins)
 */
export function PresetProfessionsShowcase({
  enableClone = false,
  compact = false,
}: Props) {
  const { user } = useAuth();
  const clone = useCloneRoleProgramTemplate();

  const presetQuery = useQuery({
    queryKey: ["preset-showcase-role-programs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("oap_role_programs")
        .select("id, name, description, vertical, vertical_role_slug")
        .eq("is_canonical", true)
        .eq("is_active", true)
        .order("vertical")
        .order("name");
      if (error) throw error;
      return (data ?? []) as RoleProgramRow[];
    },
  });

  const oapCoursesQuery = useQuery({
    queryKey: ["preset-showcase-oap-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oap_courses")
        .select("id, slug, title, section_number, estimated_minutes")
        .order("section_number");
      if (error) throw error;
      return (data ?? []) as OapCourseRow[];
    },
  });

  const gcaBanksQuery = useQuery({
    queryKey: ["preset-showcase-gca-banks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gca_question_banks")
        .select("id, slug, title, topic, difficulty, is_pro_only")
        .eq("is_published", true);
      if (error) throw error;
      return (data ?? []) as GcaBankRow[];
    },
  });

  const presets = useMemo(() => {
    const programsByVertical = new Map<string, RoleProgramRow[]>();
    (presetQuery.data ?? []).forEach((row) => {
      const v = row.vertical ?? "machining";
      const arr = programsByVertical.get(v) ?? [];
      arr.push(row);
      programsByVertical.set(v, arr);
    });
    return PROFESSION_PRESETS.map((p) => ({
      ...p,
      rolePrograms: programsByVertical.get(p.vertical) ?? [],
    }));
  }, [presetQuery.data]);

  const [active, setActive] = useState<string>(PROFESSION_PRESETS[0].vertical);

  const isLoading =
    presetQuery.isLoading || oapCoursesQuery.isLoading || gcaBanksQuery.isLoading;

  return (
    <section
      className={
        compact
          ? "space-y-4"
          : "py-16 md:py-24 border-b border-border bg-card/30"
      }
    >
      <div className={compact ? "" : "container mx-auto px-4"}>
        {!compact && (
          <div className="max-w-3xl mx-auto text-center mb-10">
            <Badge variant="outline" className="mb-4 gap-1">
              <Sparkles className="w-3 h-3" /> Quick-start by Profession
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Pick your trade. Start in seconds.
            </h2>
            <p className="text-lg text-muted-foreground">
              {PROFESSION_PRESETS.length} preset profession tracks across CNC machining,
              cabinetry, automotive, welding, construction, electrical, plumbing, and HVAC —
              each with matched OAP sections, GCA tests, and inspection-tool videos.
              No empty dashboards, no setup required.
            </p>
          </div>
        )}

        {compact && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold">Quick-start by profession</h3>
            <Badge variant="secondary" className="text-[10px]">
              {PROFESSION_PRESETS.length} trades
            </Badge>
          </div>
        )}

        <Tabs value={active} onValueChange={setActive} className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 mb-4">
            <TabsList className="inline-flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
              {presets.map((p) => {
                const Icon = p.icon;
                return (
                  <TabsTrigger
                    key={p.vertical}
                    value={p.vertical}
                    className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="capitalize">{p.label}</span>
                    {p.rolePrograms.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 text-[10px] py-0 px-1.5"
                      >
                        {p.rolePrograms.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {presets.map((p) => (
            <TabsContent key={p.vertical} value={p.vertical} className="mt-0">
              <PresetVerticalPanel
                preset={p}
                allOapCourses={oapCoursesQuery.data ?? []}
                allGcaBanks={gcaBanksQuery.data ?? []}
                isLoading={isLoading}
                enableClone={enableClone && !!user}
                onClone={(id) => clone.mutate({ template_id: id })}
                cloning={clone.isPending}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

interface PanelProps {
  preset: ProfessionPreset & { rolePrograms: RoleProgramRow[] };
  allOapCourses: OapCourseRow[];
  allGcaBanks: GcaBankRow[];
  isLoading: boolean;
  enableClone: boolean;
  onClone: (templateId: string) => void;
  cloning: boolean;
}

function PresetVerticalPanel({
  preset,
  allOapCourses,
  allGcaBanks,
  isLoading,
  enableClone,
  onClone,
  cloning,
}: PanelProps) {
  const Icon = preset.icon;

  // Resolve OAP courses to objects (preserving the preset order, then any
  // remaining universal sections).
  const oapCourses = useMemo(() => {
    const bySlug = new Map(allOapCourses.map((c) => [c.slug, c]));
    return preset.oapCourseSlugs
      .map((s) => bySlug.get(s))
      .filter((c): c is OapCourseRow => Boolean(c));
  }, [preset.oapCourseSlugs, allOapCourses]);

  // GCA banks: featured first, then everything matching the trade's topics.
  const gcaBanks = useMemo(() => {
    const featuredSet = new Set(preset.featuredGcaBankSlugs ?? []);
    const topicSet = new Set(preset.gcaBankTopics);
    const featured = allGcaBanks.filter((b) => featuredSet.has(b.slug));
    const byTopic = allGcaBanks.filter(
      (b) => !featuredSet.has(b.slug) && topicSet.has(b.topic),
    );
    return [...featured, ...byTopic].slice(0, 9);
  }, [preset, allGcaBanks]);

  const firstGcaSlug = gcaBanks[0]?.slug;
  const firstOapSlug = oapCourses[0]?.slug ?? "orientation";

  return (
    <div className="space-y-6">
      {/* Trade hero strip */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="py-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg w-fit">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold capitalize">{preset.label}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {preset.tagline}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to={`/oap/learn/${firstOapSlug}`}>
                <GraduationCap className="w-3.5 h-3.5 mr-1" />
                Start OAP <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={firstGcaSlug ? `/gca/test/${firstGcaSlug}` : "/gcode-academy/app"}>
                <Code2 className="w-3.5 h-3.5 mr-1" />
                Open GCA
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/resources/measuring-tools">
                <Ruler className="w-3.5 h-3.5 mr-1" />
                Tools Library
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* What you'll cover */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              What you'll cover
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {preset.highlights.map((h) => (
                <li
                  key={h}
                  className="text-xs text-muted-foreground flex items-start gap-2"
                >
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* OAP study plan */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                OAP study plan
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {oapCourses.length} sections
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {isLoading && (
              <p className="text-xs text-muted-foreground">Loading…</p>
            )}
            {!isLoading && oapCourses.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No mapped sections yet — universal 12 still apply.
              </p>
            )}
            {oapCourses.slice(0, 8).map((c) => (
              <Link
                key={c.id}
                to={`/oap/learn/${c.slug}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded px-2 py-1.5 text-xs transition hover:bg-muted"
              >
                <span className="truncate">
                  <Badge
                    variant="outline"
                    className="text-[10px] mr-1.5 px-1 py-0"
                  >
                    {c.section_number ?? "·"}
                  </Badge>
                  {c.title}
                </span>
                <ArrowRight className="w-3 h-3 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* GCA practice tests */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                GCA practice tests
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {gcaBanks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {isLoading && (
              <p className="text-xs text-muted-foreground">Loading…</p>
            )}
            {!isLoading && gcaBanks.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No banks matched — open the full library.
              </p>
            )}
            {gcaBanks.slice(0, 8).map((b) => (
              <Link
                key={b.id}
                to={`/gca/test/${b.slug}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded px-2 py-1.5 text-xs transition hover:bg-muted"
              >
                <span className="truncate flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1 py-0 capitalize"
                  >
                    {b.difficulty[0]}
                  </Badge>
                  <span className="truncate">{b.title}</span>
                </span>
                {b.is_pro_only && (
                  <Badge variant="secondary" className="text-[9px] shrink-0">
                    Pro
                  </Badge>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Profession role programs (clonable for admins) */}
      {preset.rolePrograms.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Certified role programs in this trade</span>
              <Badge variant="secondary" className="text-[10px]">
                {preset.rolePrograms.length}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Pre-built certification tracks. Operators can study against any of these;
              org admins can clone one into their shop in a click.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {preset.rolePrograms.map((rp) => (
                <div
                  key={rp.id}
                  className="border rounded p-2.5 flex flex-col gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{rp.name}</p>
                    {rp.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {rp.description}
                      </p>
                    )}
                  </div>
                  {enableClone && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] self-start"
                      onClick={() => onClone(rp.id)}
                      disabled={cloning}
                    >
                      Add to my shop
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

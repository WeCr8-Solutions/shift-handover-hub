import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InspectionToolsCatalog } from "./InspectionToolsCatalog";
import { MachiningOperationsCatalog } from "./MachiningOperationsCatalog";
import { Library, Wrench, GraduationCap, ClipboardCheck, Cog } from "lucide-react";
import type { AdminComponentAccess } from "@/types/admin";

interface Props {
  access: AdminComponentAccess;
}

export function TrainingLibraryPanel({ access }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Library className="w-4 h-4" />
            Training Library
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Manage inspection tools, lesson media (AVIF/GIF/JPEG/PNG/MP3/MP4), and
            program assignments for both the GCA and OAP programs.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="tools" className="space-y-3">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="tools" className="gap-1">
            <Wrench className="w-3.5 h-3.5" /> Tools Catalog
          </TabsTrigger>
          <TabsTrigger value="ops" className="gap-1">
            <Cog className="w-3.5 h-3.5" /> Machining Ops
          </TabsTrigger>
          <TabsTrigger value="gca" className="gap-1">
            <GraduationCap className="w-3.5 h-3.5" /> GCA Mapping
          </TabsTrigger>
          <TabsTrigger value="oap" className="gap-1">
            <ClipboardCheck className="w-3.5 h-3.5" /> OAP Mapping
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools">
          <InspectionToolsCatalog isPlatformAdmin={access.isPlatformAdmin} />
        </TabsContent>

        <TabsContent value="ops">
          <MachiningOperationsCatalog isPlatformAdmin={access.isPlatformAdmin} />
        </TabsContent>

        <TabsContent value="gca">
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              GCA question/bank media mapping UI ships next. Underlying tables and
              the polymorphic media layer are already in place — you can attach
              media to <code>gca_question</code> and <code>gca_question_bank</code>{" "}
              entity types via the same uploader as the Tools tab.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oap">
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              OAP lesson, course, quiz, and walkthrough media mapping UI ships
              next. Backend already supports <code>oap_lesson</code>,{" "}
              <code>oap_course</code>, <code>oap_quiz_question</code>,{" "}
              <code>oap_walkthrough_item</code>, and{" "}
              <code>oap_walkthrough_section</code>.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

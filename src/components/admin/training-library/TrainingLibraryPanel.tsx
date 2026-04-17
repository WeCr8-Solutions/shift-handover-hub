import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { InspectionToolsCatalog } from "./InspectionToolsCatalog";
import { MachiningOperationsCatalog } from "./MachiningOperationsCatalog";
import { OrgOverridesPanel } from "./OrgOverridesPanel";
import { BulkTagPanel } from "./BulkTagPanel";
import { CertificateIssuancePanel } from "@/components/certificates/CertificateIssuancePanel";
import { OapMentorAdminPanel } from "@/components/oap/OapMentorAdminPanel";
import {
  Library,
  Wrench,
  GraduationCap,
  ClipboardCheck,
  Cog,
  Settings2,
  Tags,
  Award,
  ShieldCheck,
} from "lucide-react";
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
          <TabsTrigger value="overrides" className="gap-1">
            <Settings2 className="w-3.5 h-3.5" /> Org Overrides
          </TabsTrigger>
          <TabsTrigger value="mentors" className="gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> OAP Mentors
          </TabsTrigger>
          <TabsTrigger value="certs" className="gap-1">
            <Award className="w-3.5 h-3.5" /> Certificates
          </TabsTrigger>
          {access.isPlatformAdmin && (
            <TabsTrigger value="bulk" className="gap-1">
              <Tags className="w-3.5 h-3.5" /> Bulk Tags
            </TabsTrigger>
          )}
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
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" /> OAP Mentor Walkthrough
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                The mentor check-off screen lives at{" "}
                <code>/oap/walkthrough</code>. Designated mentors and supervisors
                can start a session for any operator and sign off the 7 OAP
                sections (Safety, Material Handling, Measurement, Tooling,
                Machine Qualification, Floor Certification).
              </p>
              <Button asChild size="sm">
                <Link to="/oap/walkthrough">Open Mentor Walkthrough →</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentors">
          <OapMentorAdminPanel />
        </TabsContent>

        <TabsContent value="overrides">
          <OrgOverridesPanel />
        </TabsContent>

        <TabsContent value="certs">
          <CertificateIssuancePanel />
        </TabsContent>

        {access.isPlatformAdmin && (
          <TabsContent value="bulk">
            <BulkTagPanel isPlatformAdmin={access.isPlatformAdmin} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase, UserCog } from "lucide-react";
import { EngagementsList } from "@/components/admin/onboarding/EngagementsList";
import { EngagementDetail } from "@/components/admin/onboarding/EngagementDetail";
import { ConciergeKpiStrip } from "./ConciergeKpiStrip";
import { CustomersLaunchpad } from "./CustomersLaunchpad";
import { SelfServeList } from "./SelfServeList";
import { SelfServeAssistDrawer } from "./SelfServeAssistDrawer";
import { ConciergeQuickActions } from "./ConciergeQuickActions";

export function CustomerSuccessPanel() {
  const [tab, setTab] = useState<string>("customers");
  const [conciergeEngagementId, setConciergeEngagementId] = useState<string | null>(null);
  const [assistOrgId, setAssistOrgId] = useState<string | null>(null);

  const openConcierge = (engagementId: string) => {
    setConciergeEngagementId(engagementId);
    setTab("concierge");
  };

  return (
    <>
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers" className="gap-2">
            <Users className="w-4 h-4" /> Customers
          </TabsTrigger>
          <TabsTrigger value="concierge" className="gap-2">
            <Briefcase className="w-4 h-4" /> Concierge
          </TabsTrigger>
          <TabsTrigger value="self-serve" className="gap-2">
            <UserCog className="w-4 h-4" /> Self-serve setup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <CustomersLaunchpad
            onOpenConcierge={openConcierge}
            onOpenSelfServe={(orgId) => setAssistOrgId(orgId)}
          />
        </TabsContent>

        <TabsContent value="concierge" className="space-y-4">
          {conciergeEngagementId ? (
            <EngagementDetail
              engagementId={conciergeEngagementId}
              onBack={() => setConciergeEngagementId(null)}
            />
          ) : (
            <>
              <ConciergeKpiStrip />
              <EngagementsList />
            </>
          )}
        </TabsContent>

        <TabsContent value="self-serve">
          <SelfServeList onAssist={(orgId) => setAssistOrgId(orgId)} />
        </TabsContent>
      </Tabs>

      <SelfServeAssistDrawer
        organizationId={assistOrgId}
        onClose={() => setAssistOrgId(null)}
        onConverted={(engagementId) => {
          setAssistOrgId(null);
          openConcierge(engagementId);
        }}
      />
    </>
  );
}

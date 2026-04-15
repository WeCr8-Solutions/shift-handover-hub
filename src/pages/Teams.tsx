import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { TeamManagement } from "@/components/TeamManagement";
import { OrganizationMemberManager } from "@/components/OrganizationMemberManager";
import { InviteCodeGenerator } from "@/components/InviteCodeGenerator";
import { TourTriggerButton } from "@/components/onboarding";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UsersRound, QrCode } from "lucide-react";

export default function Teams() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("teams");

  useEffect(() => {
    if (isReady && !user) {
      navigate("/auth");
    }
  }, [isReady, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 overflow-x-hidden">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Teams & Members</h1>
          <TourTriggerButton />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="teams" className="gap-2">
              <UsersRound className="w-4 h-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="org-members" className="gap-2">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="invites" className="gap-2">
              <QrCode className="w-4 h-4" />
              Invite Codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams" data-tour="team-list">
            <TeamManagement />
          </TabsContent>

          <TabsContent value="org-members">
            <OrganizationMemberManager onNavigateToInvites={() => setActiveTab("invites")} />
          </TabsContent>

          <TabsContent value="invites">
            <InviteCodeGenerator />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { TeamProvider } from "@/contexts/TeamContext";
import { OrgProvider } from "@/contexts/OrgContext";
import { ActAsProvider } from "@/contexts/ActAsContext";
import { OnboardingProvider, GuidedTour, WelcomeModal } from "@/components/onboarding";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { ActAsBanner } from "@/components/admin/ActAsBanner";
import { JobLineProvider } from "@/components/providers/JobLineProvider";
import { MFAEnrollmentGate } from "@/components/compliance/MFAEnrollmentGate";
import { ScrollToTop } from "@/components/ScrollToTop";
import { USPersonDeclarationGate } from "@/components/compliance/USPersonDeclarationGate";
import { ReleaseBadge } from "@/components/ReleaseBadge";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Teams from "./pages/Teams";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Testing from "./pages/Testing";
import Queue from "./pages/Queue";
import Setup from "./pages/Setup";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import DonationSuccess from "./pages/DonationSuccess";
import Demo from "./pages/Demo";
import FounderRedirect from "./pages/FounderRedirect";
import NotFound from "./pages/NotFound";
import ShiftHandoffSoftware from "./pages/features/ShiftHandoffSoftware";
import WorkOrderTracking from "./pages/features/WorkOrderTracking";
import ProductionScheduling from "./pages/features/ProductionScheduling";
import MachineShopSoftware from "./pages/features/MachineShopSoftware";
import ProductionControl from "./pages/features/ProductionControl";
import DigitalExpeditor from "./pages/features/DigitalExpeditor";
import ManufacturingOversight from "./pages/features/ManufacturingOversight";
import QualityManagement from "./pages/features/QualityManagement";
import CNCOperatorTools from "./pages/features/CNCOperatorTools";
import TeamCollaboration from "./pages/features/TeamCollaboration";
import DowntimeTracking from "./pages/features/DowntimeTracking";
import AIPlanningAssistant from "./pages/features/AIPlanningAssistant";
import MachineTimeTracking from "./pages/features/MachineTimeTracking";
import ShiftHandoff from "./pages/features/ShiftHandoff";
import ManufacturingVisibility from "./pages/features/ManufacturingVisibility";
import VSCodeGCode from "./pages/features/VSCodeGCode";
import MachineConnectPage from "./pages/features/MachineConnect";
import Updates from "./pages/Updates";
import Start from "./pages/Start";
import ResourcesIndex from "./pages/resources/ResourcesIndex";
import ManufacturingGuides from "./pages/resources/ManufacturingGuides";
import GCodeReference from "./pages/resources/GCodeReference";
import IndustryGlossary from "./pages/resources/IndustryGlossary";
import BeginnersGuide from "./pages/resources/BeginnersGuide";
import ManufacturingCareers from "./pages/resources/ManufacturingCareers";
import SafetyCompliance from "./pages/resources/SafetyCompliance";
import QualityInspection from "./pages/resources/QualityInspection";
import LeanManufacturing from "./pages/resources/LeanManufacturing";
import FiveSMethodology from "./pages/resources/FiveSMethodology";
import KanbanSortingTechniques from "./pages/resources/KanbanSortingTechniques";
import ManufacturingPioneers from "./pages/resources/ManufacturingPioneers";
import ToolComparisons from "./pages/resources/ToolComparisons";
import ERPSelectionGuide from "./pages/resources/ERPSelectionGuide";
import ResetPassword from "./pages/ResetPassword";
import Blog from "./pages/Blog";
import Help from "./pages/Help";
import HelpArticle from "./pages/HelpArticle";
import Tools from "./pages/Tools";
import IndustryPage from "./pages/industries/IndustryPage";
import ERPGuidePart from "./pages/resources/ERPGuidePart";
import { lazy, Suspense } from "react";

const ShopFloorDisplay = lazy(() => import("./pages/ShopFloorDisplay"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30s — don't refetch within window
      gcTime: 5 * 60_000,      // 5min garbage collection
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrgProvider>
        <TeamProvider>
          <ActAsProvider>
          <OnboardingProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AnalyticsProvider>
                  <ScrollToTop />
                  {/* ITAR compliance gates — both are no-ops when not required by the org */}
                  <MFAEnrollmentGate>
                  <USPersonDeclarationGate>
                  <JobLineProvider>
                  <ActAsBanner />
                  <ReleaseBadge />
                  <GuidedTour />
                  <WelcomeModal />
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/dashboard" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/teams" element={<Teams />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/testing" element={<Testing />} />
                    <Route path="/queue" element={<Queue />} />
                    <Route path="/setup" element={<Setup />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/donation-success" element={<DonationSuccess />} />
                    <Route path="/demo" element={<Demo />} />
                    <Route path="/updates" element={<Updates />} />
                    <Route path="/start" element={<Start />} />
                    <Route path="/zach" element={<FounderRedirect />} />
                    <Route path="/features/shift-handoff-software" element={<ShiftHandoffSoftware />} />
                    <Route path="/features/work-order-tracking" element={<WorkOrderTracking />} />
                    <Route path="/features/production-scheduling" element={<ProductionScheduling />} />
                    <Route path="/features/machine-shop-software" element={<MachineShopSoftware />} />
                    <Route path="/features/production-control" element={<ProductionControl />} />
                    <Route path="/features/digital-expeditor" element={<DigitalExpeditor />} />
                    <Route path="/features/manufacturing-oversight" element={<ManufacturingOversight />} />
                    <Route path="/features/quality-management" element={<QualityManagement />} />
                    <Route path="/features/cnc-operator-tools" element={<CNCOperatorTools />} />
                    <Route path="/features/team-collaboration" element={<TeamCollaboration />} />
                    <Route path="/features/downtime-tracking" element={<DowntimeTracking />} />
                    <Route path="/features/ai-planning-assistant" element={<AIPlanningAssistant />} />
                    <Route path="/machine-time-tracking" element={<MachineTimeTracking />} />
                    <Route path="/shift-handoff" element={<ShiftHandoff />} />
                    <Route path="/manufacturing-visibility" element={<ManufacturingVisibility />} />
                    <Route path="/features/vscode-gcode" element={<VSCodeGCode />} />
                    <Route path="/features/machine-connect" element={<MachineConnectPage />} />
                    <Route path="/resources" element={<ResourcesIndex />} />
                    <Route path="/resources/guides" element={<ManufacturingGuides />} />
                    <Route path="/resources/gcode" element={<GCodeReference />} />
                    <Route path="/resources/glossary" element={<IndustryGlossary />} />
                    <Route path="/resources/beginners" element={<BeginnersGuide />} />
                    <Route path="/resources/careers" element={<ManufacturingCareers />} />
                    <Route path="/resources/safety" element={<SafetyCompliance />} />
                    <Route path="/resources/quality" element={<QualityInspection />} />
                    <Route path="/resources/lean" element={<LeanManufacturing />} />
                    <Route path="/resources/5s" element={<FiveSMethodology />} />
                    <Route path="/resources/kanban" element={<KanbanSortingTechniques />} />
                    <Route path="/resources/pioneers" element={<ManufacturingPioneers />} />
                    <Route path="/resources/comparisons" element={<ToolComparisons />} />
                    <Route path="/resources/erp-guide" element={<ERPSelectionGuide />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/help/:category/:slug" element={<HelpArticle />} />
                    <Route path="/tools" element={<Tools />} />
                    <Route path="/industries/:slug" element={<IndustryPage />} />
                    <Route path="/resources/erp-guide/:partSlug" element={<ERPGuidePart />} />
                    <Route path="/display/:displayId" element={<Suspense fallback={<div className="min-h-screen bg-background" />}><ShopFloorDisplay /></Suspense>} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </JobLineProvider>
                  </USPersonDeclarationGate>
                  </MFAEnrollmentGate>
                </AnalyticsProvider>
              </BrowserRouter>
            </TooltipProvider>
          </OnboardingProvider>
          </ActAsProvider>
        </TeamProvider>
        </OrgProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

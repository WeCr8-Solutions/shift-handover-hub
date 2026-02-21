import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { TeamProvider } from "@/contexts/TeamContext";
import { OnboardingProvider, GuidedTour, WelcomeModal } from "@/components/onboarding";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
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

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TeamProvider>
          <OnboardingProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AnalyticsProvider>
                  <GuidedTour />
                  <WelcomeModal />
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/dashboard" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
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
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AnalyticsProvider>
              </BrowserRouter>
            </TooltipProvider>
          </OnboardingProvider>
        </TeamProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

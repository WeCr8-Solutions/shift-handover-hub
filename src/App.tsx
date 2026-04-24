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
import { RulesOfBehaviorGate } from "@/components/compliance/RulesOfBehaviorGate";
import { ReleaseBadge } from "@/components/ReleaseBadge";
import { lazy, Suspense } from "react";

// Eager: landing page (LCP-critical, most-visited route)
import Landing from "./pages/Landing";

// All other pages: lazy-loaded for route-based code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Teams = lazy(() => import("./pages/Teams"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const FieldView = lazy(() => import("./pages/FieldView"));
const Testing = lazy(() => import("./pages/Testing"));
const Queue = lazy(() => import("./pages/Queue"));
const Setup = lazy(() => import("./pages/Setup"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Settings = lazy(() => import("./pages/Settings"));
const DonationSuccess = lazy(() => import("./pages/DonationSuccess"));
const Demo = lazy(() => import("./pages/Demo"));
const FounderRedirect = lazy(() => import("./pages/FounderRedirect"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ShiftHandoffSoftware = lazy(() => import("./pages/features/ShiftHandoffSoftware"));
const WorkOrderTracking = lazy(() => import("./pages/features/WorkOrderTracking"));
const ProductionScheduling = lazy(() => import("./pages/features/ProductionScheduling"));
const MachineShopSoftware = lazy(() => import("./pages/features/MachineShopSoftware"));
const ProductionControl = lazy(() => import("./pages/features/ProductionControl"));
const DigitalExpeditor = lazy(() => import("./pages/features/DigitalExpeditor"));
const ManufacturingOversight = lazy(() => import("./pages/features/ManufacturingOversight"));
const QualityManagement = lazy(() => import("./pages/features/QualityManagement"));
const CNCOperatorTools = lazy(() => import("./pages/features/CNCOperatorTools"));
const TeamCollaboration = lazy(() => import("./pages/features/TeamCollaboration"));
const DowntimeTracking = lazy(() => import("./pages/features/DowntimeTracking"));
const AIPlanningAssistant = lazy(() => import("./pages/features/AIPlanningAssistant"));
const MachineTimeTracking = lazy(() => import("./pages/features/MachineTimeTracking"));
const ShiftHandoff = lazy(() => import("./pages/features/ShiftHandoff"));
const ManufacturingVisibility = lazy(() => import("./pages/features/ManufacturingVisibility"));
const VSCodeGCode = lazy(() => import("./pages/features/VSCodeGCode"));
const MachineConnectPage = lazy(() => import("./pages/features/MachineConnect"));
const JobShopSoftware = lazy(() => import("./pages/features/JobShopSoftware"));
const JobShopERP = lazy(() => import("./pages/features/JobShopERP"));
const CNCMachineTracking = lazy(() => import("./pages/features/CNCMachineTracking"));
const DNCFileSoftware = lazy(() => import("./pages/features/DNCFileSoftware"));
const ShopFloorDashboard = lazy(() => import("./pages/features/ShopFloorDashboard"));
const MesSoftware = lazy(() => import("./pages/features/MesSoftware"));
const ShopFloorControl = lazy(() => import("./pages/features/ShopFloorControl"));
const ProductionTracking = lazy(() => import("./pages/features/ProductionTracking"));
const JobCostingSoftware = lazy(() => import("./pages/features/JobCostingSoftware"));
const OeeSoftware = lazy(() => import("./pages/features/OeeSoftware"));
const CapacityPlanning = lazy(() => import("./pages/features/CapacityPlanning"));
const FirstArticleInspection = lazy(() => import("./pages/features/FirstArticleInspection"));
const NcrSoftware = lazy(() => import("./pages/features/NcrSoftware"));
const PreventiveMaintenance = lazy(() => import("./pages/features/PreventiveMaintenance"));
const WorkCenterScheduling = lazy(() => import("./pages/features/WorkCenterScheduling"));
const QuotingSoftware = lazy(() => import("./pages/features/QuotingSoftware"));
const JobBossAlternative = lazy(() => import("./pages/compare/JobBossAlternative"));
const ProShopAlternative = lazy(() => import("./pages/compare/ProShopAlternative"));
const E2ShopAlternative = lazy(() => import("./pages/compare/E2ShopAlternative"));
const GlobalShopAlternative = lazy(() => import("./pages/compare/GlobalShopAlternative"));
const EpicorAlternative = lazy(() => import("./pages/compare/EpicorAlternative"));
const SpreadsheetAlternative = lazy(() => import("./pages/compare/SpreadsheetAlternative"));
const MesVsErp = lazy(() => import("./pages/resources/MesVsErp"));
const ShopFloorBuyersGuide = lazy(() => import("./pages/resources/ShopFloorBuyersGuide"));
const Updates = lazy(() => import("./pages/Updates"));
const Start = lazy(() => import("./pages/Start"));
const ResourcesIndex = lazy(() => import("./pages/resources/ResourcesIndex"));
const ManufacturingGuides = lazy(() => import("./pages/resources/ManufacturingGuides"));
const GCodeReference = lazy(() => import("./pages/resources/GCodeReference"));
const GCodeAcademy = lazy(() => import("./pages/resources/GCodeAcademy"));
const OperatorAcceptanceProgram = lazy(() => import("./pages/resources/OperatorAcceptanceProgram"));
const OAPLanding = lazy(() => import("./pages/OAPLanding"));
const GCALanding = lazy(() => import("./pages/GCALanding"));
const HandbookLibrary = lazy(() => import("./pages/HandbookLibrary"));
const HandbookEntry = lazy(() => import("./pages/HandbookEntry"));
const CertificateLookup = lazy(() => import("./pages/CertificateLookup"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const CertSuccess = lazy(() => import("./pages/CertSuccess"));
const OapWalkthrough = lazy(() => import("./pages/OapWalkthrough"));
const OapHub = lazy(() => import("./pages/OapHub"));
const OapCoursePlayer = lazy(() => import("./pages/OapCoursePlayer"));
const OapEmployer = lazy(() => import("./pages/OapEmployer"));
const GcaEmployer = lazy(() => import("./pages/GcaEmployer"));
const GcaTestPage = lazy(() => import("./pages/GcaTestPage"));
const OapMyTranscript = lazy(() => import("./pages/OapMyTranscript"));
const IndustryGlossary = lazy(() => import("./pages/resources/IndustryGlossary"));
const BeginnersGuide = lazy(() => import("./pages/resources/BeginnersGuide"));
const ManufacturingCareers = lazy(() => import("./pages/resources/ManufacturingCareers"));
const SafetyCompliance = lazy(() => import("./pages/resources/SafetyCompliance"));
const QualityInspection = lazy(() => import("./pages/resources/QualityInspection"));
const LeanManufacturing = lazy(() => import("./pages/resources/LeanManufacturing"));
const FiveSMethodology = lazy(() => import("./pages/resources/FiveSMethodology"));
const KanbanSortingTechniques = lazy(() => import("./pages/resources/KanbanSortingTechniques"));
const ManufacturingPioneers = lazy(() => import("./pages/resources/ManufacturingPioneers"));
const ToolComparisons = lazy(() => import("./pages/resources/ToolComparisons"));
const ERPSelectionGuide = lazy(() => import("./pages/resources/ERPSelectionGuide"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Help = lazy(() => import("./pages/Help"));
const UseCases = lazy(() => import("./pages/UseCases"));
const HelpArticle = lazy(() => import("./pages/HelpArticle"));
const Tools = lazy(() => import("./pages/Tools"));
const Status = lazy(() => import("./pages/Status"));
const IndustryPage = lazy(() => import("./pages/industries/IndustryPage"));
const ERPGuidePart = lazy(() => import("./pages/resources/ERPGuidePart"));
const DevPortal = lazy(() => import("./pages/DevPortal"));
const DevDocArticle = lazy(() => import("./pages/DevDocArticle"));
const WorkOrderHistoryPage = lazy(() => import("./pages/WorkOrderHistoryPage"));
const QuoteHistoryPage = lazy(() => import("./pages/QuoteHistoryPage"));
const OperatorProfile = lazy(() => import("./pages/OperatorProfile"));
const TalentLanding = lazy(() => import("./pages/TalentLanding"));
const TalentBrowse = lazy(() => import("./pages/TalentBrowse"));
const TalentSearch = lazy(() => import("./pages/TalentSearch"));
const PublicOperatorProfile = lazy(() => import("./pages/PublicOperatorProfile"));
const OperatorInbox = lazy(() => import("./pages/OperatorInbox"));
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

const RouteFallback = () => <div className="min-h-screen bg-background" />;

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
                  {/* Compliance gates — no-ops when the condition is not met */}
                  <RulesOfBehaviorGate>
                  <MFAEnrollmentGate>
                  <USPersonDeclarationGate>
                  <JobLineProvider>
                  <ActAsBanner />
                  <ReleaseBadge />
                  <GuidedTour />
                  <WelcomeModal />
                  <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/dashboard" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/teams" element={<Teams />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/field" element={<FieldView />} />
                    <Route path="/field/:token" element={<FieldView />} />
                    <Route path="/testing" element={<Testing />} />
                    <Route path="/queue" element={<Queue />} />
                    <Route path="/history" element={<WorkOrderHistoryPage />} />
                    <Route path="/quote-history" element={<QuoteHistoryPage />} />
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
                    <Route path="/features/job-shop-software" element={<JobShopSoftware />} />
                    <Route path="/features/job-shop-erp" element={<JobShopERP />} />
                    <Route path="/features/cnc-machine-tracking" element={<CNCMachineTracking />} />
                    <Route path="/features/dnc-software" element={<DNCFileSoftware />} />
                    <Route path="/features/shop-floor-dashboard" element={<ShopFloorDashboard />} />
                    <Route path="/features/mes-software" element={<MesSoftware />} />
                    <Route path="/features/shop-floor-control" element={<ShopFloorControl />} />
                    <Route path="/features/production-tracking" element={<ProductionTracking />} />
                    <Route path="/features/job-costing-software" element={<JobCostingSoftware />} />
                    <Route path="/features/oee-software" element={<OeeSoftware />} />
                    <Route path="/features/capacity-planning" element={<CapacityPlanning />} />
                    <Route path="/features/first-article-inspection" element={<FirstArticleInspection />} />
                    <Route path="/features/ncr-software" element={<NcrSoftware />} />
                    <Route path="/features/preventive-maintenance" element={<PreventiveMaintenance />} />
                    <Route path="/features/work-center-scheduling" element={<WorkCenterScheduling />} />
                    <Route path="/features/quoting-software" element={<QuotingSoftware />} />
                    <Route path="/compare/jobboss-alternative" element={<JobBossAlternative />} />
                    <Route path="/compare/proshop-alternative" element={<ProShopAlternative />} />
                    <Route path="/compare/e2-shop-alternative" element={<E2ShopAlternative />} />
                    <Route path="/compare/global-shop-alternative" element={<GlobalShopAlternative />} />
                    <Route path="/compare/epicor-alternative" element={<EpicorAlternative />} />
                    <Route path="/compare/spreadsheet-alternative" element={<SpreadsheetAlternative />} />
                    <Route path="/resources" element={<ResourcesIndex />} />
                    <Route path="/resources/guides" element={<ManufacturingGuides />} />
                    <Route path="/resources/gcode" element={<GCodeReference />} />
                    <Route path="/gcode-academy" element={<GCALanding />} />
                    <Route path="/resources/gcode-academy" element={<GCodeAcademy />} />
                    <Route path="/oap" element={<OAPLanding />} />
                    <Route path="/handbook" element={<HandbookLibrary />} />
                    <Route path="/handbook/:slug" element={<HandbookEntry />} />
                    <Route path="/verify" element={<CertificateLookup />} />
                    <Route path="/verify/:certId" element={<VerifyCertificate />} />
                    <Route path="/cert/success" element={<CertSuccess />} />
                    <Route path="/oap/walkthrough" element={<OapWalkthrough />} />
                    <Route path="/oap/walkthrough/:sessionId" element={<OapWalkthrough />} />
                    <Route path="/oap/learn" element={<OapHub />} />
                    <Route path="/oap/learn/:courseSlug" element={<OapCoursePlayer />} />
                    <Route path="/oap/learn/:courseSlug/:lessonSlug" element={<OapCoursePlayer />} />
                    <Route path="/oap/employer" element={<OapEmployer />} />
                    <Route path="/gca/employer" element={<GcaEmployer />} />
                    <Route path="/gca/test/:bankSlug" element={<GcaTestPage />} />
                    <Route path="/gcode-academy/certificates" element={<CertificateLookup />} />
                    <Route path="/gcode-academy/certificates/verify" element={<CertificateLookup />} />
                    <Route path="/oap/my-transcript" element={<OapMyTranscript />} />
                    <Route path="/oap/certificates" element={<CertificateLookup />} />
                    <Route path="/oap/certificates/verify" element={<CertificateLookup />} />
                    <Route path="/talent" element={<TalentLanding />} />
                    <Route path="/talent/browse" element={<TalentBrowse />} />
                    <Route path="/talent/search" element={<TalentSearch />} />
                    <Route path="/talent/:username" element={<PublicOperatorProfile />} />
                    <Route path="/operator/profile" element={<OperatorProfile />} />
                    <Route path="/resources/oap" element={<OperatorAcceptanceProgram />} />
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
                    <Route path="/resources/mes-vs-erp" element={<MesVsErp />} />
                    <Route path="/resources/buyers-guide" element={<ShopFloorBuyersGuide />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/use-cases" element={<UseCases />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/help/:category/:slug" element={<HelpArticle />} />
                    <Route path="/tools" element={<Tools />} />
                    <Route path="/status" element={<Status />} />
                    <Route path="/industries/:slug" element={<IndustryPage />} />
                    <Route path="/resources/erp-guide/:partSlug" element={<ERPGuidePart />} />
                    <Route path="/dev" element={<DevPortal />} />
                    <Route path="/dev/:category/:slug" element={<DevDocArticle />} />
                    <Route path="/display/:displayId" element={<ShopFloorDisplay />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
                  </JobLineProvider>
                  </USPersonDeclarationGate>
                  </MFAEnrollmentGate>
                  </RulesOfBehaviorGate>
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

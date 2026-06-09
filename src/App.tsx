import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { TeamProvider } from "@/contexts/TeamContext";
import { OrgProvider } from "@/contexts/OrgContext";
import { ActAsProvider } from "@/contexts/ActAsContext";
import { OnboardingProvider, GuidedTour, WelcomeModal } from "@/components/onboarding";
import { ConciergeInProgressSplash } from "@/components/onboarding/ConciergeInProgressSplash";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { ActAsBanner } from "@/components/admin/ActAsBanner";
import { JobLineProvider } from "@/components/providers/JobLineProvider";
import { MFAEnrollmentGate } from "@/components/compliance/MFAEnrollmentGate";
import { ScrollToTop } from "@/components/ScrollToTop";
import { USPersonDeclarationGate } from "@/components/compliance/USPersonDeclarationGate";
import { RulesOfBehaviorGate } from "@/components/compliance/RulesOfBehaviorGate";
import { ReleaseBadge } from "@/components/ReleaseBadge";
import { RequireAuth, RequireOrg, RequireRole, RequireSubscription } from "@/components/auth/RouteGuards";
import { OwnerSetupRedirect } from "@/components/onboarding/OwnerSetupRedirect";
import { lazy, Suspense } from "react";

// Eager: landing page (LCP-critical, most-visited route)
import Landing from "./pages/Landing";

// All other pages: lazy-loaded for route-based code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Teams = lazy(() => import("./pages/Teams"));
const CustomersPage = lazy(() => import("./pages/Customers"));
const Packages = lazy(() => import("./pages/Packages"));
const PackageDetail = lazy(() => import("./pages/PackageDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const FieldView = lazy(() => import("./pages/FieldView"));
const FloorMap = lazy(() => import("./pages/FloorMap"));
const Testing = lazy(() => import("./pages/Testing"));
const Queue = lazy(() => import("./pages/Queue"));
const QueueHub = lazy(() => import("./pages/QueueHub"));
const PlanningCenter = lazy(() => import("./pages/PlanningCenter"));
const WorkOrdersHub = lazy(() => import("./pages/WorkOrdersHub"));
const WorkOrderTraveler = lazy(() => import("./pages/WorkOrderTraveler"));
const WorkOrderCoC = lazy(() => import("./pages/WorkOrderCoC"));
const CompletedWorkOrders = lazy(() => import("./pages/CompletedWorkOrders"));
const CancelledWorkOrders = lazy(() => import("./pages/CancelledWorkOrders"));
const OnHoldWorkOrders = lazy(() => import("./pages/OnHoldWorkOrders"));
const QuotesHub = lazy(() => import("./pages/QuotesHub"));
const Setup = lazy(() => import("./pages/Setup"));
const OnboardingService = lazy(() => import("./pages/OnboardingService"));
const OnboardingIntake = lazy(() => import("./pages/OnboardingIntake"));
const ConciergeSales = lazy(() => import("./pages/ConciergeSales"));
const ConciergeSalesPack = lazy(() => import("./pages/ConciergeSalesPack"));
const ConciergeInvoicePdf = lazy(() => import("./pages/ConciergeInvoicePdf"));
const ConciergeBillingTab = lazy(() => import("./pages/billing/ConciergeBillingTab"));
const ConciergeReporting = lazy(() => import("./pages/admin/ConciergeReporting"));
const ConciergeLibrary = lazy(() => import("./pages/admin/ConciergeLibrary"));
const ConciergeDocumentsCustomer = lazy(() => import("./pages/settings/ConciergeDocuments"));
const ManufacturingVisibility100 = lazy(() => import("./pages/marketing/ManufacturingVisibility100"));
const ManufacturingVisibility100Methodology = lazy(() => import("./pages/marketing/ManufacturingVisibility100Methodology"));
const ManufacturingVisibility100Nominate = lazy(() => import("./pages/marketing/ManufacturingVisibility100Nominate"));
const ManufacturingVisibility100Honorees = lazy(() => import("./pages/marketing/ManufacturingVisibility100Honorees"));
const ManufacturingVisibility100Detail = lazy(() => import("./pages/marketing/ManufacturingVisibility100Detail"));
const ManufacturingVisibility100Admin = lazy(() => import("./pages/admin/ManufacturingVisibility100Admin"));
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
const ManufacturingSchedulingSoftware = lazy(() => import("./pages/features/ManufacturingSchedulingSoftware"));
const MachineMonitoringSoftware = lazy(() => import("./pages/features/MachineMonitoringSoftware"));
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
const SAPAlternative = lazy(() => import("./pages/compare/SAPAlternative"));
const WhyJobline = lazy(() => import("./pages/WhyJobline"));
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
const ManualsLibrary = lazy(() => import("./pages/ManualsLibrary"));
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
const LearnIndex = lazy(() => import("./pages/learn/LearnIndex"));
const LearnGlossary = lazy(() => import("./pages/learn/LearnGlossary"));
const LearnTermDetail = lazy(() => import("./pages/learn/LearnTermDetail"));
const LearnFundamentals = lazy(() => import("./pages/learn/fundamentals/LearnFundamentals"));
const LearnProfessions = lazy(() => import("./pages/learn/professions/LearnProfessions"));
const LearnProfessionDetail = lazy(() => import("./pages/learn/professions/LearnProfessionDetail"));
const LearnTutorials = lazy(() => import("./pages/learn/tutorials/LearnTutorials"));
const OpenClawInstallGuide = lazy(() => import("./pages/learn/tutorials/openclaw/OpenClawInstallGuide"));
const HermesInstallGuide = lazy(() => import("./pages/learn/tutorials/hermes/HermesInstallGuide"));
const NemoClawInstallGuide = lazy(() => import("./pages/learn/tutorials/nemoclaw/NemoClawInstallGuide"));
const IndustryGlossary = lazy(() => import("./pages/resources/IndustryGlossary"));
const BeginnersGuide = lazy(() => import("./pages/resources/BeginnersGuide"));
const ManufacturingCareers = lazy(() => import("./pages/resources/ManufacturingCareers"));
const SafetyCompliance = lazy(() => import("./pages/resources/SafetyCompliance"));
const QualityInspection = lazy(() => import("./pages/resources/QualityInspection"));
const LeanManufacturing = lazy(() => import("./pages/resources/LeanManufacturing"));
const FiveSMethodology = lazy(() => import("./pages/resources/FiveSMethodology"));
const KanbanSortingTechniques = lazy(() => import("./pages/resources/KanbanSortingTechniques"));
const ManufacturingPioneers = lazy(() => import("./pages/resources/ManufacturingPioneers"));
const EssentialReading = lazy(() => import("./pages/resources/EssentialReading"));
const AdminAmazonLinks = lazy(() => import("./pages/admin/AdminAmazonLinks"));
const ToolComparisons = lazy(() => import("./pages/resources/ToolComparisons"));
const ERPSelectionGuide = lazy(() => import("./pages/resources/ERPSelectionGuide"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Activate = lazy(() => import("./pages/Activate"));
const ClaimAccountOwner = lazy(() => import("./pages/ClaimAccountOwner"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Blog = lazy(() => import("./pages/Blog"));
const SitemapPage = lazy(() => import("./pages/SitemapPage"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Help = lazy(() => import("./pages/Help"));
const UseCases = lazy(() => import("./pages/UseCases"));
const HelpArticle = lazy(() => import("./pages/HelpArticle"));
const Tools = lazy(() => import("./pages/Tools"));
const Status = lazy(() => import("./pages/Status"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Cookies = lazy(() => import("./pages/legal/Cookies"));
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
const TalentDashboard = lazy(() => import("./pages/TalentDashboard"));
const PublicTalentProfile = lazy(() => import("./pages/PublicOperatorProfile"));
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
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AnalyticsProvider>
                  <ScrollToTop />
                  {/* Compliance gates — no-ops when the condition is not met */}
                  <RulesOfBehaviorGate>
                  <MFAEnrollmentGate>
                  <USPersonDeclarationGate>
                  <JobLineProvider>
                  <ConciergeInProgressSplash>
                  <ActAsBanner />
                  <ReleaseBadge />
                  <GuidedTour />
                  <WelcomeModal />
                  <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/dashboard" element={<OwnerSetupRedirect><Index /></OwnerSetupRedirect>} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/unsubscribe" element={<Unsubscribe />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/activate" element={<Activate />} />
                    <Route path="/claim/account-owner" element={<ClaimAccountOwner />} />
                    <Route path="/claim" element={<ClaimAccountOwner />} />
                    <Route path="/welcome" element={<RequireAuth><RequireOrg><Welcome /></RequireOrg></RequireAuth>} />
                    <Route path="/welcome/:stepId" element={<RequireAuth><RequireOrg><Welcome /></RequireOrg></RequireAuth>} />
                    <Route path="/teams" element={<Teams />} />
                    <Route path="/customers" element={<RequireAuth><RequireOrg><CustomersPage /></RequireOrg></RequireAuth>} />
                    <Route path="/packages" element={<RequireAuth><RequireOrg><Packages /></RequireOrg></RequireAuth>} />
                    <Route path="/packages/:id" element={<RequireAuth><RequireOrg><PackageDetail /></RequireOrg></RequireAuth>} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/field" element={<FieldView />} />
                    <Route path="/field/:token" element={<FieldView />} />
                    <Route path="/floor-map" element={<RequireAuth><RequireOrg><FloorMap /></RequireOrg></RequireAuth>} />
                    <Route path="/testing" element={<RequireAuth><RequireRole roles={["platform_admin","developer"]}><Testing /></RequireRole></RequireAuth>} />
                    <Route path="/queue" element={<RequireAuth><RequireOrg><Queue /></RequireOrg></RequireAuth>} />
                    <Route path="/queue-hub" element={<RequireAuth><RequireOrg><QueueHub /></RequireOrg></RequireAuth>} />
                    <Route path="/planning-center" element={<RequireAuth><RequireOrg><PlanningCenter /></RequireOrg></RequireAuth>} />
                    <Route path="/work-orders" element={<RequireAuth><RequireOrg><WorkOrdersHub /></RequireOrg></RequireAuth>} />
                    <Route path="/work-orders/completed" element={<RequireAuth><RequireOrg><CompletedWorkOrders /></RequireOrg></RequireAuth>} />
                    <Route path="/work-orders/cancelled" element={<RequireAuth><RequireOrg><CancelledWorkOrders /></RequireOrg></RequireAuth>} />
                    <Route path="/work-orders/on-hold" element={<RequireAuth><RequireOrg><OnHoldWorkOrders /></RequireOrg></RequireAuth>} />
                    <Route path="/work-orders/:id/traveler" element={<RequireAuth><RequireOrg><WorkOrderTraveler /></RequireOrg></RequireAuth>} />
                    <Route path="/work-orders/:id/coc" element={<RequireAuth><RequireOrg><WorkOrderCoC /></RequireOrg></RequireAuth>} />
                    <Route path="/quotes" element={<RequireAuth><RequireOrg><QuotesHub /></RequireOrg></RequireAuth>} />
                    <Route path="/history" element={<RequireAuth><RequireOrg><WorkOrderHistoryPage /></RequireOrg></RequireAuth>} />
                    <Route path="/quote-history" element={<RequireAuth><RequireOrg><QuoteHistoryPage /></RequireOrg></RequireAuth>} />
                    <Route path="/setup" element={<RequireAuth><Setup /></RequireAuth>} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/onboarding-service" element={<OnboardingService />} />
                    <Route path="/onboarding/intake" element={<RequireAuth><RequireOrg><OnboardingIntake /></RequireOrg></RequireAuth>} />
                    <Route path="/concierge/sales" element={<ConciergeSales />} />
                    <Route path="/concierge/sales-pack" element={<ConciergeSalesPack publicMode />} />
                    <Route path="/manufacturing-100" element={<ManufacturingVisibility100 />} />
                    <Route path="/manufacturing-100/methodology" element={<ManufacturingVisibility100Methodology />} />
                    <Route path="/manufacturing-100/nominate" element={<ManufacturingVisibility100Nominate />} />
                    <Route path="/manufacturing-100/honorees" element={<ManufacturingVisibility100Honorees />} />
                    <Route path="/manufacturing-100/:slug" element={<ManufacturingVisibility100Detail />} />
                    <Route path="/admin/manufacturing-100" element={<RequireAuth><RequireRole roles={["platform_admin","developer"]}><ManufacturingVisibility100Admin /></RequireRole></RequireAuth>} />
                    <Route path="/admin/concierge/print" element={<ConciergeSalesPack />} />
                    <Route path="/admin/concierge/print/:engagementId" element={<ConciergeSalesPack />} />
                    <Route path="/admin/concierge/reporting" element={<RequireAuth><RequireRole roles={["platform_admin","developer"]}><ConciergeReporting /></RequireRole></RequireAuth>} />
                    <Route path="/admin/concierge/library" element={<RequireAuth><RequireRole roles={["platform_admin","developer"]}><ConciergeLibrary /></RequireRole></RequireAuth>} />
                    <Route path="/settings/concierge/documents" element={<RequireAuth><RequireOrg><ConciergeDocumentsCustomer /></RequireOrg></RequireAuth>} />

                    <Route path="/billing/concierge/invoice/:engagementId" element={<RequireAuth><ConciergeInvoicePdf /></RequireAuth>} />
                    <Route path="/settings/billing/concierge" element={<RequireAuth><RequireOrg><ConciergeBillingTab /></RequireOrg></RequireAuth>} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/donation-success" element={<DonationSuccess />} />
                    <Route path="/demo" element={<Demo />} />
                    <Route path="/updates" element={<Updates />} />
                    <Route path="/start" element={<Start />} />
                    <Route path="/zach" element={<FounderRedirect />} />
                    <Route path="/features/shift-handoff-software" element={<ShiftHandoffSoftware />} />
                    <Route path="/features/work-order-tracking" element={<WorkOrderTracking />} />
                    <Route path="/features/production-scheduling" element={<ProductionScheduling />} />
                    <Route path="/features/manufacturing-scheduling-software" element={<ManufacturingSchedulingSoftware />} />
                    <Route path="/features/machine-monitoring-software" element={<MachineMonitoringSoftware />} />
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
                    <Route path="/compare/sap-alternative" element={<SAPAlternative />} />
                    <Route path="/why-jobline" element={<WhyJobline />} />
                    <Route path="/resources" element={<ResourcesIndex />} />
                    <Route path="/resources/guides" element={<ManufacturingGuides />} />
                    <Route path="/resources/gcode" element={<GCodeReference />} />
                    <Route path="/gcode-academy" element={<GCALanding />} />
                    <Route path="/gcode-academy/app" element={<Navigate to="/resources/gcode-academy" replace />} />
                    <Route path="/resources/gcode-academy" element={<GCodeAcademy />} />
                    <Route path="/oap" element={<OAPLanding />} />
                    <Route path="/oap/app" element={<Navigate to="/resources/oap" replace />} />
                    <Route path="/handbook" element={<HandbookLibrary />} />
                    <Route path="/handbook/:slug" element={<HandbookEntry />} />
                    <Route path="/manuals" element={<ManualsLibrary />} />
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
                    <Route path="/learn" element={<LearnIndex />} />
                    <Route path="/learn/glossary" element={<LearnGlossary />} />
                    <Route path="/learn/glossary/:termId" element={<LearnTermDetail />} />
                    <Route path="/learn/fundamentals" element={<LearnFundamentals />} />
                    <Route path="/learn/professions" element={<LearnProfessions />} />
                    <Route path="/learn/professions/:roleSlug" element={<LearnProfessionDetail />} />
                    <Route path="/learn/tutorials" element={<LearnTutorials />} />
                    <Route path="/learn/tutorials/openclaw-install" element={<OpenClawInstallGuide />} />
                    <Route path="/learn/tutorials/hermes-install" element={<HermesInstallGuide />} />
                    <Route path="/learn/tutorials/nemoclaw-install" element={<NemoClawInstallGuide />} />
                    <Route path="/talent" element={<TalentLanding />} />
                    <Route path="/talent/dashboard" element={<TalentDashboard />} />
                    <Route path="/talent/browse" element={<TalentBrowse />} />
                    <Route path="/talent/search" element={<TalentSearch />} />
                    <Route path="/talent/profile" element={<Navigate to="/operator/profile" replace />} />
                    <Route path="/talent/:username" element={<PublicTalentProfile />} />
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
                    <Route path="/resources/essential-reading" element={<EssentialReading />} />
                    <Route path="/admin/amazon-links" element={<AdminAmazonLinks />} />
                    <Route path="/resources/comparisons" element={<ToolComparisons />} />
                    <Route path="/resources/erp-guide" element={<ERPSelectionGuide />} />
                    <Route path="/resources/mes-vs-erp" element={<MesVsErp />} />
                    <Route path="/resources/buyers-guide" element={<ShopFloorBuyersGuide />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/use-cases" element={<UseCases />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/sitemap" element={<SitemapPage />} />
                    <Route path="/help/:category/:slug" element={<HelpArticle />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/cookies" element={<Cookies />} />
                    <Route path="/tools" element={<Tools />} />
                    <Route path="/status" element={<Status />} />
                    <Route path="/industries" element={<Navigate to="/industries/job-shops" replace />} />
                    <Route path="/industries/:slug" element={<IndustryPage />} />
                    <Route path="/resources/erp-guide/:partSlug" element={<ERPGuidePart />} />
                    <Route path="/dev" element={<DevPortal />} />
                    <Route path="/dev/:category/:slug" element={<DevDocArticle />} />
                    <Route path="/display/:displayId" element={<ShopFloorDisplay />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
                  </ConciergeInProgressSplash>
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

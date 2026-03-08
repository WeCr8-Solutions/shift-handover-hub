import {
  Rocket, LayoutDashboard, ClipboardList, ArrowRightLeft,
  Users, Radio, ShieldCheck, Settings, Lock, HelpCircle, Wrench,
} from "lucide-react";

export interface HelpSection {
  heading: string;
  body: string;
}

export interface HelpArticle {
  category: string;
  categoryLabel: string;
  slug: string;
  title: string;
  description: string;
  sections: HelpSection[];
  tags: string[];
  relatedSlugs?: string[];
}

export interface HelpCategory {
  key: string;
  label: string;
  description: string;
  icon: typeof Rocket;
}

export const helpCategories: HelpCategory[] = [
  { key: "getting-started", label: "Getting Started", description: "Account creation, onboarding, and your first steps on JobLine.ai", icon: Rocket },
  { key: "dashboard", label: "Dashboard", description: "Understanding your dashboard views, widgets, refresh behavior, and analytics", icon: LayoutDashboard },
  { key: "work-orders", label: "Work Orders", description: "Creating, routing, tracking, and managing production work orders", icon: ClipboardList },
  { key: "shift-handoffs", label: "Shift Handoffs", description: "Documenting handoffs, reviewing incoming notes, and shift analytics", icon: ArrowRightLeft },
  { key: "teams-orgs", label: "Teams & Organizations", description: "Organization setup, team management, invitations, and role structure", icon: Users },
  { key: "stations", label: "Stations & Work Centers", description: "Setting up physical work centers, check-in, equipment, and filtering", icon: Radio },
  { key: "quality", label: "Quality Management", description: "Non-Conformance Reports, disposition workflows, and quality metrics", icon: ShieldCheck },
  { key: "settings", label: "Settings", description: "Profile, notifications, billing, shift schedules, and integrations", icon: Settings },
  { key: "admin", label: "Admin Guide", description: "User management, organization oversight, audit trails, and compliance", icon: Lock },
  { key: "tools", label: "Operator Tools", description: "Calculators, converters, and reference utilities for the shop floor", icon: Wrench },
  { key: "faq", label: "FAQ", description: "Common questions, troubleshooting, data export, and productivity tips", icon: HelpCircle },
];

export const helpArticles: HelpArticle[] = [
  // ════════════════════════════════════════════════════════════════
  // ── GETTING STARTED ────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════
  {
    category: "getting-started", categoryLabel: "Getting Started",
    slug: "creating-an-account", title: "Creating an Account",
    description: "How to sign up for JobLine.ai, verify your email, and prepare for onboarding.",
    tags: ["signup", "account", "email", "registration", "onboarding"],
    relatedSlugs: ["getting-started/joining-an-organization", "getting-started/navigating-the-dashboard"],
    sections: [
      { heading: "Before You Begin", body: "To create an account you need a valid work email address and a modern web browser (Chrome, Edge, Firefox, or Safari — latest two versions). JobLine.ai does not currently support Internet Explorer. Make sure your network does not block access to jobline.ai or its subdomains, as some corporate firewalls restrict SaaS applications by default." },
      { heading: "Navigating to Sign-Up", body: "From the JobLine.ai landing page, click the \"Start Free Trial\" button in the top-right corner. You will be taken to the authentication page where you can choose between signing up with a new account or signing in to an existing one. If your organization has already sent you an invite link, clicking that link will also bring you here with the invite code pre-filled." },
      { heading: "Choosing Your Credentials", body: "Enter your work email address — this will be the primary identifier for your account and where all notifications are sent. Choose a password that is at least 8 characters long. We strongly recommend using a mix of uppercase letters, lowercase letters, numbers, and symbols. Avoid using the same password you use for other services, especially your email provider." },
      { heading: "Email Verification", body: "After submitting the sign-up form, check your inbox for a verification email from JobLine.ai. This email contains a confirmation link that you must click to activate your account. The link is valid for 24 hours. If you do not see the email within a few minutes, check your spam or junk folder. Corporate email filters sometimes flag automated messages — if needed, ask your IT team to whitelist emails from jobline.ai." },
      { heading: "What If the Verification Link Expires?", body: "If 24 hours pass without clicking the link, return to the sign-in page and attempt to sign in with your email and password. The system will detect that your email is unverified and offer to resend the verification link. You can also use the \"Forgot Password\" flow, which sends a password-reset email that also verifies your account upon completion." },
      { heading: "First Sign-In", body: "Once your email is verified, sign in with your credentials. You will be greeted by the onboarding wizard, which walks you through creating or joining an organization. If you already have an invite code from a colleague, you can enter it during this step to skip organization creation and join their existing org immediately." },
      { heading: "Browser and Device Recommendations", body: "For the best experience, use JobLine.ai on a device with a screen width of at least 360 pixels (most modern smartphones meet this). On desktop, a screen resolution of 1280×720 or higher is recommended. The application works on tablets and can be added to your home screen for a near-native experience on iOS and Android." },
    ],
  },
  {
    category: "getting-started", categoryLabel: "Getting Started",
    slug: "joining-an-organization", title: "Joining an Organization",
    description: "How to join an existing organization using an invite code, QR code, or direct link.",
    tags: ["invite", "organization", "join", "QR", "onboarding"],
    relatedSlugs: ["getting-started/creating-an-account", "teams-orgs/inviting-members"],
    sections: [
      { heading: "Overview", body: "Every user in JobLine.ai belongs to at least one organization. An organization represents your company, facility, or shop. Before you can view dashboards, work orders, or stations, you need to either create a new organization or join an existing one. Most production-floor workers will join an organization that their supervisor or admin has already set up." },
      { heading: "Using an Invite Code", body: "Your supervisor or org admin will provide you with a 6-character alphanumeric invite code (for example: A3X7K9). After signing in, navigate to the \"Join Organization\" screen — this is shown automatically during onboarding or can be accessed from your Profile page. Enter the code in the text field and click \"Join.\" If the code is valid and has not expired, you will be added to the organization with the role the inviter selected (typically Operator)." },
      { heading: "Scanning a QR Code", body: "Instead of typing a code, your admin may display a QR code on a monitor, printed sheet, or shared screen. Open your phone's camera app (or any QR scanner) and point it at the code. This will open a link in your browser that pre-fills the invite code on the join screen. If you are not yet signed in, you will be prompted to create an account or sign in first, and the invite code will be preserved through that flow." },
      { heading: "Direct Invite Links", body: "In some cases, your admin may send you a direct URL via email or messaging app. Clicking this link takes you straight to the join page with the invite code embedded. This is the simplest method for users who are not physically on the shop floor during onboarding." },
      { heading: "Pending Approval", body: "Depending on your organization's settings, joining may be instant or may require admin approval. If approval is required, you will see a \"Pending\" status after entering the code. Your admin will review and approve your membership from the member management screen. You will not be able to access organization data until approval is granted. If you have been waiting longer than expected, contact your supervisor directly." },
      { heading: "What Happens After Joining", body: "Once you are a member of an organization, the app redirects you to the main dashboard. You will see content scoped to your assigned team (if one has been set). If you have not been assigned to a team yet, you may see an empty dashboard — this is normal. Your supervisor will add you to the appropriate team, at which point stations and work orders will appear." },
      { heading: "Troubleshooting Join Issues", body: "Common issues include: expired invite codes (codes are valid for a limited time — ask your admin for a fresh one), codes that have reached their maximum use count, or typos in the code. If you receive an \"invalid code\" error, double-check each character carefully. Codes are case-insensitive, so capitalization does not matter. If the problem persists, ask your admin to generate a new code." },
    ],
  },
  {
    category: "getting-started", categoryLabel: "Getting Started",
    slug: "navigating-the-dashboard", title: "Navigating the Dashboard",
    description: "A guided tour of the main dashboard layout, navigation elements, and how content adapts to your role.",
    tags: ["dashboard", "navigation", "layout", "header", "menu"],
    relatedSlugs: ["dashboard/operator-dashboard", "dashboard/supervisor-dashboard"],
    sections: [
      { heading: "The Header Bar", body: "The header bar is always visible at the top of the screen. On the left side you will find the JobLine.ai logo (clicking it returns you to the dashboard from any page). On the right side you will see the team selector dropdown, a notifications indicator, and your user menu (avatar or initials). On mobile devices, a hamburger menu icon replaces some of these elements to save screen space." },
      { heading: "Team Selector", body: "If you belong to more than one team — for example, you occasionally cover shifts in a different department — the team selector lets you switch context. When you select a different team, all dashboard content (stations, work orders, handoffs, and analytics) updates to reflect that team's data. Your most recent selection is remembered between sessions, so you will not need to re-select every time you sign in." },
      { heading: "Role-Based Content", body: "What you see on the dashboard depends on your role. Operators see a focused view centered on their checked-in station: the active work order, parts progress, and recent handoff notes. Supervisors see a broader overview with all stations in their team displayed as cards, plus shift-level statistics. Org Admins see cross-team summaries and can drill into any team's data. This role-based filtering ensures you only see information relevant to your responsibilities." },
      { heading: "Quick Action Buttons", body: "Frequently used actions are accessible directly from the dashboard without navigating to other pages. These include creating a new handoff, filing a quality report, checking into a station, and viewing the work order queue. The exact buttons shown depend on your role — for example, operators see \"Create Handoff\" and \"File NCR,\" while supervisors also see \"View All Stations\" and \"Shift Analytics.\"" },
      { heading: "Navigation Menu", body: "The main navigation provides links to: Dashboard (home), Queue (work orders), Teams, Settings, and Profile. Admins also see an \"Admin\" link. On desktop, these appear as a horizontal nav or sidebar. On mobile, they are grouped in the hamburger menu. The current page is highlighted so you always know where you are in the application." },
      { heading: "Notifications", body: "The notification indicator (bell icon) in the header shows a count of unread items. Notifications include: new handoffs at your station, work orders assigned to you, NCRs requiring review, and organization announcements. Click the bell to open a dropdown showing recent notifications with timestamps. Click any notification to navigate directly to the relevant record." },
      { heading: "User Menu", body: "Click your avatar or initials in the top-right corner to open the user menu. From here you can access your Profile page (to update display name, password, or avatar), Settings, sign out, or view the current app version. If your admin has enabled the \"Act As\" feature for support purposes, that option appears here as well." },
    ],
  },
  {
    category: "getting-started", categoryLabel: "Getting Started",
    slug: "understanding-roles", title: "Understanding Roles",
    description: "A comprehensive explanation of the role hierarchy, what each role can access, and how roles are assigned.",
    tags: ["roles", "permissions", "access", "hierarchy", "security"],
    relatedSlugs: ["teams-orgs/role-permissions", "admin/user-management"],
    sections: [
      { heading: "Why Roles Matter", body: "Roles control what you can see and do in JobLine.ai. They exist to protect sensitive data (like billing information or cross-team analytics) from users who do not need it, and to prevent accidental changes to critical records. Understanding your role helps you know what actions are available to you and when to escalate to someone with higher permissions." },
      { heading: "The Role Hierarchy", body: "JobLine.ai uses a tiered hierarchy: Platform Admin → Org Owner / Admin → Supervisor → Operator → Viewer. Each tier includes all the capabilities of the tiers below it, plus additional powers. For example, a Supervisor can do everything an Operator can, plus approve NCRs and view team-wide analytics. This layered approach ensures that responsibilities scale with authority." },
      { heading: "Viewer", body: "Viewers have read-only access. They can see dashboards, work order lists, handoff records, and analytics charts, but they cannot create, edit, or delete anything. This role is designed for stakeholders — plant managers, customers, or quality auditors — who need visibility into production status without the ability to change data. Viewers can still use filters, search, and export features." },
      { heading: "Operator", body: "Operators are the core production-floor users. They can check into stations, update work order progress (parts counts, status changes within their scope), create shift handoffs, file Non-Conformance Reports, and request material deliveries. Operators can only interact with data at their assigned station and within their team. They cannot manage users, change organization settings, or access billing information." },
      { heading: "Supervisor", body: "Supervisors oversee one or more teams. In addition to everything an Operator can do, Supervisors can: view all stations and operators within their team, reassign work orders between stations, approve or disposition NCRs, review and acknowledge handoffs across the team, access production analytics (throughput, utilization, downtime), and invite new members to their team. Supervisors cannot change organization-level settings or manage billing." },
      { heading: "Org Owner / Admin", body: "Organization Admins have full control over everything within their organization. This includes: creating and archiving teams, managing all user roles, configuring stations and work centers, setting up shift schedules, managing the part catalog, configuring ERP connections, controlling billing and subscription settings, and viewing all activity and audit logs. Every organization must have at least one Admin. The user who creates the organization is automatically assigned this role." },
      { heading: "Platform Admin (Internal)", body: "Platform Admins are JobLine.ai internal staff. This role is not available to customers. Platform Admins can access cross-organization diagnostics, manage system-wide settings, and support customer organizations. If you encounter a reference to this role, it is not something you need to request or configure." },
      { heading: "How Roles Are Assigned", body: "When you join an organization via invite code, the role selected by the inviter is applied to your account automatically. After joining, only Org Admins can change your role. Role changes take effect immediately — if your admin upgrades you from Operator to Supervisor, your next page load will show the expanded capabilities. If you believe your role is incorrect, contact your Org Admin." },
    ],
  },
  {
    category: "getting-started", categoryLabel: "Getting Started",
    slug: "mobile-access", title: "Mobile Access Tips",
    description: "Best practices, device compatibility, and tips for using JobLine.ai effectively on phones and tablets.",
    tags: ["mobile", "responsive", "tablet", "phone", "touch"],
    relatedSlugs: ["getting-started/navigating-the-dashboard", "faq/common-errors"],
    sections: [
      { heading: "Responsive Layout", body: "JobLine.ai automatically adapts to your screen size. On phones (under 1024px wide), the sidebar navigation collapses into a slide-out drawer accessible via the hamburger menu icon. Cards and tables stack vertically for easy scrolling with your thumb. Dialogs become full-screen on small devices to give you more space for form fields." },
      { heading: "Supported Browsers", body: "On iOS, use Safari or Chrome. On Android, use Chrome, Edge, or Firefox. Make sure your browser is updated to at least the second-most-recent version. Older browsers may not render all features correctly — in particular, some older Android WebView versions can cause issues with dropdown menus and date pickers." },
      { heading: "Add to Home Screen", body: "For a faster, more app-like experience, add JobLine.ai to your home screen. On iOS Safari, tap the share icon (square with upward arrow) and select \"Add to Home Screen.\" On Android Chrome, tap the three-dot menu and select \"Add to Home screen\" or \"Install app.\" This creates an icon on your home screen that launches JobLine.ai in full-screen mode without browser toolbars." },
      { heading: "Touch-Friendly Interactions", body: "Buttons and interactive elements are sized for touch input (minimum 44×44 pixel tap targets). However, some complex interactions like drag-and-drop on the Kanban board may be less precise on touchscreens. If you find drag-and-drop difficult on your device, use the status dropdown in the work order detail view instead — it achieves the same status change with a simpler tap-and-select interaction." },
      { heading: "Data Usage and Connectivity", body: "JobLine.ai is a cloud-based application and requires an active internet connection. On cellular networks, a typical dashboard load uses approximately 200–500 KB of data. Background refresh polls add minimal additional usage. If you are on a metered connection, consider adjusting the refresh interval in Settings to reduce polling frequency. The app does not currently support offline mode — if you lose connectivity, unsaved changes may not persist." },
      { heading: "Notifications on Mobile", body: "In-app notifications appear within the JobLine.ai interface when you open it. Email notifications for critical events (new handoffs, NCRs) are sent regardless of whether the app is open. To stay informed between app visits, ensure your email notifications are enabled in Settings → Notifications." },
    ],
  },
  {
    category: "getting-started", categoryLabel: "Getting Started",
    slug: "onboarding-wizard", title: "The Onboarding Wizard",
    description: "Step-by-step walkthrough of the guided setup experience for new users and organizations.",
    tags: ["onboarding", "wizard", "setup", "first-time"],
    relatedSlugs: ["getting-started/creating-an-account", "teams-orgs/creating-an-organization"],
    sections: [
      { heading: "When It Appears", body: "The onboarding wizard appears automatically after your first sign-in. It guides you through essential setup steps so you can start using JobLine.ai productively. If you dismiss it, you can re-launch it from Settings → Onboarding at any time." },
      { heading: "Step 1: Create or Join an Organization", body: "The first step asks whether you want to create a new organization (if you are the first person from your company) or join an existing one (if a colleague has already set things up). Creating an org makes you the Org Admin. Joining requires an invite code from your admin." },
      { heading: "Step 2: Organization Details", body: "If you are creating an organization, you will enter your company name, select your industry type, and choose your time zone. These details help configure default settings like shift schedules and work center types. All of these can be changed later." },
      { heading: "Step 3: Set Up Your Profile", body: "Enter your display name — this is the name your teammates will see in handoffs, activity logs, and assignments. You can also upload a profile photo. Choose a name that your colleagues will recognize, whether that is your full name or a shop-floor nickname." },
      { heading: "Step 4: Guided Tour", body: "After setup, a brief interactive tour highlights key interface elements: the team selector, navigation menu, quick action buttons, and notification bell. Each tooltip explains what the element does and how to use it. You can skip the tour if you prefer to explore on your own." },
      { heading: "Resuming the Wizard", body: "If you close the wizard before completing all steps, a progress indicator appears on your dashboard reminding you of remaining setup tasks. Click it to resume where you left off. The wizard is considered complete when all required steps are finished." },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // ── DASHBOARD ──────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════
  {
    category: "dashboard", categoryLabel: "Dashboard",
    slug: "operator-dashboard", title: "Operator Dashboard",
    description: "A detailed guide to everything operators see and can do from their main dashboard view.",
    tags: ["operator", "dashboard", "station", "work order", "handoff"],
    relatedSlugs: ["stations/operator-check-in", "shift-handoffs/creating-a-handoff"],
    sections: [
      { heading: "Overview", body: "The operator dashboard is your command center during a shift. It is designed to surface the most critical information immediately — your current station, the active work order, parts progress, and any messages from the previous shift — so you can start work without searching through menus or pages." },
      { heading: "Station Panel", body: "The central card displays your currently checked-in station. It shows the station name, work center type (e.g., CNC Mill, Lathe), and current condition status (Running, Idle, or Down). If the previous operator left a handoff note, a banner at the top of this card prompts you to review it before starting work. The condition status is color-coded: green for Running, amber for Idle, and red for Down." },
      { heading: "Active Work Order", body: "Within the station panel, the active work order is displayed with its key details: work order number, part number, customer name, required quantity, and completed quantity. A progress bar shows how close you are to completing the order. You can update the parts count directly from this card — enter the number of good parts, scrap, and rework produced during your shift." },
      { heading: "Upcoming Queue", body: "Below the station panel, a list shows the next work orders routed to your station, sorted by priority and due date. Each entry displays the WO number, part, priority badge, and due date. This gives you visibility into what is coming next so you can prepare tooling, fixtures, or materials in advance. Tapping a work order opens its detail view." },
      { heading: "Quick Action Buttons", body: "A row of action buttons provides one-tap access to frequent tasks: \"Create Handoff\" (document your shift's work for the next operator), \"File NCR\" (report a quality issue), \"Request Delivery\" (ask for material or parts to be brought to your station), and \"View Station Detail\" (see full station history and equipment info). These buttons are always visible at the top of the page without scrolling." },
      { heading: "Handoff Banner", body: "If the previous operator submitted a handoff for your station, a highlighted banner appears at the top of your dashboard when you first check in. This banner shows a summary of their notes — machine condition, parts progress, and any issues flagged. Click the banner to read the full handoff and mark it as acknowledged. Acknowledging the handoff dismisses the banner and logs that you received the information." },
      { heading: "What You Cannot Access", body: "As an Operator, your dashboard is scoped to your assigned station and team. You will not see stations from other teams, cross-team analytics, or administrative controls. This is by design — it keeps your view focused on your immediate responsibilities. If you need information outside your scope, ask your Supervisor." },
    ],
  },
  {
    category: "dashboard", categoryLabel: "Dashboard",
    slug: "supervisor-dashboard", title: "Supervisor Dashboard",
    description: "How supervisors monitor team performance, station statuses, and production metrics from a single view.",
    tags: ["supervisor", "dashboard", "overview", "analytics", "stations"],
    relatedSlugs: ["dashboard/operator-dashboard", "dashboard/production-analytics"],
    sections: [
      { heading: "Overview", body: "The supervisor dashboard provides a bird's-eye view of your entire team's production floor. Unlike the operator dashboard, which focuses on a single station, this view shows all stations simultaneously, aggregated shift metrics, and analytical charts that help you identify problems and make decisions in real time." },
      { heading: "Station Grid", body: "All stations in your team are displayed as cards in a responsive grid. Each card shows the station name, current operator (if someone is checked in), the active work order, parts progress (as a mini progress bar), and the machine condition indicator. Cards are color-bordered: green (Running), amber (Idle), red (Down). Clicking a station card opens its detail view with full history." },
      { heading: "Shift Stats Bar", body: "At the top of the dashboard, a summary bar displays real-time shift metrics: total parts produced across all stations, number of active handoffs waiting to be reviewed, count of open NCRs requiring disposition, total downtime minutes recorded, and the number of operators currently checked in. These numbers update automatically via background refresh." },
      { heading: "Production Analytics", body: "Below the station grid, charts visualize key trends: throughput over time (parts per hour), station utilization rate (running time vs. total time), and a breakdown of downtime reasons. Use the date range selector to view the current shift, today, this week, or a custom range. These analytics help you spot bottlenecks — for example, if one station consistently has lower throughput, it may need maintenance or operator retraining." },
      { heading: "Handoff Review Queue", body: "A dedicated section lists all recent handoffs from your team that have not yet been acknowledged by the incoming operator. This lets you monitor whether shift transitions are happening smoothly. If a handoff goes unacknowledged for too long, it may indicate that the incoming operator has not arrived or has not checked in." },
      { heading: "Alerts and Flags", body: "The dashboard surfaces automatic alerts for situations that need attention: a station that has been in \"Down\" status for more than a configured threshold, a work order that is past its due date, or an NCR that has been open for more than 24 hours without disposition. These alerts appear as badges on the relevant station cards and in the notification center." },
      { heading: "Actions Available to Supervisors", body: "From this dashboard, supervisors can: reassign work orders between stations (drag-and-drop or use the assignment menu), approve or disposition NCRs, acknowledge handoffs on behalf of absent operators, generate and share invite codes for new team members, and drill into any station's detail view. You cannot modify organization-level settings or billing from this page — those require Org Admin access." },
    ],
  },
  {
    category: "dashboard", categoryLabel: "Dashboard",
    slug: "background-refresh", title: "Background Refresh & Real-Time Updates",
    description: "How JobLine.ai keeps your dashboard data current without requiring manual page reloads.",
    tags: ["refresh", "realtime", "polling", "auto-update", "sync"],
    relatedSlugs: ["settings/notification-preferences", "faq/common-errors"],
    sections: [
      { heading: "How Auto-Refresh Works", body: "JobLine.ai polls the server at a regular interval to fetch the latest data. The default interval is 30 seconds, which balances data freshness with network efficiency. Each refresh updates station statuses, work order progress, handoff records, and notification counts. You will see a subtle timestamp in the header (\"Last updated: 12 seconds ago\") so you know how current the data is." },
      { heading: "Adjusting the Refresh Interval", body: "You can change the polling interval in Settings → General. Options typically range from 10 seconds (most responsive, uses more bandwidth) to 120 seconds (least responsive, best for slow or metered connections). Teams with fast-moving production may prefer shorter intervals; teams running long-cycle jobs may be comfortable with longer intervals. Note that your Org Admin can set a minimum interval for the entire organization." },
      { heading: "Real-Time Push Events", body: "For high-priority changes, JobLine.ai uses real-time subscriptions that push updates to your browser instantly, without waiting for the next poll. Events that trigger instant updates include: a station condition changing to \"Down,\" a new NCR being filed, a handoff being submitted for your station, and system announcements. These events appear in your notification feed immediately and update the relevant dashboard cards in place." },
      { heading: "Manual Refresh", body: "Click the refresh icon in the header to force an immediate data reload at any time. This is useful after making changes in another browser tab, when you suspect the display is stale, or when troubleshooting a data discrepancy. The manual refresh fetches all data sources, not just incremental changes, so it takes slightly longer than a background poll." },
      { heading: "Refresh Indicator", body: "A circular progress indicator near the header shows the time until the next automatic refresh. When a refresh is in progress, it briefly animates to indicate data is loading. If a refresh fails (due to a network issue), the indicator turns amber and shows a \"Retry\" option. The dashboard continues to display the last successfully loaded data until connectivity is restored." },
      { heading: "Performance Considerations", body: "If you have many browser tabs open, only the active tab maintains the full refresh cycle. Background tabs reduce their polling frequency to conserve resources. When you switch back to a JobLine.ai tab, it immediately performs a refresh to bring data up to date. This behavior is automatic and requires no configuration." },
    ],
  },
  {
    category: "dashboard", categoryLabel: "Dashboard",
    slug: "production-analytics", title: "Production Analytics Deep Dive",
    description: "Understanding the charts, metrics, and data visualizations available on the analytics panels.",
    tags: ["analytics", "charts", "metrics", "throughput", "utilization"],
    relatedSlugs: ["dashboard/supervisor-dashboard", "shift-handoffs/shift-stats"],
    sections: [
      { heading: "Available Metrics", body: "The production analytics section tracks several key performance indicators: Throughput (parts produced per hour or per shift), Utilization Rate (percentage of time stations are actively running vs. idle or down), First-Pass Yield (percentage of parts that pass inspection without rework), Downtime Minutes (total time stations were in Down status), and Queue Depth (number of work orders waiting at each station)." },
      { heading: "Time Range Selection", body: "Use the date range picker above the charts to control the period being analyzed. Preset options include: Current Shift, Today, Yesterday, This Week, Last Week, This Month, and Custom Range. Changing the range updates all charts simultaneously. For comparing shifts, select the same time window on different dates." },
      { heading: "Reading the Charts", body: "Bar charts show discrete values (e.g., parts produced per station). Line charts show trends over time (e.g., hourly throughput). The color coding matches the rest of the application: green for positive/on-target metrics, amber for caution, and red for below-target or alarming values. Hover over any data point to see the exact value and timestamp." },
      { heading: "Identifying Bottlenecks", body: "Compare utilization rates across stations. A station with consistently lower utilization than its peers may be experiencing frequent tool changes, material shortages, or operator availability issues. Conversely, a station at near-100% utilization with a growing queue depth may need additional capacity (a second machine or an additional shift)." },
      { heading: "Exporting Data", body: "Click the download icon on any chart to export its underlying data as a CSV file. This is useful for creating custom reports in Excel, sharing data with management, or feeding metrics into external business intelligence tools. The export includes all data points for the selected time range, including data not visible due to chart aggregation." },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // ── WORK ORDERS ────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════
  {
    category: "work-orders", categoryLabel: "Work Orders",
    slug: "creating-work-orders", title: "Creating Work Orders",
    description: "Complete guide to creating work orders, including all fields, validation rules, and tips.",
    tags: ["create", "work order", "queue", "new"],
    relatedSlugs: ["work-orders/work-order-statuses", "work-orders/routing-steps"],
    sections: [
      { heading: "Who Can Create Work Orders", body: "Work orders can be created by Supervisors and Org Admins. Operators can view and update work orders assigned to their station but cannot create new ones. If you are an Operator and need a work order created, ask your Supervisor to add it to the queue." },
      { heading: "Opening the Creation Dialog", body: "From the Queue page, click the \"+ New Work Order\" button in the top-right corner. This opens a dialog with all the fields needed to define a new work order. You can also access this from the Supervisor dashboard via the quick action buttons." },
      { heading: "Required Fields", body: "Work Order Number: A unique identifier for this job within your organization. This is often assigned by your ERP system or follows an internal numbering convention (e.g., WO-2026-0001). The system will reject duplicate numbers. Quantity: The number of parts to be produced. This must be a positive whole number." },
      { heading: "Optional but Recommended Fields", body: "Part Number: Links to your part catalog (if configured) and auto-fills description and routing. Customer: The customer or project this order is for — useful for filtering and reporting. Due Date: When the order needs to be completed. Setting this enables calendar view scheduling and overdue alerts. Priority: Low, Medium, High, or Rush. Priority affects queue ordering — Rush orders appear at the top of station queues." },
      { heading: "Adding Routing", body: "If your part requires multiple operations, expand the Routing section to define the sequence of work centers. For example, a part might go: Saw → CNC Mill → Deburr → Inspect. Each step specifies the work center type, operation description, and estimated cycle time. If you have a part catalog entry with a default routing, it will be pre-filled here. You can add, remove, or reorder steps as needed." },
      { heading: "Validation and Submission", body: "Before the work order is accepted, the system validates: the WO number is unique, the quantity is positive, and all required fields are filled. If you have defined routing steps, each step must have a work center assigned. Once validation passes, click \"Create Work Order\" to add it to the queue. The order starts in \"Queued\" status." },
      { heading: "After Creation", body: "The new work order immediately appears in the Queue (list, kanban, and calendar views). If routing is defined, it shows up in the queue of the first work center in the sequence. The system logs the creation event with your user ID and timestamp in the activity log. You can edit the work order details at any time before an operator starts working on it." },
    ],
  },
  {
    category: "work-orders", categoryLabel: "Work Orders",
    slug: "queue-views", title: "Queue Views (List, Kanban, Calendar)",
    description: "In-depth explanation of the three queue views and when to use each one.",
    tags: ["queue", "kanban", "calendar", "list", "views"],
    relatedSlugs: ["work-orders/creating-work-orders", "work-orders/work-order-statuses"],
    sections: [
      { heading: "Switching Between Views", body: "At the top of the Queue page, toggle buttons let you switch between List, Kanban, and Calendar views. Your selected view is remembered between sessions. Each view shows the same underlying data but presents it differently to suit various workflows. All views respect the currently active filters (status, priority, work center, date range)." },
      { heading: "List View", body: "The list view displays work orders in a sortable, searchable table. Columns include: WO Number, Part Number, Customer, Status, Priority, Due Date, Assigned Station, and Quantity Progress. Click any column header to sort ascending or descending. The search bar at the top filters by WO number, part number, or customer name. This view is ideal for quickly finding a specific order or seeing a comprehensive inventory of all active work." },
      { heading: "Kanban Board", body: "The Kanban view organizes work orders into columns by status: Queued, In Progress, QC Hold, Complete, and Shipped. Each work order appears as a card showing key details. If your role permits, you can drag cards between columns to change their status — for example, dragging a card from \"Queued\" to \"In Progress.\" The Kanban view is ideal for supervisors who want a visual workflow overview and need to quickly spot work orders stuck in a particular status." },
      { heading: "Calendar View", body: "The calendar view plots work orders on a weekly or monthly grid based on their due date. Each day cell shows the work orders due that day, color-coded by priority: blue (Low), green (Medium), orange (High), red (Rush). Click a day to see a detailed list of its orders. This view is particularly useful for production planning — you can see at a glance whether certain days are overloaded and need work to be rebalanced." },
      { heading: "Filtering", body: "All three views support the same filter controls: Status (multi-select checkboxes), Priority (multi-select), Work Center (dropdown), and Date Range (for due dates). Active filters are displayed as removable chips above the results. You can combine multiple filters — for example, show only High-priority Mill orders that are In Progress. Clearing all filters restores the full list." },
      { heading: "Choosing the Right View", body: "Use List view when you need to search or sort by specific fields, or when managing a large number of orders. Use Kanban when you want a visual workflow pipeline and need to see status distribution at a glance. Use Calendar when planning workload by due date and identifying scheduling conflicts. Many supervisors check Kanban at the start of a shift and Calendar during planning meetings." },
    ],
  },
  {
    category: "work-orders", categoryLabel: "Work Orders",
    slug: "work-order-statuses", title: "Work Order Statuses",
    description: "Every status in the work order lifecycle explained, including transition rules and who can change them.",
    tags: ["status", "lifecycle", "workflow", "state"],
    relatedSlugs: ["work-orders/creating-work-orders", "work-orders/routing-steps"],
    sections: [
      { heading: "The Status Lifecycle", body: "Every work order moves through a defined sequence of statuses that reflect its journey from creation to shipment. The standard flow is: Queued → In Progress → QC Hold (optional) → Complete → Shipped. Each transition is recorded with the user who made the change, the timestamp, and any associated notes. This audit trail provides full traceability of every work order's history." },
      { heading: "Queued", body: "The starting status for all new work orders. A Queued order is visible in station queues and on the Kanban board but has not been picked up by an operator yet. The order appears in the queue of the first work center defined in its routing (or the assigned station if no routing is configured). Queued orders are sorted by priority and due date within each station's queue." },
      { heading: "In Progress", body: "An operator has begun working on this order. The transition from Queued to In Progress can happen automatically when an operator selects the order from their station panel, or manually via the status dropdown. While In Progress, the operator can update parts counts (good, scrap, rework). Only one work order can typically be \"In Progress\" at a station at a time, depending on station capacity settings." },
      { heading: "QC Hold", body: "The work order is paused pending quality review. This status can be triggered in two ways: an operator manually sets it (e.g., they notice a dimensional issue and want a supervisor to inspect), or the system automatically applies it when an NCR is filed against the order. While on QC Hold, the operator should stop producing parts until the issue is resolved. The order returns to In Progress after the hold is cleared by a Supervisor." },
      { heading: "Complete", body: "All required parts have been produced (good quantity meets or exceeds the order quantity) and any quality holds have been resolved. Marking an order Complete moves it out of the active queue and into the completed history. Supervisors typically confirm completion after verifying final counts. Completed orders still appear in reporting and analytics but no longer clutter the active queue views." },
      { heading: "Shipped", body: "The finished parts have been packaged and sent to the customer or next destination. This is the terminal status — once shipped, no further changes are expected. Only Supervisors and Admins can set this status. The Shipped status is important for accurate order-to-delivery tracking and customer-facing reports." },
      { heading: "Who Can Change Status", body: "Operators can transition orders between Queued, In Progress, and QC Hold for work orders at their station. Supervisors can make all transitions including Complete and Shipped for any order in their team. Admins can change status on any order in the organization. All status changes are logged in the activity log with the user's identity and timestamp." },
    ],
  },
  {
    category: "work-orders", categoryLabel: "Work Orders",
    slug: "routing-steps", title: "Routing Steps",
    description: "How to define, manage, and advance multi-operation routing for complex parts.",
    tags: ["routing", "operations", "work center", "sequence", "multi-op"],
    relatedSlugs: ["work-orders/creating-work-orders", "stations/work-center-filtering"],
    sections: [
      { heading: "What Is Routing?", body: "Routing defines the ordered sequence of operations (work centers) that a job must pass through to reach completion. A simple part might have a single operation, but many manufactured parts require multiple steps — for example: Raw Material → Saw → CNC Mill → CNC Lathe → Deburr → Inspect → Ship. Each step in the routing is called an operation and is assigned to a specific work center type." },
      { heading: "Why Routing Matters", body: "Without routing, a work order sits at one station until it is complete. With routing, JobLine.ai automatically moves the work order through the correct sequence of stations, ensuring each operation is performed in order. This eliminates the need for paper travelers, reduces miscommunication about what step a job is on, and gives supervisors visibility into where every job is in the process." },
      { heading: "Adding Routing Steps", body: "When creating or editing a work order, open the Routing section. Click \"Add Step\" to insert a new operation. For each step, select the work center type (e.g., Mill, Lathe, Grinder) from the dropdown, enter a brief operation description (e.g., \"Rough mill top face, 0.010 finish\"), and optionally provide an estimated cycle time. Steps are automatically numbered (Op 10, Op 20, Op 30, etc.) following manufacturing convention." },
      { heading: "Reordering and Editing Steps", body: "You can reorder routing steps by dragging them up or down in the list. To edit a step, click on it to expand the fields. To remove a step, click the delete icon. Changes to routing are saved when you save the work order. Note: if a work order is already In Progress and has completed some routing steps, you cannot reorder or delete those completed steps — only future steps can be modified." },
      { heading: "Advancing Through Operations", body: "When an operator completes their operation at a station, they mark the current routing step as \"Done.\" The work order then automatically advances to the next step and appears in the queue of the next work center type in the sequence. If no station of that work center type exists in the team, the supervisor is alerted. The routing progress is visible on the work order card as a step indicator (e.g., \"Step 3 of 5\")." },
      { heading: "Outside Processing Steps", body: "Some operations require sending parts to an external vendor — heat treating, anodizing, plating, or specialized testing. Mark these routing steps as \"Outside Processing\" when configuring them. When the order reaches an outside processing step, it moves to a special status indicating the parts are off-site. When the parts return, a user marks the step complete and the order continues through the remaining internal operations." },
      { heading: "Routing Templates", body: "If you manufacture the same part repeatedly, you can save a routing sequence as a template in the Part Catalog. When creating a new work order for that part, the routing is automatically pre-filled from the template. This saves time and ensures consistency. Templates can be updated — new orders use the latest template, while existing orders retain their original routing." },
    ],
  },
  {
    category: "work-orders", categoryLabel: "Work Orders",
    slug: "part-specs", title: "Part Specifications",
    description: "How the part catalog works, linking parts to work orders, and managing revisions.",
    tags: ["parts", "catalog", "specs", "revision", "material"],
    relatedSlugs: ["work-orders/creating-work-orders", "work-orders/routing-steps"],
    sections: [
      { heading: "What Is the Part Catalog?", body: "The part catalog is a reusable library of part definitions maintained at the organization level. Each catalog entry represents a distinct part that your shop produces, whether it is a one-time custom job or a part you manufacture regularly. The catalog serves as a single source of truth for part-related information, reducing data entry errors and ensuring consistency across work orders." },
      { heading: "Catalog Entry Fields", body: "Each part catalog entry includes: Part Number (unique identifier), Description (human-readable name and details), Material (e.g., 6061-T6 Aluminum, 304 Stainless Steel, Delrin), Default Routing (a pre-defined sequence of operations), and Special Instructions (notes for operators, such as deburr requirements, surface finish specs, or tooling preferences). All fields except Part Number are optional but recommended." },
      { heading: "Linking Parts to Work Orders", body: "When creating a work order, start typing a part number in the Part Number field. The system will suggest matching catalog entries as you type. Selecting a catalog entry auto-fills the description, material, and default routing on the work order form. You can override any of these values for a specific order without changing the underlying catalog entry — the override applies only to that work order." },
      { heading: "Revision Management", body: "Parts evolve over time — dimensions change, materials are substituted, or routing sequences are updated. When you update a catalog entry, the system creates a new revision. Existing work orders that were created with the previous revision retain their original part data. Only new work orders pick up the latest revision. This ensures that in-progress production uses the specs that were current when the order was placed." },
      { heading: "Managing the Catalog", body: "The part catalog is managed in Settings → Part Catalog (accessible to Supervisors and Admins). From there you can add new parts, edit existing entries, view revision history, and search the catalog. For shops with large catalogs, the search function supports filtering by part number, description, or material." },
    ],
  },
  {
    category: "work-orders", categoryLabel: "Work Orders",
    slug: "bulk-upload", title: "Bulk Upload Work Orders",
    description: "How to import dozens or hundreds of work orders at once from an Excel spreadsheet.",
    tags: ["bulk", "upload", "excel", "import", "spreadsheet"],
    relatedSlugs: ["work-orders/creating-work-orders", "settings/erp-connector"],
    sections: [
      { heading: "When to Use Bulk Upload", body: "Bulk upload is designed for situations where you need to create many work orders at once — for example, when loading a week's production schedule from a planning system, migrating from another platform, or entering a batch of customer orders received simultaneously. For one or two orders, the standard creation dialog is faster." },
      { heading: "Downloading the Template", body: "From the Queue page, click the upload icon (arrow pointing up) and select \"Download Template.\" This downloads an Excel (.xlsx) file with pre-formatted column headers. The template includes required columns (Work Order Number, Quantity) and optional columns (Part Number, Customer, Due Date, Priority, and routing step fields). Do not rename or reorder the columns — the importer relies on the header names to map data correctly." },
      { heading: "Filling Out the Spreadsheet", body: "Enter one work order per row. Work Order Numbers must be unique — the system will reject duplicates. Dates should be in YYYY-MM-DD format (e.g., 2026-03-15). Priority values must match exactly: Low, Medium, High, or Rush (case-insensitive). Quantity must be a positive whole number. Leave optional columns blank if not applicable — do not enter placeholder values like \"N/A\" as they may cause validation errors." },
      { heading: "Uploading and Validation", body: "Return to the Queue page, click the upload icon, and select \"Upload File.\" Choose your completed spreadsheet. JobLine.ai parses the file and displays a preview table showing all rows, with any validation errors highlighted in red. Common errors include: duplicate work order numbers, invalid date formats, non-numeric quantities, or unrecognized priority values. You can fix errors in the spreadsheet and re-upload, or dismiss individual rows to import only the valid ones." },
      { heading: "Confirming the Import", body: "After resolving all errors (or dismissing problematic rows), click \"Confirm Import\" to create all work orders at once. The system provides a summary: X orders created, Y orders skipped due to errors. All created orders start in \"Queued\" status. The import event is logged in the activity log with the total count and your user ID." },
      { heading: "Tips for Large Imports", body: "For very large imports (100+ orders), the upload may take a few seconds to process. Do not close the browser tab during processing. If the upload appears to stall, check your network connection and try again. There is no strict row limit, but imports exceeding 500 rows may benefit from being split into multiple files to keep the preview manageable." },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // ── SHIFT HANDOFFS ─────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════
  {
    category: "shift-handoffs", categoryLabel: "Shift Handoffs",
    slug: "creating-a-handoff", title: "Creating a Handoff",
    description: "Everything you need to know about documenting your shift handoff for the incoming operator.",
    tags: ["handoff", "create", "shift", "notes", "documentation"],
    relatedSlugs: ["shift-handoffs/reviewing-handoffs", "shift-handoffs/handoff-best-practices"],
    sections: [
      { heading: "Why Handoffs Exist", body: "Shift handoffs are the single most important communication tool on a production floor. When shifts change, critical context — machine issues, job progress, material shortages, safety concerns — can be lost if not documented. JobLine.ai's handoff system replaces verbal pass-downs and sticky notes with a structured, searchable, and auditable digital record that ensures nothing falls through the cracks." },
      { heading: "When to Create a Handoff", body: "Create a handoff at the end of your shift, before you leave your station. The ideal time is during the last 10–15 minutes of your shift, while the details are fresh in your mind. Do not wait until the next day or try to create handoffs from memory — the accuracy of your notes degrades rapidly with time. If you forget to create a handoff, you can still submit one later, but it will be timestamped with the actual submission time." },
      { heading: "Accessing the Handoff Form", body: "Click \"Create Handoff\" from your station panel on the dashboard, or from the station detail page. The form opens with your current station pre-selected. If you are checked into a station, the form also pre-fills the current work order information, parts counts, and machine condition from the latest data." },
      { heading: "Work Order Status Section", body: "The first section of the handoff form captures job progress. Confirm or update the active work order number, the parts completed during your shift, the current quantity totals (good, scrap, rework), and whether the job is on track, behind schedule, or ahead. If you completed a work order and started a new one during the shift, note both." },
      { heading: "Machine Condition", body: "Select the current machine condition: Running (machine is operational and can continue production), Idle (machine is stopped but has no issues — perhaps waiting for material or the next job), or Down (machine has a fault, error, or requires maintenance before it can run). If selecting Down, provide details in the notes section about what happened and any troubleshooting steps you took." },
      { heading: "Notes for the Next Operator", body: "The free-text notes field is where you provide context that does not fit into structured fields. Examples: \"Offset Z was adjusted -0.002 after third piece to correct dimension on bore. See inspection report.\" Or: \"Coolant concentration is low — maintenance was notified at 14:30, they said they would top it off before night shift.\" Be factual and specific. These notes become part of the permanent station record." },
      { heading: "Submitting the Handoff", body: "Click \"Submit Handoff\" to save the record. It is timestamped, linked to your station and user account, and immediately visible to anyone who checks into the station next. Once submitted, a handoff cannot be deleted (to preserve the audit trail), but you can create an amendment handoff if you need to add information you forgot." },
    ],
  },
  {
    category: "shift-handoffs", categoryLabel: "Shift Handoffs",
    slug: "reviewing-handoffs", title: "Reviewing Incoming Handoffs",
    description: "How to review, acknowledge, and act on handoff notes left by the previous operator.",
    tags: ["handoff", "review", "incoming", "acknowledge"],
    relatedSlugs: ["shift-handoffs/creating-a-handoff", "stations/operator-check-in"],
    sections: [
      { heading: "The Check-In Prompt", body: "When you check into a station at the start of your shift, the system checks for any unacknowledged handoff from the previous operator. If one exists, a prominent banner appears at the top of your dashboard with a summary of the handoff: who submitted it, when, the machine condition they reported, and the first few lines of their notes. This ensures you see the handoff before starting work." },
      { heading: "Reading the Full Handoff", body: "Click the banner or the \"View Handoff\" button to open the complete handoff record. Read through all sections carefully: work order progress, machine condition, and operator notes. Pay particular attention to any issues flagged, tool offset changes, material notes, or safety concerns. This information directly affects how you should begin your shift." },
      { heading: "Acknowledging the Handoff", body: "After reading the handoff, click \"Acknowledge\" to confirm you have received the information. This action is logged with your user ID and timestamp, and the handoff moves to \"Reviewed\" status. Acknowledging the handoff dismisses the dashboard banner so it does not continue to distract you. Your supervisor can see acknowledgment status in their dashboard — unacknowledged handoffs may trigger follow-up." },
      { heading: "Acting on Handoff Information", body: "If the handoff mentions a machine issue, verify the condition yourself before starting production. If the previous operator flagged a dimensional problem, run a test piece and check the dimension before committing to a full run. If material was running low, check the bin before assuming it was restocked. Handoff notes are guidance — always verify conditions yourself when possible." },
      { heading: "Viewing Handoff History", body: "From the station detail page, you can view a chronological history of all handoffs for that station. This is valuable for understanding recurring issues (\"the X-axis alarm has been reported in three consecutive handoffs — this machine needs a service call\"), tracking pattern changes, or reviewing what happened during a shift you were not present for." },
      { heading: "What If There Is No Handoff?", body: "If no handoff was submitted by the previous operator, you will not see a banner. This could mean the station was idle (no one was checked in), or the previous operator forgot to submit one. In either case, assume nothing about the machine's condition — do a visual inspection, check the active work order status in the system, and verify tooling and material before starting. If you regularly find missing handoffs, raise the issue with your supervisor." },
    ],
  },
  {
    category: "shift-handoffs", categoryLabel: "Shift Handoffs",
    slug: "handoff-best-practices", title: "Handoff Best Practices",
    description: "Proven techniques for writing handoffs that actually help the next operator.",
    tags: ["handoff", "tips", "best practices", "communication"],
    relatedSlugs: ["shift-handoffs/creating-a-handoff", "quality/filing-an-ncr"],
    sections: [
      { heading: "Lead with What Changed", body: "The most useful handoff notes focus on what is different from normal. If the machine ran fine all shift and production is on schedule, a brief note like \"Smooth shift, on track, no issues\" is sufficient. But if something unusual happened — a tool broke, an alarm occurred, a dimension drifted, material quality varied — lead with that information. The incoming operator needs to know what is not normal." },
      { heading: "Be Specific About Problems", body: "Vague notes like \"machine was acting up\" or \"had some issues\" are not helpful. Instead, describe the symptom precisely: \"Spindle alarm 410 (overload) triggered during Op 20 roughing pass at 3,200 RPM, 80 IPM. Reduced feed to 60 IPM and alarm did not recur. Monitor feed rate on this operation.\" Specific details save the next operator from having to diagnose the problem from scratch." },
      { heading: "Include Accurate Part Counts", body: "Always update your parts counts before creating the handoff. The incoming operator is relying on these numbers to know where production stands. If you produced 47 good parts, 2 scrap, and 1 rework, enter those exact numbers — do not round or estimate. Inaccurate counts cascade into incorrect yield calculations and can lead to under- or over-production." },
      { heading: "Flag Safety Concerns Prominently", body: "Safety issues should be the first thing the incoming operator reads. If there is a coolant leak near the electrical panel, a loose enclosure guard, an unusual smell from the spindle, or a slippery floor area — state it clearly and set the machine condition to Down or Idle. Never leave a safety hazard for someone to discover on their own. Safety notes should be factual, not alarming: describe what you observed and what action you took." },
      { heading: "Note Tool and Offset Changes", body: "If you changed a tool, adjusted a work offset, or modified a program parameter during your shift, document it in the handoff. Example: \"Replaced T05 (0.500 endmill) at piece count 38 — new tool, offset Z reset to -4.2310. G10 adjustment applied in program O1234.\" The next operator needs to know the current state of the machine's setup, especially if they need to troubleshoot a dimensional issue." },
      { heading: "Mention Material and Supply Status", body: "If raw material is running low, if a cutting tool is near the end of its expected life, if coolant was topped off or needs attention, or if you noticed the chip conveyor bin is full — include it. These logistical details prevent the next operator from discovering a supply shortage mid-production, which causes unnecessary downtime." },
      { heading: "Keep It Structured, Not Long", body: "A good handoff does not need to be a novel. Use the structured fields (work order status, parts counts, machine condition) for data, and reserve the notes section for context and exceptions. Three to five sentences of focused, specific notes are better than two paragraphs of general commentary. The goal is for the incoming operator to read the handoff in under two minutes and know everything they need to start their shift." },
    ],
  },
  {
    category: "shift-handoffs", categoryLabel: "Shift Handoffs",
    slug: "shift-stats", title: "Shift Stats & Analytics",
    description: "How to read and use the shift-level statistics panel for performance tracking.",
    tags: ["shift", "stats", "analytics", "metrics", "performance"],
    relatedSlugs: ["dashboard/supervisor-dashboard", "dashboard/production-analytics"],
    sections: [
      { heading: "What Shift Stats Show", body: "The shift stats panel aggregates production data for a single shift period. Metrics include: total parts produced (good + scrap + rework across all stations), the number of work orders started, completed, and still in progress, handoff submission count and acknowledgment rate, total downtime minutes across all stations, and the number of NCRs filed during the shift." },
      { heading: "Accessing Shift Stats", body: "Shift stats are visible on the Supervisor dashboard and accessible from the Analytics section. By default, the panel shows the current shift's data. Use the shift selector to view previous shifts — typically labeled by name (Day, Swing, Night) and date. The data updates in near real-time for the current shift and is finalized for past shifts." },
      { heading: "Station-Level Breakdown", body: "Click \"View Details\" on the shift stats panel to drill into per-station metrics. This breakdown shows each station's contribution to the shift total: parts produced, utilization percentage, downtime events, and the operators who were checked in during the period. Use this to identify which stations carried the shift and which underperformed relative to expectations." },
      { heading: "Comparing Shifts", body: "Select two or more shifts to view a side-by-side comparison. This helps you answer questions like: Is the day shift consistently outproducing the night shift? Is downtime trending upward on weekends? Are certain operators consistently higher-performing? These comparisons are most valuable over a week or month of data, where patterns become clear." },
      { heading: "Using Stats for Continuous Improvement", body: "Shift stats are a starting point for continuous improvement conversations. If scrap rates are climbing, investigate whether it correlates with a specific station, material batch, or operator. If utilization is low, examine whether stations are idle due to material shortages, operator availability, or scheduling gaps. Data-driven discussions are more productive than assumptions." },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // ── TEAMS & ORGANIZATIONS ──────────────────────────────────────
  // ════════════════════════════════════════════════════════════════
  {
    category: "teams-orgs", categoryLabel: "Teams & Organizations",
    slug: "creating-an-organization", title: "Creating an Organization",
    description: "How to set up your organization, what it means, and configuration options.",
    tags: ["organization", "setup", "create", "company"],
    relatedSlugs: ["getting-started/onboarding-wizard", "teams-orgs/managing-teams"],
    sections: [
      { heading: "What Is an Organization?", body: "An organization is the top-level container for all your data in JobLine.ai. It represents your company, facility, or shop. Everything — teams, stations, work orders, users, settings, and billing — lives within an organization. Data is strictly isolated between organizations; no user in one org can see data from another org, and no admin can cross this boundary." },
      { heading: "When to Create vs. Join", body: "Create a new organization if you are the first person from your company to use JobLine.ai. Join an existing organization if a colleague has already set one up — they will provide you with an invite code. Most production-floor workers should join, not create. If you are unsure whether your company already has an org, ask your manager or IT department before creating a new one to avoid duplicate orgs." },
      { heading: "Organization Setup Steps", body: "During creation, you provide: Company Name (displayed in headers and reports), Industry Type (helps configure default settings), and Time Zone (used for shift scheduling and timestamp display). All of these can be changed later in Settings → Organization. The user who creates the organization is automatically assigned the Org Admin role." },
      { heading: "Data Isolation and Security", body: "Your organization's data is isolated at every level — database queries, API calls, and UI rendering all enforce organization boundaries. This means even if two organizations use the same station names or work order numbers, there is no conflict or data leakage. Row-level security policies in the database ensure that users can only access data belonging to their organization, regardless of how they access the system." },
      { heading: "Single vs. Multiple Organizations", body: "Most companies need only one organization. However, if you operate multiple independent facilities with separate staff and processes, you may create a separate org for each. Users can belong to multiple organizations but can only be active in one at a time. Switching organizations is done from the Profile page. Billing is per-organization." },
    ],
  },
  {
    category: "teams-orgs", categoryLabel: "Teams & Organizations",
    slug: "inviting-members", title: "Inviting Members",
    description: "Detailed guide to generating invite codes, QR codes, managing role assignment, and expiration.",
    tags: ["invite", "members", "QR", "code", "onboarding"],
    relatedSlugs: ["getting-started/joining-an-organization", "teams-orgs/role-permissions"],
    sections: [
      { heading: "Who Can Invite", body: "Org Admins and Supervisors can generate invite codes. Org Admins can invite members to any team with any role (except Platform Admin). Supervisors can invite members to their own team only, with roles at or below Supervisor level. Operators and Viewers cannot generate invite codes." },
      { heading: "Generating an Invite Code", body: "Navigate to the Teams page and click \"Invite Members\" on the relevant team, or go to Settings → Organization → Members. Click \"Generate Invite Code.\" You will be prompted to select the role the new member will receive. The system generates a unique 6-character alphanumeric code and displays it along with a corresponding QR code." },
      { heading: "Sharing the Invite", body: "You can share the invite in three ways: (1) Read the 6-character code aloud or send it via text/email. (2) Display the QR code on a screen for people to scan. (3) Copy the direct invite link and share it via any messaging platform. For onboarding multiple operators at once (e.g., during a new-hire orientation), displaying the QR on a large screen is the fastest method." },
      { heading: "Role Selection", body: "Choose the role carefully when generating the invite — it is applied automatically when the person redeems the code. For production workers, Operator is the most common choice. For team leads, select Supervisor. For stakeholders who only need to view reports, select Viewer. The role can be changed later by an Org Admin from the member management screen." },
      { heading: "Expiration and Usage Limits", body: "Invite codes expire after a configurable period (the default is 7 days). You can also set a maximum number of uses — for example, a code that can be redeemed by up to 20 people, useful for onboarding a new shift crew. Once a code expires or reaches its use limit, it becomes invalid. Expired codes cannot be reactivated; generate a new one instead." },
      { heading: "Revoking an Invite", body: "If you shared an invite code and need to revoke it before it expires (for example, if it was shared with the wrong person), you can deactivate it from the member management screen. Deactivated codes cannot be redeemed. Users who already redeemed the code before deactivation are not affected — they retain their membership." },
    ],
  },
  {
    category: "teams-orgs", categoryLabel: "Teams & Organizations",
    slug: "managing-teams", title: "Managing Teams",
    description: "Creating teams, adding members, configuring team-level settings, and understanding team scope.",
    tags: ["teams", "manage", "create", "members", "settings"],
    relatedSlugs: ["teams-orgs/creating-an-organization", "teams-orgs/switching-teams"],
    sections: [
      { heading: "What Are Teams?", body: "Teams are sub-groups within your organization that define how data is scoped and who works together. Teams typically correspond to shifts (Day Shift, Night Shift), departments (CNC Department, Fabrication, Assembly), or production areas (Building A, Building B). Each team has its own set of stations, work orders, and members. A user's view is filtered to their active team." },
      { heading: "Creating a Team", body: "From the Teams page, click \"Create Team.\" Enter a team name (e.g., \"1st Shift CNC\"), an optional description, and select a team lead (Supervisor). The team lead will manage daily operations — they can invite members, configure stations, and monitor production. You can create as many teams as your subscription plan allows." },
      { heading: "Adding and Removing Members", body: "On the team detail page, click \"Add Member\" to add existing organization members to the team. Search by name or email and select the user. A user can belong to multiple teams (e.g., an operator who covers both day and night shifts), but they can only be actively checked into one station at a time. To remove a member, click the remove icon next to their name. Removing them from the team does not remove them from the organization." },
      { heading: "Team-Level Settings", body: "Each team can override certain organization-level defaults: shift schedule (different start/end times), refresh interval (how often dashboards poll for new data), and notification preferences (which events generate alerts for team members). These overrides ensure that a night shift team is not bound to a day shift schedule, or that a fast-paced team can poll more frequently." },
      { heading: "Archiving a Team", body: "If a team is no longer active (e.g., a shift was eliminated, a department was reorganized), you can archive it instead of deleting it. Archiving preserves all historical data — handoffs, work order records, analytics — for audit and reporting purposes, but removes the team from active selection. Archived teams can be restored if needed." },
    ],
  },
  {
    category: "teams-orgs", categoryLabel: "Teams & Organizations",
    slug: "role-permissions", title: "Role Permissions Explained",
    description: "A detailed matrix of what each role can view, create, edit, and delete across all features.",
    tags: ["roles", "permissions", "matrix", "access control"],
    relatedSlugs: ["getting-started/understanding-roles", "admin/user-management"],
    sections: [
      { heading: "Permission Structure", body: "Every feature in JobLine.ai has four permission levels: View (read-only access), Create (ability to add new records), Edit (ability to modify existing records), and Delete (ability to remove records). Each role is granted a specific combination of these permissions for each feature. Permissions are enforced both in the user interface (buttons are hidden or disabled) and at the database level (API calls are rejected if the user lacks permission)." },
      { heading: "Work Orders", body: "Viewers and Operators can view work orders within their team scope. Operators can also update parts counts and status for orders at their station. Supervisors can create, edit, and reassign work orders within their team. Admins can do all of the above across all teams, plus delete work orders (a rare action typically reserved for correcting data entry mistakes)." },
      { heading: "Handoffs", body: "Operators can view handoffs at their station and create new ones. They cannot delete handoffs (to preserve the audit trail). Supervisors can view all handoffs within their team, create handoffs, and acknowledge them on behalf of absent operators. Admins have full access across all teams." },
      { heading: "NCRs (Non-Conformance Reports)", body: "Operators can view NCRs and file new ones. Only Supervisors and above can disposition NCRs (approve, reject, set rework/scrap). Admins can modify and close NCRs across all teams. No role can delete an NCR — they are permanent quality records." },
      { heading: "Stations and Equipment", body: "Operators can view station details and check in/out. Supervisors can create and configure stations within their team. Admins can manage stations across all teams, including setting up work center types and attaching machine profiles." },
      { heading: "Users and Settings", body: "Only Org Admins can manage user roles, organization settings, billing, ERP connections, and the part catalog. Supervisors can invite new members to their team but cannot change roles or access billing. Operators and Viewers have no access to administrative functions." },
      { heading: "Data Scope Enforcement", body: "Beyond action-level permissions, data visibility is scoped by team. An Operator on Team A cannot see Team B's work orders, even if both teams belong to the same organization. Supervisors see all data within their assigned team(s). Admins see all data across all teams. This scoping is enforced at the database level using row-level security, meaning it cannot be bypassed even through direct API calls." },
    ],
  },
  {
    category: "teams-orgs", categoryLabel: "Teams & Organizations",
    slug: "switching-teams", title: "Switching Teams",
    description: "How the team selector works, what changes when you switch, and cross-team visibility.",
    tags: ["teams", "switch", "selector", "context"],
    relatedSlugs: ["teams-orgs/managing-teams", "getting-started/navigating-the-dashboard"],
    sections: [
      { heading: "The Team Selector", body: "The team selector is a dropdown in the header bar that shows your currently active team. If you belong to only one team, this dropdown is informational. If you belong to multiple teams, clicking it reveals all your team memberships. Selecting a different team changes your active context — all data throughout the application (dashboard, queue, stations, analytics) updates to show the selected team's data." },
      { heading: "What Changes When You Switch", body: "Switching teams updates: the station grid (you see that team's stations), the work order queue (you see orders assigned to that team's stations), handoff records (you see handoffs from that team), and analytics (metrics are scoped to that team). Your station check-in status is unaffected — if you were checked into a station on Team A and switch to view Team B, you remain checked in to your Team A station." },
      { heading: "Default Team Behavior", body: "The app remembers your most recently selected team and defaults to it on your next sign-in. If you consistently work with one team, you will rarely need to interact with the selector. If you split time between teams, you may want to switch at the start of each shift to match your physical location." },
      { heading: "Cross-Team Visibility for Supervisors", body: "Supervisors and Admins have the ability to view data from other teams without switching. On certain pages (Queue, Analytics), a team filter allows you to scope the view to any team or \"All Teams.\" This is useful for comparing performance, identifying cross-team dependencies, or managing organization-wide workload." },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // ── STATIONS & WORK CENTERS ────────────────────────────────────
  // ════════════════════════════════════════════════════════════════
  {
    category: "stations", categoryLabel: "Stations & Work Centers",
    slug: "setting-up-stations", title: "Setting Up Stations",
    description: "Complete guide to creating, configuring, and managing work stations on your production floor.",
    tags: ["station", "setup", "work center", "configuration"],
    relatedSlugs: ["stations/operator-check-in", "stations/machine-profiles"],
    sections: [
      { heading: "What Is a Station?", body: "A station in JobLine.ai represents a physical work center on your production floor. This could be a CNC milling machine, a lathe, a welding booth, a grinding station, an inspection bench, a deburring area, or a shipping dock. Stations are the fundamental unit where work happens — operators check into them, work orders are processed at them, and handoffs are written about them." },
      { heading: "Creating a Station", body: "Supervisors and Admins can create stations from the Teams page (click a team, then \"Add Station\") or from Settings → Stations. Enter the station name (e.g., \"Haas VF-2 #3\"), select the work center type from the dropdown (Mill, Lathe, Grinder, etc.), and assign it to a team. The station immediately appears in the team's station grid on the dashboard." },
      { heading: "Work Center Type", body: "The work center type is a classification that determines which work orders get routed to this station. When a work order's routing includes a \"Mill\" step, it appears in the queues of all stations typed as \"Mill\" within the appropriate team. Choose the type that best matches the station's primary function. If no built-in type fits, Admins can create custom types in Settings → Work Centers." },
      { heading: "Station Configuration Options", body: "Beyond name and type, you can configure: Display Name (a friendly name shown on dashboard cards — useful when the full name is long), Capacity (default: 1 — how many concurrent jobs the station can handle), and Notes (freeform text for permanent information about the station, like \"Maximum workpiece size: 20×16×20 inches\" or \"Requires flood coolant\")." },
      { heading: "Linking Equipment", body: "Each station can be linked to an equipment record that stores machine-specific details: manufacturer, model, serial number, and maintenance schedule. This link is optional but recommended — it enables equipment tracking and makes your station cards more informative. See the Machine Profiles article for details on setting this up." },
      { heading: "Editing and Deactivating Stations", body: "Edit a station by clicking its name in the station list and modifying any field. Changes take effect immediately. If a station is taken out of service (sold, moved, or permanently idle), deactivate it instead of deleting it. Deactivated stations are hidden from the active station grid but their historical data (handoffs, work order records) is preserved for reporting." },
    ],
  },
  {
    category: "stations", categoryLabel: "Stations & Work Centers",
    slug: "operator-check-in", title: "Operator Check-In",
    description: "Why check-in matters, how to do it, and what happens behind the scenes.",
    tags: ["check-in", "station", "operator", "shift"],
    relatedSlugs: ["stations/setting-up-stations", "shift-handoffs/reviewing-handoffs"],
    sections: [
      { heading: "Why Check-In Matters", body: "Checking into a station tells JobLine.ai which operator is at which machine. This seemingly simple action enables several critical features: handoff notes are delivered to the right person, parts counts are attributed to the correct operator for performance tracking, supervisors can see at a glance who is where on the floor, and the system knows which station to show on your operator dashboard." },
      { heading: "How to Check In", body: "From the dashboard, locate the station card and click the \"Check In\" button. Alternatively, navigate to the station detail page and click \"Check In\" there. Once checked in, the station card updates to show your name and the dashboard switches to your operator view for that station. You will also be prompted to review any pending handoff from the previous operator." },
      { heading: "One Station at a Time", body: "You can only be checked into one station at a time. If you check into a new station while already checked into another, the system automatically checks you out of the first station. This ensures data integrity — your parts counts and handoffs are always attributed to the correct station. If you need to briefly leave your station (for a break, meeting, or supply run), you do not need to check out; only check out when you are done for the shift or being reassigned." },
      { heading: "Automatic Check-Out", body: "Submitting a handoff at the end of your shift automatically checks you out of the station. This is the recommended workflow: finish your shift, create a handoff with your notes and parts counts, submit it, and you are checked out. If you forget to submit a handoff, you remain checked in until you manually check out or check into a different station." },
      { heading: "Check-In History", body: "Every check-in and check-out event is logged in the station's history and the activity log. Supervisors can review who was checked into each station at any point in time. This history is valuable for investigating production issues (\"who was running this machine when the scrap rate spiked?\") and for verifying attendance." },
    ],
  },
  {
    category: "stations", categoryLabel: "Stations & Work Centers",
    slug: "machine-profiles", title: "Machine Profiles",
    description: "How to link machine details and equipment information to your stations.",
    tags: ["machine", "equipment", "profile", "manufacturer"],
    relatedSlugs: ["stations/setting-up-stations", "admin/organization-oversight"],
    sections: [
      { heading: "What Is a Machine Profile?", body: "A machine profile is a detailed record of a piece of equipment: its manufacturer, model, serial number, asset tag, purchase date, and other operational details. Linking a machine profile to a station enriches the station card with equipment-specific information and supports maintenance tracking, calibration scheduling, and warranty management." },
      { heading: "Equipment Record Fields", body: "Each equipment record includes: Name (e.g., \"Haas VF-2\"), Equipment Type (CNC Mill, Lathe, Grinder, etc.), Manufacturer, Model Number, Serial Number, Asset Tag (your internal tracking number), Purchase Date, Warranty Expiration, and optional fields for calibration dates and maintenance notes." },
      { heading: "The Machine Profile Marketplace", body: "JobLine.ai includes a library of pre-built machine profiles for popular CNC equipment brands: Haas, Mazak, DMG Mori, Okuma, Doosan, and others. Attaching a marketplace profile to your station pre-fills the manufacturer and model data automatically. This saves setup time and ensures consistency across stations with the same equipment." },
      { heading: "Creating Custom Profiles", body: "If your equipment is not in the marketplace — custom-built machines, specialty equipment, or less common brands — create a custom profile by entering the details manually. Navigate to the station's detail page, click \"Add Equipment,\" and fill in the fields. Custom profiles function identically to marketplace profiles." },
      { heading: "Maintenance and Calibration Tracking", body: "Equipment records include fields for last calibration date and next calibration due date. When a calibration date approaches, the system can generate alerts so maintenance tasks are not overlooked. This is particularly important for inspection equipment where calibration directly affects quality assurance." },
    ],
  },
  {
    category: "stations", categoryLabel: "Stations & Work Centers",
    slug: "work-center-filtering", title: "Work Center Filtering",
    description: "How to use work center types to filter dashboard views, queue lists, and production analytics.",
    tags: ["filter", "work center", "type", "sort"],
    relatedSlugs: ["work-orders/queue-views", "stations/setting-up-stations"],
    sections: [
      { heading: "Built-In Work Center Types", body: "JobLine.ai includes a set of standard work center types commonly found in manufacturing: Mill, Lathe, Grinder, Saw, EDM (Electrical Discharge Machining), Assembly, Inspection, Shipping, Deburr, and Welding. Each station is assigned one of these types, which determines how work orders are routed to it and how it appears in filtered views." },
      { heading: "Filtering on the Dashboard", body: "On the supervisor dashboard, use the work center filter to show only stations of a specific type. For example, selecting \"Mill\" hides all non-milling stations, giving you a focused view of your milling capacity, utilization, and queue depth. This is useful during morning production meetings when discussing specific departments or work areas." },
      { heading: "Filtering the Queue", body: "On the Queue page, the work center filter narrows the work order list to show only orders currently at (or routed to) stations of the selected type. Combined with status and priority filters, this lets you answer questions like \"How many rush jobs are waiting at our lathes?\" or \"What is the oldest in-progress order in grinding?\"" },
      { heading: "Adding Custom Work Center Types", body: "If the built-in types do not cover your operations, Admins can add custom types in Settings → Work Centers. Common additions include: Laser, Waterjet, Paint, Heat Treat, Plating, CMM (Coordinate Measuring Machine), and Manual Assembly. Custom types work identically to built-in types for routing and filtering purposes." },
      { heading: "Work Center Icons", body: "Each work center type has an associated icon that appears on station cards, queue items, and routing step indicators. This visual cue helps users quickly identify the type of operation at a glance, especially on the Kanban board and station grid where many items are visible simultaneously." },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // ── QUALITY MANAGEMENT ─────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════
  {
    category: "quality", categoryLabel: "Quality Management",
    slug: "filing-an-ncr", title: "Filing an NCR",
    description: "Step-by-step guide to documenting a Non-Conformance Report with all required information.",
    tags: ["NCR", "quality", "non-conformance", "report", "defect"],
    relatedSlugs: ["quality/ncr-approval-workflow", "quality/quantity-tracking"],
    sections: [
      { heading: "What Is an NCR?", body: "A Non-Conformance Report (NCR) is a formal quality document that records a deviation from specifications. It could be a dimensional issue (a bore is 0.003\" oversize), a surface finish problem (tool marks visible where smooth finish is required), a material defect (inclusions found in incoming bar stock), or a process deviation (wrong program revision was used). NCRs are a foundational element of any quality management system and are required by standards like ISO 9001 and AS9100." },
      { heading: "When to File an NCR", body: "File an NCR whenever you discover a part or batch that does not meet the documented specifications for the work order. This includes: parts that fail dimensional inspection, visible surface defects, incorrect material or hardness, incorrect quantity delivered by a previous operation, or any deviation from the engineering drawing or customer requirements. When in doubt, file the NCR — it is better to document a potential issue than to let a non-conforming part reach the customer." },
      { heading: "Accessing the NCR Form", body: "Click \"File NCR\" from your station panel's quick actions, from the work order detail page, or from the Quality section in the main navigation. The form opens with your current station and active work order pre-selected (if applicable). You can change the associated work order if the NCR applies to a different job." },
      { heading: "Required Information", body: "The NCR form requires: the affected Work Order number, a Description of the non-conformance (what is wrong, measured vs. specified dimensions, quantity of affected parts), Quantity Breakdown (how many good parts, how many scrap, how many need rework), and Severity Level (Minor: cosmetic or within tolerance range; Major: out of spec but usable with concession; Critical: safety risk or complete failure to meet requirements)." },
      { heading: "Supporting Evidence", body: "Whenever possible, attach supporting evidence to the NCR. This might include: photographs of the defect, screenshots of CMM inspection results, measurements from calipers or micrometers, or references to the drawing revision and tolerance zone. Evidence strengthens the NCR and helps the reviewer make a faster, more informed disposition decision." },
      { heading: "Submission and Next Steps", body: "Click \"Submit NCR\" to create the record. The NCR enters \"Open\" status and appears in the supervisor's review queue. Depending on your organization's settings, the associated work order may be automatically placed in QC Hold to prevent further processing on potentially defective parts. You will receive a notification when the NCR is reviewed and dispositioned by a supervisor." },
    ],
  },
  {
    category: "quality", categoryLabel: "Quality Management",
    slug: "ncr-approval-workflow", title: "NCR Approval Workflow",
    description: "The complete disposition workflow from initial review through closure and corrective action.",
    tags: ["NCR", "approval", "workflow", "disposition", "corrective action"],
    relatedSlugs: ["quality/filing-an-ncr", "quality/quality-dashboard"],
    sections: [
      { heading: "NCR Status Flow", body: "NCRs follow a defined lifecycle: Open → Under Review → Dispositioned → Closed. Each transition is logged with the reviewer's identity and timestamp. The flow ensures that every quality issue is formally assessed, a decision is made about the affected parts, and the resolution is documented for future reference." },
      { heading: "Initial Review", body: "A Supervisor or designated quality lead opens the NCR from the review queue. They verify the information: Is the work order correct? Is the description accurate? Are the quantities reasonable? If additional information is needed, they may contact the operator who filed the NCR for clarification. The reviewer sets the status to \"Under Review\" to signal that someone is actively working on it." },
      { heading: "Disposition Options", body: "After reviewing the evidence, the reviewer selects one of four dispositions: (1) Use As-Is — accept the parts despite the deviation (often with customer concession for contract work). (2) Rework — return the parts to a previous operation for correction. (3) Scrap — reject the parts entirely and update scrap counts. (4) Return to Vendor — if the non-conformance originated from incoming material, return it to the supplier. Each option updates the work order quantities accordingly." },
      { heading: "Corrective Action Notes", body: "The reviewer documents what actions are being taken to prevent recurrence. This might include: adjusting a tool offset, replacing a worn cutter, updating a program, retraining an operator, or flagging a supplier quality issue. Corrective action notes are stored with the NCR and are searchable — they become a knowledge base for preventing future quality problems." },
      { heading: "Closing the NCR", body: "After disposition is applied and corrective actions are documented, the reviewer closes the NCR. If the associated work order was on QC Hold, the hold is released and the order can resume production. The closure event is logged and the NCR moves to historical records where it remains permanently for audit purposes." },
      { heading: "Reopening an NCR", body: "In rare cases, a closed NCR may need to be reopened — for example, if the same defect recurs or if additional affected parts are discovered after closure. Only Supervisors and Admins can reopen NCRs. Reopening returns the NCR to \"Open\" status and initiates a new review cycle." },
    ],
  },
  {
    category: "quality", categoryLabel: "Quality Management",
    slug: "quantity-tracking", title: "Quantity Tracking",
    description: "Understanding how good parts, scrap, and rework are tracked throughout production.",
    tags: ["quantity", "parts", "scrap", "rework", "yield"],
    relatedSlugs: ["quality/filing-an-ncr", "work-orders/work-order-statuses"],
    sections: [
      { heading: "The Three Quantity Categories", body: "Every work order tracks parts produced in three categories: Good (parts that meet all specifications and are ready for the next operation or shipment), Scrap (parts that cannot be corrected and must be discarded), and Rework (parts that have a defect but can be corrected by returning to a previous operation). Maintaining accurate counts in all three categories is essential for yield tracking, cost analysis, and customer delivery commitments." },
      { heading: "Updating Counts", body: "Operators update quantity counts from the station panel as production proceeds. After inspecting a batch, enter the number of good parts, scrap, and rework. The system adds these to running totals for the work order. You can update counts as frequently as you like — some operators update after every piece, others after each batch or inspection interval." },
      { heading: "The Running Total Bar", body: "The station panel displays a progress bar and numeric summary showing: Good/Required (e.g., 42/100), plus Scrap and Rework counts. The system validates that Good + Scrap + Rework does not exceed a reasonable total (based on the order quantity plus allowable overrun). If the numbers seem inconsistent, a warning appears prompting you to verify your counts." },
      { heading: "Yield Calculation", body: "Yield (also called First-Pass Yield) is calculated as: Good / (Good + Scrap) × 100%. For example, if you produced 95 good parts and 5 scrap, your yield is 95%. This metric appears on the quality dashboard and is tracked per work order, per station, and per operator over time. High yield indicates consistent quality; declining yield signals a problem that needs investigation." },
      { heading: "Impact on Work Order Status", body: "When the Good count meets or exceeds the Required quantity, the work order can be marked as Complete. If significant scrap occurs and you cannot meet the required quantity with remaining material, notify your supervisor — they may need to order additional material or adjust the customer commitment. The system does not automatically complete orders based on counts; a human decision is always required." },
    ],
  },
  {
    category: "quality", categoryLabel: "Quality Management",
    slug: "quality-dashboard", title: "Quality Metrics Dashboard",
    description: "Interpreting quality charts, identifying trends, and using data for continuous improvement.",
    tags: ["quality", "dashboard", "metrics", "trends", "pareto"],
    relatedSlugs: ["quality/ncr-approval-workflow", "dashboard/production-analytics"],
    sections: [
      { heading: "Dashboard Overview", body: "The quality metrics dashboard provides a consolidated view of your organization's quality performance. Key widgets include: total open NCRs, NCR count by severity, average time from NCR filing to closure, scrap rate trend (percentage over time), and a breakdown of NCR dispositions. The dashboard can be filtered by team, station, and date range to focus on specific areas." },
      { heading: "Pareto Analysis Chart", body: "The Pareto chart ranks NCR root causes by frequency, with a cumulative percentage line overlay. This follows the 80/20 principle — typically, a small number of root causes account for the majority of quality issues. Focus your improvement efforts on the top two or three causes shown on the chart. Common categories include: tool wear, incorrect offsets, material variation, setup error, and program revision mismatch." },
      { heading: "Scrap Rate Trend", body: "A line chart shows the scrap rate (scrap / total produced × 100%) over time. Look for patterns: is scrap increasing on certain days of the week? After certain shifts? At specific stations? An upward trend in scrap rate is an early warning that something has changed — a dull tool, a new material batch, an operator who needs additional training, or a process that has drifted out of control." },
      { heading: "Time-to-Close Metric", body: "This metric measures the average number of hours (or days) between an NCR being filed and being closed. A low time-to-close indicates that your quality review process is responsive. If this number is high or increasing, it may mean NCRs are accumulating in the review queue without timely attention, which can cause work orders to remain on QC Hold for too long." },
      { heading: "Using Quality Data for Improvement", body: "The quality dashboard is most valuable when reviewed regularly — weekly or even daily during quality huddles. Ask questions like: What is our yield trend? Are the same root causes recurring? Is one station generating more NCRs than others? Use the data to drive specific actions: retool a worn station, update a program, retrain on a measurement technique, or escalate a supplier quality issue. Data-driven quality improvement is more effective and sustainable than reactive firefighting." },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // ── SETTINGS ───────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════
  {
    category: "settings", categoryLabel: "Settings",
    slug: "profile-settings", title: "Profile Settings",
    description: "How to manage your personal profile, display name, password, and avatar.",
    tags: ["profile", "settings", "personal", "password", "avatar"],
    relatedSlugs: ["getting-started/creating-an-account", "settings/notification-preferences"],
    sections: [
      { heading: "Accessing Your Profile", body: "Click your avatar or initials in the top-right corner of the header and select \"Profile\" from the dropdown menu. This page shows your current display name, email address, and avatar. You can also access it from Settings → Profile in the main navigation." },
      { heading: "Display Name", body: "Your display name appears throughout JobLine.ai wherever your identity is shown: handoff records, activity logs, station check-in indicators, team member lists, and NCR filings. Choose a name your colleagues will recognize — this could be your full name (\"John Smith\"), a common nickname (\"Smitty\"), or a combination (\"J. Smith\"). The display name is separate from your email address and can be changed at any time." },
      { heading: "Changing Your Password", body: "To change your password, click \"Change Password\" on the Profile page. You will be prompted to enter your current password for security verification, then enter and confirm your new password. The new password must be at least 8 characters. For best security, use a unique password that you do not use for any other service. After changing your password, all other active sessions are terminated — you will need to sign in again on other devices." },
      { heading: "Profile Avatar", body: "Upload a profile photo by clicking the avatar area on the Profile page and selecting an image file from your device. The image is cropped to a circle for display purposes. Supported formats include JPEG, PNG, and WebP. A profile photo helps teammates identify you quickly, especially in organizations with many members sharing similar names." },
      { heading: "Email Address", body: "Your email address is used for sign-in and notifications. It cannot be changed from the Profile page directly — if you need to update your email (e.g., name change, new company domain), contact your Org Admin who can assist with the process." },
    ],
  },
  {
    category: "settings", categoryLabel: "Settings",
    slug: "notification-preferences", title: "Notification Preferences",
    description: "Controlling which events generate notifications and how they are delivered.",
    tags: ["notifications", "settings", "email", "alerts"],
    relatedSlugs: ["settings/profile-settings", "dashboard/background-refresh"],
    sections: [
      { heading: "Notification Types", body: "JobLine.ai generates notifications for several event categories: Handoffs (a new handoff is filed at your station or requires your acknowledgment), Work Orders (an order is assigned to your station, status changes on orders you are tracking), Quality (an NCR is filed, dispositioned, or closed on work you are involved in), Announcements (organization-wide messages from your admin), and System (updates, maintenance windows, or new feature releases)." },
      { heading: "In-App Notifications", body: "In-app notifications appear as a badge count on the bell icon in the header. Click the bell to see a list of recent notifications with timestamps. Unread notifications are highlighted. Clicking a notification navigates you to the relevant record (e.g., the handoff, work order, or NCR). You can mark all notifications as read to clear the badge count." },
      { heading: "Email Notifications", body: "By default, certain high-priority events also generate email notifications: new handoffs at your station, NCRs filed on your work orders, and critical announcements. You can enable or disable email notifications for each category independently in Settings → Notifications. Disabling email notifications does not affect in-app notifications — you will still see them when you open the application." },
      { heading: "Organization Announcements", body: "Admins can post announcements that appear prominently in your notification center. High-priority announcements (marked as \"urgent\" by the admin) may bypass your email notification preferences and send an email regardless. This mechanism is reserved for critical communications like safety alerts, system outages, or policy changes." },
      { heading: "Do Not Disturb", body: "If you need to temporarily suppress notifications (e.g., during a vacation or an off-shift period), you can enable \"Do Not Disturb\" mode in Settings → Notifications. While active, in-app notification badges are suppressed and email notifications are paused. Notifications are still generated and stored — when you disable Do Not Disturb, you can review everything you missed." },
    ],
  },
  {
    category: "settings", categoryLabel: "Settings",
    slug: "billing-subscriptions", title: "Billing & Subscriptions",
    description: "Understanding subscription plans, seat management, and how to manage your billing.",
    tags: ["billing", "subscription", "plan", "pricing", "seats"],
    relatedSlugs: ["settings/profile-settings", "admin/user-management"],
    sections: [
      { heading: "Subscription Plans", body: "JobLine.ai offers tiered subscription plans designed to scale with your organization: a Free plan for small teams or evaluation purposes (limited seats and features), a Pro plan for full-featured access for small to medium teams, and an Enterprise plan with custom pricing for larger organizations that need advanced features, higher seat limits, or dedicated support. Plan details are viewable in Settings → Billing." },
      { heading: "Seat-Based Pricing", body: "Subscriptions are priced by the number of active seats (users) in your organization. Each user who has an active account counts as one seat. Deactivated users do not count toward your seat limit. When you invite new members, the system checks whether you have available seats — if not, you will be prompted to upgrade your plan or add more seats before the invite can be completed." },
      { heading: "Managing Your Plan", body: "To change your plan or add seats, navigate to Settings → Billing and click \"Manage Billing.\" This opens a secure portal where you can: view your current plan and usage, upgrade or downgrade your plan, add or reduce seats, update your payment method, and view or download invoices for past billing periods." },
      { heading: "Trial Period", body: "New organizations start with a free trial that includes full access to Pro features for a limited time. During the trial, you can explore all capabilities without entering payment information. When the trial ends, you will be prompted to select a paid plan. If you do not upgrade, your account transitions to the Free plan with reduced capabilities, but your data is preserved." },
      { heading: "Billing Questions", body: "If you have questions about charges, need a custom invoice, or want to discuss enterprise pricing, use the support contact options available in the billing portal. For general billing FAQ, check the Pricing page on the JobLine.ai website." },
    ],
  },
  {
    category: "settings", categoryLabel: "Settings",
    slug: "shift-configuration", title: "Shift Configuration",
    description: "Defining shift schedules, labels, and exceptions for accurate time-based tracking.",
    tags: ["shift", "schedule", "configuration", "time"],
    relatedSlugs: ["shift-handoffs/shift-stats", "teams-orgs/managing-teams"],
    sections: [
      { heading: "Why Configure Shifts", body: "Shift configuration tells JobLine.ai when your shifts start and end. This information is used for: determining which handoffs belong to which shift, calculating shift-level statistics, filtering analytics by shift, and generating accurate utilization metrics. Without shift configuration, time-based analytics use default 8-hour blocks which may not match your actual schedule." },
      { heading: "Defining Shifts", body: "Navigate to Settings → Shifts. Click \"Add Shift\" to define each shift your organization uses. For each shift, enter: a Name (e.g., \"1st Shift\"), a Label (e.g., \"Day\"), a Start Time (e.g., 06:00), and an End Time (e.g., 14:30). Common configurations include two 12-hour shifts, three 8-hour shifts, or a rotating pattern. The shifts you define apply organization-wide by default but can be overridden per team." },
      { heading: "Shift Labels", body: "Labels are short identifiers used in analytics filters, handoff records, and scheduling views. Common labels include: Day, Swing, Night, A-Shift, B-Shift, Weekend. Labels make it easy to select and compare shifts without remembering exact times. Choose labels that match the terminology your team already uses on the shop floor." },
      { heading: "Overnight Shifts", body: "If a shift spans midnight (e.g., Night Shift from 22:00 to 06:00), set the end time to the next-day time. The system correctly handles the day boundary and attributes handoffs and production data to the correct shift even when the shift crosses midnight." },
      { heading: "Holidays and Exceptions", body: "Mark specific dates as holidays or exceptions in the shift calendar. On exception dates, the normal shift schedule does not apply. This prevents false \"missed handoff\" alerts on days when the shop is closed and ensures that productivity analytics are not skewed by non-production days. You can also define reduced schedules (e.g., a half-day shift on the day before a holiday)." },
    ],
  },
  {
    category: "settings", categoryLabel: "Settings",
    slug: "erp-connector", title: "ERP Connector Setup",
    description: "How to connect JobLine.ai to your ERP system for bidirectional data sync.",
    tags: ["ERP", "connector", "integration", "sync", "API"],
    relatedSlugs: ["work-orders/creating-work-orders", "admin/activity-logs"],
    sections: [
      { heading: "What the ERP Connector Does", body: "The ERP connector enables bidirectional synchronization between JobLine.ai and your existing Enterprise Resource Planning system. It can import work orders from your ERP into JobLine.ai (so operators do not need to re-enter them manually), sync part catalog data, push status updates back to the ERP (so planners and sales teams see real-time progress), and exchange quantity information (good parts, scrap). This eliminates double data entry and keeps both systems in sync." },
      { heading: "Supported Integration Methods", body: "JobLine.ai supports API-based integration with ERP systems that provide RESTful or OData endpoints. The connector is configurable for various ERP platforms — the specific setup depends on your ERP's API capabilities. If your ERP does not have a standard API, file-based import/export (via the bulk upload feature) is an alternative." },
      { heading: "Configuration Steps", body: "Navigate to Settings → ERP Connector. Enter: your ERP's API endpoint URL, authentication credentials (API key, OAuth credentials, or username/password — depending on your ERP), and select which data types to sync (work orders, parts, statuses). Click \"Test Connection\" to verify that JobLine.ai can communicate with your ERP before enabling automatic sync." },
      { heading: "Status Mapping", body: "ERP systems use different status names than JobLine.ai. The status mapping table lets you define equivalences — for example, your ERP's \"Released\" maps to JobLine.ai's \"Queued,\" and your ERP's \"In Process\" maps to \"In Progress.\" This mapping ensures that status changes in either system are translated correctly when synced. Review and test the mappings carefully before enabling automated sync." },
      { heading: "Sync Schedule and Monitoring", body: "Syncs can run on a configurable schedule (every 5 minutes, 15 minutes, 30 minutes, or hourly) or be triggered manually. The sync log in Settings → ERP Connector shows a history of all sync operations: when they ran, how many records were fetched, created, or updated, and any errors encountered. Monitor this log regularly, especially after initial setup, to ensure data is flowing correctly." },
      { heading: "Error Handling", body: "If a sync encounters errors (e.g., a work order number conflict, an unrecognized status, or a network timeout), the error is logged with details and the affected records are skipped. Other records in the same sync batch are processed normally. Review errors in the sync log and resolve them manually — common fixes include correcting status mappings, deduplicating work order numbers, or verifying network connectivity to the ERP." },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // ── ADMIN GUIDE ────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════
  {
    category: "admin", categoryLabel: "Admin Guide",
    slug: "user-management", title: "User Management",
    description: "Complete guide to managing users, assigning roles, and handling deactivation.",
    tags: ["admin", "users", "roles", "management", "deactivation"],
    relatedSlugs: ["teams-orgs/role-permissions", "teams-orgs/inviting-members"],
    sections: [
      { heading: "Accessing User Management", body: "Navigate to the Admin panel from the main navigation menu. The User Management section lists all users in your organization with their email address, display name, current role, team memberships, account status (active/deactivated), and last sign-in date. Use the search bar at the top to find specific users by name or email." },
      { heading: "Viewing User Details", body: "Click on a user's row to open their detail panel. Here you can see: their full profile information, the teams they belong to, their station check-in history, recent activity log entries (sign-ins, work order updates, handoffs created), and any NCRs they have filed. This view helps you understand a user's engagement and responsibilities." },
      { heading: "Changing a User's Role", body: "From the user detail panel, click \"Change Role\" and select the new role from the dropdown. Role changes take effect immediately — the user's permissions update on their next page load or API call. The change is logged in the activity log with your identity, the previous role, and the new role. Exercise caution when changing roles — upgrading an Operator to Supervisor gives them access to team-wide data and management functions." },
      { heading: "Deactivating a User", body: "If a user leaves the organization or should no longer have access, click \"Deactivate\" on their profile. Deactivation revokes their sign-in credentials and prevents access to all org data. Importantly, their historical data is preserved: handoff records they created, work order updates they made, NCRs they filed, and activity log entries all remain intact for audit purposes. Deactivated users do not count toward your seat limit." },
      { heading: "Reactivating a User", body: "Deactivated users can be reactivated by an Admin from the user management list. Filter by \"Deactivated\" status to find them. Click \"Reactivate\" to restore their access. They will need to sign in again — their credentials are not changed, but their session was terminated at deactivation. Reactivation counts toward your seat limit." },
      { heading: "Bulk Actions", body: "For organizations onboarding or offboarding many users at once, the user management list supports bulk selection. Select multiple users via checkboxes and apply actions like: assign to team, change role, or deactivate. Bulk actions are logged individually in the activity log (one entry per user affected)." },
    ],
  },
  {
    category: "admin", categoryLabel: "Admin Guide",
    slug: "organization-oversight", title: "Organization Oversight",
    description: "How to monitor your entire organization's health, performance, and compliance from a single panel.",
    tags: ["admin", "oversight", "monitoring", "health", "compliance"],
    relatedSlugs: ["admin/activity-logs", "dashboard/supervisor-dashboard"],
    sections: [
      { heading: "The Oversight Dashboard", body: "The organization oversight panel provides the highest-level view of your operation. Summary cards display: total active users, number of teams, total stations across all teams, total open work orders, open NCRs, and handoffs submitted in the last 24 hours. This is your daily health check — scan it each morning to ensure operations are running normally across the entire organization." },
      { heading: "Cross-Team Comparison", body: "Unlike supervisors who see only their team, Admins can compare metrics across all teams. Side-by-side charts show throughput, utilization, scrap rate, and downtime per team. This helps identify: teams that are consistently outperforming (whose practices should be replicated), teams that are struggling (which may need more resources or support), and workload imbalances (one team overloaded while another is underutilized)." },
      { heading: "User Activity Summary", body: "A table shows recent user activity across the organization: who signed in today, who submitted handoffs, who filed NCRs, and who has been inactive for an extended period. Inactive users may indicate abandoned accounts that should be deactivated to free up seats, or team members who need encouragement or support to adopt the system." },
      { heading: "Compliance and Audit Readiness", body: "For organizations subject to quality standards (ISO 9001, AS9100, ITAR), the oversight panel provides quick access to compliance-related data: NCR aging report (how long NCRs stay open), handoff completion rate (percentage of shifts with documented handoffs), and data access logs (who accessed what data and when). These reports can be exported for auditor review." },
      { heading: "System Health Indicators", body: "The panel also shows operational health metrics: last successful data refresh, any pending sync errors (if ERP connector is configured), subscription status and seat utilization, and whether any scheduled tasks or automated processes have failed. These indicators help you proactively address issues before they affect users." },
    ],
  },
  {
    category: "admin", categoryLabel: "Admin Guide",
    slug: "activity-logs", title: "Activity Logs",
    description: "Understanding the comprehensive audit trail and how to use it for compliance and investigation.",
    tags: ["admin", "activity", "logs", "audit", "compliance"],
    relatedSlugs: ["admin/organization-oversight", "admin/user-management"],
    sections: [
      { heading: "What Gets Logged", body: "The activity log captures every significant event in your organization: authentication events (sign-in, sign-out, failed sign-in attempts), data creation (new work orders, handoffs, NCRs, stations), data modifications (status changes, quantity updates, role changes, setting modifications), data deletions (when permitted by role), and administrative actions (user deactivation, invite generation, plan changes). Each log entry includes: the user who performed the action, a timestamp, a description, and relevant metadata." },
      { heading: "Searching and Filtering", body: "The log can contain thousands of entries. Use the filter controls to narrow your view: by User (show only actions by a specific person), by Activity Type (e.g., only authentication events, or only work order changes), by Date Range (from/to date picker), and by Team (show only actions related to a specific team). Filters can be combined — for example, show all NCR filings by user \"Jane Smith\" in the past 7 days." },
      { heading: "Data Access Logs", body: "A separate, more granular log tracks data access: which users viewed or queried which records. This is important for organizations with compliance requirements (ITAR, HIPAA, SOX) where you must demonstrate who accessed sensitive data and when. Data access logs include the table name, record ID, operation type (SELECT, INSERT, UPDATE, DELETE), and user identity." },
      { heading: "Exporting Logs", body: "Both activity logs and data access logs can be exported as CSV files for external analysis, archival, or auditor review. Click the export button and select the date range and log type. Exports include all entries matching your current filters, so you can generate focused reports (e.g., all authentication events for the past quarter)." },
      { heading: "Log Retention", body: "Activity logs are retained for the lifetime of your organization. They cannot be deleted or modified by any user, including Admins. This immutability ensures the integrity of the audit trail — you can always trace back to who did what and when, regardless of subsequent changes." },
      { heading: "Investigating Incidents", body: "When something goes wrong — an unexplained work order status change, a data discrepancy, or a suspected unauthorized access — the activity log is your primary investigation tool. Start by identifying the affected record (work order number, station ID, etc.), then filter the log for that record to see all related events in chronological order. This typically reveals who made the change, when, and what the previous value was." },
    ],
  },
  {
    category: "admin", categoryLabel: "Admin Guide",
    slug: "system-updates", title: "System Updates & Changelog",
    description: "Staying informed about new features, improvements, and how to manage internal changelog entries.",
    tags: ["admin", "updates", "changelog", "features", "releases"],
    relatedSlugs: ["admin/organization-oversight", "settings/notification-preferences"],
    sections: [
      { heading: "The Updates Page", body: "Navigate to the Updates page from the main navigation. This page lists all recent changes to JobLine.ai: new features, improvements to existing features, bug fixes, and security updates. Each entry includes a title, description, category (Feature, Improvement, Fix, Security), date, and version number. Updates are listed in reverse chronological order so the latest changes are always at the top." },
      { heading: "Update Categories", body: "Feature: a new capability that did not previously exist (e.g., a new chart type on the analytics dashboard). Improvement: an enhancement to an existing feature (e.g., faster load times, better mobile layout). Fix: a correction to a bug or unexpected behavior. Security: a change related to authentication, data protection, or access control. Understanding the category helps you assess the relevance and urgency of each update." },
      { heading: "Required Acknowledgments", body: "Some updates are marked as requiring acknowledgment. When you encounter one, a modal prompts you to read the update details and click \"I Understand\" before continuing. This mechanism ensures that critical changes — like new workflow behaviors, security policy updates, or feature deprecations — are formally communicated to all users. Your acknowledgment is logged with your user ID and timestamp." },
      { heading: "Internal Changelog", body: "Admins can create internal changelog entries for organization-specific changes that are not system updates — for example, \"New Grinding Station #4 added to Night Shift team\" or \"Routing templates updated for Part No. 7842.\" These internal entries appear alongside system updates on the Updates page for your organization's users, providing a single feed of all relevant changes." },
      { heading: "Staying Current", body: "We recommend checking the Updates page at least weekly. Important updates also generate notifications (in-app and/or email depending on your settings). If a new feature or change is relevant to your team, share the update with your team members during shift meetings or via the announcements feature." },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // ── FAQ ────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════
  {
    category: "faq", categoryLabel: "FAQ",
    slug: "common-errors", title: "Common Errors & Troubleshooting",
    description: "Detailed solutions to the most frequently encountered issues and error messages.",
    tags: ["faq", "errors", "troubleshooting", "help", "support"],
    relatedSlugs: ["faq/data-export", "getting-started/mobile-access"],
    sections: [
      { heading: "\"You do not have permission to perform this action\"", body: "This error appears when your role does not include the permission needed for the action you attempted. For example, an Operator trying to delete a work order, or a Viewer trying to create a handoff. First, verify that you are signed into the correct account (check your user menu). Second, confirm your role with your Org Admin. Third, try signing out completely and signing back in — sessions can sometimes carry stale role information. If your role is correct and you still see this error, the action genuinely requires a higher role — ask your Supervisor or Admin to perform it." },
      { heading: "\"Your session has expired. Please sign in again.\"", body: "For security, sessions have a limited lifetime. If you have been inactive for an extended period, your session expires and you must sign in again. Any unsaved work (a handoff form you were filling out, a work order you were editing) may be lost. To prevent data loss, save your work frequently by clicking Submit or Save, especially before leaving your computer for breaks or meetings." },
      { heading: "Data Is Not Appearing", body: "If you expect to see work orders, stations, or handoffs that are not showing: (1) Check the team selector — you may be viewing a different team than expected. (2) Check active filters — status, priority, or date filters may be hiding the records. Clear all filters and search again. (3) Click the manual refresh button to force a data reload. (4) If you recently joined the organization, your Admin may not have assigned you to a team yet — contact them. (5) If none of these solve it, report the issue through the in-app issue reporter." },
      { heading: "The App Feels Slow or Unresponsive", body: "Performance can be affected by several factors: (1) Slow internet connection — test your connection speed at fast.com; at least 2 Mbps is recommended. (2) Too many browser tabs open — close unused tabs to free up memory. (3) Outdated browser — update to the latest version of Chrome, Edge, Firefox, or Safari. (4) Try a hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac) to clear cached assets. (5) If the issue affects multiple users simultaneously, it may indicate a system-level problem — check the Updates page for any maintenance notices." },
      { heading: "\"Work order number already exists\"", body: "Work order numbers must be unique within your organization. If you receive this error when creating or bulk-uploading a work order, it means another order with that number already exists. Search the queue for the duplicate to verify. If the existing order was created in error, ask an Admin to delete it. If both orders are legitimate, adjust the new order's number to be unique — many shops use a suffix (e.g., WO-1234-A, WO-1234-B) for split orders." },
      { heading: "\"Failed to check into station\"", body: "This can occur if: (1) Another user is already checked into the station and it is configured for single-operator use — coordinate with your supervisor. (2) The station has been deactivated — check with your Admin. (3) You are not a member of the team that owns the station — ask your Admin to add you to the correct team. (4) A temporary network error occurred — try again in a few seconds." },
      { heading: "Reporting an Issue", body: "If you encounter a problem not covered here, use the in-app issue reporter: click the help or support icon (typically in the user menu or footer), describe the problem with as much detail as possible (what you were doing, what you expected, what happened instead), and submit. Your report is logged with your user ID, browser information, and current page context, which helps the support team diagnose the problem faster." },
    ],
  },
  {
    category: "faq", categoryLabel: "FAQ",
    slug: "data-export", title: "Data Export",
    description: "How to export work orders, handoffs, analytics, and other data from JobLine.ai.",
    tags: ["faq", "export", "data", "download", "excel", "csv"],
    relatedSlugs: ["work-orders/queue-views", "dashboard/production-analytics"],
    sections: [
      { heading: "Why Export Data", body: "While JobLine.ai provides comprehensive in-app analytics and reporting, there are situations where you need raw data outside the application: creating custom reports for management, sharing production metrics with customers, feeding data into external business intelligence tools, archiving records for compliance, or integrating with systems that do not have a direct connector." },
      { heading: "Work Order Export", body: "From the Queue page, apply any filters you want (status, priority, date range, work center) and then click the export/download button. The system generates an Excel (.xlsx) file containing all work orders matching your current filters. Columns include: WO Number, Part Number, Customer, Status, Priority, Due Date, Assigned Station, Quantity Required, Good Count, Scrap Count, Rework Count, Created Date, and Last Updated Date. The export respects your current sort order." },
      { heading: "Handoff Export", body: "From a station's detail view, navigate to the handoff history section. Select a date range and click the export button. The resulting spreadsheet includes: handoff timestamp, outgoing operator name, incoming operator name, machine condition, work order number, parts counts at time of handoff, and the full text of operator notes. This export is valuable for quality audits and shift performance reviews." },
      { heading: "Analytics Export", body: "On any analytics chart or dashboard widget, look for the download icon (typically an arrow pointing down). Clicking it exports the underlying data as a CSV file. The CSV contains the raw data points that the chart visualizes — timestamps, values, and category labels. This data can be imported into Excel, Google Sheets, or any data analysis tool for custom charting and deeper analysis." },
      { heading: "Activity Log Export", body: "Admins can export the activity log from the Admin panel. Filter the log to the desired date range and event types, then click Export. The resulting CSV includes all matching log entries with timestamps, user IDs, user names, action descriptions, and metadata. This export is commonly used for compliance audits, incident investigations, and quarterly access reviews." },
      { heading: "Data Formats", body: "Work order and handoff exports are in Excel (.xlsx) format for easy viewing and manipulation. Analytics and log exports are in CSV format, which is universally compatible with spreadsheet and database tools. All exports use UTF-8 encoding to properly handle special characters in notes and descriptions." },
    ],
  },
  {
    category: "faq", categoryLabel: "FAQ",
    slug: "keyboard-shortcuts", title: "Keyboard Shortcuts",
    description: "Productivity keyboard shortcuts for navigating and interacting with JobLine.ai efficiently.",
    tags: ["faq", "keyboard", "shortcuts", "productivity"],
    relatedSlugs: ["getting-started/navigating-the-dashboard", "work-orders/queue-views"],
    sections: [
      { heading: "General Navigation", body: "Escape: Close any open dialog, modal, or dropdown. This is the most useful shortcut — it works everywhere in the application and saves you from reaching for the X button with your mouse. Ctrl/Cmd+K: Open the command palette (if available in your version) for quick navigation to any page by typing its name." },
      { heading: "Queue Shortcuts", body: "When the queue list is focused: Up/Down Arrow Keys navigate between rows, highlighting each work order in sequence. Press Enter to open the detail view for the highlighted work order. Press Escape to close the detail view and return to the list. These shortcuts let you review work orders rapidly without switching between mouse and keyboard." },
      { heading: "Form Shortcuts", body: "In any form (handoff creation, NCR filing, work order creation): Tab moves focus to the next field, Shift+Tab moves to the previous field. Ctrl/Cmd+Enter submits the form (equivalent to clicking the Submit or Save button). These are standard browser shortcuts that work consistently throughout JobLine.ai." },
      { heading: "Search Shortcuts", body: "On pages with a search bar (Queue, User Management, Part Catalog): Ctrl/Cmd+F or clicking the search icon focuses the search input. Start typing immediately to filter results. Press Escape to clear the search and restore the full list." },
      { heading: "Browser Shortcuts That Help", body: "These are not JobLine.ai-specific, but they are useful: Ctrl/Cmd+R refreshes the page (equivalent to manual refresh). Ctrl/Cmd+Shift+R performs a hard refresh, clearing cached assets. Ctrl/Cmd+T opens a new browser tab (useful for viewing two JobLine.ai pages simultaneously). F11 toggles full-screen mode (useful on shop-floor monitors with limited screen space)." },
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // ── OPERATOR TOOLS ─────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════
  {
    category: "tools", categoryLabel: "Operator Tools",
    slug: "tools-overview", title: "Operator Tools Overview",
    description: "Introduction to the built-in calculators and reference utilities available in JobLine.ai.",
    tags: ["tools", "calculators", "overview", "shop floor", "utilities"],
    relatedSlugs: ["tools/speed-feed-calculator", "tools/tolerance-calculator", "tools/unit-converter", "tools/trig-calculator"],
    sections: [
      { heading: "What Are Operator Tools?", body: "Operator Tools is a library of small, self-contained calculators and reference utilities built directly into JobLine.ai. They are designed for quick, on-the-spot computations that machinists, CNC operators, engineers, and supervisors need every day — no external apps, websites, or spreadsheets required. All calculations run entirely in your browser; no data is sent to the server or stored anywhere." },
      { heading: "Accessing the Tools Hub", body: "Navigate to /tools from the main navigation or sidebar. The hub displays all available tools as a searchable, filterable card grid. Use the category tabs (Machining, Measurement, Conversion, Reference) to narrow the list, or type keywords into the search bar to find a specific tool. Click any card to open the tool in a slide-out panel." },
      { heading: "Free vs. Premium Tools", body: "Some tools — like the Unit Converter and Right Triangle Solver — are available to all users, including those on a free trial. Other tools, such as the Speed & Feed Calculator, Tolerance Calculator, and upcoming advanced utilities (Surface Finish Calculator, Hardness Converter, Material Removal Rate, Cycle Time Estimator), require an active subscription on the Single User plan or above. If a tool requires a subscription you do not have, it will display a 'Coming Soon' badge or prompt you to upgrade." },
      { heading: "Tool Design Philosophy", body: "Every tool follows the same principles: instant results as you type (no 'Calculate' button needed), mobile-friendly layouts that work on shop floor tablets and phones, and formulas displayed in plain text so you can verify the math. Tools use standard manufacturing conventions for units and precision." },
      { heading: "Requesting New Tools", body: "If there is a calculator or reference chart you need that is not yet available, use the in-app issue reporter or contact your Org Admin. We prioritize tools based on user demand and manufacturing relevance. Upcoming tools include Tap Drill Chart, Thread Pitch Calculator, Bolt Circle Calculator, Coolant Ratio Calculator, and more." },
    ],
  },
  {
    category: "tools", categoryLabel: "Operator Tools",
    slug: "speed-feed-calculator", title: "Speed & Feed Calculator",
    description: "How to use the SFM calculator for spindle RPM, feed rate, and chip load calculations.",
    tags: ["sfm", "rpm", "feed rate", "chip load", "cnc", "milling", "machining", "calculator"],
    relatedSlugs: ["tools/tools-overview", "tools/unit-converter"],
    sections: [
      { heading: "What It Calculates", body: "The Speed & Feed Calculator computes three key machining parameters from your inputs: Spindle RPM (from Surface Feet per Minute and cutter diameter), Feed Rate in inches per minute (from RPM, feed per tooth, and number of flutes), and Chip Load (the actual material removed per tooth per revolution). These are fundamental to setting up any milling or turning operation correctly." },
      { heading: "Input Fields", body: "Material Preset: Select a common material (Aluminum, Mild Steel, Stainless Steel, Titanium, Cast Iron, Brass) to auto-fill a recommended SFM value. You can always override the SFM manually. SFM (Surface Feet/Min): The recommended cutting speed for your material and tool combination. Cutter Diameter (in): The diameter of your end mill, face mill, or drill. Number of Flutes: The flute count of your cutting tool (commonly 2, 3, 4, or 6). Feed per Tooth (in): The chip load target per flute — typically 0.001–0.010 for most operations." },
      { heading: "Formulas Used", body: "RPM = (SFM × 12) / (π × Diameter). Feed Rate (IPM) = RPM × Feed per Tooth × Number of Flutes. Chip Load = Feed Rate / (RPM × Flutes). These are standard imperial formulas. For metric operations, convert your inputs using the Unit Converter tool first, or use the relationship: Vc (m/min) ≈ SFM × 0.3048." },
      { heading: "Interpreting Results", body: "The three result cards update in real time as you adjust inputs. If Spindle RPM exceeds your machine's maximum, reduce SFM or increase cutter diameter. If Feed Rate seems too aggressive, reduce Feed per Tooth. The Chip Load readout helps you verify that each flute is taking an appropriate cut — too thin causes rubbing and heat buildup; too thick risks tool breakage." },
      { heading: "Subscription Required", body: "The Speed & Feed Calculator is available on all paid plans (Single User, Team, and Enterprise). Free trial users can access it during their 14-day trial period. After the trial expires, an active subscription is required to continue using this tool." },
    ],
  },
  {
    category: "tools", categoryLabel: "Operator Tools",
    slug: "tolerance-calculator", title: "Tolerance Calculator",
    description: "Using the tolerance stackup tool for dimensional analysis and pass/fail inspection.",
    tags: ["tolerance", "stackup", "bilateral", "dimension", "inspection", "quality", "calculator"],
    relatedSlugs: ["tools/tools-overview", "quality/ncr-overview"],
    sections: [
      { heading: "Purpose", body: "The Tolerance Calculator helps you determine minimum and maximum allowable dimensions from a nominal value and tolerance specification. It supports both bilateral (±) and unilateral tolerances, multi-feature stackup analysis, and pass/fail inspection with color-coded feedback. This is essential for first-article inspection, in-process checks, and communicating dimensional requirements." },
      { heading: "Bilateral vs. Unilateral Mode", body: "Toggle the switch at the top to choose between Bilateral (symmetric ± tolerance, e.g., 1.000 ± 0.005) and Unilateral mode (separate upper and lower tolerance values, e.g., 1.000 +0.005 / -0.002). In bilateral mode, entering 0.005 as the tolerance automatically applies +0.005 and -0.005. In unilateral mode, you specify each bound independently." },
      { heading: "Adding Features for Stackup", body: "Click 'Add Feature' to add additional dimension rows. Each row represents one feature in a tolerance stackup. The calculator sums all individual tolerance ranges to compute the Total Tolerance Stackup at the bottom — this is the worst-case accumulation across all features. Name each feature (e.g., 'Bore Diameter', 'Shoulder Length') for clarity." },
      { heading: "Pass/Fail Inspection", body: "Enter a measured value in the 'Measured' field for any feature. The calculator compares it against the computed min/max bounds and displays a color-coded badge: green ✓ PASS (within spec with margin), amber ⚠ NEAR LIMIT (within spec but less than 10% of the range from a limit), or red ✕ FAIL (outside spec). The measured input border also changes color to match." },
      { heading: "Subscription Required", body: "The Tolerance Calculator requires an active subscription (Single User, Team, or Enterprise). It is available during the 14-day free trial." },
    ],
  },
  {
    category: "tools", categoryLabel: "Operator Tools",
    slug: "unit-converter", title: "Unit Converter",
    description: "Converting between imperial and metric units for length, weight, pressure, temperature, torque, and speed.",
    tags: ["unit", "converter", "imperial", "metric", "length", "weight", "pressure", "temperature", "torque", "speed"],
    relatedSlugs: ["tools/tools-overview", "tools/speed-feed-calculator"],
    sections: [
      { heading: "Overview", body: "The Unit Converter supports six categories of conversions commonly needed in manufacturing: Length (in, mm, cm, m, ft), Weight (lb, kg, oz, g), Pressure (PSI, bar, MPa, kPa), Temperature (°F, °C, K), Torque (ft-lb, N·m, in-lb), and Speed (SFM, m/min, ft/s, m/s). Select a category, choose your 'from' and 'to' units, and type a value — the result updates instantly." },
      { heading: "Swap Button", body: "Click the swap arrow between the 'from' and 'to' fields to reverse the conversion direction. The current result becomes the new input value, so you can quickly toggle back and forth without retyping." },
      { heading: "Precision", body: "Results are displayed to 8 significant figures with trailing zeros removed. This provides sufficient precision for most machining tolerances (which typically require 4–6 decimal places in inches or 2–3 in millimeters)." },
      { heading: "Free Access", body: "The Unit Converter is available to all users, including those without an active subscription. No upgrade is required to use this tool." },
    ],
  },
  {
    category: "tools", categoryLabel: "Operator Tools",
    slug: "trig-calculator", title: "Right Triangle Solver",
    description: "Solving right triangles for fixture layout, angle setting, and bolt hole patterns.",
    tags: ["trig", "triangle", "angle", "sine", "cosine", "hypotenuse", "geometry", "calculator"],
    relatedSlugs: ["tools/tools-overview", "tools/unit-converter"],
    sections: [
      { heading: "What It Solves", body: "The Right Triangle Solver computes all sides and angles of a right triangle from any two known values. Enter any combination of Side A (opposite), Side B (adjacent), Hypotenuse (C), or Angle α (in degrees) — the calculator fills in all remaining values plus the triangle's area. This is indispensable for fixture layout, angle block calculations, bolt hole patterns, and verifying setups on sine bars." },
      { heading: "Live SVG Diagram", body: "As you enter values, a proportionally-accurate SVG triangle diagram updates in real time. The diagram labels sides A, B, and C, shows the right-angle marker, and scales to fit the available space. This visual feedback helps confirm you have the correct triangle orientation before committing to a setup." },
      { heading: "Formulas Used", body: "The solver uses standard trigonometric identities: Pythagorean theorem (a² + b² = c²), sine (sin α = a/c), cosine (cos α = b/c), tangent (tan α = a/b), and their inverses (asin, acos, atan2). All calculations use JavaScript's native Math functions for accuracy. Angles are displayed in degrees; internal math uses radians." },
      { heading: "Common Use Cases", body: "Setting a sine bar angle: Enter the desired angle and the sine bar length (Side B) to find the gage block stack height (Side A). Bolt circle layout: Enter the radius and angle between holes to find X-Y coordinates. Fixture offsets: Enter two measured dimensions to find the angular error." },
      { heading: "Free Access", body: "The Right Triangle Solver is available to all users, including those without an active subscription." },
    ],
  },
  {
    category: "tools", categoryLabel: "Operator Tools",
    slug: "upcoming-tools", title: "Upcoming Tools & Roadmap",
    description: "Tools currently in development and how to request new manufacturing utilities.",
    tags: ["upcoming", "roadmap", "coming soon", "feature request", "tools"],
    relatedSlugs: ["tools/tools-overview"],
    sections: [
      { heading: "Coming Soon", body: "The following tools are actively in development: Tap Drill Chart (recommended drill sizes for UNC, UNF, and metric threads), Thread Pitch Calculator (TPI-to-pitch conversion and standard thread specs), Surface Finish Calculator (theoretical Ra from feed and nose radius), Material Removal Rate Calculator (MRR for milling and turning), Cycle Time Estimator (total cycle time from cutting parameters), and Hardness Converter (HRC, HRB, Brinell, Vickers scales). These will appear in the Tools hub as they are released." },
      { heading: "Subscription Tiers for New Tools", body: "Basic reference tools (Tap Drill Chart, Thread Pitch Calculator) will be available on all paid plans. Advanced calculators (Surface Finish, MRR, Cycle Time) will require the Team plan or above. The Hardness Converter will be available on all plans. Exact tier requirements will be displayed on each tool card when released." },
      { heading: "Requesting a Tool", body: "To request a new calculator or reference utility, use the in-app issue reporter (click the bug icon in the bottom-right corner) and select 'Feature Request' as the category. Describe the calculation or reference data you need, including any formulas, standards (e.g., ASTM, ISO), or data tables involved. We prioritize requests based on user demand and manufacturing relevance." },
      { heading: "Building Custom Tools", body: "Each tool is a self-contained React component with no backend dependencies. If your organization has developers who want to contribute custom tools, they can follow the component contract defined in the tools architecture: accept no props, use semantic design tokens, perform all math inline with native JavaScript, and register in the tool registry. Contact your account representative for the developer guide." },
    ],
  },
  {
    category: "faq", categoryLabel: "FAQ",
    slug: "account-security", title: "Account Security Best Practices",
    description: "Tips for keeping your JobLine.ai account and production data secure.",
    tags: ["faq", "security", "password", "safety", "best practices"],
    relatedSlugs: ["settings/profile-settings", "admin/activity-logs"],
    sections: [
      { heading: "Strong Passwords", body: "Use a unique password for your JobLine.ai account — do not reuse passwords from other services (email, banking, social media). A strong password is at least 12 characters and includes a mix of uppercase, lowercase, numbers, and symbols. Consider using a password manager to generate and store complex passwords securely." },
      { heading: "Sign Out When Finished", body: "On shared computers (shop floor terminals, inspection stations, break room PCs), always sign out when you are done. Leaving your session active allows the next person to access your account, potentially viewing or changing data under your identity. Use the sign-out option in the user menu." },
      { heading: "Recognize Suspicious Activity", body: "If you notice actions in the activity log that you did not perform, or if you receive notification emails for actions you did not take, your account may be compromised. Immediately change your password and notify your Org Admin. They can review the activity log for unauthorized access and take appropriate action." },
      { heading: "Shared Devices", body: "If multiple operators share a single computer or tablet, each person should sign in with their own account at the start of their shift and sign out at the end. Do not use a shared \"station account\" — individual accounts ensure accurate attribution of handoffs, parts counts, and activity logs. Browser \"incognito mode\" or \"private window\" can help prevent sessions from persisting across users." },
      { heading: "Report Security Concerns", body: "If you believe there is a security vulnerability, unauthorized access, or data exposure, report it immediately to your Org Admin and through the in-app issue reporter. Include as much detail as possible: what you observed, when, and any screenshots or error messages. Security issues are treated with the highest priority." },
    ],
  },
];

export function getArticlesByCategory(category: string): HelpArticle[] {
  return helpArticles.filter((a) => a.category === category);
}

export function getArticle(category: string, slug: string): HelpArticle | undefined {
  return helpArticles.find((a) => a.category === category && a.slug === slug);
}

export function searchArticles(query: string): HelpArticle[] {
  const q = query.toLowerCase();
  return helpArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
  );
}

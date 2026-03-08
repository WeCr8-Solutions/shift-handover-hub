import {
  Rocket, LayoutDashboard, ClipboardList, ArrowRightLeft,
  Users, Radio, ShieldCheck, Settings, Lock, HelpCircle,
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
  { key: "getting-started", label: "Getting Started", description: "Account creation, onboarding, and first steps", icon: Rocket },
  { key: "dashboard", label: "Dashboard", description: "Views, widgets, real-time refresh, and analytics", icon: LayoutDashboard },
  { key: "work-orders", label: "Work Orders", description: "Creating, routing, queue views, and tracking", icon: ClipboardList },
  { key: "shift-handoffs", label: "Shift Handoffs", description: "Handoff creation, reviews, and shift stats", icon: ArrowRightLeft },
  { key: "teams-orgs", label: "Teams & Organizations", description: "Org setup, teams, invites, and roles", icon: Users },
  { key: "stations", label: "Stations & Work Centers", description: "Work centers, check-in, and machine profiles", icon: Radio },
  { key: "quality", label: "Quality Management", description: "NCRs, inspections, and quantity tracking", icon: ShieldCheck },
  { key: "settings", label: "Settings", description: "Profile, notifications, billing, and ERP", icon: Settings },
  { key: "admin", label: "Admin Guide", description: "User management, oversight, and analytics", icon: Lock },
  { key: "faq", label: "FAQ", description: "Common questions and troubleshooting", icon: HelpCircle },
];

export const helpArticles: HelpArticle[] = [
  // ── Getting Started ──
  {
    category: "getting-started", categoryLabel: "Getting Started",
    slug: "creating-an-account", title: "Creating an Account",
    description: "How to sign up for JobLine.ai and verify your email.",
    tags: ["signup", "account", "email"],
    sections: [
      { heading: "Sign Up", body: "Navigate to the authentication page by clicking \"Start Free Trial\" from the landing page. Enter your work email address and choose a strong password (minimum 8 characters). You will receive a verification email — click the link inside to activate your account." },
      { heading: "Email Verification", body: "Check your inbox (and spam/junk folder) for a message from JobLine.ai. The verification link is valid for 24 hours. If it expires, return to the sign-in page and request a new link." },
      { heading: "First Sign-In", body: "After verification, sign in with your email and password. You will be directed to the onboarding flow where you can create or join an organization." },
    ],
  },
  {
    category: "getting-started", categoryLabel: "Getting Started",
    slug: "joining-an-organization", title: "Joining an Organization",
    description: "How to join an existing organization using an invite code or QR code.",
    tags: ["invite", "organization", "join", "QR"],
    sections: [
      { heading: "Invite Code", body: "Your supervisor or org admin will provide a 6-character invite code. After signing in, navigate to the organization join screen and enter the code. Once accepted, you will appear in the org's member list with the role assigned by the inviter." },
      { heading: "QR Code Invite", body: "Admins can generate a QR code that encodes the invite link. Open your phone camera or a QR reader and scan it — you will be taken directly to the sign-up or join page with the invite pre-filled." },
      { heading: "Pending Approval", body: "Some organizations require admin approval before new members gain access. If your org uses this setting, you will see a \"pending\" status after joining. Your admin will approve you from the member management screen." },
    ],
  },
  {
    category: "getting-started", categoryLabel: "Getting Started",
    slug: "navigating-the-dashboard", title: "Navigating the Dashboard",
    description: "Overview of the main dashboard layout and navigation.",
    tags: ["dashboard", "navigation", "layout"],
    sections: [
      { heading: "Layout Overview", body: "The dashboard is split into a top header bar (with team selector, notifications, and user menu) and a main content area that changes based on your role. Operators see their station panel and active work orders. Supervisors see a broader production overview with station cards and shift stats." },
      { heading: "Team Selector", body: "If you belong to multiple teams, use the team dropdown in the header to switch context. All data — stations, handoffs, and work orders — filters to the selected team automatically." },
      { heading: "Quick Actions", body: "Common actions like creating a handoff, filing an NCR, or checking into a station are accessible from buttons on the dashboard cards. These save you from navigating to separate pages for frequent tasks." },
    ],
  },
  {
    category: "getting-started", categoryLabel: "Getting Started",
    slug: "understanding-roles", title: "Understanding Roles",
    description: "Explanation of the role hierarchy and what each role can do.",
    tags: ["roles", "permissions", "access"],
    sections: [
      { heading: "Role Hierarchy", body: "JobLine.ai uses a hierarchical role system: Platform Admin → Org Owner/Admin → Supervisor → Operator → Viewer. Each level inherits the permissions of the levels below it, plus additional capabilities." },
      { heading: "Operator", body: "Operators are the primary production-floor users. They can check into stations, view and update work orders assigned to their station, create shift handoffs, and file NCRs. They cannot manage other users or change org settings." },
      { heading: "Supervisor", body: "Supervisors see all stations and operators within their team. They can reassign work orders, approve NCRs, review handoffs, and view production analytics. They can also invite new team members." },
      { heading: "Org Owner / Admin", body: "Org Admins have full control over the organization: managing teams, stations, billing, settings, and all user roles within their org. They can also configure ERP connections and shift schedules." },
      { heading: "Viewer", body: "Viewers have read-only access to dashboards and reports. They cannot create, edit, or delete any records. This role is suitable for stakeholders who need visibility without interaction." },
    ],
  },
  {
    category: "getting-started", categoryLabel: "Getting Started",
    slug: "mobile-access", title: "Mobile Access Tips",
    description: "Best practices for using JobLine.ai on mobile devices.",
    tags: ["mobile", "responsive", "PWA"],
    sections: [
      { heading: "Responsive Design", body: "JobLine.ai is built with a responsive layout that adapts to phone and tablet screens. The sidebar navigation collapses into a slide-out drawer, and cards stack vertically for easy scrolling." },
      { heading: "Add to Home Screen", body: "For a native-app experience, open JobLine.ai in your mobile browser, tap the share/menu icon, and select \"Add to Home Screen.\" This creates a shortcut that opens the app in full-screen mode without browser chrome." },
      { heading: "Offline Considerations", body: "JobLine.ai requires an internet connection for data sync. If you lose connectivity, any unsaved changes may not persist. Work in areas with reliable Wi-Fi or cellular coverage for the best experience." },
    ],
  },

  // ── Dashboard ──
  {
    category: "dashboard", categoryLabel: "Dashboard",
    slug: "operator-dashboard", title: "Operator Dashboard",
    description: "What operators see on their main dashboard.",
    tags: ["operator", "dashboard", "station"],
    sections: [
      { heading: "Station Panel", body: "The operator dashboard centers on your currently checked-in station. It displays the active work order (part number, quantity required vs. completed), machine condition status, and any pending handoff notes from the previous shift." },
      { heading: "Work Order Queue", body: "Below the station panel, you see a prioritized list of upcoming work orders routed to your station. Each card shows the work order number, due date, and current status. Tap a card to view full details or update progress." },
      { heading: "Quick Actions", body: "Buttons for \"Create Handoff,\" \"File NCR,\" and \"Request Delivery\" are pinned to the top of the dashboard for one-tap access to common tasks." },
    ],
  },
  {
    category: "dashboard", categoryLabel: "Dashboard",
    slug: "supervisor-dashboard", title: "Supervisor Dashboard",
    description: "The supervisor's production overview and team monitoring.",
    tags: ["supervisor", "dashboard", "overview"],
    sections: [
      { heading: "Station Overview", body: "Supervisors see a grid of all stations in their team, color-coded by status: green (running), yellow (idle), red (down). Each card shows the current operator, active job, and parts progress." },
      { heading: "Shift Stats", body: "A summary bar at the top displays shift-level metrics: total parts produced, active handoffs, open NCRs, and downtime events. These update in near real-time via background refresh." },
      { heading: "Production Analytics", body: "Charts and graphs show trends over the current shift or selected date range, including throughput, utilization rate, and top bottleneck stations. Use these to identify problems before they escalate." },
    ],
  },
  {
    category: "dashboard", categoryLabel: "Dashboard",
    slug: "background-refresh", title: "Background Refresh & Real-Time Updates",
    description: "How JobLine.ai keeps your dashboard data current.",
    tags: ["refresh", "realtime", "polling"],
    sections: [
      { heading: "Auto-Refresh", body: "The dashboard polls for new data at a configurable interval (default: 30 seconds). You can adjust this in Settings → General. A subtle indicator in the header shows when the last refresh occurred." },
      { heading: "Real-Time Events", body: "Certain high-priority changes — such as a new handoff being filed or a station going down — are pushed to your browser instantly via real-time subscriptions. You do not need to wait for the next poll cycle." },
      { heading: "Manual Refresh", body: "Click the refresh icon in the header to force an immediate data reload. This is useful if you suspect the display is stale or after making changes in another tab." },
    ],
  },

  // ── Work Orders ──
  {
    category: "work-orders", categoryLabel: "Work Orders",
    slug: "creating-work-orders", title: "Creating Work Orders",
    description: "Step-by-step guide to creating a new work order.",
    tags: ["create", "work order", "queue"],
    sections: [
      { heading: "Open the Dialog", body: "From the Queue page, click the \"+ New Work Order\" button in the top-right corner. This opens the creation dialog with fields for work order number, customer name, part number, quantity, due date, and priority." },
      { heading: "Fill in Details", body: "Work Order Number is required and must be unique within your organization. Part Number links to your part catalog if configured. Set the priority (Low, Medium, High, Rush) to control queue ordering. Due date helps with scheduling visibility." },
      { heading: "Add Routing (Optional)", body: "If your part requires multiple operations, expand the Routing section to define the sequence of work centers the job must pass through. Each routing step specifies the work center, estimated time, and any special instructions." },
      { heading: "Submit", body: "Click \"Create Work Order\" to add it to the queue. The work order starts in \"Queued\" status and will appear in the appropriate station queues based on its routing." },
    ],
  },
  {
    category: "work-orders", categoryLabel: "Work Orders",
    slug: "queue-views", title: "Queue Views (List, Kanban, Calendar)",
    description: "Understanding the different ways to view your work order queue.",
    tags: ["queue", "kanban", "calendar", "list"],
    sections: [
      { heading: "List View", body: "The default view shows work orders in a sortable table with columns for WO number, part, customer, status, priority, due date, and assigned station. Click column headers to sort. Use the filter bar to narrow results by status, priority, or work center." },
      { heading: "Kanban Board", body: "Switch to Kanban view to see work orders organized by status columns: Queued → In Progress → QC Hold → Complete. Drag and drop cards between columns to update status (if your role permits). Each card shows key details at a glance." },
      { heading: "Calendar View", body: "The calendar view plots work orders on a weekly or monthly grid by their due date. Color coding indicates priority. This view is especially useful for supervisors planning workload distribution across shifts." },
    ],
  },
  {
    category: "work-orders", categoryLabel: "Work Orders",
    slug: "work-order-statuses", title: "Work Order Statuses",
    description: "Explanation of each status in the work order lifecycle.",
    tags: ["status", "lifecycle", "workflow"],
    sections: [
      { heading: "Status Flow", body: "Work orders follow a defined lifecycle: Queued → In Progress → QC Hold (optional) → Complete → Shipped. Each transition is logged with a timestamp and the user who made the change." },
      { heading: "Queued", body: "The initial state when a work order is created. It is visible in station queues but no operator has started work on it yet." },
      { heading: "In Progress", body: "An operator has begun working on this order. The station panel shows it as the active job with parts tracking enabled." },
      { heading: "QC Hold", body: "The work order is paused for quality inspection. This may be triggered manually by an operator or automatically when an NCR is filed against the order." },
      { heading: "Complete", body: "All required quantities have been produced and quality checks passed. The order moves out of active queues and into the completed history." },
      { heading: "Shipped", body: "The finished parts have been shipped to the customer. This is typically the final status and is set by a supervisor or admin." },
    ],
  },
  {
    category: "work-orders", categoryLabel: "Work Orders",
    slug: "routing-steps", title: "Routing Steps",
    description: "How to define and manage multi-operation routing for work orders.",
    tags: ["routing", "operations", "work center"],
    sections: [
      { heading: "What Is Routing?", body: "Routing defines the sequence of operations (work centers) a job must pass through to completion. For example, a part might need: Saw → CNC Mill → Deburr → Inspect → Ship. Each step has an operation number, work center assignment, and estimated cycle time." },
      { heading: "Adding Steps", body: "When creating or editing a work order, open the Routing section and click \"Add Step.\" Select the work center from the dropdown, enter the operation description and estimated time. Steps are automatically numbered in sequence." },
      { heading: "Advancing Through Steps", body: "As an operator completes their operation, they mark the routing step as done. The work order then appears in the queue of the next work center in the sequence. Supervisors can see the current step at a glance on the work order card." },
      { heading: "Outside Processing", body: "If a routing step requires sending parts to an outside vendor (e.g., heat treating, plating), mark it as an outside processing step. This pauses the internal routing until the parts return and are received back into the system." },
    ],
  },
  {
    category: "work-orders", categoryLabel: "Work Orders",
    slug: "part-specs", title: "Part Specifications",
    description: "Managing part catalog entries and linking them to work orders.",
    tags: ["parts", "catalog", "specs"],
    sections: [
      { heading: "Part Catalog", body: "The part catalog is a reusable library of part definitions within your organization. Each entry contains a part number, description, material, default routing template, and any special instructions. Navigate to Settings → Part Catalog to manage entries." },
      { heading: "Linking to Work Orders", body: "When creating a work order, selecting a part number from the catalog auto-fills the description, material, and default routing. You can override any field for a specific order without changing the catalog entry." },
      { heading: "Revision Tracking", body: "Part specs can be versioned. When you update a catalog entry, existing work orders retain their original spec version. New orders pick up the latest revision automatically." },
    ],
  },
  {
    category: "work-orders", categoryLabel: "Work Orders",
    slug: "bulk-upload", title: "Bulk Upload Work Orders",
    description: "How to import multiple work orders from a spreadsheet.",
    tags: ["bulk", "upload", "excel", "import"],
    sections: [
      { heading: "Download Template", body: "From the Queue page, click the upload icon and select \"Download Template.\" This gives you an Excel file with the required column headers: Work Order #, Part Number, Customer, Quantity, Due Date, Priority, and optional routing columns." },
      { heading: "Fill the Spreadsheet", body: "Enter your work orders row by row. Each row becomes one work order. Make sure work order numbers are unique and dates are in YYYY-MM-DD format. Save the file as .xlsx." },
      { heading: "Upload and Review", body: "Click \"Upload\" and select your file. JobLine.ai parses the spreadsheet and shows a preview of the work orders to be created, highlighting any validation errors (duplicate WO numbers, missing required fields). Fix any issues and confirm to create all orders at once." },
    ],
  },

  // ── Shift Handoffs ──
  {
    category: "shift-handoffs", categoryLabel: "Shift Handoffs",
    slug: "creating-a-handoff", title: "Creating a Handoff",
    description: "How to document your shift handoff for the next operator.",
    tags: ["handoff", "create", "shift"],
    sections: [
      { heading: "When to Create", body: "Create a handoff at the end of your shift before you leave. This ensures the incoming operator has all the context they need to continue production without delays or mistakes." },
      { heading: "Handoff Form", body: "Click \"Create Handoff\" from your station panel or dashboard. The form captures: current job status, parts completed, machine condition (running/idle/down), any issues encountered, and free-text notes for the next operator." },
      { heading: "Condition Status", body: "Set the machine/station condition: Running (machine is operational), Idle (machine is stopped but functional), or Down (machine has a problem that needs attention). This gives the incoming operator an immediate status snapshot." },
      { heading: "Submit", body: "After filling in all fields, click \"Submit Handoff.\" The record is timestamped and linked to your station. The incoming operator will see it highlighted on their dashboard when they check in." },
    ],
  },
  {
    category: "shift-handoffs", categoryLabel: "Shift Handoffs",
    slug: "reviewing-handoffs", title: "Reviewing Incoming Handoffs",
    description: "How to review handoff notes left by the previous shift.",
    tags: ["handoff", "review", "incoming"],
    sections: [
      { heading: "Check-In Prompt", body: "When you check into a station at the start of your shift, any unread handoff from the previous operator is displayed prominently. Read through the notes, machine condition, and parts progress before starting work." },
      { heading: "Acknowledge", body: "After reading the handoff, mark it as acknowledged. This logs that you received the information and transitions the handoff record to \"reviewed\" status. Supervisors can track acknowledgment rates." },
      { heading: "Historical Handoffs", body: "You can view past handoffs for your station from the station detail view. This is useful for tracking recurring issues or understanding patterns across multiple shifts." },
    ],
  },
  {
    category: "shift-handoffs", categoryLabel: "Shift Handoffs",
    slug: "handoff-best-practices", title: "Handoff Best Practices",
    description: "Tips for writing effective shift handoffs.",
    tags: ["handoff", "tips", "best practices"],
    sections: [
      { heading: "Be Specific", body: "Instead of writing \"machine is acting up,\" describe the symptom: \"X-axis servo alarm triggered twice during roughing pass on WO-1234. Cleared by power cycling. Monitor closely.\" Specific notes save the next operator diagnostic time." },
      { heading: "Include Part Counts", body: "Always update the parts completed count before handing off. The incoming operator needs to know exactly where production stands relative to the order quantity." },
      { heading: "Flag Safety Issues", body: "If there is any safety concern — a coolant leak, a loose guard, an unusual vibration — note it clearly in the handoff and set the condition status to Down or Idle. Do not leave a safety issue for the next person to discover on their own." },
      { heading: "Keep It Concise", body: "Handoff notes should be thorough but not verbose. Focus on what changed during your shift: issues encountered, deviations from the plan, and anything the next operator needs to act on. Routine information (machine is running normally, on schedule) can be brief." },
    ],
  },
  {
    category: "shift-handoffs", categoryLabel: "Shift Handoffs",
    slug: "shift-stats", title: "Shift Stats & Analytics",
    description: "Understanding the shift statistics dashboard.",
    tags: ["shift", "stats", "analytics"],
    sections: [
      { heading: "Shift Summary", body: "The shift stats panel shows aggregate metrics for the current or selected shift: total parts produced across all stations, number of handoffs created, open NCRs, and downtime minutes. These metrics help supervisors assess shift performance at a glance." },
      { heading: "Station Breakdown", body: "Drill into individual station performance within a shift to compare throughput, identify bottleneck stations, and see which operators were checked in during the period." },
      { heading: "Trend Comparison", body: "Compare current shift stats against previous shifts (day-over-day or week-over-week) to spot trends. Declining throughput or increasing downtime can signal emerging problems that need attention." },
    ],
  },

  // ── Teams & Organizations ──
  {
    category: "teams-orgs", categoryLabel: "Teams & Organizations",
    slug: "creating-an-organization", title: "Creating an Organization",
    description: "How to set up your organization in JobLine.ai.",
    tags: ["organization", "setup", "create"],
    sections: [
      { heading: "What Is an Organization?", body: "An organization in JobLine.ai represents your company or facility. All teams, stations, work orders, and users belong to an organization. You need at least one organization to start using the platform." },
      { heading: "Setup Wizard", body: "After signing in for the first time, the onboarding wizard guides you through creating your organization. Enter your company name, select your industry (e.g., CNC Machining, Fabrication), and choose your time zone. These settings can be changed later in Settings." },
      { heading: "Organization ID", body: "Each organization gets a unique identifier used internally for data isolation. All records are scoped to your organization — you will never see another organization's data, and they will never see yours." },
    ],
  },
  {
    category: "teams-orgs", categoryLabel: "Teams & Organizations",
    slug: "inviting-members", title: "Inviting Members",
    description: "How to invite people to your organization using codes or QR.",
    tags: ["invite", "members", "QR", "code"],
    sections: [
      { heading: "Generate Invite Code", body: "From the Teams page or Settings → Organization, click \"Invite Members.\" This generates a unique 6-character alphanumeric code. Share this code with the person you want to invite — they will enter it during sign-up or from their profile page." },
      { heading: "QR Code", body: "Each invite code also generates a scannable QR code. This is especially convenient for onboarding multiple operators on the shop floor. Print it or display it on a screen for people to scan with their phones." },
      { heading: "Role Assignment", body: "When generating an invite, you select the role the new member will receive (Operator, Supervisor, or Viewer). The role is applied automatically when they redeem the code. Org Admins can change roles later from the member management screen." },
      { heading: "Expiration", body: "Invite codes expire after a configurable period (default: 7 days) or after a set number of uses. This prevents stale invites from being redeemed by unauthorized people." },
    ],
  },
  {
    category: "teams-orgs", categoryLabel: "Teams & Organizations",
    slug: "managing-teams", title: "Managing Teams",
    description: "Creating and configuring teams within your organization.",
    tags: ["teams", "manage", "create"],
    sections: [
      { heading: "What Are Teams?", body: "Teams are sub-groups within your organization. They typically map to shifts, departments, or production areas (e.g., \"Day Shift,\" \"CNC Department,\" \"Assembly Line 2\"). Teams have their own stations, work orders, and members." },
      { heading: "Creating a Team", body: "Navigate to the Teams page and click \"Create Team.\" Enter a name and optional description. Assign a team lead (supervisor) who will manage the team's day-to-day operations." },
      { heading: "Adding Members", body: "Add existing org members to a team from the team detail page. A user can belong to multiple teams but can only be actively checked into one station at a time." },
      { heading: "Team Settings", body: "Each team can have its own shift schedule, refresh interval, and notification preferences. These override the org-level defaults for members of that team." },
    ],
  },
  {
    category: "teams-orgs", categoryLabel: "Teams & Organizations",
    slug: "role-permissions", title: "Role Permissions Explained",
    description: "Detailed breakdown of what each role can and cannot do.",
    tags: ["roles", "permissions", "matrix"],
    sections: [
      { heading: "Permission Matrix", body: "Each feature in JobLine.ai has a set of permitted actions (view, create, edit, delete) mapped to roles. For example, Operators can view and create handoffs but cannot delete them. Supervisors can view, create, and edit handoffs. Admins can do all four." },
      { heading: "Data Visibility", body: "Operators see only data related to their assigned station and team. Supervisors see all data within their team. Org Admins see all data across all teams. This scoping is enforced at the database level, not just the UI." },
      { heading: "Escalation", body: "If you need to perform an action that your role does not permit, contact your supervisor or org admin. They can either perform the action on your behalf or temporarily elevate your role if appropriate." },
    ],
  },
  {
    category: "teams-orgs", categoryLabel: "Teams & Organizations",
    slug: "switching-teams", title: "Switching Teams",
    description: "How to switch between teams if you belong to more than one.",
    tags: ["teams", "switch", "selector"],
    sections: [
      { heading: "Team Selector", body: "The team dropdown in the header shows your currently active team. Click it to see all teams you belong to and select a different one. All dashboard data, station lists, and work orders will update to reflect the selected team's context." },
      { heading: "Default Team", body: "Your most recently selected team is remembered between sessions. If you always work with the same team, you will not need to switch every time you sign in." },
      { heading: "Cross-Team Visibility", body: "Supervisors and Admins can view data from other teams without switching by using the team filter on specific pages (e.g., Queue, Analytics). Operators must switch teams to see another team's data, if they are a member of that team." },
    ],
  },

  // ── Stations & Work Centers ──
  {
    category: "stations", categoryLabel: "Stations & Work Centers",
    slug: "setting-up-stations", title: "Setting Up Stations",
    description: "How to create and configure work stations.",
    tags: ["station", "setup", "work center"],
    sections: [
      { heading: "What Is a Station?", body: "A station represents a physical work center on your production floor — a CNC machine, a welding booth, an inspection bench, etc. Stations are where operators check in, work orders are processed, and handoffs are documented." },
      { heading: "Creating a Station", body: "Admins or Supervisors can create stations from the Teams page or Settings → Stations. Enter the station name, select its work center type (Mill, Lathe, Grinder, Assembly, Inspection, etc.), and assign it to a team." },
      { heading: "Station Configuration", body: "Each station can have: a display name, work center type (used for routing), capacity (how many jobs it can run simultaneously — default is 1), and an optional machine profile linking to equipment details." },
    ],
  },
  {
    category: "stations", categoryLabel: "Stations & Work Centers",
    slug: "operator-check-in", title: "Operator Check-In",
    description: "How operators check into a station to start their shift.",
    tags: ["check-in", "station", "operator"],
    sections: [
      { heading: "Why Check In?", body: "Checking in tells the system which operator is at which station. This enables accurate handoff tracking, parts count attribution, and supervisor visibility into who is where on the floor." },
      { heading: "How to Check In", body: "From the dashboard, click \"Check In\" on the station card, or navigate to the station detail page and click the check-in button. You can only be checked into one station at a time — checking into a new station automatically checks you out of the previous one." },
      { heading: "Check-Out", body: "Check out when you leave your station (shift end, break, reassignment). This is typically done automatically when you submit a handoff, but you can also manually check out from the station panel." },
    ],
  },
  {
    category: "stations", categoryLabel: "Stations & Work Centers",
    slug: "machine-profiles", title: "Machine Profiles",
    description: "Linking machine details and equipment to stations.",
    tags: ["machine", "equipment", "profile"],
    sections: [
      { heading: "Equipment Records", body: "Each station can be linked to an equipment record that stores machine-specific details: manufacturer, model, serial number, asset tag, purchase date, and maintenance schedule." },
      { heading: "Machine Profile Marketplace", body: "JobLine.ai provides a library of common CNC machine profiles (Haas, Mazak, DMG Mori, etc.) that you can attach to your stations. These profiles pre-fill manufacturer data and provide relevant default settings." },
      { heading: "Custom Profiles", body: "If your machine is not in the marketplace, you can create a custom profile by entering the details manually. This is useful for custom-built equipment or less common brands." },
    ],
  },
  {
    category: "stations", categoryLabel: "Stations & Work Centers",
    slug: "work-center-filtering", title: "Work Center Filtering",
    description: "How to filter views by work center type.",
    tags: ["filter", "work center", "type"],
    sections: [
      { heading: "Work Center Types", body: "Work center types categorize your stations: Mill, Lathe, Grinder, Saw, EDM, Assembly, Inspection, Shipping, and more. These types are used for routing (directing work orders to the correct station type) and for filtering dashboard and queue views." },
      { heading: "Filter Controls", body: "On the Queue and Dashboard pages, use the work center filter dropdown to show only stations or work orders related to a specific type. For example, filter to \"Mill\" to see only milling stations and their queued jobs." },
      { heading: "Custom Types", body: "Admins can add custom work center types in Settings → Work Centers if the defaults do not cover your operations (e.g., \"Laser,\" \"Paint,\" \"Heat Treat\")." },
    ],
  },

  // ── Quality Management ──
  {
    category: "quality", categoryLabel: "Quality Management",
    slug: "filing-an-ncr", title: "Filing an NCR",
    description: "How to create a Non-Conformance Report.",
    tags: ["NCR", "quality", "non-conformance"],
    sections: [
      { heading: "What Is an NCR?", body: "A Non-Conformance Report (NCR) documents a quality issue — a part that does not meet specifications, a process deviation, or a material defect. NCRs trigger a review workflow and ensure issues are tracked to resolution." },
      { heading: "Creating an NCR", body: "Click \"File NCR\" from the station panel or work order detail. Fill in the affected work order, description of the non-conformance, quantity affected (good parts, scrap, rework), and severity level. Attach photos if possible." },
      { heading: "Submission", body: "Once submitted, the NCR enters \"Open\" status and appears in the supervisor's review queue. The associated work order is optionally placed in QC Hold to prevent further processing until the NCR is reviewed." },
    ],
  },
  {
    category: "quality", categoryLabel: "Quality Management",
    slug: "ncr-approval-workflow", title: "NCR Approval Workflow",
    description: "How NCRs are reviewed, dispositioned, and closed.",
    tags: ["NCR", "approval", "workflow", "disposition"],
    sections: [
      { heading: "Review", body: "Supervisors or quality leads review open NCRs from the NCR list or the quality metrics dashboard. They assess the non-conformance, verify the affected quantities, and determine the disposition." },
      { heading: "Disposition Options", body: "The reviewer selects a disposition: Use As-Is (accept the deviation), Rework (send back for correction), Scrap (reject the parts), or Return to Vendor (if the issue is with incoming material). Each disposition has cost and timeline implications." },
      { heading: "Closure", body: "After disposition is applied and corrective actions are noted, the NCR is closed. The closure is logged with a timestamp and reviewer ID. Closed NCRs remain in the history for audits and trend analysis." },
    ],
  },
  {
    category: "quality", categoryLabel: "Quality Management",
    slug: "quantity-tracking", title: "Quantity Tracking",
    description: "Tracking good parts, scrap, and rework quantities.",
    tags: ["quantity", "parts", "scrap", "rework"],
    sections: [
      { heading: "Quantity Fields", body: "Each work order tracks three quantity categories: Good (parts that meet spec), Scrap (rejected parts), and Rework (parts that can be corrected). Operators update these counts as production proceeds." },
      { heading: "Running Totals", body: "The station panel shows a running total: Good + Scrap + Rework should equal total parts produced. The system flags discrepancies if the numbers do not add up." },
      { heading: "Yield Calculation", body: "Yield is calculated as Good / (Good + Scrap) × 100%. This metric appears on the quality dashboard and is tracked per work order, station, and operator for performance analysis." },
    ],
  },
  {
    category: "quality", categoryLabel: "Quality Management",
    slug: "quality-dashboard", title: "Quality Metrics Dashboard",
    description: "Using the quality dashboard to track trends and performance.",
    tags: ["quality", "dashboard", "metrics", "trends"],
    sections: [
      { heading: "Overview", body: "The quality metrics dashboard aggregates NCR data across your organization or team. It shows: open NCR count, NCRs by severity, top NCR reasons, scrap rate trends, and average time-to-close." },
      { heading: "Pareto Analysis", body: "The dashboard includes a Pareto chart of NCR root causes, helping you identify the vital few issues that account for the majority of quality problems. Focus improvement efforts on the top contributors." },
      { heading: "Time Trends", body: "Track quality metrics over time to see if improvements are taking hold. A declining scrap rate or faster NCR closure time indicates progress in your quality program." },
    ],
  },

  // ── Settings ──
  {
    category: "settings", categoryLabel: "Settings",
    slug: "profile-settings", title: "Profile Settings",
    description: "Managing your personal profile and preferences.",
    tags: ["profile", "settings", "personal"],
    sections: [
      { heading: "Display Name", body: "Set your display name (shown in handoffs, activity logs, and team lists) from the Profile page. This is separate from your email address and can be your full name or a nickname used on the shop floor." },
      { heading: "Password", body: "Change your password from the Profile page. You will need to enter your current password for verification. Choose a strong password with at least 8 characters." },
      { heading: "Avatar", body: "Upload a profile photo that appears next to your name throughout the app. This helps teammates identify you quickly, especially in larger organizations." },
    ],
  },
  {
    category: "settings", categoryLabel: "Settings",
    slug: "notification-preferences", title: "Notification Preferences",
    description: "Configuring how and when you receive notifications.",
    tags: ["notifications", "settings", "email"],
    sections: [
      { heading: "Notification Types", body: "JobLine.ai can notify you about: new handoffs at your station, work orders assigned to you, NCRs filed against your work, and system announcements. Each type can be toggled independently." },
      { heading: "Email Notifications", body: "By default, important events (e.g., NCR filed, shift handoff) trigger email notifications. You can disable email notifications and rely solely on in-app indicators if you prefer." },
      { heading: "Organization Announcements", body: "Admins can post announcements that appear in your notification center. High-priority announcements may also generate email notifications regardless of your personal settings." },
    ],
  },
  {
    category: "settings", categoryLabel: "Settings",
    slug: "billing-subscriptions", title: "Billing & Subscriptions",
    description: "Managing your subscription plan and billing details.",
    tags: ["billing", "subscription", "plan", "pricing"],
    sections: [
      { heading: "Plans", body: "JobLine.ai offers tiered plans: Free (limited users and features), Pro (full feature access for small teams), and Enterprise (custom pricing for large organizations). View current plan details in Settings → Billing." },
      { heading: "Seat Management", body: "Your subscription is based on the number of active seats (users). Adding or removing users adjusts your next billing cycle automatically. You can see seat usage vs. limit on the billing page." },
      { heading: "Payment", body: "Billing is handled through a secure payment portal. Click \"Manage Billing\" to update payment methods, view invoices, or change your plan. All transactions are processed securely." },
    ],
  },
  {
    category: "settings", categoryLabel: "Settings",
    slug: "shift-configuration", title: "Shift Configuration",
    description: "Setting up shift schedules for your organization.",
    tags: ["shift", "schedule", "configuration"],
    sections: [
      { heading: "Shift Definitions", body: "Define your shift schedule in Settings → Shifts. Common configurations include: two 12-hour shifts, three 8-hour shifts, or custom patterns. Each shift has a name, start time, and end time." },
      { heading: "Shift Labels", body: "Assign labels like \"Day,\" \"Swing,\" and \"Night\" to your shifts. These labels appear in handoff records, analytics filters, and scheduling views throughout the app." },
      { heading: "Holidays & Exceptions", body: "Mark dates as holidays or exceptions when normal shift schedules do not apply. This helps analytics accurately calculate productivity metrics and prevents false \"missed handoff\" alerts." },
    ],
  },
  {
    category: "settings", categoryLabel: "Settings",
    slug: "erp-connector", title: "ERP Connector Setup",
    description: "Connecting JobLine.ai to your ERP system.",
    tags: ["ERP", "connector", "integration", "sync"],
    sections: [
      { heading: "Supported ERPs", body: "JobLine.ai currently supports integration with common manufacturing ERPs through a configurable connector. The connector syncs work orders, part data, and status updates bidirectionally." },
      { heading: "Configuration", body: "In Settings → ERP Connector, enter your ERP's API endpoint, authentication credentials, and select which data types to sync. Test the connection before enabling automatic sync." },
      { heading: "Sync Behavior", body: "Syncs can run on a schedule (e.g., every 15 minutes) or be triggered manually. The sync log shows all recent operations, records fetched/created/updated, and any errors that need attention." },
      { heading: "Status Mapping", body: "Map your ERP's work order statuses to JobLine.ai statuses. For example, your ERP's \"Released\" status might map to JobLine's \"Queued\" status. This ensures status changes flow correctly between systems." },
    ],
  },

  // ── Admin Guide ──
  {
    category: "admin", categoryLabel: "Admin Guide",
    slug: "user-management", title: "User Management",
    description: "Managing users, roles, and access within your organization.",
    tags: ["admin", "users", "roles", "management"],
    sections: [
      { heading: "User List", body: "The Admin panel shows all users in your organization with their email, display name, role, team memberships, and last active timestamp. Use the search bar to find specific users." },
      { heading: "Role Changes", body: "Click on a user to view their details and change their role. Role changes take effect immediately — the user's permissions update on their next page load or API call." },
      { heading: "Deactivation", body: "Deactivating a user revokes their access without deleting their data. Their handoff history, work order updates, and activity logs remain intact for audit purposes. Deactivated users do not count toward your seat limit." },
    ],
  },
  {
    category: "admin", categoryLabel: "Admin Guide",
    slug: "organization-oversight", title: "Organization Oversight",
    description: "Monitoring your entire organization from the admin panel.",
    tags: ["admin", "oversight", "monitoring"],
    sections: [
      { heading: "Org Dashboard", body: "The admin oversight panel provides a high-level view of your entire organization: total active users, teams, stations, open work orders, and recent activity. Use this as a daily health check." },
      { heading: "Cross-Team View", body: "Unlike operators and supervisors who see team-scoped data, admins see data across all teams. This is essential for identifying resource imbalances, comparing team performance, and making staffing decisions." },
      { heading: "Audit Trail", body: "Every significant action in JobLine.ai is logged in the activity log: user sign-ins, role changes, work order updates, handoff submissions, and settings modifications. Admins can filter and export this log for compliance or investigation purposes." },
    ],
  },
  {
    category: "admin", categoryLabel: "Admin Guide",
    slug: "activity-logs", title: "Activity Logs",
    description: "Understanding and using the activity log system.",
    tags: ["admin", "activity", "logs", "audit"],
    sections: [
      { heading: "What Is Logged", body: "The activity log captures: authentication events (sign-in, sign-out), data modifications (create, update, delete on work orders, handoffs, NCRs), role and permission changes, settings updates, and administrative actions." },
      { heading: "Filtering", body: "Filter logs by user, activity type, date range, or team. This helps you quickly find specific events — for example, all work order status changes made by a particular user last week." },
      { heading: "Data Access Logs", body: "For organizations with compliance requirements, a separate data access log tracks which users accessed which records. This provides a detailed audit trail for sensitive data." },
    ],
  },
  {
    category: "admin", categoryLabel: "Admin Guide",
    slug: "system-updates", title: "System Updates & Changelog",
    description: "Staying informed about new features and changes.",
    tags: ["admin", "updates", "changelog"],
    sections: [
      { heading: "Updates Page", body: "Visit the Updates page to see the latest changes to JobLine.ai: new features, improvements, and bug fixes. Each update entry includes a description, category (feature, fix, improvement), and date." },
      { heading: "Acknowledgment", body: "Important updates may require acknowledgment — a modal prompts you to read and confirm that you understand the changes. This ensures critical information (like workflow changes or security updates) is communicated to all users." },
      { heading: "Changelog", body: "Admins can create internal changelog entries for org-specific changes (e.g., new stations added, workflow modifications). These appear alongside system updates for your organization's users." },
    ],
  },

  // ── FAQ ──
  {
    category: "faq", categoryLabel: "FAQ",
    slug: "common-errors", title: "Common Errors & Troubleshooting",
    description: "Solutions to frequently encountered issues.",
    tags: ["faq", "errors", "troubleshooting"],
    sections: [
      { heading: "\"You do not have permission\"", body: "This error means your role does not permit the action you attempted. Contact your supervisor or org admin to verify your role assignment. If you believe your role is correct, try signing out and back in to refresh your session." },
      { heading: "\"Session expired\"", body: "For security, sessions expire after a period of inactivity. Sign in again to continue. Your unsaved work may be lost, so save frequently." },
      { heading: "Data Not Showing", body: "If you expect to see data that is not appearing: 1) Check your team selector — you may be viewing a different team. 2) Check filters — active filters may be hiding records. 3) Try a manual refresh. 4) If the problem persists, report it through the issue reporting tool." },
      { heading: "Slow Performance", body: "If the app feels slow: 1) Check your internet connection. 2) Close unused browser tabs. 3) Try a hard refresh (Ctrl+Shift+R / Cmd+Shift+R). 4) If the issue persists across multiple users, it may be a system-level problem — contact your admin." },
    ],
  },
  {
    category: "faq", categoryLabel: "FAQ",
    slug: "data-export", title: "Data Export",
    description: "How to export your data from JobLine.ai.",
    tags: ["faq", "export", "data", "download"],
    sections: [
      { heading: "Work Order Export", body: "From the Queue page, use the export button to download your work orders as an Excel spreadsheet. The export includes all visible columns based on your current filters and sort order." },
      { heading: "Handoff Export", body: "Handoff history can be exported from the station detail view. The export includes timestamps, operator names, condition statuses, and notes for the selected date range." },
      { heading: "Analytics Export", body: "Charts and analytics data can be exported as CSV for further analysis in external tools. Click the download icon on any chart to export its underlying data." },
    ],
  },
  {
    category: "faq", categoryLabel: "FAQ",
    slug: "keyboard-shortcuts", title: "Keyboard Shortcuts",
    description: "Productivity shortcuts for power users.",
    tags: ["faq", "keyboard", "shortcuts"],
    sections: [
      { heading: "Navigation", body: "Use the following shortcuts to navigate quickly: Ctrl/Cmd+K opens the command palette (if available), Ctrl/Cmd+/ focuses the search bar, and Escape closes any open dialog or modal." },
      { heading: "Queue Actions", body: "In the queue list view: Arrow keys navigate between rows, Enter opens the selected work order detail, and Escape returns to the list. These shortcuts help you browse work orders without using the mouse." },
      { heading: "Forms", body: "In any form: Tab moves to the next field, Shift+Tab moves to the previous field, and Ctrl/Cmd+Enter submits the form. These are standard browser shortcuts that work throughout JobLine.ai." },
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

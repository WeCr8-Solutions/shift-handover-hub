import { AlertTriangle, Trophy, Target, Phone, DollarSign, ClipboardList } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const LOCAL_KEY = "erp-guide-read";

export interface GuidePart {
  id: string;
  part: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  sections: { heading: string; body: string }[];
}

export const erpGuideParts: GuidePart[] = [
  {
    id: "prevent-selection-mistakes",
    part: 1,
    title: "Avoid the 5 Costliest ERP Selection Mistakes",
    subtitle: "Learn the pitfalls that derail ERP projects before they start — and how to sidestep each one.",
    icon: AlertTriangle,
    sections: [
      { heading: "Mistake 1: Choosing Based on Brand Name Alone", body: "Enterprise ERP suites designed for Fortune 500 companies are often a poor fit for job shops running 10–50 machines. Evaluate vendors by how well they understand make-to-order, mixed-mode, and high-mix/low-volume production — not by market share. JobLine.ai is purpose-built for discrete manufacturers who route work through multiple stations." },
      { heading: "Mistake 2: Skipping the Shop Floor Discovery", body: "Most ERP failures start in the conference room, not on the floor. Walk every station, interview operators, and map actual material flow before writing an RFP. The routing your ERP models must mirror reality — not an idealized process chart." },
      { heading: "Mistake 3: Underestimating Data Migration Effort", body: "Migrating part masters, BOMs, routing steps, and customer records is the single biggest hidden cost. Plan for data cleansing, field mapping, and validation runs. JobLine's ERP connector supports incremental sync so you can run parallel before cutting over." },
      { heading: "Mistake 4: Ignoring Operator Adoption", body: "A system operators won't use is worse than no system at all. Prioritize mobile-friendly interfaces, minimal click paths, and real-time feedback. JobLine's operator view was designed with machinists — not IT departments." },
      { heading: "Mistake 5: No Post-Go-Live Improvement Plan", body: "ERP value compounds over time — but only if you continuously tune dashboards, routing logic, and reporting. Schedule monthly reviews of cycle-time accuracy, scrap rates, and scheduling adherence for the first year." },
    ],
  },
  {
    id: "champion-new-erp",
    part: 2,
    title: "How to Champion a Manufacturing System Upgrade",
    subtitle: "Build executive buy-in and floor-level enthusiasm for your digital transformation.",
    icon: Trophy,
    sections: [
      { heading: "Quantify the Cost of the Status Quo", body: "Calculate how much tribal knowledge loss, missed due dates, and manual scheduling cost per month. Use real examples: 'We lost $12K last quarter because a setup sheet wasn't passed during shift change.' Hard numbers move budgets." },
      { heading: "Recruit a Cross-Functional Team", body: "Your champion team needs a shop floor lead, a planner, a quality rep, and an executive sponsor. Each person owns a different slice of the evaluation — routing accuracy, scheduling flexibility, inspection workflows, and ROI tracking." },
      { heading: "Start with a Pilot Cell", body: "Don't try to digitize the entire shop on day one. Pick one high-visibility work cell (e.g., your CNC lathe line) and prove the concept there. JobLine.ai supports team-scoped rollouts so you can expand station by station." },
      { heading: "Communicate Wins Early and Often", body: "Share before/after metrics weekly: on-time delivery improvement, reduction in handoff errors, time saved on status meetings. Visible progress builds momentum faster than any project plan." },
    ],
  },
  {
    id: "determine-functionality-needs",
    part: 3,
    title: "How to Determine Your System Functionality Needs",
    subtitle: "Map your shop's real workflows to the features that actually matter.",
    icon: Target,
    sections: [
      { heading: "Start with Your Pain Points, Not a Feature List", body: "Rank your top 5 daily frustrations: late jobs, missing setups, quality escapes, scheduling conflicts, tribal knowledge gaps. Each pain point maps to a required capability — routing visibility, structured handoffs, inspection gates, capacity planning, or knowledge capture." },
      { heading: "Must-Have vs. Nice-to-Have Matrix", body: "Create a two-column matrix. Must-haves are blockers — if the system can't do it, walk away. Nice-to-haves add value but aren't deal-breakers. For most job shops: work order routing, shift handoffs, and quality checkpoints are must-haves. Advanced AI scheduling is a powerful nice-to-have." },
      { heading: "Integration Requirements", body: "Document every system that touches production data: your ERP/MRP, CAD/CAM, quality (CMM software), accounting, and shipping. JobLine.ai provides a configurable REST-based ERP connector with field mapping, status mapping, and automated sync — no middleware required." },
      { heading: "Scalability Checkpoints", body: "Ask: 'Will this system work when we add a second shift? A third building? 50 more part numbers?' Cloud-native platforms like JobLine.ai scale with your organization, not against it." },
    ],
  },
  {
    id: "discovery-call-success",
    part: 4,
    title: "How to Run a Successful Vendor Discovery Call",
    subtitle: "Ask the right questions so you evaluate vendors on substance, not slide decks.",
    icon: Phone,
    sections: [
      { heading: "Prepare Your Routing Scenario", body: "Bring a real work order with 4–6 routing steps across different work centers. Ask the vendor to walk through how their system would track that job from release to ship. If they can't demo your actual workflow, they don't understand your business." },
      { heading: "Ask About Operator Experience", body: "Request a live demo of what your CNC operator sees at 6 AM on a Monday. How many clicks to see their queue? Can they log a quality issue from their phone? Is the interface designed for gloved hands and shop lighting?" },
      { heading: "Probe Data Ownership and Portability", body: "Can you export all your data at any time? What format? How are backups handled? Avoid vendors that lock your production history behind proprietary formats." },
      { heading: "Evaluate Support and Onboarding", body: "Ask: 'What does week 1 look like? Week 4? Who is our primary contact after go-live?' The best systems include guided onboarding, contextual help, and responsive human support — not just a knowledge base." },
    ],
  },
  {
    id: "build-erp-budget",
    part: 5,
    title: "Plan and Build Your System Budget",
    subtitle: "Understand true cost of ownership — not just the sticker price.",
    icon: DollarSign,
    sections: [
      { heading: "Subscription vs. Perpetual Licensing", body: "Cloud-based SaaS (like JobLine.ai) spreads cost over time with predictable monthly fees, automatic updates, and zero server maintenance. Perpetual licenses look cheaper upfront but accumulate hidden costs: hosting, patching, version upgrades, and IT staff." },
      { heading: "Implementation and Training Costs", body: "Budget 15–30% of Year 1 software cost for implementation: data migration, configuration, and training. Systems with guided onboarding (like JobLine's step-by-step tour) reduce this significantly compared to traditional ERP deployments." },
      { heading: "Opportunity Cost of Delay", body: "Every month without production visibility costs you in late deliveries, scrap, and overtime. Calculate your 'cost of doing nothing' — it's usually higher than the system investment." },
      { heading: "ROI Timeline", body: "Most job shops see measurable improvement within 30–60 days of go-live: fewer missed handoffs, faster status checks, and reduced scheduling meetings. Full ROI (including quality and on-time delivery gains) typically materializes within 6–12 months." },
    ],
  },
  {
    id: "project-plan",
    part: 6,
    title: "How to Build a System Implementation Plan",
    subtitle: "A practical, phased roadmap from kickoff to full production use.",
    icon: ClipboardList,
    sections: [
      { heading: "Phase 1: Foundation (Weeks 1–2)", body: "Set up your organization, invite your core team, and configure stations to match your shop floor layout. Import or create your first 5–10 work orders with routing steps. This phase validates that your digital layout mirrors physical reality." },
      { heading: "Phase 2: Pilot (Weeks 3–4)", body: "Run one work cell in parallel — digital and existing process simultaneously. Operators log handoffs, supervisors review dashboards, and quality records dimension checks. Capture feedback daily and adjust station names, routing templates, and notification preferences." },
      { heading: "Phase 3: Expand (Weeks 5–8)", body: "Roll out to additional work cells. Connect your ERP via the sync connector to automate work order import. Enable shift scheduling and delivery request tracking. Train supervisors on oversight dashboards and KPI interpretation." },
      { heading: "Phase 4: Optimize (Ongoing)", body: "Analyze cycle time trends, handoff quality scores, and on-time delivery rates. Introduce quality checkpoints at high-risk routing steps. Use the AI planning assistant for capacity analysis. Review and refine monthly." },
    ],
  },
  {
    id: "implementation-success",
    part: 7,
    title: "Own Your Implementation Success",
    subtitle: "Sustain momentum and continuously improve after go-live.",
    icon: Trophy,
    sections: [
      { heading: "Define Success Metrics Before Day 1", body: "Pick 3–5 KPIs that matter: on-time delivery %, average handoff completeness, scrap rate, scheduling adherence, and mean time to resolve quality issues. Baseline these before go-live so you can measure real improvement." },
      { heading: "Assign System Owners, Not Just Users", body: "Designate a 'system champion' per shift who ensures data quality, answers operator questions, and escalates issues. This person is the bridge between the shop floor and continuous improvement." },
      { heading: "Monthly Review Cadence", body: "Hold a 30-minute monthly review with supervisors and the champion team. Review KPI trends, discuss what's working, identify friction points, and prioritize the next round of improvements. This cadence prevents drift and keeps adoption strong." },
      { heading: "Leverage the Platform as It Grows", body: "JobLine.ai ships updates continuously — new reporting views, AI capabilities, and integration options. Stay current with the changelog, attend office hours, and share feature requests. The best implementations treat the system as a living tool, not a finished project." },
    ],
  },
];

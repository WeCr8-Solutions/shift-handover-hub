import {
  BadgeCheck,
  Briefcase,
  ClipboardList,
  Cog,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface LearnStarterConcept {
  title: string;
  summary: string;
  whyItMatters: string;
  links: Array<{ label: string; href: string }>;
}

export interface LearnRoleGuide {
  slug: string;
  title: string;
  shortTitle: string;
  seoTitle: string;
  seoDescription: string;
  audience: string;
  description: string;
  icon: LucideIcon;
  learnFirst: string[];
  summary: string;
  bullets: string[];
  teachingPrompt: string;
  links: Array<{ label: string; href: string }>;
}

export const starterConcepts: LearnStarterConcept[] = [
  {
    title: "Token",
    summary:
      "A token is one small piece of writing the model reads while it works. Short questions use fewer pieces. Long copied notes, manuals, and chat history use more.",
    whyItMatters:
      "This helps people understand why long messy prompts can behave differently than short clean ones.",
    links: [
      { label: "Open token in the glossary", href: "/learn/glossary/token" },
      { label: "See fundamentals first", href: "/learn/fundamentals" },
    ],
  },
  {
    title: "Context Window",
    summary:
      "Think of the model getting one sheet of paper to work with. As you keep adding notes, documents, and instructions, that page gets full.",
    whyItMatters:
      "When too much information competes for space, the answer can miss details, flatten nuance, or lose earlier context.",
    links: [
      { label: "Open context window in the glossary", href: "/learn/glossary/context-window" },
      { label: "See fundamentals first", href: "/learn/fundamentals" },
    ],
  },
  {
    title: "Human Oversight",
    summary:
      "Human in the loop means a person reviews before an important step continues. Human on the loop means the system keeps moving while a person monitors and can intervene.",
    whyItMatters:
      "Most useful manufacturing AI systems still need clear human ownership. The question is where that person sits in the workflow.",
    links: [
      { label: "Open oversight terms in the glossary", href: "/learn/glossary/human-in-the-loop" },
      { label: "Read fundamentals on control models", href: "/learn/fundamentals" },
    ],
  },
];

export const roleGuides: LearnRoleGuide[] = [
  {
    slug: "cnc-operators",
    title: "CNC operators and machinists",
    shortTitle: "AI for CNC operators",
    seoTitle: "AI for CNC Operators and Machinists | Learning Center",
    seoDescription:
      "Practical AI guide for CNC operators and machinists covering setup context, alarm understanding, grounded answers, and where human review still matters.",
    audience: "Operators, setup machinists, apprentices, and people running live machines.",
    description: "Focus on clearer instructions, setup confidence, alarms, and better access to the right context during real work.",
    icon: Wrench,
    learnFirst: ["Token", "Context Window", "Human in the Loop"],
    summary:
      "Operators usually feel AI through instructions, alarms, notes, and setup context. The biggest lesson is that AI can help explain or organize information, but it should not become a blind substitute for the current print, setup, or machine condition.",
    bullets: [
      "Token and context window matter because long pasted notes can crowd out the most important instruction.",
      "Human in the loop matters because final machine action, offset changes, and risky setup decisions still need a person to own them.",
      "Grounded answers matter because confident guessing is expensive on a live machine.",
    ],
    teachingPrompt:
      "Start here: what is a token, what is a context window, and when should a machinist stop trusting a draft answer until it is checked against the real source?",
    links: [
      { label: "Read AI terms in plain language", href: "/learn/glossary" },
      { label: "See operator learning context", href: "/oap" },
    ],
  },
  {
    slug: "quality-inspection",
    title: "Quality and inspection staff",
    shortTitle: "AI for quality inspectors",
    seoTitle: "AI for Quality Inspectors and Inspection Teams | Learning Center",
    seoDescription:
      "Practical AI guide for quality and inspection teams covering traceability, evidence, vision-system support, and human review boundaries.",
    audience: "Inspectors, quality techs, first-article reviewers, and disposition-focused teams.",
    description: "Center on traceability, consistent checks, vision-system support, and why grounded information matters.",
    icon: BadgeCheck,
    learnFirst: ["Context Window", "Human in the Loop", "Human on the Loop"],
    summary:
      "For quality and inspection roles, AI should strengthen consistency, traceability, and evidence gathering. The main lesson is not speed alone. It is how to stay correct and repeatable when standards, evidence, and exceptions matter.",
    bullets: [
      "Context window matters because inspection work often combines drawings, requirements, findings, and previous notes in one conversation.",
      "Human in the loop fits approvals and dispositions. Human on the loop fits monitored visual systems and exception queues.",
      "This role should care more about verification, evidence, and escalation design than novelty.",
    ],
    teachingPrompt:
      "Start here: what should always be reviewed by a person, and where can a monitored system keep moving until an exception appears?",
    links: [
      { label: "See quality resource content", href: "/resources/quality" },
      { label: "Review fundamentals on retrieval and vision", href: "/learn/fundamentals" },
    ],
  },
  {
    slug: "supervisors-leads",
    title: "Supervisors and leads",
    shortTitle: "AI for manufacturing supervisors",
    seoTitle: "AI for Manufacturing Supervisors and Team Leads | Learning Center",
    seoDescription:
      "Practical AI guide for supervisors and team leads covering summaries, escalation routing, alerts, oversight models, and decision ownership.",
    audience: "Shift leads, team leads, planners, supervisors, and people coordinating multiple workstreams.",
    description: "Explain planning visibility, communication summaries, escalation routing, and keeping people in the loop.",
    icon: Users,
    learnFirst: ["Token", "Context Window", "Human on the Loop"],
    summary:
      "For supervisors and leads, AI is helpful when it compresses noise into something readable, highlights exceptions, and gives people a better starting point for judgment across many moving parts.",
    bullets: [
      "Token and context window matter because long recaps can bury what actually changed this shift.",
      "Human on the loop matters because supervisors often monitor many flows at once and step in when an alert, delay, or risk crosses a threshold.",
      "The best learning sequence here is usually prompt workflow, retrieval, and human oversight design.",
    ],
    teachingPrompt:
      "Start here: how do you let summaries and alerts move fast without losing human ownership of the decision?",
    links: [
      { label: "See AI planning-assistant context", href: "/features/ai-planning-assistant" },
      { label: "Review the glossary", href: "/learn/glossary" },
    ],
  },
  {
    slug: "manufacturing-engineers",
    title: "Manufacturing engineers",
    shortTitle: "AI for manufacturing engineers",
    seoTitle: "AI for Manufacturing Engineers | Learning Center",
    seoDescription:
      "Practical AI guide for manufacturing engineers covering process knowledge, document retrieval, troubleshooting context, and repeatable review workflows.",
    audience: "Manufacturing engineers, process engineers, continuous-improvement leads, and technical document owners.",
    description: "Cover process knowledge, documentation retrieval, troubleshooting context, and where structured automation helps.",
    icon: Cog,
    learnFirst: ["Context Window", "Prompt Workflow", "Human in the Loop"],
    summary:
      "For manufacturing engineers, AI is strongest when it helps connect process documents, repeated troubleshooting patterns, and technical context without forcing a blank-page start every time.",
    bullets: [
      "Context window matters because engineering questions often pile several sources into one working thread.",
      "Structured workflows beat one-off prompts when repeatability matters.",
      "Engineers should care about source traceability, review boundaries, and whether the answer can be checked quickly.",
    ],
    teachingPrompt:
      "Start here: how much source material is the model juggling, and where should engineering review remain explicit before changes or recommendations move forward?",
    links: [
      { label: "Browse handbook reference content", href: "/handbook" },
      { label: "See tutorial tracks", href: "/learn/tutorials" },
    ],
  },
  {
    slug: "automation-technicians",
    title: "Robotics and automation technicians",
    shortTitle: "AI for robotics and automation technicians",
    seoTitle: "AI for Robotics and Automation Technicians | Learning Center",
    seoDescription:
      "Practical AI guide for robotics and automation technicians covering monitored automation, safety boundaries, repetitive-task fit, and deployment judgment.",
    audience: "Automation techs, robotics techs, controls-minded operators, and people evaluating repetitive-task automation.",
    description: "Connect robotics, sensors, safety, and repetitive-task automation to realistic deployment choices.",
    icon: Briefcase,
    learnFirst: ["Human on the Loop", "Human in the Loop", "Prompt Workflow"],
    summary:
      "For robotics and automation technicians, AI should be taught through fit-for-purpose use. The question is not whether automation sounds advanced. It is whether the task is repetitive, risky, or hard to sustain manually.",
    bullets: [
      "The 3 Ds are a practical entry point for talking about automation honestly.",
      "Human on the loop matters because monitored automation often makes more sense than forcing approval at every micro-step.",
      "Vision systems and tool-connected workflows are easier to evaluate when the limits are stated clearly.",
      "Tutorial content matters here because many people are trying to get tools running, not just learn definitions.",
    ],
    teachingPrompt:
      "Start here: what should run automatically, what should raise an alert, and what should still require a human to approve before the next step continues?",
    links: [
      { label: "Read fundamentals on robotics and vision", href: "/learn/fundamentals" },
      { label: "Open tutorial tracks", href: "/learn/tutorials" },
    ],
  },
  {
    slug: "ai-curious-shop-staff",
    title: "General AI-curious shop staff",
    shortTitle: "AI basics for shop staff",
    seoTitle: "AI Basics for Shop Staff | Learning Center",
    seoDescription:
      "Plain-language AI guide for shop staff who want useful examples, less jargon, and a practical starting point before technical depth.",
    audience: "Curious operators, support staff, office staff, and first-time AI learners in manufacturing environments.",
    description: "Provide a simpler entry point for people who need confidence and useful examples before technical depth.",
    icon: ClipboardList,
    learnFirst: ["Token", "Context Window", "Human in the Loop"],
    summary:
      "This path is for people who are curious but do not want jargon dumped on them. The goal is understanding first, confidence second, and optional application after that.",
    bullets: [
      "Start with what a token is and why long chats or pasted notes can crowd the model.",
      "Use the sheet-of-paper idea for context window before worrying about technical jargon.",
      "Reflection should stay optional so learning does not feel like homework or intake.",
    ],
    teachingPrompt:
      "Start here: what are the simplest concepts that make AI feel less mysterious without dropping someone into unnecessary technical detail?",
    links: [
      { label: "Start with the glossary", href: "/learn/glossary" },
      { label: "Go to fundamentals", href: "/learn/fundamentals" },
    ],
  },
];

export function getRoleGuideBySlug(slug: string) {
  return roleGuides.find((role) => role.slug === slug);
}

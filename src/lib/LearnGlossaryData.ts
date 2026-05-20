export const LEARN_CATEGORIES = [
  "Foundations",
  "Context & Retrieval",
  "Automation & Agents",
  "Safety & Quality",
] as const;

export type LearnCategory = (typeof LEARN_CATEGORIES)[number];

export interface TermQuizOption {
  text: string;
  correct: boolean;
}

export interface TermQuiz {
  question: string;
  options: TermQuizOption[];
  correctExplanation: string;
  wrongExplanation: string;
}

export interface LearnTermLink {
  label: string;
  href: string;
}

export interface LearnTermVisual {
  body: string;
  breakdown?: string[];
  note?: string;
}

interface TermColor {
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export interface LearnTerm {
  id: string;
  name: string;
  icon: string;
  category: LearnCategory;
  oneLiner: string;
  plain: string;
  whyItMatters: string;
  benefits?: string[];
  drawbacks?: string[];
  visual?: LearnTermVisual;
  analogy: {
    aiSide: string;
    shopSide: string;
  };
  examples: string[];
  sparkPrompt: string;
  quiz: TermQuiz;
  relatedLinks?: LearnTermLink[];
  trending?: boolean;
  color: TermColor;
}

const COLORS: Record<LearnCategory, TermColor> = {
  Foundations: {
    bgClass: "bg-sky-50",
    textClass: "text-sky-700",
    borderClass: "border-sky-200",
  },
  "Context & Retrieval": {
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
  },
  "Automation & Agents": {
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
  },
  "Safety & Quality": {
    bgClass: "bg-rose-50",
    textClass: "text-rose-700",
    borderClass: "border-rose-200",
  },
};

export const TERMS: LearnTerm[] = [
  {
    id: "token",
    name: "Token",
    icon: "🔤",
    category: "Foundations",
    oneLiner: "A token is one small piece of text the model reads before it can answer.",
    plain:
      "A **token** is one small piece of text the model reads while it is trying to understand your request. Think of a sentence getting broken into little pieces the model can count, track, and work through. Short requests use fewer pieces. Long notes, manuals, and chats use more.",
    whyItMatters:
      "If you want AI to read long shift notes, alarm history, and setup instructions together, token usage becomes a real limit. That affects how much context you can send at once.",
    visual: {
      body:
        "Picture a sentence being snapped into small text pieces before the model works on it. The model does not hold one giant thought bubble. It reads piece by piece, then builds the answer from those pieces.",
      breakdown: ["Summarize", "yesterday's", "spindle", "alarm", "notes"],
      note:
        "This is a simple picture, not the exact tokenizer output. Real token splits vary by model, punctuation, and wording.",
    },
    analogy: {
      aiSide: "The model keeps count of many small text pieces while it reads, reasons, and answers.",
      shopSide: "Like checking whether a message is short enough to scan quickly or long enough that it needs to be broken into smaller parts to stay clear.",
    },
    examples: ["A short chat question", "A long pasted note", "A manual copied into a prompt"],
    sparkPrompt:
      "If this connects to a workflow, project, or question you care about, what would you want to remember or try later?",
    quiz: {
      question: "Why do tokens matter in a manufacturing AI workflow?",
      options: [
        { text: "They control how much text the model can work with at once", correct: true },
        { text: "They are passwords needed to unlock the AI", correct: false },
        { text: "They replace work orders in the ERP", correct: false },
      ],
      correctExplanation:
        "Right. Token limits affect how much handbook content, shift notes, and machine context the model can read in one pass.",
      wrongExplanation:
        "The key idea is context size. Tokens are the units that determine how much text the model can process at once.",
    },
    relatedLinks: [
      { label: "Shift handoff software", href: "/features/shift-handoff-software" },
      { label: "Manufacturing glossary", href: "/resources/glossary" },
    ],
    color: COLORS.Foundations,
  },
  {
    id: "context-window",
    name: "Context Window",
    icon: "📄",
    category: "Foundations",
    oneLiner: "A context window is the amount of text and information the model can keep in view at one time.",
    plain:
      "A **context window** is the working space the model has available while answering. A simple way to picture it is a sheet of paper that keeps filling up with your prompt, chat history, pasted notes, documents, and instructions. Once that page gets crowded, older or less important information may no longer stay in view.",
    whyItMatters:
      "This affects whether the model can see the whole situation at once. Long handoff notes, pasted manuals, quality findings, and extra instructions can compete for space, which changes answer quality.",
    visual: {
      body:
        "Imagine one page in front of the model. First you write the question. Then you add yesterday's notes, machine alarms, setup details, and a handbook excerpt. At some point the page gets full, so something has to be shortened, dropped, or moved into a new pass.",
      breakdown: ["Question", "Chat history", "Shift notes", "Reference document", "Output space"],
      note:
        "Different models have different context sizes, but the learning idea is the same: too much text competing for attention makes prioritization harder.",
    },
    analogy: {
      aiSide: "The model can only keep so much active text in view while it works through the answer.",
      shopSide: "Like trying to write instructions, notes, exceptions, and a checklist onto one sheet of paper. Once the page fills up, you either need a cleaner summary or another page.",
    },
    examples: ["A short prompt with room to spare", "A long chat with many pasted notes", "A manual excerpt plus operator notes plus follow-up questions"],
    sparkPrompt:
      "Where do people paste too much information at once and end up with answers that feel scattered or incomplete?",
    quiz: {
      question: "Why does context window size matter?",
      options: [
        { text: "It affects how much information the model can keep in view while answering", correct: true },
        { text: "It decides whether the screen theme is light or dark", correct: false },
        { text: "It only matters for image editing tools", correct: false },
      ],
      correctExplanation:
        "Right. If too much information competes for limited space, the model may miss or downplay something important.",
      wrongExplanation:
        "The key idea is working space. Context window size changes how much text and instruction can stay active during the answer.",
    },
    relatedLinks: [
      { label: "Learning fundamentals", href: "/learn/fundamentals" },
      { label: "AI planning assistant", href: "/features/ai-planning-assistant" },
    ],
    color: COLORS.Foundations,
  },
  {
    id: "prompt-workflow",
    name: "Prompt Workflow",
    icon: "🧭",
    category: "Foundations",
    oneLiner: "A prompt workflow is the repeatable structure around an AI task.",
    plain:
      "A **prompt workflow** is the sequence around an AI task: what information goes in, what rules apply, what output is expected, and what a person does next. Good results usually come from the workflow, not from one magic prompt.",
    whyItMatters:
      "If you want repeatable output for quality notes, shift handoffs, or planning support, the workflow needs guardrails and a defined handoff to the human.",
    analogy: {
      aiSide: "Prompt, rules, context, output format, review step.",
      shopSide: "Like a standard setup process: pull the print, verify tools, set offsets, run the first part, inspect, then release.",
    },
    examples: ["Quality summary draft", "Supervisor recap", "Daily planning assistant"],
    sparkPrompt:
      "What job on your floor already follows a standard checklist and could benefit from an AI draft or first pass?",
    quiz: {
      question: "What makes an AI workflow reliable?",
      options: [
        { text: "A repeatable structure with context, rules, and review", correct: true },
        { text: "Using the longest prompt possible every time", correct: false },
        { text: "Removing the human from the process completely", correct: false },
      ],
      correctExplanation:
        "Right. Reliable AI work usually comes from a stable workflow with clear inputs and review points.",
      wrongExplanation:
        "The strongest answer is the structured workflow. Prompt length alone does not create quality.",
    },
    relatedLinks: [
      { label: "AI planning assistant", href: "/features/ai-planning-assistant" },
      { label: "OAP learning hub", href: "/oap/learn" },
    ],
    color: COLORS.Foundations,
  },
  {
    id: "environment",
    name: "Environment",
    icon: "🖥️",
    category: "Foundations",
    oneLiner: "The environment is where the AI is being used, such as a CLI, IDE, web app, or mobile app.",
    plain:
      "An **environment** is the place where the AI is operating and what tools or limits come with it. The same model can feel very different in a command line, inside an IDE, in a web application, or on a phone because the surrounding interface changes what the user can see, send, click, or do next.",
    whyItMatters:
      "People often think the model changed when the real difference is the environment around it. The interface controls how much context is visible, how actions are triggered, and what kind of work feels natural.",
    visual: {
      body:
        "Picture the same AI worker dropped into four places. In a CLI it reads and writes text commands. In an IDE it can look at files, symbols, and tests. In a web app it works through pages, forms, and APIs. On mobile it has less screen space but may gain camera, voice, and quick field use.",
      breakdown: ["CLI = commands", "IDE = code and files", "Web = pages and forms", "Mobile = short, field-friendly interactions"],
      note:
        "The model may be the same underneath. The surrounding environment changes what feels useful, safe, and efficient.",
    },
    analogy: {
      aiSide: "Same brain, different workspace. The room changes the tools on the desk.",
      shopSide: "Like giving the same operator a machine control, an office computer, a browser dashboard, or a phone on the floor. The job flow changes because the station changes.",
    },
    examples: ["CLI for command-driven work", "IDE for coding and debugging", "Web app for shared workflows", "Mobile for quick updates, photos, or voice notes"],
    sparkPrompt:
      "Where does the same task need a different interface depending on whether someone is at a desk, at a machine, or walking the floor?",
    quiz: {
      question: "What is the main difference between AI in a CLI, IDE, web app, and mobile app?",
      options: [
        { text: "The surrounding interface and available tools change how the same model can be used", correct: true },
        { text: "Each environment automatically becomes a different model family", correct: false },
        { text: "Only mobile can use prompts", correct: false },
      ],
      correctExplanation:
        "Right. The big shift is the interface, context, and tools around the model, not always the model itself.",
      wrongExplanation:
        "The key lesson is environment fit. CLI, IDE, web, and mobile shape what the AI can see and how the user interacts with it.",
    },
    relatedLinks: [
      { label: "Learning fundamentals", href: "/learn/fundamentals" },
      { label: "AI tutorial tracks", href: "/learn/tutorials" },
    ],
    color: COLORS.Foundations,
  },
  {
    id: "cli",
    name: "CLI",
    icon: "⌨️",
    category: "Foundations",
    oneLiner: "A CLI is a command-line environment where you type commands instead of clicking through screens.",
    plain:
      "A **CLI** is a command-line interface. You type instructions and the system responds with text output. It is common for developer tools, automation tasks, system administration, and repeatable command-driven work.",
    whyItMatters:
      "CLI environments are strong when the task is precise, repeatable, and mostly text-driven. They are weaker when someone needs visual comparison, rich forms, or a low-friction experience on a phone.",
    benefits: [
      "Fast for repeatable commands, scripts, and automation.",
      "Good for exact control when the user already knows the task.",
      "Easy to document and replay because commands are explicit.",
    ],
    drawbacks: [
      "Harder for beginners who do not know the commands yet.",
      "Less visual context than a browser or app dashboard.",
      "Usually awkward on a phone unless the task is extremely simple.",
    ],
    visual: {
      body:
        "Picture a conversation where every step is a typed instruction and every answer comes back as text. That is powerful when the user wants speed and precision, but it assumes they can think in commands.",
      breakdown: ["Type command", "Read output", "Adjust command", "Run again"],
      note: "CLI-first tools feel efficient to technical users and intimidating to people who expect buttons, menus, and visual guidance.",
    },
    analogy: {
      aiSide: "A command-driven workspace where the AI can help write, explain, or chain exact instructions.",
      shopSide: "Like working from a terse but precise machine control instead of a guided touchscreen workflow.",
    },
    examples: ["Developer tooling", "Server administration", "Scripted installs", "Repeatable diagnostics"],
    sparkPrompt:
      "Which tasks in your team are already checklist-like and could benefit from precise command-driven help rather than another visual dashboard?",
    quiz: {
      question: "When is a CLI usually the strongest environment?",
      options: [
        { text: "When the work is command-driven, repeatable, and text-heavy", correct: true },
        { text: "When the user needs the richest visual dashboard possible", correct: false },
        { text: "When the task depends mainly on camera input from a phone", correct: false },
      ],
      correctExplanation:
        "Right. CLI environments shine when exact commands, scripts, and repeatable text workflows matter most.",
      wrongExplanation:
        "The core advantage of CLI is precision and repeatability in text-driven work, not visual richness.",
    },
    relatedLinks: [
      { label: "Learning fundamentals", href: "/learn/fundamentals" },
      { label: "AI tutorial tracks", href: "/learn/tutorials" },
    ],
    color: COLORS.Foundations,
  },
  {
    id: "ide",
    name: "IDE",
    icon: "🧰",
    category: "Foundations",
    oneLiner: "An IDE is a coding workspace that combines files, editing, navigation, and validation tools.",
    plain:
      "An **IDE** is an integrated development environment. It puts code, files, search, symbol navigation, debugging, tests, and tooling in one place so the user can build and change software without jumping between separate apps.",
    whyItMatters:
      "If the task involves reading a codebase, fixing bugs, renaming symbols, or running tests, an IDE gives the AI and the user a much better workspace than a plain chat box.",
    benefits: [
      "Strong for code-aware work because files, symbols, and tests are nearby.",
      "Supports fast edit-run-debug loops.",
      "Makes larger technical tasks easier to inspect and verify.",
    ],
    drawbacks: [
      "Best suited to builders, not general end users.",
      "Can overwhelm beginners with too much surface area.",
      "Usually tied to desktop or laptop work instead of quick phone access.",
    ],
    visual: {
      body:
        "Picture the AI sitting inside the same room as the files, tests, and error list. It can help much more effectively because the surrounding workspace already has the technical context.",
      breakdown: ["Files", "Symbols", "Tests", "Errors", "Editor"],
      note: "The model may be the same as in a web chat, but the IDE gives it a far better technical workstation.",
    },
    analogy: {
      aiSide: "A builder's bench with the project opened up in front of the model and the user.",
      shopSide: "Like moving from a generic note pad to a full setup station with prints, gauges, history, and tools laid out together.",
    },
    examples: ["Bug fixing", "Refactors", "Test-driven changes", "Tracing code paths"],
    sparkPrompt:
      "Where does your team need AI help that only becomes useful when the surrounding files, errors, and project structure are visible together?",
    quiz: {
      question: "Why is an IDE usually better than a plain chat box for coding work?",
      options: [
        { text: "Because the surrounding files, tests, and symbols are part of the workspace", correct: true },
        { text: "Because IDEs automatically remove the need for validation", correct: false },
        { text: "Because only IDE-based AI can understand text", correct: false },
      ],
      correctExplanation:
        "Right. IDEs improve coding work because the AI and user can operate with the nearby project context, files, and validation tools.",
      wrongExplanation:
        "The important idea is workspace context. IDEs help because the surrounding technical surfaces are available.",
    },
    relatedLinks: [
      { label: "Learning fundamentals", href: "/learn/fundamentals" },
      { label: "Role-based AI guides", href: "/learn/professions" },
    ],
    color: COLORS.Foundations,
  },
  {
    id: "web-app",
    name: "Web App",
    icon: "🌐",
    category: "Foundations",
    oneLiner: "A web app is an AI experience delivered through pages, forms, dashboards, and shared browser workflows.",
    plain:
      "A **web app** is an AI experience that runs in the browser. It usually combines pages, forms, dashboards, shared records, and role-based workflows so people can access the same system without installing a full desktop environment.",
    whyItMatters:
      "Web apps are usually the best fit when the work needs shared visibility, approvals, forms, browser access, and a lower barrier for non-technical users.",
    benefits: [
      "Easy to access from most devices with a browser.",
      "Good for shared workflows, records, forms, dashboards, and approvals.",
      "Usually easier for non-technical users than CLI or IDE tools.",
    ],
    drawbacks: [
      "Often narrower than an IDE or CLI for deep technical control.",
      "Dependent on browser sessions, network quality, and page design.",
      "Complex multi-step work can feel slower if the interface is over-structured.",
    ],
    visual: {
      body:
        "Picture the AI inside a shared dashboard where different people can open the same workflow, fill forms, review summaries, and approve next steps from the browser.",
      breakdown: ["Page", "Form", "Dashboard", "Shared record", "Approval"],
      note: "Web apps often win when the goal is adoption across many roles, not maximum technical depth for one role.",
    },
    analogy: {
      aiSide: "A browser-based workspace built for shared workflows instead of typed commands.",
      shopSide: "Like moving from sticky notes and hallway conversations to one shared board everyone can open and act from.",
    },
    examples: ["Shared handoff workflows", "Approval screens", "Issue dashboards", "Training portals"],
    sparkPrompt:
      "Which workflows in your environment need one shared view that many people can access without learning commands first?",
    quiz: {
      question: "When is a web app usually the best AI environment?",
      options: [
        { text: "When many users need shared pages, forms, records, or approvals", correct: true },
        { text: "When the main task is deep code refactoring", correct: false },
        { text: "When the user needs the least visual interface possible", correct: false },
      ],
      correctExplanation:
        "Right. Web apps are strongest when shared browser-based workflows matter more than deep technical control.",
      wrongExplanation:
        "The key advantage is broad access and shared workflow visibility through the browser.",
    },
    relatedLinks: [
      { label: "Learning center", href: "/learn" },
      { label: "Digital expeditor", href: "/features/digital-expeditor" },
    ],
    color: COLORS.Foundations,
  },
  {
    id: "mobile-app",
    name: "Mobile App",
    icon: "📱",
    category: "Foundations",
    oneLiner: "A mobile app brings AI into the field with a small screen, but gains camera, voice, and quick-response access.",
    plain:
      "A **mobile app** brings AI into a phone or tablet workflow. The user loses screen space and long-form comfort, but gains portability, camera input, voice input, notifications, and quick access while moving around the floor or site.",
    whyItMatters:
      "Mobile matters when someone is not sitting at a desk. It is often the right place for quick questions, image capture, status updates, and short guided workflows rather than long technical reviews.",
    benefits: [
      "Useful in the field because the device is already in the user's pocket.",
      "Can pair AI with camera, voice, notifications, and quick updates.",
      "Good for short interactions while moving between tasks or stations.",
    ],
    drawbacks: [
      "Small screens make long reviews and complex comparisons harder.",
      "Typing long prompts is slower and more error-prone.",
      "Dense technical workflows can feel cramped without careful design.",
    ],
    visual: {
      body:
        "Picture a worker taking a photo, tapping a quick action, dictating a note, or asking for a short explanation while standing next to the work instead of returning to a desk.",
      breakdown: ["Camera", "Voice", "Notification", "Quick reply", "Short form"],
      note: "Mobile is usually strongest for short, guided, field-friendly interactions rather than heavy document review.",
    },
    analogy: {
      aiSide: "A pocket workstation built for quick capture and short back-and-forth interactions.",
      shopSide: "Like carrying a compact helper around the floor instead of walking back to an office terminal for every question.",
    },
    examples: ["Photo-based issue capture", "Voice notes", "Quick approvals", "On-the-floor status updates"],
    sparkPrompt:
      "What information do people notice in the moment but fail to capture because the system is too desk-bound to use quickly?",
    quiz: {
      question: "What is the main tradeoff of mobile AI?",
      options: [
        { text: "You gain portability and quick input methods, but lose screen space for complex review", correct: true },
        { text: "Mobile can only be used for entertainment tasks", correct: false },
        { text: "Mobile always has more context than desktop", correct: false },
      ],
      correctExplanation:
        "Right. Mobile wins on portability, camera, voice, and speed in the field, but loses screen space and comfort for complex review.",
      wrongExplanation:
        "The core tradeoff is portability versus screen and workflow depth.",
    },
    relatedLinks: [
      { label: "Learning fundamentals", href: "/learn/fundamentals" },
      { label: "Role-based AI guides", href: "/learn/professions" },
    ],
    color: COLORS.Foundations,
  },
  {
    id: "chat-agent",
    name: "Chat Agent",
    icon: "💬",
    category: "Automation & Agents",
    oneLiner: "A chat agent is an AI workflow reached through messaging surfaces such as Slack, Telegram, or Teams.",
    plain:
      "A **chat agent** is an agent that people use through a messaging surface instead of a dedicated app screen first. That might be Slack, Telegram, Teams, or another chat system where the user asks a question, gets a response, and optionally triggers buttons, forms, or follow-up actions inside the conversation.",
    whyItMatters:
      "Chat agents are useful because they meet people where they already communicate. They are usually strong for alerts, triage, quick status checks, and short next-step workflows. They are weaker when the task needs deep screen space, dense review, or complex side-by-side comparison.",
    benefits: [
      "Low friction because users stay inside a familiar messaging tool.",
      "Good for alerts, quick questions, short approvals, and threaded follow-up.",
      "Works well on phones because messaging apps are already part of daily work.",
    ],
    drawbacks: [
      "Long or technical work can get noisy and hard to review inside chat history.",
      "Permissions, privacy, and channel visibility need clear design.",
      "Some message types are temporary or constrained by the platform surface.",
    ],
    visual: {
      body:
        "Picture a user asking a question in the same chat where their team already coordinates work. The agent replies in a DM, a thread, or a channel, then offers the next action through buttons, links, or a short follow-up prompt.",
      breakdown: ["Ask in chat", "Get answer", "Tap action", "Stay in thread"],
      note:
        "Slack supports channels, DMs, threads, Block Kit layouts, and ephemeral messages. Telegram bots support private chats, groups, web apps, and webhook or polling delivery. Teams bots can work in personal, group, or channel scopes and support notification, workflow, and command patterns.",
    },
    analogy: {
      aiSide: "An agent embedded in the conversation layer rather than hidden behind a separate portal.",
      shopSide: "Like reaching a knowledgeable coordinator through the team message stream instead of leaving the current conversation to open another system first.",
    },
    examples: ["Slack triage agent", "Telegram field bot", "Teams notification bot", "Phone-based quick approval flow"],
    sparkPrompt:
      "Which questions or alerts should reach people inside the chat tools they already check on their phones, instead of waiting for them to open a separate dashboard?",
    quiz: {
      question: "What is the best use for a chat agent?",
      options: [
        { text: "Quick questions, alerts, approvals, and short workflows inside familiar messaging tools", correct: true },
        { text: "Replacing every complex dashboard with a long text thread", correct: false },
        { text: "Avoiding any need for permissions or channel design", correct: false },
      ],
      correctExplanation:
        "Right. Chat agents are strongest when they reduce friction for short, timely interactions in tools people already watch.",
      wrongExplanation:
        "The strength of chat agents is low-friction access in familiar messaging surfaces, not forcing every workflow into a chat thread.",
    },
    relatedLinks: [
      { label: "Learning fundamentals", href: "/learn/fundamentals" },
      { label: "AI tutorial tracks", href: "/learn/tutorials" },
    ],
    trending: true,
    color: COLORS["Automation & Agents"],
  },
  {
    id: "rag",
    name: "RAG",
    icon: "📚",
    category: "Context & Retrieval",
    oneLiner: "RAG lets AI search your own documents before answering.",
    plain:
      "**RAG** means retrieval-augmented generation. Instead of answering only from general training, the system first looks through your own documents, finds relevant material, and sends that context into the model before it responds.",
    whyItMatters:
      "This is how AI can answer from your handbook, SOPs, setup sheets, or quality procedures instead of making a generic guess.",
    analogy: {
      aiSide: "Search the library first, then answer with the right pages in view.",
      shopSide: "Like checking the latest traveler and setup packet before touching the machine instead of relying on memory.",
    },
    examples: ["Handbook lookup", "Procedure search", "Setup-sheet answers"],
    sparkPrompt:
      "Which documents do people repeatedly ask supervisors to interpret because they are hard to find or too spread out?",
    quiz: {
      question: "What problem does RAG solve?",
      options: [
        { text: "Giving AI grounded access to current internal documents", correct: true },
        { text: "Training the model from scratch every shift", correct: false },
        { text: "Replacing all written procedures", correct: false },
      ],
      correctExplanation:
        "Right. RAG is about retrieving the right current material so the answer is based on your real documents.",
      wrongExplanation:
        "RAG does not mean retraining the model. It means retrieving relevant documents before generating the answer.",
    },
    relatedLinks: [
      { label: "Handbook library", href: "/handbook" },
      { label: "OAP overview", href: "/oap" },
    ],
    trending: true,
    color: COLORS["Context & Retrieval"],
  },
  {
    id: "vector-search",
    name: "Vector Search",
    icon: "🧲",
    category: "Context & Retrieval",
    oneLiner: "Vector search finds meaning-similar content, not just exact keyword matches.",
    plain:
      "**Vector search** turns text into mathematical representations so the system can find content that means something similar even when the words are different.",
    whyItMatters:
      "Operators may search for \"bad finish\" while the procedure says \"surface roughness issue\". Vector search helps those two connect.",
    analogy: {
      aiSide: "Find the closest meaning, not just the exact same word.",
      shopSide: "Like knowing that chatter, washboard finish, and vibration complaint may all point to related setup or tooling issues.",
    },
    examples: ["Procedure discovery", "Alarm context", "Knowledge-base search"],
    sparkPrompt:
      "Where do people use different language for the same issue, causing search or documentation lookup to break down?",
    quiz: {
      question: "Why is vector search useful in manufacturing content?",
      options: [
        { text: "It can match similar meaning across different wording", correct: true },
        { text: "It only works when operators know the exact document title", correct: false },
        { text: "It converts all files into CAD drawings", correct: false },
      ],
      correctExplanation:
        "Right. It helps bridge everyday shop-floor language and the formal language used in procedures or quality docs.",
      wrongExplanation:
        "The important point is semantic matching. Vector search helps when people describe the same issue differently.",
    },
    relatedLinks: [
      { label: "Quality and inspection", href: "/resources/quality" },
      { label: "Help center", href: "/help" },
    ],
    color: COLORS["Context & Retrieval"],
  },
  {
    id: "agent",
    name: "Agent",
    icon: "🤖",
    category: "Automation & Agents",
    oneLiner: "An agent is an AI workflow that can use tools and move through steps toward a goal.",
    plain:
      "An **agent** is more than a single answer. It can take a goal, choose actions, use tools, gather context, and continue through several steps before presenting a result.",
    whyItMatters:
      "This is the pattern behind AI that can help classify issues, summarize work, or route information rather than just chat about it.",
    analogy: {
      aiSide: "Take a goal, inspect context, use tools, decide the next step, and keep going.",
      shopSide: "Like a lead operator who checks the board, looks at the job, calls up the right documents, and moves the work to the next station.",
    },
    examples: ["Issue triage", "Planning assist", "Knowledge routing"],
    sparkPrompt:
      "What repeatable multi-step task on your floor still depends on someone manually chasing information across tools?",
    quiz: {
      question: "What separates an agent from a simple one-shot response?",
      options: [
        { text: "It can move through multiple steps and use tools toward a goal", correct: true },
        { text: "It only writes longer paragraphs", correct: false },
        { text: "It always replaces the supervisor", correct: false },
      ],
      correctExplanation:
        "Right. The core difference is tool use and multi-step execution toward an objective.",
      wrongExplanation:
        "Length is not the point. Agents are distinct because they can take actions and sequence work.",
    },
    relatedLinks: [
      { label: "Use cases", href: "/use-cases" },
      { label: "Digital expeditor", href: "/features/digital-expeditor" },
    ],
    trending: true,
    color: COLORS["Automation & Agents"],
  },
  {
    id: "mcp",
    name: "MCP",
    icon: "🔌",
    category: "Automation & Agents",
    oneLiner: "MCP is a standard way for AI systems to connect to tools and structured context.",
    plain:
      "**MCP** stands for Model Context Protocol. It gives AI systems a standard way to talk to tools, fetch context, and expose actions without hard-coding every integration separately.",
    whyItMatters:
      "If you want AI to interact safely with handbooks, machine data, ERP details, or training utilities, protocol-level tool access is cleaner than copying everything into the prompt.",
    analogy: {
      aiSide: "Standard tool ports for AI systems.",
      shopSide: "Like using a common machine interface so one system can plug into different controls and still know how to ask for the right data.",
    },
    examples: ["Tool access", "Handbook connections", "ERP context retrieval"],
    sparkPrompt:
      "Which system in your environment would become more useful if AI could read from it or ask it questions safely?",
    quiz: {
      question: "Why would a learning platform care about MCP?",
      options: [
        { text: "It helps AI connect to tools and context in a standard way", correct: true },
        { text: "It is a machine programming language like G-code", correct: false },
        { text: "It only matters for social media bots", correct: false },
      ],
      correctExplanation:
        "Right. MCP matters because it standardizes access to tools and context that AI can use.",
      wrongExplanation:
        "The important point is tool connectivity and structured context, not controller programming.",
    },
    relatedLinks: [
      { label: "AI planning assistant", href: "/features/ai-planning-assistant" },
      { label: "Developer portal", href: "/dev" },
    ],
    color: COLORS["Automation & Agents"],
  },
  {
    id: "hallucination",
    name: "Hallucination",
    icon: "⚠️",
    category: "Safety & Quality",
    oneLiner: "A hallucination is when AI states something incorrect as if it were true.",
    plain:
      "A **hallucination** happens when the model gives a confident answer that is wrong, invented, or unsupported by the real context it should be using.",
    whyItMatters:
      "In manufacturing, confident wrong answers can damage trust fast. That is why grounded context, review steps, and scoped workflows matter.",
    analogy: {
      aiSide: "The answer sounds smooth but is not actually tied to the correct source.",
      shopSide: "Like someone confidently quoting an outdated setup value from memory instead of checking the current print or work instruction.",
    },
    examples: ["Wrong procedure step", "Invented machine limit", "Incorrect document claim"],
    sparkPrompt:
      "Where would a wrong but confident answer create the most risk in your current workflow?",
    quiz: {
      question: "What is the best defense against hallucinations in a shop-floor AI flow?",
      options: [
        { text: "Ground the answer in real sources and keep human review where needed", correct: true },
        { text: "Ask the AI to sound more confident", correct: false },
        { text: "Hide the source documents from the AI", correct: false },
      ],
      correctExplanation:
        "Right. Better grounding and clear review steps reduce the chance and impact of hallucinations.",
      wrongExplanation:
        "Confidence is not quality. The answer needs grounding in real source material and sensible review controls.",
    },
    relatedLinks: [
      { label: "Quality management", href: "/features/quality-management" },
      { label: "Safety and compliance", href: "/resources/safety" },
    ],
    color: COLORS["Safety & Quality"],
  },
  {
    id: "human-in-the-loop",
    name: "Human in the Loop",
    icon: "👷",
    category: "Safety & Quality",
    oneLiner: "Human in the loop means people still review, approve, or steer the AI output.",
    plain:
      "**Human in the loop** means the AI can draft, classify, summarize, or suggest, but a person still checks or approves the result where the risk or importance justifies it.",
    whyItMatters:
      "This is the right operating model for many shop workflows: save time on the first pass without giving up accountability.",
    analogy: {
      aiSide: "AI drafts and structures the work. A human validates the decision.",
      shopSide: "Like an apprentice setting up the first pass while the lead still verifies offsets and signs off before production starts.",
    },
    examples: ["Supervisor review", "Quality approval", "Machine-change authorization"],
    sparkPrompt:
      "Where could AI remove repetitive writing or sorting while the final call still clearly belongs to a person?",
    quiz: {
      question: "What is the practical value of human-in-the-loop design?",
      options: [
        { text: "It keeps human accountability while AI handles repetitive first-pass work", correct: true },
        { text: "It slows every workflow for no reason", correct: false },
        { text: "It means the AI is not allowed to help at all", correct: false },
      ],
      correctExplanation:
        "Right. The model can save time while the human stays in control of the meaningful decision.",
      wrongExplanation:
        "Human-in-the-loop is not about blocking AI. It is about placing review and responsibility in the right spot.",
    },
    relatedLinks: [
      { label: "OAP overview", href: "/oap" },
      { label: "Work order tracking", href: "/features/work-order-tracking" },
    ],
    color: COLORS["Safety & Quality"],
  },
  {
    id: "human-on-the-loop",
    name: "Human on the Loop",
    icon: "🧑‍🏭",
    category: "Safety & Quality",
    oneLiner: "Human on the loop means the system runs, but a person still monitors it and can step in.",
    plain:
      "**Human on the loop** means the AI or automated system is allowed to keep moving through its workflow, while a person watches the process, checks exceptions, and intervenes when something looks wrong or important enough to stop.",
    whyItMatters:
      "This model fits cases where you want more speed than constant approval allows, but still need visible oversight, escalation paths, and clear human responsibility.",
    visual: {
      body:
        "Think of two different control styles. In human-in-the-loop, the line pauses for a person to approve a meaningful step. In human-on-the-loop, the line keeps moving while a person watches the board, reviews alerts, and steps in when needed.",
      breakdown: ["System runs", "Human monitors", "Alert or exception appears", "Human intervenes if needed"],
      note:
        "The difference is not whether a human exists. The difference is when the person has to act: before the next step, or only when oversight says intervention is needed.",
    },
    analogy: {
      aiSide: "The workflow can continue by default, but a human stays responsible for watching, auditing, and interrupting when conditions justify it.",
      shopSide: "Like a supervisor watching several machines, dashboards, or alarms at once instead of manually approving every single cycle before it begins.",
    },
    examples: ["Queue monitoring", "Exception review", "Alert-driven escalation"],
    sparkPrompt:
      "Where would continuous monitoring with exception handling work better than forcing a person to approve every single step?",
    quiz: {
      question: "What separates human-on-the-loop from human-in-the-loop?",
      options: [
        { text: "Human-on-the-loop allows the system to keep moving while a person monitors and can intervene", correct: true },
        { text: "Human-on-the-loop means no human responsibility at all", correct: false },
        { text: "Human-on-the-loop is only another name for manual work", correct: false },
      ],
      correctExplanation:
        "Right. The main distinction is when the person acts. On-the-loop means oversight and intervention authority without requiring approval at every step.",
      wrongExplanation:
        "Human-on-the-loop still includes human responsibility. The person is monitoring and able to step in, even if they are not approving every single action in advance.",
    },
    relatedLinks: [
      { label: "Quality management", href: "/features/quality-management" },
      { label: "Manufacturing oversight", href: "/features/manufacturing-oversight" },
    ],
    color: COLORS["Safety & Quality"],
  },
];

export const SEO_RELATED_TERMS = [
  "AI for manufacturing",
  "AI glossary for machinists",
  "RAG for shop floor knowledge",
  "MCP and AI tools",
  "agent workflows in manufacturing",
  "AI ideas from operators",
];

export const FEATURED_TERM_IDS = [
  "token",
  "context-window",
  "environment",
  "chat-agent",
  "rag",
  "human-in-the-loop",
] as const;

export function getLearnTermById(id: string) {
  return TERMS.find((term) => term.id === id);
}

export function getFeaturedLearnTerms() {
  return FEATURED_TERM_IDS.map((id) => getLearnTermById(id)).filter((term): term is LearnTerm => Boolean(term));
}
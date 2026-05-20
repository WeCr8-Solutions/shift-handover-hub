import type { TutorialInstallGuideData } from "./TutorialInstallGuide";

export const openClawInstallData: TutorialInstallGuideData = {
  title: "OpenClaw Install Guide | Learning Center",
  badge: "OpenClaw install",
  pathLabel: "OpenClaw",
  description:
    "A practical OpenClaw install guide covering the recommended installer, alternate package-manager paths, verification steps, and early troubleshooting for Windows, WSL2, macOS, and Linux users.",
  canonical: "/learn/tutorials/openclaw-install",
  keywords:
    "OpenClaw install guide, OpenClaw tutorial, install OpenClaw Windows, install OpenClaw WSL2, OpenClaw npm install, OpenClaw source install",
  searchIntent:
    "This page is for someone who searched how to install OpenClaw, wants the fastest safe path first, and also wants backup options if they manage Node themselves or prefer a source checkout.",
  note:
    "This is an original walkthrough built from OpenClaw's public install documentation and public search results. It summarizes the paths most people need first instead of mirroring the vendor docs line for line.",
  orientation: {
    eli5:
      "OpenClaw is like giving an AI worker a desk, a phone, and a rulebook on your computer. This tutorial helps you get that worker installed so it can start handling tasks instead of just being an idea in a browser tab.",
    outcome:
      "By the end, you should have the OpenClaw command available on your machine, onboarding complete, and a working local agent environment you can build into a simple agentic system such as triage, research, or operations follow-up.",
    idealFor: [
      "You want the fastest path from zero to a working local AI agent environment.",
      "You are comfortable copying a few terminal commands but do not want to debug a custom stack from scratch.",
      "You want to experiment with lightweight agent workflows before wiring them into a business process.",
    ],
    avoidIf: [
      "You need a heavily sandboxed OpenClaw setup with guided provider and policy choices first. Start with NemoClaw instead.",
      "You only want a hosted chat app and do not actually need a local agent runtime.",
    ],
  },
  prerequisites: {
    title: "Before you install OpenClaw",
    description: "Start with the practical checks that reduce setup churn and false starts.",
    items: [
      "Use WSL2 on Windows when you want the most stable Unix-like install path. Native Windows is supported, but WSL2 is called out as the steadier option in the public docs.",
      "Expect Node 24 or Node 22.19+ if you manage Node yourself. The hosted installer can handle Node automatically.",
      "Choose your install path before you start: hosted installer for speed, package manager if you already manage Node, or source install if you want a contributor workflow.",
    ],
  },
  installMethods: [
    {
      title: "Recommended path: hosted installer",
      body:
        "Use the hosted installer when you want the CLI installed quickly and want onboarding to launch right away. This is the shortest route for most users.",
      code: ["curl -fsSL https://openclaw.ai/install.sh | bash"],
    },
    {
      title: "Installer without onboarding",
      body:
        "Use this when you want the binary installed first and prefer to run onboarding yourself after you confirm your shell environment and provider settings.",
      code: ["curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard"],
    },
    {
      title: "Manual package-manager install",
      body:
        "If you already manage Node globally, a package-manager install keeps the flow familiar. After install, run onboarding and install the daemon if you want managed startup.",
      code: ["npm install -g openclaw@latest", "openclaw onboard --install-daemon"],
    },
    {
      title: "From source",
      body:
        "Use the source workflow when you want local control of the repo, build steps, and contributor tooling.",
      code: [
        "git clone https://github.com/openclaw/openclaw.git",
        "cd openclaw",
        "pnpm install && pnpm build && pnpm ui:build",
        "pnpm link --global",
        "openclaw onboard --install-daemon",
      ],
    },
  ],
  verification: [
    "Run `openclaw --version` to confirm the CLI is available in your shell.",
    "Run `openclaw doctor` to catch local config or dependency issues early.",
    "Run `openclaw gateway status` to confirm the gateway is up before you assume onboarding is complete.",
    "If `openclaw` is not found, check `node -v`, `npm prefix -g`, and whether your global bin directory is in PATH.",
  ],
  firstWorkflow: {
    title: "Make a simple shift-handoff helper",
    scenario:
      "Ask your agent to turn rough end-of-shift notes into a clean summary with priorities, blockers, and next actions for the next operator or supervisor.",
    whyItMatters:
      "This is the fastest business-facing proof because it turns messy text into a repeatable handoff workflow that saves time immediately and is easy for a non-technical person to judge.",
    steps: [
      "1. Finish install and onboarding so the OpenClaw command works reliably.",
      "2. Open the local interface or agent shell that onboarding created.",
      "3. Paste a real or sample handoff note from a machine, cell, or shift.",
      "4. Ask the agent to rewrite it into a structured handoff with urgent items first.",
      "5. Compare the output against what a supervisor would actually need on the next shift.",
    ],
    starterPrompt:
      'Turn this rough end-of-shift note into a clean manufacturing handoff with sections for machine status, blockers, quality risks, missing materials, and the first three actions for the next shift. Keep it short and practical.',
    successChecks: [
      "The response is clearer than the original note and easy to scan in under 30 seconds.",
      "It surfaces blockers and next actions instead of only rephrasing the note.",
      "A parent or non-technical manager could read it and understand what to do next.",
    ],
  },
  nextSteps: [
    {
      title: "Launch onboarding when you are ready",
      body:
        "If you used the default hosted installer, onboarding should launch automatically. If you skipped onboarding or installed manually, start it yourself and let it configure the gateway and startup path.",
      code: ["openclaw onboard --install-daemon"],
    },
    {
      title: "Fix a shell PATH issue before retrying",
      body:
        "When the install succeeds but the shell cannot find the command, add the npm global bin directory to PATH, reload the shell, and verify again.",
      code: ["export PATH=\"$(npm prefix -g)/bin:$PATH\""],
    },
  ],
  references: [
    { label: "OpenClaw install docs", href: "https://docs.openclaw.ai/install" },
    { label: "OpenClaw installer internals", href: "https://docs.openclaw.ai/install/installer" },
  ],
  communityVideos: [
    { label: "Alex Finn: The only OpenClaw tutorial you'll ever need", href: "https://www.youtube.com/watch?v=CxErCGVo-oo" },
    { label: "Alex Finn: OpenClaw Full Tutorial - Set up your first AI employee", href: "https://www.youtube.com/watch?v=mGcdxFPwBdU" },
    { label: "Metics Media: OpenClaw Tutorial for Beginners - Full Setup Guide", href: "https://www.youtube.com/watch?v=WDHgibiZ9S8" },
    { label: "Metics Media: Full OpenClaw Setup Tutorial", href: "https://www.youtube.com/watch?v=fcZMmP5dsl4" },
    { label: "Bart Slodyczka: OpenClaw Full Tutorial for Beginners", href: "https://www.youtube.com/watch?v=BoC5MY_7aDk" },
    { label: "Alex Finn Official channel", href: "https://www.youtube.com/@AlexFinnOfficial" },
    { label: "Greg Isenberg channel", href: "https://www.youtube.com/@GregIsenberg" },
  ],
  creatorChannels: [
    { label: "Alex Finn YouTube channel", href: "https://www.youtube.com/@AlexFinnOfficial" },
    { label: "Greg Isenberg YouTube channel", href: "https://www.youtube.com/@GregIsenberg" },
  ],
  relatedLinks: [
    { label: "See Hermes install guide", href: "/learn/tutorials/hermes-install" },
    { label: "See NemoClaw install guide", href: "/learn/tutorials/nemoclaw-install" },
    { label: "Browse AI fundamentals", href: "/learn/fundamentals" },
  ],
  faq: [
    {
      question: "What is the fastest way to install OpenClaw?",
      answer: "The hosted installer script is the fastest path because it can install Node if needed, install OpenClaw, and launch onboarding in one flow.",
    },
    {
      question: "Should Windows users prefer WSL2 for OpenClaw?",
      answer: "WSL2 is the more stable option when you want the Unix-style install path, even though native Windows is supported.",
    },
  ],
};

export const hermesInstallData: TutorialInstallGuideData = {
  title: "Hermes Install Guide | Learning Center",
  badge: "Hermes install",
  pathLabel: "Hermes",
  description:
    "A practical Hermes install guide using NemoClaw's Hermes agent flow, including onboarding, non-interactive setup, API endpoint checks, and the most important differences from the standard OpenClaw path.",
  canonical: "/learn/tutorials/hermes-install",
  keywords:
    "Hermes install guide, Hermes agent setup, install Hermes with NemoClaw, nemohermes onboarding, Hermes OpenAI compatible API",
  searchIntent:
    "This page is for someone searching how to install Hermes, usually because they want a basic local or sandboxed setup path and need to know which NemoClaw-specific commands actually matter.",
  note:
    "This page is original guidance derived from NVIDIA's public NemoClaw Hermes quickstart. Hermes is marked experimental in that source, so this guide keeps the focus on safe first-run setup and verification rather than production claims.",
  orientation: {
    eli5:
      "Hermes is like setting up a specialized AI worker inside a protected workshop instead of dropping it directly onto your laptop. You still get an agent, but the setup goes through NemoClaw so the environment is more structured.",
    outcome:
      "By the end, you should have a Hermes sandbox you can connect to, a health endpoint you can verify, and the minimum context needed to start experimenting with a more controlled agentic setup.",
    idealFor: [
      "You want to try an agent inside a sandboxed flow rather than a looser direct install.",
      "You plan to connect tools or clients to an OpenAI-compatible endpoint after setup.",
      "You want a stepping stone toward multi-agent or guarded agent experiments without designing the whole platform yourself.",
    ],
    avoidIf: [
      "You want the simplest beginner path with the least moving parts. Start with OpenClaw first.",
      "You need production-grade guarantees today. Hermes is described as experimental in the source docs.",
    ],
  },
  prerequisites: {
    title: "Before you install Hermes",
    description: "Confirm the environment assumptions that are unique to the Hermes flow before you start onboarding.",
    items: [
      "Treat Hermes as experimental and avoid positioning it as production-ready without your own qualification work.",
      "Review the NemoClaw prerequisites first because the Hermes flow uses the same sandbox and host-preflight model.",
      "Plan a unique sandbox name if you want Hermes and OpenClaw running side by side instead of reusing the default `hermes` name.",
    ],
  },
  installMethods: [
    {
      title: "Recommended path: install NemoClaw with the Hermes agent selected",
      body:
        "Set the agent selector first, then launch the public NemoClaw installer. This installs the CLI and starts onboarding with the Hermes alias preselected.",
      code: ["export NEMOCLAW_AGENT=hermes", "curl -fsSL https://www.nvidia.com/nemoclaw.sh | bash"],
    },
    {
      title: "If NemoClaw is already installed",
      body:
        "Use the Hermes-specific onboarding alias directly when the base CLI is already on the machine and you only need the Hermes sandbox flow.",
      code: ["nemohermes onboard"],
    },
    {
      title: "Non-interactive setup",
      body:
        "For repeatable scripting or CI, set the Hermes agent, accept the third-party notice, define a sandbox name, stage the provider credential, and run the same installer.",
      code: [
        "export NEMOCLAW_AGENT=hermes",
        "export NEMOCLAW_NON_INTERACTIVE=1",
        "export NEMOCLAW_ACCEPT_THIRD_PARTY_SOFTWARE=1",
        "export NEMOCLAW_SANDBOX_NAME=my-hermes",
        "export NVIDIA_API_KEY=<your-key>",
        "curl -fsSL https://www.nvidia.com/nemoclaw.sh | bash",
      ],
    },
  ],
  verification: [
    "Check the forwarded health endpoint with `curl -sf http://127.0.0.1:8642/health` after onboarding completes.",
    "If the endpoint stops responding after a restart, start the forward again with `openshell forward start --background 8642 my-hermes`.",
    "Use `nemohermes my-hermes status` and `nemohermes my-hermes logs --follow` before you troubleshoot model or client settings.",
  ],
  firstWorkflow: {
    title: "Stand up a guarded research-and-response helper",
    scenario:
      "Use Hermes to expose a controlled local endpoint, then send it a request that summarizes a production issue and proposes next checks without pretending it has done work it has not actually done.",
    whyItMatters:
      "This proves the endpoint is alive and gives you a realistic first step toward agentic systems that need API access, structured inputs, and stronger boundaries than a loose chat workflow.",
    steps: [
      "1. Complete onboarding and confirm the health endpoint responds.",
      "2. Connect to the Hermes sandbox or client path you plan to use.",
      "3. Send a short production issue summary, such as late material arrival or recurring downtime.",
      "4. Ask Hermes for a structured response with assumptions, likely causes, and next checks.",
      "5. Review whether the answer stays grounded instead of inventing facts.",
    ],
    starterPrompt:
      'A CNC cell missed its schedule because material arrived late and one machine had repeated downtime alarms. Summarize the situation, list likely causes, and propose the next five checks without claiming anything that is not in the input.',
    successChecks: [
      "The endpoint returns a usable response through the Hermes flow.",
      "The answer is structured and cautious instead of overconfident.",
      "You can imagine plugging the same response shape into a ticket, dashboard, or ops workflow.",
    ],
  },
  nextSteps: [
    {
      title: "Connect to the Hermes sandbox",
      body:
        "Once onboarding finishes, connect to the sandbox through the Hermes alias and start the Hermes CLI inside the environment.",
      code: ["nemohermes my-hermes connect", "hermes"],
    },
    {
      title: "Configure your client correctly",
      body:
        "Hermes exposes an OpenAI-compatible API on port 8642. Use the base URL shown by onboarding and do not treat it like an OpenClaw browser dashboard token flow.",
      code: ["curl -sf http://127.0.0.1:8642/health"],
    },
  ],
  references: [
    { label: "NemoClaw Hermes quickstart", href: "https://docs.nvidia.com/nemoclaw/latest/get-started/quickstart-hermes" },
    { label: "NemoClaw inference options", href: "https://docs.nvidia.com/nemoclaw/latest/inference/inference-options" },
  ],
  communityVideos: [
    { label: "Tech With Tim: Hermes Agent Full Tutorial for Beginners | Setup Guide", href: "https://www.youtube.com/watch?v=1ve4Atbqmoo" },
    { label: "Metics Media: Full Hermes Agent Setup Tutorial", href: "https://www.youtube.com/watch?v=uycgV-eulGE" },
    { label: "Clearmud: Install Hermes Agent on Windows in 10 Minutes", href: "https://www.youtube.com/watch?v=VT-E0OPPr2g" },
    { label: "Alex Finn Official channel", href: "https://www.youtube.com/@AlexFinnOfficial" },
    { label: "Greg Isenberg channel", href: "https://www.youtube.com/@GregIsenberg" },
  ],
  creatorChannels: [
    { label: "Alex Finn YouTube channel", href: "https://www.youtube.com/@AlexFinnOfficial" },
    { label: "Greg Isenberg YouTube channel", href: "https://www.youtube.com/@GregIsenberg" },
  ],
  relatedLinks: [
    { label: "See OpenClaw install guide", href: "/learn/tutorials/openclaw-install" },
    { label: "See NemoClaw install guide", href: "/learn/tutorials/nemoclaw-install" },
    { label: "See role-based AI guides", href: "/learn/professions" },
  ],
  faq: [
    {
      question: "Can I install Hermes without reinstalling NemoClaw from scratch?",
      answer: "Yes. If the base CLI is already installed, you can start Hermes onboarding directly with `nemohermes onboard`.",
    },
    {
      question: "Does Hermes use the same browser dashboard flow as OpenClaw?",
      answer: "No. Hermes exposes an OpenAI-compatible API endpoint on port 8642 rather than the OpenClaw dashboard flow.",
    },
  ],
};

export const nemoClawInstallData: TutorialInstallGuideData = {
  title: "NemoClaw Install Guide | Learning Center",
  badge: "NemoClaw install",
  pathLabel: "NemoClaw",
  description:
    "A practical NemoClaw install guide covering the public quickstart flow, onboarding options, provider selection, network policy decisions, and the fastest way to verify that the sandbox and OpenClaw UI are actually reachable.",
  canonical: "/learn/tutorials/nemoclaw-install",
  keywords:
    "NemoClaw install guide, NemoClaw quickstart, install NemoClaw, NemoClaw onboarding, OpenClaw sandbox install",
  searchIntent:
    "This page is for someone searching how to install NemoClaw and wants the shortest path from installer to a working sandbox, provider selection, and first prompt without reading the entire product manual first.",
  note:
    "This is original tutorial copy based on NVIDIA's public NemoClaw quickstart with OpenClaw. The goal is to shorten time-to-understanding, not replace the official reference.",
  orientation: {
    eli5:
      "NemoClaw is like building a safe fenced yard for your AI worker before you let it run around. It installs the tooling, creates the sandbox, and walks you through choices that affect how much freedom the agent has.",
    outcome:
      "By the end, you should have a working sandbox, a chosen provider, access to the OpenClaw UI or terminal workflow, and a cleaner foundation for agentic systems that need more guardrails than a direct install.",
    idealFor: [
      "You want guided onboarding with clearer security and network choices.",
      "You expect to test agent behavior in a more controlled environment.",
      "You want the better path for people who may later care about policy, provider selection, and safe experimentation.",
    ],
    avoidIf: [
      "You only want the quickest possible first demo and do not care about sandbox decisions yet. Start with OpenClaw.",
      "You are not ready to think about provider keys, Docker checks, or sandbox lifecycle commands.",
    ],
  },
  prerequisites: {
    title: "Before you install NemoClaw",
    description: "Validate the host and provider setup first so the installer can finish without avoidable retries.",
    items: [
      "Review the published NemoClaw prerequisites before you run the installer, especially if you are on Windows, using Docker, or working inside a managed host.",
      "Expect Docker checks on Linux and a guided Docker path when Docker is missing. On macOS, plan around Docker Desktop or Colima.",
      "Set your inference-provider API key in the shell before install if you want fewer prompts during onboarding.",
    ],
  },
  installMethods: [
    {
      title: "Recommended path: installer plus guided onboarding",
      body:
        "The public installer installs the CLI, starts guided onboarding, creates a fresh OpenClaw sandbox, and walks you through provider and policy choices.",
      code: ["curl -fsSL https://www.nvidia.com/nemoclaw.sh | bash"],
    },
    {
      title: "Non-interactive path",
      body:
        "For automation or CI, explicitly accept the third-party notice and run the installer in non-interactive mode.",
      code: [
        "curl -fsSL https://www.nvidia.com/nemoclaw.sh | NEMOCLAW_NON_INTERACTIVE=1 NEMOCLAW_ACCEPT_THIRD_PARTY_SOFTWARE=1 bash",
      ],
    },
    {
      title: "Recover when the CLI is installed but not in PATH",
      body:
        "If the installer finishes but the shell does not see the new command yet, reload the shell environment before you retry onboarding.",
      code: ["source ~/.bashrc", "# or source ~/.zshrc"],
    },
  ],
  verification: [
    "Confirm the install summary shows the sandbox name, provider, and the follow-up lifecycle commands.",
    "Open the dashboard URL printed by onboarding and be ready to fetch the gateway token if the browser asks for authentication.",
    "Use `nemoclaw my-gpt-claw connect` and then `openclaw agent --agent main --local -m \"hello\" --session-id test` to confirm the first terminal prompt works.",
  ],
  firstWorkflow: {
    title: "Build a sandboxed daily-ops assistant",
    scenario:
      "Use the sandbox to run a first prompt that turns a daily production update into a prioritized operations summary while keeping the experiment inside a more controlled environment.",
    whyItMatters:
      "This shows the value of NemoClaw immediately: you are not only installing tooling, you are creating a safer place to test agent behavior before you trust it with bigger workflows.",
    steps: [
      "1. Finish guided onboarding and note the sandbox name and provider choice.",
      "2. Open the dashboard or connect through the terminal.",
      "3. Paste a small production summary with delays, material issues, and one quality concern.",
      "4. Ask the agent to produce a prioritized daily-ops brief with risks and recommended actions.",
      "5. Decide whether the sandbox setup gives you the control you wanted before expanding the workflow.",
    ],
    starterPrompt:
      'Create a daily operations brief from this production update. Put urgent issues first, call out quality or delivery risks, and end with the three actions a plant lead should review before the next meeting.',
    successChecks: [
      "The sandbox is reachable from the UI or terminal path you chose.",
      "The output is useful enough that an operations lead would save it or forward it.",
      "You leave with a clearer sense of how policy and provider choices affect agent behavior.",
    ],
  },
  nextSteps: [
    {
      title: "Choose your provider and policy carefully during onboarding",
      body:
        "The onboarding wizard is not just a cosmetic setup. It determines the inference route, optional web search, messaging channels, and network policy preset that shape the sandbox you end up running.",
    },
    {
      title: "Open the UI or connect from the terminal",
      body:
        "After a successful build, use the printed dashboard URL for browser access or connect to the sandbox in the terminal for a CLI-first workflow.",
      code: ["nemoclaw my-gpt-claw connect", "openclaw agent --agent main --local -m \"hello\" --session-id test"],
    },
  ],
  references: [
    { label: "NemoClaw quickstart with OpenClaw", href: "https://docs.nvidia.com/nemoclaw/latest/get-started/quickstart.html" },
    { label: "NemoClaw prerequisites", href: "https://docs.nvidia.com/nemoclaw/latest/get-started/prerequisites" },
  ],
  communityVideos: [
    { label: "Metics Media: NemoClaw Tutorial - Run OpenClaw Safely with NVIDIA", href: "https://www.youtube.com/watch?v=M0ciMpB-EMY" },
    { label: "Alex Finn Official channel", href: "https://www.youtube.com/@AlexFinnOfficial" },
    { label: "Greg Isenberg channel", href: "https://www.youtube.com/@GregIsenberg" },
  ],
  creatorChannels: [
    { label: "Alex Finn YouTube channel", href: "https://www.youtube.com/@AlexFinnOfficial" },
    { label: "Greg Isenberg YouTube channel", href: "https://www.youtube.com/@GregIsenberg" },
  ],
  relatedLinks: [
    { label: "See OpenClaw install guide", href: "/learn/tutorials/openclaw-install" },
    { label: "See Hermes install guide", href: "/learn/tutorials/hermes-install" },
    { label: "Return to tutorial tracks", href: "/learn/tutorials" },
  ],
  faq: [
    {
      question: "What does the NemoClaw installer do after installation?",
      answer: "It can immediately launch guided onboarding to create a sandbox, choose an inference provider, and apply security and network settings.",
    },
    {
      question: "How do I verify the NemoClaw dashboard is reachable?",
      answer: "Use the dashboard URL printed in the install summary and retrieve the gateway token with the provided command if the browser asks for authentication.",
    },
  ],
};
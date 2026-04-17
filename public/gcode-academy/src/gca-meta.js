// ═══════════════════════════════════════════════════════════════════
// GCA-META.JS — Curriculum Metadata, Versioning & Changelog
// GCode Academy | WeCr8 Solutions LLC
// ═══════════════════════════════════════════════════════════════════

const GCA_META = {
  version: '4.0.0',
  released: '2025-04-16',
  authors: ['WeCr8 Solutions LLC'],
  contact: 'hello@jobline.ai',

  changelog: [
    {
      version: '4.0.0',
      date: '2025-04-16',
      summary: 'Full architecture rebuild — modular curriculum, controller tests, GD&T, progress tracking',
      changes: [
        'Separated curriculum data, meta, tests, and engine into logical modules',
        'Added revision tracking per lesson (lesson.rev, lesson.revised)',
        'Added full controller test bank: Fanuc, Haas, Siemens, Heidenhain',
        'Added machine-type test bank: VMC, Lathe, Swiss, HMC',
        'Added GD&T module with symbols, tolerancing, and datum reference testing',
        'Added Interview Prep mode with timed tests and scoring',
        'Added visual stepped progress tracker with milestone badges',
        'Restructured Beginner level: operator-first, no programming assumed',
        'Restructured Intermediate level: setup tech — MDI, hand programming, canned cycles',
        'Corrected level progression: G96/G97 moved from Beginner to Intermediate',
      ]
    },
    {
      version: '3.0.0',
      date: '2025-04-15',
      summary: 'Two-track system (Lathe + Mill), four levels, live calculators',
      changes: [
        'Added CNC Mill track alongside CNC Lathe',
        'Added four-level structure: Beginner / Intermediate / Advanced / Automation',
        'Added G96/G97 RPM calculator and G50 advisor',
        'Added quiz system with immediate feedback',
        'Added Pro subscription gate with Stripe-ready modal',
      ]
    },
    {
      version: '2.0.0',
      date: '2025-04-14',
      summary: 'Initial G-Code reference tool with theory, code, quiz tabs',
      changes: [
        'Launched interactive G-code reference with syntax-highlighted code blocks',
        'Added tabbed lesson cards: Theory / Code / Calculator / Quiz',
        'Established WeCr8 / JobLine.ai branding',
      ]
    },
  ],

  tracks: {
    lathe:  { label: 'CNC Lathe',  icon: '⚙️',  color: '#00e5b0', desc: 'Turning, threading, boring, live tooling' },
    mill:   { label: 'CNC Mill',   icon: '🔩',  color: '#4a9eff', desc: 'Milling, drilling, boring, 4/5-axis' },
    gdnt:   { label: 'GD&T',       icon: '📐',  color: '#a78bfa', desc: 'Geometric Dimensioning & Tolerancing' },
  },

  levels: {
    beginner:     { label: 'Beginner',     color: '#00e5b0', icon: '🟢', suf: 'beg',  goal: 'Floor-ready CNC operator' },
    intermediate: { label: 'Intermediate', color: '#4a9eff', icon: '🔵', suf: 'int',  goal: 'Setup technician — MDI, hand programming' },
    advanced:     { label: 'Advanced',     color: '#ff6b35', icon: '🔴', suf: 'adv',  goal: 'Full CNC programmer' },
    automation:   { label: 'Automation',   color: '#a78bfa', icon: '🤖', suf: 'auto', goal: 'Senior programmer / manufacturing engineer' },
  },

  milestones: [
    { id: 'op-ready',    label: 'Operator Ready',    req: 8,  track: 'any',   level: 'beginner',     icon: '🟢', desc: 'Completed all Beginner operator lessons' },
    { id: 'setup-ready', label: 'Setup Tech',        req: 5,  track: 'any',   level: 'intermediate', icon: '🔵', desc: 'Hand programming and MDI proficient' },
    { id: 'programmer',  label: 'CNC Programmer',    req: 5,  track: 'any',   level: 'advanced',     icon: '🔴', desc: 'Full program authoring capability' },
    { id: 'lathe-cert',  label: 'Lathe Certified',   req: 12, track: 'lathe', level: 'beginner',     icon: '⚙️', desc: 'All lathe beginner lessons complete' },
    { id: 'mill-cert',   label: 'Mill Certified',    req: 9,  track: 'mill',  level: 'beginner',     icon: '🔩', desc: 'All mill beginner lessons complete' },
    { id: 'gdnt-basic',  label: 'GD&T Fundamentals', req: 5,  track: 'gdnt',  level: 'beginner',     icon: '📐', desc: 'GD&T symbols and tolerance types' },
    { id: 'automation',  label: 'Automation Ready',  req: 5,  track: 'any',   level: 'automation',   icon: '🤖', desc: 'Macro and integration capable' },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// GCA.CONFIG.JS — Tenant Configuration & Design Token System
// Swap this block to deploy on wecr8.info vs jobline.ai
// WeCr8 Solutions LLC | v1.0.0
// ═══════════════════════════════════════════════════════════════════

const GCA_CONFIG = {

  // ── ACTIVE TENANT ────────────────────────────────────────────────
  // Change this one value to switch tenant context.
  // 'wecr8' | 'jobline'
  tenant: 'jobline',

  tenants: {
    wecr8: {
      id: 'wecr8',
      brand: 'WeCr8',
      productName: 'G-Code Academy',
      tagline: 'Built by machinists, for machinists.',
      domain: 'wecr8.info',
      contactEmail: 'contact@wecr8.info',
      logoMark: 'WeCr8',
      logoAccent: 'Solutions',
      footerLinks: [
        { label: 'wecr8.info', href: 'https://wecr8.info' },
        { label: 'jobline.ai', href: 'https://jobline.ai' },
        { label: 'contact@wecr8.info', href: 'mailto:contact@wecr8.info' },
      ],
      // Feature flags — which modules are exposed on this tenant
      features: {
        lathe: true,
        mill: true,
        gdnt: true,
        tests: true,
        progress: true,
        changelog: true,
        joblinePromo: true,    // show JobLine.ai cross-promo in automation lessons
      },
      // Pricing
      pricing: {
        monthly: { price: '$19', period: 'per month' },
        annual:  { price: '$149', period: 'per year', savings: 'SAVE $79 ✓' },
        cta: 'Unlock All Courses & Tests',
        contactNote: 'Questions? contact@wecr8.info',
      },
    },

    jobline: {
      id: 'jobline',
      brand: 'JobLine',
      productName: 'Operator Training',
      tagline: 'Train your team. Track their progress.',
      domain: 'jobline.ai',
      contactEmail: 'hello@jobline.ai',
      logoMark: 'Job',
      logoAccent: 'Line.ai',
      footerLinks: [
        { label: 'jobline.ai', href: 'https://jobline.ai' },
        { label: 'hello@jobline.ai', href: 'mailto:hello@jobline.ai' },
      ],
      features: {
        lathe: true,
        mill: true,
        gdnt: true,
        tests: true,
        progress: true,
        changelog: false,      // hide changelog on jobline — internal detail
        joblinePromo: false,   // already on jobline
      },
      pricing: {
        monthly: { price: '$19', period: 'per seat / month' },
        annual:  { price: '$149', period: 'per seat / year', savings: 'SAVE $79 ✓' },
        cta: 'Unlock Team Access',
        contactNote: 'Team plans available · hello@jobline.ai',
      },
    },
  },

  // ── DESIGN TOKEN SYSTEM ──────────────────────────────────────────
  // All visual values. Swap token sets to retheme per tenant.
  tokens: {
    // Base palette (shared)
    color: {
      bg:          '#14181f',
      surface:     '#191d25',
      card:        '#1b1f27',
      border:      '#303541',
      border2:     '#3a4052',
      text:        '#f0f2f5',
      muted:       '#4a5567',
      muted2:      '#7b899d',
      codeBg:      '#0f1117',
      // Semantic
      accent:      '#22b6c3',   // JobLine teal
      accent2:     '#ff6b35',   // orange
      gold:        '#f5c518',   // pro/unlock
      purple:      '#a78bfa',   // GD&T / automation
      blue:        '#4a9eff',   // mill / info
      green:       '#22b6c3',
      red:         '#ff4757',
    },
    // Level colors
    level: {
      beginner:     '#22b6c3',
      intermediate: '#4a9eff',
      advanced:     '#ff6b35',
      automation:   '#a78bfa',
    },
    // Typography
    font: {
      mono: "'JetBrains Mono', monospace",
      head: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    // Spacing (base unit = 4px)
    space: {
      xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '20px', xxl: '28px',
    },
    // Border radius
    radius: { sm: '4px', md: '6px', lg: '8px', xl: '10px' },
  },

  // ── AUTH CONFIGURATION ───────────────────────────────────────────
  // Wire real endpoints here to activate auth.
  auth: {
    enabled: false,           // Set true when backend is wired
    provider: 'local',        // 'local' | 'supabase' | 'auth0' | 'clerk'

    // Endpoint stubs (fill in real URLs)
    endpoints: {
      login:    '/api/auth/login',
      register: '/api/auth/register',
      logout:   '/api/auth/logout',
      me:       '/api/auth/me',
      refresh:  '/api/auth/refresh',
    },

    // Supabase config (if provider = 'supabase')
    supabase: {
      url:     '',   // 'https://xxxx.supabase.co'
      anonKey: '',   // 'eyJhbGciOiJIUzI1NiIs...'
    },

    // JWT settings
    jwt: {
      storageKey: 'gca_token',
      refreshKey: 'gca_refresh',
      expiryKey:  'gca_token_exp',
    },

    // Pro access control
    proTiers: ['pro', 'team', 'enterprise'],
    freeTier: 'free',
  },

  // ── PROGRESS SYNC ────────────────────────────────────────────────
  progress: {
    // When auth.enabled = false, uses localStorage only
    // When auth.enabled = true, syncs to backend on each action
    syncEndpoint: '/api/progress/sync',
    localKey: 'gca-v1-progress',
    // Throttle: max sync calls per minute
    throttleMs: 2000,
  },

  // ── STRIPE INTEGRATION ───────────────────────────────────────────
  stripe: {
    enabled: true,
    publishableKey: '',       // not needed — checkout via edge function
    // Price IDs (from Stripe dashboard) — G-Code Academy product
    prices: {
      monthly: 'price_1TN4g9CyekafHX788v10vyWz', // $19/mo
      annual:  'price_1TN4jwCyekafHX785ZAg0oue', // $149/yr
    },
    productId: 'prod_ULmEqvUEDTTrpp',
    checkoutEndpoint: '/api/stripe/create-checkout',
    portalEndpoint:   '/api/stripe/portal',
  },

  // ── ANALYTICS ────────────────────────────────────────────────────
  analytics: {
    enabled: false,
    provider: 'plausible',   // 'plausible' | 'posthog' | 'ga4'
    siteId: '',
  },

  // ── API ──────────────────────────────────────────────────────────
  api: {
    baseUrl: '/api',
    version: 'v1',
    timeout: 10000,
  },
};

// Resolved config for active tenant
GCA_CONFIG.active = GCA_CONFIG.tenants[GCA_CONFIG.tenant];

// CSS variable injection from tokens
GCA_CONFIG.injectTokens = function() {
  const t = GCA_CONFIG.tokens;
  const c = t.color;
  const root = document.documentElement;
  const vars = {
    '--bg': c.bg, '--surface': c.surface, '--card': c.card,
    '--border': c.border, '--border2': c.border2,
    '--text': c.text, '--muted': c.muted, '--muted2': c.muted2,
    '--code-bg': c.codeBg,
    '--accent': c.accent, '--accent2': c.accent2,
    '--gold': c.gold, '--purple': c.purple,
    '--blue': c.blue, '--green': c.green, '--red': c.red,
    '--mono': t.font.mono, '--head': t.font.head, '--body': t.font.body,
    '--beg': t.level.beginner, '--int': t.level.intermediate,
    '--adv': t.level.advanced, '--auto': t.level.automation,
  };
  Object.entries(vars).forEach(([k,v]) => root.style.setProperty(k, v));
};

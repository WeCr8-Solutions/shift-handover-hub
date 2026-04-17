// ═══════════════════════════════════════════════════════════════════
// GCA.AUTH.JS — Authentication Layer & Profile Management
// Ready to wire: localStorage now → real backend when enabled
// WeCr8 Solutions LLC | v1.0.0
// ═══════════════════════════════════════════════════════════════════

const GCA_AUTH = {

  // ── USER PROFILE SCHEMA ──────────────────────────────────────────
  // This is the shape of a user record — matches what a backend returns
  _profileSchema: {
    id: null,             // UUID from backend
    email: '',
    name: '',
    tier: 'free',         // 'free' | 'pro' | 'team' | 'enterprise'
    tenant: 'wecr8',      // 'wecr8' | 'jobline'
    createdAt: null,
    // Tracked progress (synced with backend when auth enabled)
    progress: {
      completedLessons: {},   // { 'l-b-1': { completedAt, attempts } }
      testScores: {},         // { 'ctrl-fanuc': { score, passedAt, attempts } }
      milestones: {},         // { 'op-ready': { earnedAt } }
      streakDays: 0,
      totalMinutes: 0,
      lastActivity: null,
    },
    // Preferences
    prefs: {
      defaultTrack: 'lathe',
      defaultLevel: 'beginner',
      units: 'inch',          // 'inch' | 'metric'
      notifications: true,
    },
  },

  // ── STATE ────────────────────────────────────────────────────────
  _user: null,
  _token: null,
  _listeners: [],     // components that want to re-render on auth change

  // ── CURRENT USER ─────────────────────────────────────────────────
  getUser() { return this._user; },
  isLoggedIn() { return !!this._user; },
  isPro() {
    if (!this._user) return false;
    return GCA_CONFIG.auth.proTiers.includes(this._user.tier);
  },
  // Can access a lesson (free or has pro access)
  canAccess(lesson) {
    if (lesson.free) return true;
    return this.isPro();
  },

  // ── INIT ─────────────────────────────────────────────────────────
  async init() {
    // Try to restore session from storage
    const token = this._getStoredToken();
    if (token && GCA_CONFIG.auth.enabled) {
      try {
        await this.refreshSession(token);
      } catch(e) {
        this._clearSession();
      }
    } else if (!GCA_CONFIG.auth.enabled) {
      // Auth disabled: restore local guest profile
      this._user = this._loadLocalProfile();
    }
    this._notify();
  },

  // ── LOGIN ────────────────────────────────────────────────────────
  async login(email, password) {
    if (!GCA_CONFIG.auth.enabled) {
      // Dev mode: create local user
      this._user = { ...this._profileSchema, email, name: email.split('@')[0], id: 'local-'+Date.now() };
      this._saveLocalProfile();
      this._notify();
      return { success: true };
    }
    try {
      const res = await this._apiPost(GCA_CONFIG.auth.endpoints.login, { email, password });
      this._setSession(res.token, res.refresh, res.user);
      return { success: true };
    } catch(e) {
      return { success: false, error: e.message };
    }
  },

  // ── REGISTER ─────────────────────────────────────────────────────
  async register(email, password, name) {
    if (!GCA_CONFIG.auth.enabled) {
      this._user = { ...this._profileSchema, email, name: name||email.split('@')[0], id: 'local-'+Date.now() };
      this._saveLocalProfile();
      this._notify();
      return { success: true };
    }
    try {
      const res = await this._apiPost(GCA_CONFIG.auth.endpoints.register, { email, password, name, tenant: GCA_CONFIG.tenant });
      this._setSession(res.token, res.refresh, res.user);
      return { success: true };
    } catch(e) {
      return { success: false, error: e.message };
    }
  },

  // ── LOGOUT ───────────────────────────────────────────────────────
  async logout() {
    if (GCA_CONFIG.auth.enabled) {
      try { await this._apiPost(GCA_CONFIG.auth.endpoints.logout, {}); } catch(e){}
    }
    this._clearSession();
    this._notify();
  },

  // ── PROGRESS TRACKING ────────────────────────────────────────────
  async markLessonComplete(lessonId) {
    const progress = this._getProgress();
    if (!progress.completedLessons[lessonId]) {
      progress.completedLessons[lessonId] = {
        completedAt: new Date().toISOString(),
        attempts: 1,
      };
    } else {
      progress.completedLessons[lessonId].attempts++;
    }
    progress.lastActivity = new Date().toISOString();
    this._saveProgress(progress);
    await this._syncProgress();
    this._notify();
    return progress;
  },

  async recordTestScore(testId, score, passed) {
    const progress = this._getProgress();
    const existing = progress.testScores[testId];
    progress.testScores[testId] = {
      score,
      passed,
      attempts: existing ? existing.attempts + 1 : 1,
      bestScore: existing ? Math.max(existing.bestScore||0, score) : score,
      lastAttempt: new Date().toISOString(),
      ...(passed && !existing?.passedAt ? { passedAt: new Date().toISOString() } : {}),
    };
    progress.lastActivity = new Date().toISOString();
    this._saveProgress(progress);
    await this._syncProgress();
    this._notify();
  },

  async earnMilestone(milestoneId) {
    const progress = this._getProgress();
    if (!progress.milestones[milestoneId]) {
      progress.milestones[milestoneId] = { earnedAt: new Date().toISOString() };
      this._saveProgress(progress);
      await this._syncProgress();
      this._notify();
      return true; // newly earned
    }
    return false;
  },

  isLessonComplete(lessonId) {
    return !!this._getProgress().completedLessons[lessonId];
  },

  getBestScore(testId) {
    return this._getProgress().testScores[testId]?.bestScore;
  },

  hasMilestone(milestoneId) {
    return !!this._getProgress().milestones[milestoneId];
  },

  getProgress() { return this._getProgress(); },

  // ── PROFILE UPDATE ───────────────────────────────────────────────
  async updatePrefs(prefs) {
    const progress = this._getProgress();
    if (this._user) {
      this._user.prefs = { ...this._user.prefs, ...prefs };
      this._saveLocalProfile();
    }
    this._notify();
  },

  // ── SUBSCRIPTION ─────────────────────────────────────────────────
  async startCheckout(priceId) {
    if (!GCA_CONFIG.stripe.enabled) {
      // Show modal — Stripe not wired
      return { success: false, error: 'Stripe not configured' };
    }
    try {
      const res = await this._apiPost(GCA_CONFIG.stripe.checkoutEndpoint, {
        priceId, userId: this._user?.id, tenant: GCA_CONFIG.tenant,
      });
      window.location.href = res.checkoutUrl;
    } catch(e) {
      return { success: false, error: e.message };
    }
  },

  // ── LISTENERS ────────────────────────────────────────────────────
  onChange(fn) { this._listeners.push(fn); },
  _notify() { this._listeners.forEach(fn => { try { fn(this._user); } catch(e){} }); },

  // ── INTERNAL ─────────────────────────────────────────────────────
  _getProgress() {
    if (this._user) return this._user.progress;
    // Guest mode — read from localStorage
    const raw = localStorage.getItem(GCA_CONFIG.progress.localKey);
    try { return JSON.parse(raw) || this._profileSchema.progress; }
    catch(e) { return { ...this._profileSchema.progress }; }
  },

  _saveProgress(progress) {
    if (this._user) {
      this._user.progress = progress;
      this._saveLocalProfile();
    } else {
      localStorage.setItem(GCA_CONFIG.progress.localKey, JSON.stringify(progress));
    }
  },

  _syncProgress: (function() {
    var _timer = null;
    return async function() {
      if (!GCA_CONFIG.auth.enabled || !this._user) return;
      clearTimeout(_timer);
      var self = this;
      _timer = setTimeout(async function() {
        try {
          await self._apiPost(GCA_CONFIG.progress.syncEndpoint, {
            userId: self._user.id,
            progress: self._user.progress,
          });
        } catch(e) { /* silent fail — localStorage is source of truth */ }
      }, GCA_CONFIG.progress.throttleMs);
    };
  }()),

  _setSession(token, refresh, user) {
    this._token = token;
    this._user = user;
    const cfg = GCA_CONFIG.auth.jwt;
    localStorage.setItem(cfg.storageKey, token);
    if (refresh) localStorage.setItem(cfg.refreshKey, refresh);
    localStorage.setItem(cfg.expiryKey, String(Date.now() + 3600000));
  },

  _clearSession() {
    this._token = null;
    this._user = null;
    const cfg = GCA_CONFIG.auth.jwt;
    [cfg.storageKey, cfg.refreshKey, cfg.expiryKey].forEach(k => localStorage.removeItem(k));
  },

  _getStoredToken() {
    const cfg = GCA_CONFIG.auth.jwt;
    const token = localStorage.getItem(cfg.storageKey);
    const exp = parseInt(localStorage.getItem(cfg.expiryKey)||'0');
    if (!token || Date.now() > exp) return null;
    return token;
  },

  _loadLocalProfile() {
    try {
      const raw = localStorage.getItem('gca-profile');
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  },

  _saveLocalProfile() {
    if (this._user) localStorage.setItem('gca-profile', JSON.stringify(this._user));
  },

  async refreshSession(token) {
    const res = await this._apiFetch(GCA_CONFIG.auth.endpoints.me, { Authorization: `Bearer ${token}` });
    this._setSession(token, null, res.user);
  },

  async _apiPost(url, body) {
    const full = url.startsWith('http') ? url : GCA_CONFIG.api.baseUrl + url;
    const res = await fetch(full, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(this._token ? { Authorization: `Bearer ${this._token}` } : {}) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(GCA_CONFIG.api.timeout),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async _apiFetch(url, headers={}) {
    const full = url.startsWith('http') ? url : GCA_CONFIG.api.baseUrl + url;
    const res = await fetch(full, { headers: { 'Content-Type': 'application/json', ...headers } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

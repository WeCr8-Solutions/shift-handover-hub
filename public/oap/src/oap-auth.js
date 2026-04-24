// ═══════════════════════════════════════════════════════════════════
// OAP-AUTH.JS — Lightweight auth/session bridge for embedded OAP
// Scopes local OAP data to the signed-in JobLine user when available.
// ═══════════════════════════════════════════════════════════════════

'use strict';

const OAP_AUTH = {
  _user: null,
  _token: null,
  _legacyKeys: [
    'oap-employer-profile',
    'oap-employer-programs',
    'oap-employer-mentors',
    'oap-employer-mentees',
    'oap-certs',
    'oap-standalone-scores',
    'oap-standalone-certs',
  ],

  getUser() { return this._user; },
  isLoggedIn() { return !!this._user; },

  storageKey(baseKey) {
    if (!this._user || !this._user.id) return baseKey;
    return 'oap:' + this._user.id + ':' + baseKey;
  },

  getJSON(baseKey, fallbackValue) {
    try {
      const raw = localStorage.getItem(this.storageKey(baseKey));
      if (!raw) return fallbackValue;
      return JSON.parse(raw);
    } catch (error) {
      return fallbackValue;
    }
  },

  setJSON(baseKey, value) {
    try {
      localStorage.setItem(this.storageKey(baseKey), JSON.stringify(value));
    } catch (error) {
      // Ignore storage failures; the OAP still functions in-memory.
    }
  },

  setUser(user, token) {
    this._user = user || null;
    this._token = token || null;
    this._migrateLegacyData();
  },

  clearUser() {
    this._user = null;
    this._token = null;
  },

  _migrateLegacyData() {
    if (!this._user || !this._user.id) return;
    this._legacyKeys.forEach((baseKey) => {
      const scopedKey = this.storageKey(baseKey);
      if (localStorage.getItem(scopedKey) !== null) return;
      const legacyValue = localStorage.getItem(baseKey);
      if (legacyValue !== null) {
        localStorage.setItem(scopedKey, legacyValue);
      }
    });
  },
};

window.addEventListener('message', function(event) {
  if (event.origin !== window.location.origin) return;

  var msg = event.data;
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'OAP_AUTH_INIT' && msg.user) {
    OAP_AUTH.setUser(msg.user, msg.token || null);
    if (typeof oapRender === 'function') oapRender();
  }

  if (msg.type === 'OAP_AUTH_SIGNOUT') {
    OAP_AUTH.clearUser();
    if (typeof oapRender === 'function') oapRender();
  }
});
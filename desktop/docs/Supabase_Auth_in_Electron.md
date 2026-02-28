# Supabase Auth in Electron — Notes & Troubleshooting

## How Auth Works in v1

JobLine AI Desktop loads the hosted web app (`https://app.jobline.ai`) inside an Electron `BrowserWindow`. Because the web app is loaded from its hosted origin:

- **localStorage** works normally → Supabase session tokens persist
- **Cookies** work normally → same-origin, no cross-domain issues
- **CORS** is not a problem → requests come from the hosted origin

### Email / Password Login

✅ **Works natively.** No special handling required. The Supabase JS client stores the session in `localStorage` inside the Electron `BrowserWindow`, which persists across app restarts.

### OAuth (Google, Microsoft, GitHub, etc.)

⚠️ **v1 approach: System browser fallback.**

OAuth providers redirect to callback URLs. In a standard browser this is seamless, but in Electron:

1. OAuth popup/redirect is intercepted by the `setWindowOpenHandler`.
2. The URL is opened in the **system default browser**.
3. The user completes authentication in their browser.
4. The callback redirects back to the hosted web app URL.
5. The Electron `BrowserWindow` (already on that URL) picks up the session via Supabase's `onAuthStateChange`.

**Limitation**: The user must have their default browser open. The Electron window may need a manual refresh to detect the new session.

### Future: Custom Protocol Handler

A future version could register a custom protocol (`joblineai://`) to handle OAuth callbacks directly:

```
joblineai://auth/callback?access_token=...&refresh_token=...
```

This requires:
1. Registering the protocol with `app.setAsDefaultProtocolClient("joblineai")`
2. Configuring the OAuth provider to use `joblineai://` as the redirect URI
3. Parsing the tokens in the main process and injecting them into the renderer

This is **not implemented in v1** to keep the initial release simple.

## Troubleshooting

### Session lost after restart

- Verify `persistSession: true` in the Supabase client config (already set in the web app)
- Check that `localStorage` is not being cleared on app close
- Inspect: `View` → `Developer Tools` → `Application` → `Local Storage`

### OAuth redirect fails

- The OAuth URL should open in the system browser
- Check the allowlist in `main/index.ts` → `ALLOWED_EXTERNAL_DOMAINS`
- Add the OAuth provider's domain if missing

### "Access Denied" after login

- This is likely an RLS policy issue, not an Electron issue
- The desktop app uses the same backend as the web app
- Debug by checking the network tab in DevTools

### Blank screen after login

- Check internet connectivity
- Check the console for JavaScript errors (DevTools → Console)
- Verify `config.json` has the correct `appUrl`

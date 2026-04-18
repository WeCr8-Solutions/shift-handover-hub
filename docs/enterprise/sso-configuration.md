# SSO Configuration Guide for IT Administrators

**Product:** JobLine AI  
**Protocol:** SAML 2.0  
**FedRAMP Control:** IA-2, IA-8, AC-2 (G-06)  
**Last Updated:** April 2026

---

## Overview

JobLine AI supports enterprise Single Sign-On via SAML 2.0, allowing your users to authenticate with your organization's existing Identity Provider (IdP). Once configured, users can sign in to JobLine using their corporate credentials — no separate password required.

**Supported Identity Providers:**
- Microsoft Azure AD / Entra ID
- Okta
- Google Workspace
- ADFS (Active Directory Federation Services)
- OneLogin
- PingFederate
- Any SAML 2.0-compliant IdP

**Prerequisites:**
- JobLine AI Enterprise plan (SAML 2.0 requires Supabase Enterprise backend)
- Admin access to your Identity Provider
- Admin or Owner role in your JobLine organization

---

## Service Provider (SP) Information

When registering JobLine AI as an application in your IdP, use the following values:

| Field | Value |
|-------|-------|
| **SP Entity ID** | `https://jobline.ai/auth/saml/metadata` |
| **Assertion Consumer Service (ACS) URL** | `https://jobline.ai/auth/saml/acs` |
| **Name ID Format** | `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress` |
| **Sign-on URL** | `https://jobline.ai/auth/saml/login` |
| **Logout URL** | `https://jobline.ai/auth/saml/logout` |
| **Binding** | HTTP POST |
| **Signature Algorithm** | RSA-SHA256 |

> **Self-hosted deployments:** Replace `jobline.ai` with your self-hosted domain (e.g., `https://your-domain.com`).

---

## Step 1 — Create the Application in Your IdP

### Microsoft Azure AD / Entra ID

1. Go to **Azure Portal → Azure Active Directory → Enterprise Applications**.
2. Click **+ New application → Create your own application**.
3. Select **"Integrate any other application you don't find in the gallery (Non-gallery)"**.
4. Name it `JobLine AI` and click **Create**.
5. Under **Single sign-on**, select **SAML**.
6. In **Basic SAML Configuration**, enter:
   - **Identifier (Entity ID):** `https://jobline.ai/auth/saml/metadata`
   - **Reply URL (ACS):** `https://jobline.ai/auth/saml/acs`
   - **Sign-on URL:** `https://jobline.ai/auth/saml/login`
7. Under **Attributes & Claims**, confirm the **email** attribute maps to `user.mail` or `user.userprincipalname`.
8. Under **SAML Signing Certificate**, click **Download Federation Metadata XML** — you'll use this URL in JobLine.
9. Assign the application to the relevant users or group.

**Metadata URL format:**
```
https://login.microsoftonline.com/<tenant-id>/federationmetadata/2007-06/federationmetadata.xml
```

---

### Okta

1. Go to **Okta Admin Console → Applications → Create App Integration**.
2. Select **SAML 2.0** and click **Next**.
3. Configure:
   - **Single sign-on URL (ACS):** `https://jobline.ai/auth/saml/acs`
   - **Audience URI (SP Entity ID):** `https://jobline.ai/auth/saml/metadata`
   - **Name ID format:** `EmailAddress`
   - **Application username:** `Email`
4. Under **Attribute Statements**, add:
   - `email` → `user.email`
   - `displayName` → `user.displayName` (or `appuser.displayName`)
5. Complete setup. On the **Sign On** tab, find the **Metadata URL** — copy it for use in JobLine.

---

### Google Workspace

1. Go to **Google Admin Console → Apps → Web and mobile apps → Add app → Add custom SAML app**.
2. Enter `JobLine AI` as the app name.
3. Copy the **IdP metadata** — download the XML file.
4. Configure Service Provider details:
   - **ACS URL:** `https://jobline.ai/auth/saml/acs`
   - **Entity ID:** `https://jobline.ai/auth/saml/metadata`
   - **Name ID:** Primary email, email format
5. Add attribute mappings:
   - `email` → `Primary email`
   - `displayName` → `Full name`
6. Turn on the application for the relevant organizational units.

---

## Step 2 — Configure SSO in JobLine

1. Sign in to JobLine as an **organization admin**.
2. Go to **Settings → Organization → SAML 2.0 / SSO Configuration**.
3. Toggle on **Enable SSO**.
4. Select your **Identity Provider** from the dropdown.
5. Paste your **IdP Metadata URL** (recommended — auto-populates Entity ID, SSO URL, and certificate).
6. Alternatively, enter the **IdP Entity ID** and **IdP SSO URL** manually and upload the certificate.
7. Confirm attribute name mappings:
   - **Email attribute:** `email` (default; change if your IdP uses a different attribute name)
   - **Display name attribute:** `displayName` (or `name`, `givenName`, etc.)
8. Click **Save SSO Settings**.

---

## Step 3 — Test the SSO Flow

1. Open an **incognito/private browser window**.
2. Navigate to `https://jobline.ai/auth` and click **Continue with SSO** (appears after SSO is enabled).
3. Enter your corporate email address or organization slug.
4. You should be redirected to your IdP's login page.
5. After authenticating, you should be returned to JobLine and signed in.

**Troubleshooting:**

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| "SAML assertion signature invalid" | Certificate mismatch | Re-download metadata from IdP |
| "NameID not found" | Name ID format mismatch | Set format to `emailAddress` in IdP |
| "User not provisioned" | User not assigned app in IdP | Assign the application to the user/group in IdP |
| Redirect loop | ACS URL incorrect | Verify ACS URL matches exactly: `https://jobline.ai/auth/saml/acs` |
| "Audience restriction" error | Entity ID mismatch | Verify SP Entity ID in IdP matches `https://jobline.ai/auth/saml/metadata` |

---

## SCIM Provisioning (Optional — Future)

Automatic user provisioning via SCIM 2.0 is on the JobLine roadmap. When available, it will allow:
- Automatic account creation when users are assigned the application in your IdP
- Automatic deprovisioning when users are removed
- Group sync → JobLine team membership

Contact `support@jobline.ai` to register interest and be notified when SCIM is available.

---

## Security Considerations

- SSO does not replace multi-factor authentication. Ensure your IdP enforces MFA for JobLine AI users.
- Users who authenticate via SSO are still subject to JobLine's ITAR / US Person Declaration gate if enabled for your organization.
- SSO session tokens expire per Supabase session policy (default: 1 hour access token, 7-day refresh).
- When a user is removed from the IdP application, their existing JobLine session remains active until it expires (max 7 days). Use the **Admin → Users → Revoke Sessions** function for immediate revocation.

---

## Support

For SSO configuration assistance, contact `support@jobline.ai` with:
- Your IdP vendor and version
- A screenshot of the SAML Attributes configuration in your IdP
- The error message or SAML assertion (if available)

Enterprise customers have access to dedicated onboarding support for SSO setup.

---

*This document satisfies FedRAMP G-06 (IA-2, IA-8, AC-2): Enterprise SSO configuration documentation for JobLine AI.*

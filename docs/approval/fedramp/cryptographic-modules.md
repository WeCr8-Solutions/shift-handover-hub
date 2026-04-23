# Cryptographic Modules Table — SSP Appendix Q
**System:** JobLine AI  
**Organization:** WeCr8 Solutions LLC  
**Version:** 1.0  
**Date:** April 13, 2026  
**NIST Reference:** NIST SP 800-53 Rev. 5 SC-13, IA-7, SC-8, SC-28  
**FedRAMP Reference:** SSP Appendix Q — Cryptographic Modules Table  
**Owner:** Engineering Lead  
**Review Cycle:** Annual; updated after any cryptographic configuration change

---

## G-23 Status Notice

> **Current Status — PRE-MIGRATION**  
> FIPS 140-3 validation is a pre-condition of FedRAMP Moderate authorization. JobLine AI currently operates on **Supabase commercial** (AWS us-east-1) and **Vercel**, neither of which holds FedRAMP Marketplace authorization. As a consequence, FIPS 140-3 validated module use **cannot currently be confirmed** for all cryptographic operations.  
>
> This table documents the **current cryptographic posture** and the **target post-migration state** following infrastructure migration to FedRAMP-authorized services (G-00). The G-23 gap will be fully remediated upon completion of G-00 (migration to AWS GovCloud or Azure Government), where FIPS 140-3 validated modules are enforced at the hypervisor and OS level.

---

## 1. Cryptographic Modules in Use

### 1a. TLS / Transport Layer Security (SC-8, SC-13)

| Component | Provider | Protocol | Cipher Suites Supported | FIPS 140-3 Status | Certificate |
|-----------|----------|----------|------------------------|-------------------|-|
| `jobline.ai` frontend | Vercel (Let's Encrypt / Vercel TLS) | TLS 1.2, TLS 1.3 | TLS 1.3: TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256; TLS 1.2: ECDHE-RSA-AES128-GCM-SHA256, ECDHE-RSA-AES256-GCM-SHA384 | ❌ Not currently FIPS validated (Vercel not FedRAMP) | Let's Encrypt with Vercel-managed auto-renewal |
| Supabase API (`*.supabase.co`) | Supabase / AWS us-east-1 | TLS 1.2, TLS 1.3 | ECDHE-RSA-AES256-GCM-SHA384, TLS_AES_256_GCM_SHA384 | ❌ Not currently FIPS validated (Supabase not FedRAMP) | AWS-issued; auto-renewed |
| Supabase Edge Functions | Supabase / Deno runtime | TLS 1.3 | TLS_AES_256_GCM_SHA384 | ❌ Not currently FIPS validated | AWS-issued |
| GitHub Actions CI | GitHub / Microsoft Azure | TLS 1.2, TLS 1.3 | TLS_AES_256_GCM_SHA384 | ✅ GitHub FedRAMP Moderate authorized | GitHub Enterprise Cloud |

**Target post-migration (AWS GovCloud):**  
All TLS will terminate on AWS ALB/CloudFront with FIPS 140-3 validated TLS 1.2/1.3 using only FIPS-approved cipher suites (SP 800-52 Rev. 2 compliant). AWS GovCloud enforces FIPS 140-3 validated libraries (OpenSSL FIPS module, cert # pending per AWS CMVP listing).

### 1b. Authentication Token Signing (IA-5, SC-13)

| Function | Algorithm | Key Length | Provider | FIPS 140-3 Status | Notes |
|----------|-----------|-----------|----------|-------------------|-------|
| JWT access token signing | HMAC-SHA256 (HS256) | 256-bit | Supabase Auth (GoTrue) | ❌ Not validated | JWT secret stored as Supabase project secret |
| JWT refresh token | Opaque random token | 256-bit random | Supabase Auth | ❌ Not validated | Stored salted hash in Supabase DB |
| OAuth2 PKCE code verifier | SHA-256 code challenge | N/A | Browser WebCrypto | — | Code verifier never leaves client; PKCE S256 method |
| TOTP (MFA) | HMAC-SHA1 via RFC 6238 | 160-bit HMAC | Supabase Auth + authenticator app | ⚠️ SHA-1 not FIPS 140-3 secure hash for new apps | Acceptable for TOTP per NIST SP 800-63B; plan upgrade to HMAC-SHA256 TOTP |

**Target post-migration:**  
JWT signing migrated to RS256 (RSA-2048 or ECDSA P-256) using AWS KMS (FIPS 140-3 Level 3 validated, CMVP cert #4177). TOTP upgraded to HMAC-SHA256 TOTP.

### 1c. Password / Credential Hashing (IA-5, SC-13)

| Function | Algorithm | Parameters | Provider | FIPS 140-3 Status | Notes |
|----------|-----------|-----------|----------|-------------------|-------|
| User password hashing | bcrypt | Cost factor 10 (configurable) | Supabase Auth (GoTrue) | ❌ bcrypt is NOT FIPS 140-3 approved | GoTrue defaults; not FIPS approved |
| Email one-time tokens | SHA-256 (HMAC) | Single-use, time-limited | Supabase Auth | ❌ Not validated in current environment | Used for magic links, email OTPs |

**FIPS Note on bcrypt:**  
FIPS 140-3 approved password hashing algorithms are PBKDF2-HMAC-SHA256/SHA-512 and scrypt (per NIST SP 800-132). bcrypt is widely used and secure but is **not** on the CMVP approved algorithm list. Upon migration to GovCloud:
- Option A: Configure Supabase/GoTrue to use PBKDF2-SHA256 (natively supported in GoTrue config)
- Option B: Migrate authentication to Amazon Cognito (FIPS 140-3 validated; CMVP #4177)

**Interim compensating control:** bcrypt with cost factor ≥10 provides computationally equivalent resistance to offline attacks. This is documented as a POA&M item (G-23) pending G-00 migration.

### 1d. Data at Rest Encryption (SC-28, MP-5)

| Component | Encryption | Key Management | FIPS 140-3 Status | Notes |
|-----------|-----------|---------------|-------------------|-------|
| Supabase PostgreSQL | AES-256 (AWS EBS encryption) | AWS KMS (us-east-1) | ❌ Not FedRAMP authorized (commercial region) | Data encrypted at rest; keys managed by AWS in commercial region |
| Supabase Storage (S3-backed) | AES-256 SSE-S3 | AWS-managed KMS | ❌ Not FedRAMP authorized (commercial region) | S3 server-side encryption |
| Supabase backups | AES-256 | AWS KMS | ❌ Not FedRAMP authorized (commercial region) | Backup encryption at rest |
| Vercel (frontend build artifacts) | AES-256 | Vercel-managed | ❌ Not validated | Static files at CDN edge |
| Client browser storage | None (session only) | N/A | N/A | No sensitive data stored in localStorage; JWTs in memory only |
| Electron desktop (self-hosted) | OS-level disk encryption recommended | Customer-managed | Inherited from customer OS | BitLocker (Windows) / FileVault (macOS) recommended; documented in Desktop_Windows_Install.md |

**Target post-migration (AWS GovCloud):**  
All data at rest encryption through AWS KMS in GovCloud (us-gov-west-1), which uses FIPS 140-3 Level 3 HSMs (CMVP cert #4177). AES-256 with FIPS validated key derivation.

### 1e. Key Exchange / Asymmetric Cryptography (SC-13)

| Function | Algorithm | Key Size | Where Used | FIPS 140-3 Status |
|----------|-----------|---------|-----------|------------------|
| TLS key exchange | ECDHE (P-256) | 256-bit | All HTTPS connections | See TLS section |
| OAuth2 token exchange | RSA-2048 (provider certs) | 2048-bit | Google/Microsoft OAuth | FIPS approved at source |
| TOTP QR code | N/A (display only) | N/A | MFA enrollment | N/A |

---

## 2. FIPS-Approved Algorithms Summary

Per NIST SP 800-131A Rev. 2 and CMVP, the following algorithms are FIPS-approved and in use (or planned):

| Algorithm | Use Case | Approved | Current Status |
|-----------|---------|---------|----------------|
| AES-256-GCM | TLS, data at rest | ✅ FIPS approved | In use (via AWS/Supabase infrastructure) |
| SHA-256, SHA-384 | TLS PRF, HMAC, hashing | ✅ FIPS approved | In use |
| ECDSA P-256, P-384 | TLS certificates | ✅ FIPS approved | In use (TLS cert chain) |
| RSA-2048 | TLS certificate chain | ✅ FIPS approved (key sizes ≥2048) | In use |
| HMAC-SHA-256 | TOTP (planned), JWT (planned) | ✅ FIPS approved | Planned; currently HMAC-SHA1 for TOTP |
| PBKDF2-SHA-256 | Password hashing (planned) | ✅ FIPS approved | Planned; currently bcrypt |
| bcrypt | Password hashing (current) | ❌ Not FIPS approved | In use — POA&M item G-23 |
| HMAC-SHA1 | TOTP (current RFC 6238) | ⚠️ SHA-1 deprecated for general use, acceptable for HMAC-TOTP | In use — plan upgrade |

---

## 3. Non-FIPS Compensating Controls

For algorithms not currently FIPS 140-3 validated, the following compensating controls are in place:

| Algorithm | Compensating Control | POA&M Item |
|-----------|---------------------|-----------|
| bcrypt (password hashing) | Cost factor ≥10 (equivalent resistance); no external exposure of hashes; Supabase Auth manages hash lifecycle | G-23 |
| HMAC-SHA1 (TOTP) | TOTP is single-use, time-limited (30-second window), rate-limited via Supabase; combined with email MFA as backup | G-23 |
| Commercial-region TLS | TLS 1.2/1.3 with approved cipher suites; no downgrade path; HSTS enforced | G-00, G-23 |

---

## 4. TLS Configuration Details (SC-8)

### Current TLS Policy

**Minimum version:** TLS 1.2 (SSLv3, TLS 1.0, TLS 1.1 disabled)  
**Preferred:** TLS 1.3  
**Cipher suite policy (Vercel):** Managed by Vercel; TLS 1.3 only ciphersuites + ECDHE-RSA suites for TLS 1.2 backward compatibility  
**HSTS:** Enforced via `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` response header (configured in `vercel.json`)  
**Certificate rotation:** Automated (Let's Encrypt / Vercel managed, 90-day rotation)

### Target TLS Policy (Post-Migration to AWS GovCloud)

- FIPS 140-3 TLS policy via AWS ALB + CloudFront (FIPS endpoints)
- CloudFront FIPS endpoint: `cloudfront.us-gov-west-1.amazonaws.com`
- TLS 1.2 minimum; TLS 1.3 preferred
- Only SP 800-52 Rev. 2 Appendix A cipher suites permitted:
  - TLS_AES_128_GCM_SHA256
  - TLS_AES_256_GCM_SHA384
  - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
  - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256

---

## 5. Key Management Summary (SC-17, IA-5(7))

| Key Type | Storage | Rotation | Access |
|----------|---------|---------|--------|
| Supabase JWT secret | Supabase project secrets (encrypted) | Annually or on compromise | Engineering Lead only |
| Supabase service role key | Supabase project secrets + GitHub Actions secrets | Annually | Engineering Lead |
| LLM API key | GitHub Actions secrets | Per provider / annually | Engineering Lead |
| Stripe secret key | Vercel environment variables (encrypted) | Annually or on compromise | Engineering Lead |
| OAuth client secrets (Google, MS) | Supabase environment config | Annually | Engineering Lead |

**Key storage controls:**
- All secrets stored in encrypted secret stores (Supabase secrets vault, GitHub Actions secrets, Vercel project settings)
- No secrets committed to repository (`trivy --scanners secret` enforced in CI)
- Access restricted to Engineering Lead; no team member access to production secrets without approval

---

## 6. Post-Migration CMVP References (Target State)

Upon completion of G-00 (AWS GovCloud migration), the following NIST CMVP certificate numbers will apply:

| Module | Vendor | CMVP Cert # | Algorithms |
|--------|--------|------------|-----------|
| AWS Key Management Service (KMS) | Amazon | #4177 | AES, RSA, ECDSA, SHA-2, HMAC |
| AWS Libcrypto (FIPS) | Amazon | #4631 | AES, SHA-2, RSA, ECDSA, HMAC, DRBG |
| AWS CloudFront TLS (GovCloud) | Amazon | (inherits KMS) | TLS 1.2/1.3 FIPS cipher suites |
| Amazon Cognito (if adopted) | Amazon | #4177 (KMS backend) | PBKDF2, HMAC-SHA256, RSA |

*Note: CMVP certificate numbers current as of April 2026. Verify against [https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search](https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search) at time of SSP submission.*

---

## 7. Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | April 13, 2026 | Engineering Lead | Initial cryptographic modules table; pre-migration baseline; G-23 gap documentation |

---

*This document satisfies FedRAMP SSP Appendix Q (Cryptographic Modules Table) and documents the G-23 gap and remediation plan. NIST SP 800-53 Rev. 5 controls addressed: SC-13, IA-7, SC-8, SC-17, SC-28, IA-5(7).*

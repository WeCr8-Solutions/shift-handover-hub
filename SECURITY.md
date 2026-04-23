# Security Policy — JobLine AI (WeCr8 Solutions)

## Reporting a Vulnerability

If you believe you have found a security vulnerability in **JobLine AI** (`jobline.ai`, the self-hosted desktop app, or any associated API), please report it responsibly.

**Do NOT file a public GitHub issue for security vulnerabilities.**

### Contact

**Email:** security@jobline.ai  
**Response Time:** Acknowledgment within 5 business days; status update within 30 days.

For detailed scope, researcher guidelines, and our safe harbor commitment, see the full **Vulnerability Disclosure Policy (VDP)**:  
[`docs/approval/fedramp/responsible-disclosure-policy.md`](docs/approval/fedramp/responsible-disclosure-policy.md)

---

## In Scope

- `jobline.ai` — SaaS web application
- `*.jobline.ai` — all subdomains and APIs
- JobLine Desktop (Electron) — local IPC, auto-update mechanism
- Authentication flows, session management, access control

## Out of Scope

- Supabase, Vercel, Stripe, or other third-party infrastructure (report to them directly)
- Denial of Service (DoS/DDoS) attacks
- Social engineering of WeCr8 Solutions employees
- Physical attacks against facilities

---

## Safe Harbor

WeCr8 Solutions will not pursue civil or criminal action against researchers who:

1. Report the vulnerability directly to us before public disclosure
2. Allow reasonable time for remediation (90 days coordinated disclosure)
3. Do not access, modify, or exfiltrate data beyond what is necessary to demonstrate the vulnerability
4. Do not impact other users' data or system availability

We will work with you to understand and remediate reported vulnerabilities promptly.

---

## Disclosure Policy

We follow a **90-day coordinated disclosure** model. If a vulnerability is not remediated within 90 days of acknowledgment, you may disclose publicly after notifying us.

---

## Acknowledgments

We maintain a researcher acknowledgment list for responsibly disclosed findings. Contributors will be credited (with permission) in our security acknowledgments.

---

*This policy is aligned with NIST SP 800-53 Rev. 5 controls IR-6, RA-5(11), and SI-2. Last reviewed: April 2026.*

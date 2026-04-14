# Federal Business Onboarding Guide
**Organization:** WeCr8 Solutions LLC  
**Product:** JobLine AI  
**Document version:** 1.0  
**Date:** April 2026  
**Purpose:** Step-by-step registration guide for U.S. federal government contracting and FedRAMP marketplace listing

---

## Overview

To do business with U.S. federal agencies — including selling software, cloud services, or entering into federal contracts — WeCr8 Solutions must complete several government registrations. This guide covers every required step in sequence.

**Total estimated time:** 2–6 weeks (mostly waiting on government processing)  
**Total cost:** $0 for all registrations listed here

---

## Part 1: SAM.gov Registration (Required for All Federal Business)

SAM.gov (System for Award Management) is the **primary federal supplier database**. Every company that wants a federal contract, grant, or cooperative agreement must be registered here. This is the single most important registration.

### Prerequisites
- EIN (Employer Identification Number) from the IRS — already have this if you pay payroll taxes or filed as an LLC
- Legal business name and address exactly as filed with state
- Bank account information for Electronic Funds Transfer (EFT)
- NAICS codes (see §2 below — select these before registering)

### Registration Steps

**Step 1:** Go to https://sam.gov and click "Sign In" → "Create an Account"  
**Step 2:** Create a Login.gov account (required for sam.gov access)
- Go to https://login.gov → "Create an account"
- Provide email and verify with strong password + two-factor authentication
- Required: government-issued ID or SSN for identity proofing

**Step 3:** Return to sam.gov and complete Entity Registration:
- Entity type: "Business or Organization"
- Purpose: "I want to be able to bid on federal contracts and grants"
- Enter your EIN (FEIN), legal business name, and address

**Step 4:** You will automatically receive a **Unique Entity Identifier (UEI)**
- The UEI replaced the DUNS number in April 2022
- Your UEI is a 12-character alphanumeric identifier assigned immediately
- Record your UEI — you will need it for all federal forms, RFP responses, and FedRAMP authorization

**Step 5:** You will receive a **CAGE code** (Commercial and Government Entity code)
- Assigned by the Defense Logistics Agency (DLA) during SAM registration
- Takes 1–3 business days to assign
- CAGE code is a 5-character alphanumeric identifier
- Required for: DoD contracts, defense contractor registrations, export license applications
- Record your CAGE code alongside your UEI

**Step 6:** Complete the remaining SAM.gov registration fields:
- Financial information (banking details for EFT payments)
- Points of contact (primary and alternate)
- NAICS codes (see §2)
- PSC codes (Product and Service Codes) — see below

**Recommended PSC codes for JobLine AI:**
| PSC Code | Description |
|----------|-------------|
| D303 | IT and Telecom — IT Software Development |
| D307 | IT and Telecom — IT Integrated Hardware/Software |
| D308 | IT and Telecom — Programming |
| D399 | IT and Telecom — Other IT/Telecom |
| D316 | IT and Telecom — SaaS |

**Step 7:** Annual renewal — SAM.gov registration must be renewed **annually** or your registration expires and you are ineligible for contracts. Set a calendar reminder for 11 months after registration.

**Verification:** Registration typically activates within 1–3 business days. Check status at https://sam.gov/entity.

---

## Part 2: NAICS Codes

NAICS (North American Industry Classification System) codes identify your industry type. Select all that apply to JobLine AI.

### Recommended NAICS Codes for WeCr8 Solutions

| NAICS Code | Description | Why Relevant |
|------------|-------------|-------------|
| **541511** | Custom Computer Programming Services | Core: building custom SaaS software |
| **541512** | Computer Systems Design Services | Systems integration, solution architecture |
| **541519** | Other Computer Related Services | Edge functions, AI services |
| **518210** | Computing Infrastructure Providers, Data Processing, Web Hosting | JobLine AI is a cloud-hosted app |
| **541330** | Engineering Services | Manufacturing workflow optimization |

**Primary NAICS:** 541511  
**For GSA MAS:** Use 518210C (Cloud SIN)

---

## Part 3: GSA Multiple Award Schedule (MAS)

The GSA MAS schedule is the **preferred vehicle for federal agencies to purchase commercial IT products and services**. Being on the MAS schedule dramatically simplifies procurement — agencies can buy directly without a separate competitive solicitation.

### Why It Matters
- Agencies can purchase JobLine AI without a lengthy RFP process
- Listing signals federal procurement readiness
- Often required by large enterprise federal customers
- Some agency POCs will only purchase from GSA MAS vendors

### Schedule and SIN for JobLine AI

| Category | Schedule | SIN | Description |
|----------|----------|-----|-------------|
| Cloud hosting and SaaS | MAS — Large Category F: IT | **518210C** | Cloud and Cloud-Related IT Professional Services |
| Software | MAS — Large Category F: IT | **511210** | Commercial Software |
| Training and learning | MAS — Large Category F: IT | **611420** | Computer Training |

### How to Apply

**Step 1:** Prerequisites — complete SAM.gov registration (§1), obtain UEI + CAGE code  
**Step 2:** Ensure 2 years of financial data (income statement, balance sheet) — recent company may need to show projected revenue  
**Step 3:** Go to https://www.gsaadvantage.gov and then https://sell.gsa.gov  
**Step 4:** Navigate to "Get on Schedule" → "IT Schedule 70" or "MAS"  
**Step 5:** Submit an offer through the eOffer/eMod system (https://eoffer.gsa.gov)  
**Step 6:** GSA contracting officer reviews and negotiates pricing  
**Step 7:** Award typically takes 3–6 months  

**Resources:**
- GSA MAS Roadmap: https://www.gsa.gov/acquisition/purchasing-programs/gsa-schedules/get-on-gsa-schedules
- GSA IT Schedule 70 FAQ: https://www.gsa.gov/it-schedule-70

---

## Part 4: FedRAMP Marketplace Listing

The FedRAMP marketplace (https://marketplace.fedramp.gov) is where agencies discover authorized cloud services. Being listed here is the end goal of FedRAMP authorization.

### Listing Path

**Phase 1 — In Progress (Documentation Complete):**
- ✅ SSP (System Security Plan)
- ✅ All appendices (A–N + L, Q)
- ✅ POA&M, asset inventory, FIPS 199, Digital Identity Assessment
- ✅ VDP, CIS/CRM, ConMon Plan, SBOM CI
- ✅ Pen test RoE, CISA CHvS enrollment planned

**Phase 2 — Engineering Gaps (see poam.md):**
- ❌ Infrastructure migration to FedRAMP-authorized platform (G-00) — Q4 2026
- ❌ SAML 2.0 SSO (G-06)
- ❌ SIEM export (G-07)

**Phase 3 — 3PAO Assessment:**
- Engage a FedRAMP-approved Third Party Assessment Organization (3PAO)
- 3PAO conducts security assessment against NIST SP 800-53A
- 3PAO submits Security Assessment Report (SAR) to FedRAMP PMO or sponsoring agency

**Phase 4 — Agency Sponsorship or FedRAMP Connect:**
- **Path A (faster):** Find a federal agency to sponsor your ATO; they become your Authorizing Official
- **Path B (FedRAMP Connect):** Join the FedRAMP Connect program; PMO matches CSPs with agencies
  - Apply at: https://www.fedramp.gov/fedramp-connect/

**Phase 5 — Authorization:**
- Agency reviews SAR + authorization package
- Issues an Authority to Operate (ATO)
- FedRAMP PMO lists JobLine AI on the marketplace
- Reuse: other agencies can accept the ATO via reuse without re-assessment

### Finding an Agency Sponsor

Federal agencies most likely to need manufacturing shift-handover software:
- **DoD / Defense Logistics Agency (DLA)** — large manufacturing and supply chain operations
- **General Services Administration (GSA)** — government property and facilities management
- **Department of Energy (DOE)** — national labs, energy production facilities
- **Department of Homeland Security (DHS)** / Coast Guard — vessel and equipment maintenance
- **NASA** — facility maintenance and manufacturing operations

**Outreach approach:**
1. Identify agency CIO/CISO or IT contracting officer via sam.gov or LinkedIn
2. Request introductory meeting via their posted contact or through a GSA MAS task order
3. Provide product demo + FedRAMP documentation package (SSP summary, FIPS 199, authorization plan)
4. Request letter of intent to sponsor ATO

---

## Part 5: Defense / ITAR Considerations

If WeCr8 Solutions intends to handle defense contractor customers or U.S. military facilities:

### ITAR (International Traffic in Arms Regulations)
- Administered by the State Department (DDTC)
- If any customer uses JobLine AI for **ITAR-controlled manufacturing data** (defense articles, weapons components), WeCr8 Solutions may need to register as an ITAR-registered manufacturer or broker
- Registration at https://www.pmddtc.state.gov
- Cost: $2,750/year (small business rate)
- **Action required:** Legal review before any DoD facility signs up

### CMMC (Cybersecurity Maturity Model Certification)
- Required for any DoD contractor handling **CUI (Controlled Unclassified Information)**
- CMMC Level 2 = 110 NIST SP 800-171 practices
- FedRAMP Moderate already maps to most CMMC Level 2 requirements
- Certification performed by a C3PAO (CMMC Third Party Assessment Organization)

### Relevant DoD Resources
- CMMC Accreditation Body: https://cyberab.org
- CMMC Assessment Guide Level 2: https://dodcio.defense.gov/CMMC/
- DLA supplier registration: https://www.dla.mil/Working-With-DLA/Vendor-Information/

---

## Part 6: Registration Checklist Summary

Use this checklist to track completion. Each item should result in a saved certificate/confirmation in `docs/approval/fedramp/evidence/federal-onboarding/`.

### Required (do in order)
- [ ] **Login.gov account** created at https://login.gov
- [ ] **SAM.gov registration** complete; UEI recorded: `______________`
- [ ] **CAGE code** received: `______________`
- [ ] **SAM.gov annual renewal** reminder set (11 months from registration date)

### Strongly Recommended
- [ ] **CISA CHvS enrollment** — email sent to `cyhy@hq.dhs.gov`
- [ ] **CISA ASM enrollment** — email sent to `ASM@cisa.dhs.gov`
- [ ] **HackerOne Response VDP** created at https://hackerone.com/vulnerability-disclosure-programs
- [ ] **`public/.well-known/security.txt`** published with HackerOne VDP contact URL

### Federal Sales Readiness
- [ ] **GSA MAS application** submitted (eOffer portal)
- [ ] **FedRAMP Connect** inquiry submitted at https://www.fedramp.gov/fedramp-connect/
- [ ] **Agency sponsor outreach** — first meeting scheduled
- [ ] **3PAO selected** for security assessment (see Schellman / Coalfire / Tevora)

### Defense (if DoD customers are target)
- [ ] **Legal review of ITAR applicability** completed
- [ ] **CMMC gap assessment** against NIST SP 800-171 completed
- [ ] **ITAR registration** submitted (if applicable)

---

## Part 7: Quick Reference — Key URLs and Contacts

| Resource | URL / Contact |
|----------|--------------|
| SAM.gov registration | https://sam.gov |
| Login.gov (required for SAM) | https://login.gov |
| GSA MAS eOffer | https://eoffer.gsa.gov |
| GSA Sell portal | https://sell.gsa.gov |
| FedRAMP Marketplace | https://marketplace.fedramp.gov |
| FedRAMP Connect | https://www.fedramp.gov/fedramp-connect/ |
| CISA CHvS enrollment | cyhy@hq.dhs.gov |
| CISA ASM enrollment | ASM@cisa.dhs.gov |
| HackerOne VDP | https://hackerone.com/vulnerability-disclosure-programs |
| CAGE code lookup | https://sam.gov/search (after registration) |
| CMMC info | https://dodcio.defense.gov/CMMC/ |
| ITAR registration | https://www.pmddtc.state.gov |
| DLA vendor info | https://www.dla.mil/Working-With-DLA/Vendor-Information/ |

# SSP Appendix J — Customer Information and Service / Customer Responsibility Matrix (CIS/CRM Workbook)

## Overview

This document outlines the security controls for JobLine, a shift-handover-hub system developed by WeCr8 Solutions LLC. The system is deployed using React frontend on Vercel, Supabase (PostgreSQL + Auth + Edge Functions), and optionally Electron desktop. The Federal Agency deploying/using JobLine will be referred to as the Customer.

The CIS/CRM workbook defines which security controls are:
- **CSP (Customer Service Provider) responsibility**: WeCr8 Solutions implements/maintains
- **Customer (Agency) responsibility**: The federal agency deploying/using JobLine implements/maintains
- **Shared responsibility**: Both CSP and Customer share responsibility

This document covers all 18 NIST 800-53 families with at least the most important controls.

## Access Controls (AC)

| Control ID | Control Name | CSP Responsibility | Customer Responsibility | Notes |
|------------|--------------|----------------------|-------------------------|-------|
| AC-1       | Shared       | Technical controls   | Policy approvals, user provisioning requests | - |
| AC-2       | CSP          | Application account management | Managing their own user roster | - |
| AC-3       | CSP          | Role-based access control (RBAC) enforced by application | - | - |
| AC-5/AC-6  | CSP          | Separation of duties enforced by RBAC roles | - | - |
| AC-17      | Shared       | Secure remote access via TLS | Device management, network security | - |

## Audit and Accountability (AU)

| Control ID | Control Name | CSP Responsibility | Customer Responsibility | Notes |
|------------|--------------|----------------------|-------------------------|-------|
| AU-2/AU-3  | CSP          | Activity logs table, 22 event types, server-side timestamps | - | - |
| AU-6       | Shared       | Makes logs available | Reviews logs for their org activity | - |
| AU-9       | CSP          | RLS protection of audit logs | - | - |

## Identification and Authentication (IA)

| Control ID | Control Name | CSP Responsibility | Customer Responsibility | Notes |
|------------|--------------|----------------------|-------------------------|-------|
| IA-2       | CSP          | Supabase Auth, MFA enforcement | - | - |
| IA-4       | Shared       | UUID management | Managing user lifecycle — inviting, deprovisioning | - |
| IA-5       | Shared       | Password policies | Managing their users' credentials | - |

## System and Communications Protection (SC)

| Control ID | Control Name | CSP Responsibility | Customer Responsibility | Notes |
|------------|--------------|----------------------|-------------------------|-------|
| SC-8/SC-28 | CSP          | TLS and encryption managed by Vercel/Supabase | - | - |
| SC-7       | CSP          | Boundary protection via Vercel CDN | - | - |

## Contingency Planning (CP)

| Control ID | Control Name | CSP Responsibility | Customer Responsibility | Notes |
|------------|--------------|----------------------|-------------------------|-------|
| CP-9       | CSP          | Supabase backups | - | - |
| CP-2       | Shared       | System recovery | Their own business continuity | - |

## Incident Response (IR)

| Control ID | Control Name | CSP Responsibility | Customer Responsibility | Notes |
|------------|--------------|----------------------|-------------------------|-------|
| IR-4/IR-5  | Shared       | Handles system-level incidents | Reports incidents via portal; handles their internal response | - |
| IR-6       | Customer     | Report incidents discovered on their side to WeCr8 Solutions | - | - |

## System and Services Acquisition (SA)

| Control ID | Control Name | CSP Responsibility | Customer Responsibility | Notes |
|------------|--------------|----------------------|-------------------------|-------|
| SA-9       | CSP          | Vendor management: Supabase, Vercel, Stripe | - | - |

## Physical, Maintenance, Media (PE/MA/MP)

| Control ID | Control Name | CSP Responsibility | Customer Responsibility | Notes |
|------------|--------------|----------------------|-------------------------|-------|
| All PE     | CSP          | Inherited from Supabase/Vercel data centers | - | - |
| MA         | CSP          | Infrastructure maintenance by Supabase/Vercel; app maintenance by Engineering Lead | - | - |
| MP         | CSP          | Cloud-managed; no physical media | - | - |

## Planning, Authorization, and Risk Assessment (PL/CA/RA)

| Control ID | Control Name | CSP Responsibility | Customer Responsibility | Notes |
|------------|--------------|----------------------|-------------------------|-------|
| PL-2       | SSP          | CSP | - | - |
| CA-2       | Self-assessment and future 3PAO engagement | CSP | - | - |
| RA-2       | FIPS 199 categorization completed | CSP | - | - |
| RA-5       | Shared       | App-layer vulnerability scanning | Agency-side endpoint security | - |

## Section 2: Summary Responsibility Counts

### Access Controls (AC)
- **CSP**: 4
- **Customer**: 1

### Audit and Accountability (AU)
- **CSP**: 3
- **Customer**: 1

### Identification and Authentication (IA)
- **CSP**: 2
- **Customer**: 2

### System and Communications Protection (SC)
- **CSP**: 2
- **Customer**: 0

### Contingency Planning (CP)
- **CSP**: 1
- **Customer**: 1

### Incident Response (IR)
- **CSP**: 1
- **Customer**: 1

### System and Services Acquisition (SA)
- **CSP**: 1
- **Customer**: 0

### Physical, Maintenance, Media (PE/MA/MP)
- **CSP**: 3
- **Customer**: 0

### Planning, Authorization, and Risk Assessment (PL/CA/RA)
- **CSP**: 4
- **Customer**: 1

## Section 3: Notes on Inherited Controls

The following controls are inherited from Supabase and Vercel:
- **PE**: All physical security measures are managed by the data center operators.
- **MA**: Infrastructure maintenance is handled by Supabase/Vercel, while application-specific maintenance is the responsibility of WeCr8 Solutions' Engineering Lead.
- **MP**: The system is cloud-managed, with no physical media involved.

These inherited controls ensure that the basic security requirements are met without additional effort from the Customer.

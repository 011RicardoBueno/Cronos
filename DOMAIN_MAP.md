DOMAIN_MAP.md

Cronos SaaS — Domain Architecture (GEMINI Profile)

Purpose

This document defines the official domain boundaries of the Cronos SaaS.

Its goals are to:

Prevent domain leakage

Enable clean feature gating (Free / Pro / Enterprise)

Prepare the system for monetization and scale

Ensure predictable growth without architectural erosion

If a feature does not clearly belong to a domain, it is not ready to be implemented.

Core Domains Overview

Cronos is composed of the following first-class domains:

Auth & Identity

User

Salon

Agenda

Professionals

Customers

Finance

Subscription & Plans

Public Experience

Analytics (Internal & Public)

Each domain has:

Clear responsibility

Clear ownership in the codebase

Clear limits on dependencies

1. Auth & Identity Domain
Responsibility

Authentication

Authorization

Session lifecycle

Identity validation (real users)

Code Location
src/context/AuthContext.jsx
src/lib/supabase.js
src/services/supabaseService.js (auth-related)

Rules

Auth is cross-cutting but not business-aware

No UI components inside this domain

Other domains may consume auth state, never modify it

2. User Domain
Responsibility

User profile (non-salon-specific)

Account preferences

Ownership relations

Code Location
src/pages/admin/MyAccount.jsx
src/hooks/useUser* (future)

Rules

User ≠ Salon

One user may own or manage multiple salons (future-proofing)

3. Salon Domain (Core Business Domain)
Responsibility

Salon identity

Branding

Operational configuration

Public presence (slug)

Code Location
src/pages/admin/settings/Profile.jsx
src/pages/admin/settings/Appearance.jsx
src/components/salon/
src/context/SalonContext.jsx

Rules

Salon is the core entity

All other business domains reference Salon

UI-only salon components live in components/salon/

4. Agenda Domain
Responsibility

Scheduling

Operating hours

Availability rules

Appointments

Code Location
src/pages/admin/settings/Agenda.jsx
src/pages/admin/settings/Hours.jsx
src/pages/agenda/

Rules

Agenda logic must not leak into UI components

Public booking consumes agenda data read-only

5. Professionals Domain
Responsibility

Staff management

Availability per professional

Association with services

Code Location
src/pages/professionals/
src/hooks/useProfessional*

Rules

Professionals belong to a Salon

Professionals do not own data

Agenda consumes Professional availability

6. Customers Domain
Responsibility

Client records

Deduplication (phone number uniqueness)

Booking history

Code Location
src/pages/customers/

Rules

Phone number is a unique identifier

No duplicate customers per salon

Normalization is mandatory at persistence level

7. Finance Domain
Responsibility

Transactions

Revenue

Cash flow

Performance metrics

Code Location
src/pages/finance/
src/components/charts/

Rules

Finance is read-heavy

Writes are controlled and auditable

Finance never controls business logic directly

8. Subscription & Plans Domain (Monetization Core)
Responsibility

Plan definition

Feature gating

Limits enforcement

Upsell triggers

Code Location (current + planned)
src/hooks/usePlanFeatures.js
src/pages/admin/PricingPage.jsx
src/pages/admin/settings/Plan.jsx

Official Plans
Free (Starter)

1 professional

Limited agenda visibility

Basic salon profile

No analytics

Cronos branding visible

Professional

Multiple professionals

Full agenda

Finance dashboards

Customer management

Branding customization

Enterprise

Unlimited professionals

Advanced analytics

Priority features

API / integrations

White-label branding

Rules

Feature gating happens via hooks

UI hides features, services enforce limits

No hardcoded plan checks in components

9. Public Experience Domain
Responsibility

Public booking

Public analytics

Brand perception

Code Location
src/pages/public/
src/pages/public-settings/

Rules

Read-only access

No admin state

SEO-first architecture

10. Analytics Domain
Responsibility

Usage tracking

Performance insights

Growth metrics

Code Location
src/pages/finance/Analytics.jsx
src/pages/public/Analytics.jsx

Rules

Analytics informs decisions, not behavior

No business rules depend on analytics directly

Dependency Rules (Hard)
Auth → All
Salon → Agenda, Professionals, Customers, Finance
Agenda → Public
Subscription → All (read-only)
Public → None


Forbidden:

Finance → Salon mutation

Components → Services

UI → Subscription logic

Feature Gating Strategy

Gate by capability, not by UI

Enforce in hooks and services

UI reflects capability state

This prevents:

Frontend bypass

Inconsistent UX

Monetization leaks

Non-Negotiable Principles

Domains do not bleed

UI is dumb

Pages orchestrate

Hooks decide

Services execute

ESLint enforces

Status

Domain boundaries: DEFINED

Monetization-ready: YES

Scale-safe: YES

Architectural debt: CONTROLLED
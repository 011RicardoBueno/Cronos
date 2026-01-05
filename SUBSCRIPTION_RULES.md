SUBSCRIPTION_RULES.md

Cronos SaaS — Subscription, Plans & Monetization Rules

Purpose

This document defines the official subscription model of Cronos.

Its objectives are to:

Drive upgrades through value exposure

Prevent free-plan abuse

Ensure predictable revenue growth

Centralize feature gating logic

Align monetization with user psychology and UX

Monetization is designed, not added later.

Core Principles

Gate by capability, not UI

Expose value before blocking

Soft limits before hard locks

Upsell happens at the moment of friction

Rules enforced in hooks and services, never UI

Official Plans
1. Free — Starter

Goal: Acquisition, habit creation, viral entry point.

Enabled

1 Salon

1 Professional

Basic agenda (view + manual booking)

Public booking page

Basic salon profile

Cronos branding visible

Restricted

No financial analytics

No customer history

No integrations

No branding customization

Limited agenda automation

Limits

Max 30 appointments / month

Max 50 customers

No data export

UX Strategy

Always show locked features (disabled state)

Copy emphasizes “Unlock with Professional”

No aggressive paywall

2. Professional — Growth

Goal: Monetize active salons.

Enabled

Multiple professionals

Full agenda management

Customer management

Financial dashboards

Branding customization

Email / WhatsApp notifications

Advanced operating hours

Restricted

No advanced analytics

No integrations API

No white-label

Limits

Max 5 professionals

Max 1 location

Limited analytics history (e.g. last 90 days)

UX Strategy

“You’re almost there” messaging

Upsell triggered by:

Adding 2nd professional

Accessing finance dashboards

Customizing brand

3. Enterprise — Scale

Goal: High-ticket, low-volume revenue.

Enabled

Unlimited professionals

Unlimited appointments

Advanced analytics

Integrations (API, webhooks)

White-label branding

Priority support

Multi-location (future)

Limits

None (contractual)

UX Strategy

No self-checkout (optional)

“Talk to Sales” positioning

Emphasis on scale, control, and data

Feature Gating Matrix (Conceptual)
Capability	Free	Pro	Enterprise
Professionals > 1	❌	✅	✅
Financial dashboards	❌	✅	✅
Branding customization	❌	✅	✅
Analytics (advanced)	❌	❌	✅
Integrations / API	❌	❌	✅
White-label	❌	❌	✅
Where Rules Are Enforced (Mandatory)
Hooks (Primary Gate)
src/hooks/usePlanFeatures.js


Responsibilities:

Resolve capabilities

Expose boolean flags

Centralize plan logic

Example (conceptual):

canUseFinance
canAddProfessional
canCustomizeBrand

Services (Hard Enforcement)

Prevent bypass

Validate limits before writes

Enforce quotas (appointments, professionals)

UI checks are not security.

UI (Reflection Only)

Reflect capability state

Show upgrade prompts

Never decide access

Upsell Trigger Points (Explicit)

Upsell must be triggered when user:

Tries to add:

Second professional

Financial record

Custom branding

Reaches:

Appointment limit

Customer limit

Clicks locked analytics

Upsell copy must be:

Contextual

Benefit-oriented

Non-punitive

Data Model Requirements (Supabase)

Mandatory fields:

plan_type

plan_started_at

plan_expires_at

limits_snapshot (JSONB)

Constraints:

Limits enforced per salon

No duplicated customers by phone

Normalized identifiers (E.164 for phone)

Anti-Abuse Rules

No multiple free salons per user (default)

No bypass via client-side flags

Audit logs for limit hits (future)

What Is Explicitly Forbidden

Hardcoded plan checks in components

Feature checks spread across UI

Silent blocking without explanation

Monetization logic inside pages

Status

Monetization model: DEFINED

Feature gating strategy: READY

Growth alignment: YES

Enterprise readiness: PREPARED
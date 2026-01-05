BILLING_FLOW.md

Cronos SaaS — Subscription & Revenue Engine

Purpose

This document defines how billing works end-to-end in Cronos.

It is the single source of truth for:

Subscription lifecycle

Plan transitions

Payment handling

Upgrade & downgrade behavior

Billing-related security

If a feature affects revenue, it MUST comply with this document.

Core Principles

Billing is server-authoritative

Plans define capabilities, not UI

Downgrades are safe, never destructive

Upgrades are instant

Revenue logic is auditable

Subscription Plans
Official Plans
Plan	Purpose
Free	Onboarding, habit formation
Pro	Core operational value
Enterprise	Scale, control, compliance

Plans are mutually exclusive.

Plan Characteristics
Free

Limited resources

Hard caps

Watermarks & soft friction

No billing info required

Pro

Operational unlock

Removes friction

Monthly recurring billing

Self-service management

Enterprise

No hard limits

Advanced exports

Priority logic paths

Manual or contract-based billing

Billing Authority

Billing is handled by:

External provider (e.g. Stripe)

Supabase Edge Functions

PostgreSQL as source of truth

Frontend NEVER:

Calculates billing state

Decides access

Talks directly to billing APIs

Billing Data Model (High-Level)
salons
subscriptions
billing_events
payment_methods
invoices


All billing tables are:

Write-protected

Edge-only mutable

RLS restricted

Subscription Lifecycle
1. Creation (Free → Pro)

User clicks upgrade

UI requests checkout session

Edge Function:

Validates user & salon

Creates checkout session

User pays

Webhook confirms

Subscription activated

Upgrade is immediate.

2. Renewal

Automatic

Webhook-driven

Grace period supported

Failures trigger:

Soft warnings

Feature degradation (not lockout)

Retry logic

3. Downgrade (Pro → Free)

User-initiated or payment failure

Takes effect at next cycle

Data preserved

Features locked, not deleted

No destructive operations allowed.

4. Cancellation

Equivalent to scheduled downgrade

Access retained until cycle end

Audit log required

Capability Resolution Flow
subscription → plan → feature_flags → permissions


Edge Functions enforce final state.

Proration Rules

Upgrades: prorated

Downgrades: next-cycle

Enterprise: contract-defined

Billing Webhooks
Mandatory Rules

Signature validation

Idempotency

Versioned payloads

Strict schema validation

Webhook events update:

Subscription status

Payment state

Invoice history

Payment Failures
States
State	Behavior
Retry	Full access
Grace	Soft limits
Past due	Feature locks
Canceled	Free plan
UI Responsibilities

UI may:

Display plan

Show limits

Suggest upgrades

Trigger checkout

UI may NOT:

Enforce access

Calculate eligibility

Assume plan state

Upgrade UX Hooks

Billing integrates with:

UPSELL_UX.md

Feature usage thresholds

Contextual prompts

No dark patterns allowed.

Enterprise Billing

Manual activation

Custom flags

Optional invoicing

SLA-driven

Enterprise bypasses standard checkout.

Security Rules

No client-side billing logic

No price exposure in frontend

Secrets only in Edge

RLS enforced on billing tables

Auditing & Compliance

Every billing event:

Is logged

Is traceable

Is reversible by admins

Failure Handling

Billing outages do NOT delete data

UI degrades gracefully

Admin override supported

Forbidden Practices

Feature unlocks without subscription

Client-trusted plan state

Hard deletes on downgrade

Silent billing errors

Status

Billing system is:

Authoritative

Secure

Auditable

Growth-oriented
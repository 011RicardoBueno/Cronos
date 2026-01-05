EDGE_FUNCTIONS.md

Cronos SaaS — Secure Serverless Business Logic

Purpose

This document defines when, why, and how Edge Functions are used in Cronos.

Edge Functions exist to:

Centralize sensitive business logic

Enforce subscription & security rules

Protect critical workflows from client manipulation

Integrate external services safely

If it matters, it does not run on the client.

Core Principles

Edge Functions are authority

Frontend is orchestration only

Database enforces final access

All external integrations go through Edge

Idempotency over optimism

When to Use Edge Functions
Mandatory Use Cases
Scenario	Reason
Billing & payments	Secrets & trust
Subscription enforcement	Anti-tampering
Role escalation	Security
Bulk operations	Performance & safety
Cross-tenant validation	Isolation
Webhooks	External trust boundary
Data exports	Compliance
When NOT to Use Edge Functions

Simple CRUD protected by RLS

Read-only queries

UI-only calculations

Styling, formatting, presentation

Authentication Model
Auth Context

Each Edge Function MUST:

Extract Supabase JWT

Validate auth.uid()

Derive salon_id explicitly

Never accept:

salon_id from client without validation

role from client input

Salon Resolution Pattern
const salon = await resolveSalonForUser(userId, salonId)


If resolution fails → 403

Capability Enforcement

Edge Functions enforce:

Subscription plan

Feature flags

Role permissions

Frontend capability checks are advisory only.

Subscription-Aware Logic
Examples

Prevent creating more professionals than plan allows

Lock advanced reports on downgrade

Enable enterprise-only exports

Plans are validated server-side only.

Idempotency Rules
Required For

Billing operations

Webhooks

Mutations with side effects

Pattern:

request_id → processed_once

Error Handling
Error Categories
Type	Response
Auth error	401
Permission denied	403
Plan restriction	402
Validation error	422
Internal error	500

Never leak:

Stack traces

Internal schema

Secrets

Rate Limiting

Applied on:

User ID

IP

Salon ID

Especially critical for:

Appointment creation

Public booking

Exports

Billing Integration
Flow

Edge receives webhook

Verifies signature

Maps event → salon

Updates subscription state

Emits audit log

Billing logic NEVER runs in the UI.

Webhook Security
Rules

Signature validation mandatory

Replay protection

Event versioning

Idempotency enforcement

Data Access Rules

Edge Functions:

May bypass RLS only when justified

Must document why

Must log actions

Default = respect RLS.

Logging & Observability
Logged

Function name

User ID

Salon ID

Action type

Result (success/failure)

No PII in logs.

Versioning Strategy

Semantic versioning per function

Breaking changes require migration plan

Old versions deprecated, not removed

Deployment Rules

CI validated

Secrets via environment

No secrets in repo

Staging before production

Naming Conventions
snake_case
verb_noun


Examples:

create_subscription

export_financial_data

assign_user_role

Forbidden Practices

Business logic in React

Trusting client input

Direct Stripe calls from UI

Hardcoded secrets

Silent failures

Security Checklist (Mandatory)

Auth validated

Salon resolved

Role checked

Plan checked

RLS respected or justified

Logs emitted

Idempotent if needed

Status

Edge Functions: Mandatory for critical flows

Billing: Edge-only

Subscription enforcement: Server-side

Security posture: Strict
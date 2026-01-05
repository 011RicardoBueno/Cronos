# DEV_WORKFLOW.md

## Purpose

This document defines the **official development workflow** for the Cronos SaaS.

Its goal is to ensure **consistency, scalability, security, and velocity** while preventing architectural drift, premature complexity, and business-logic leakage.

This workflow is **mandatory** for humans and AI contributors.

---

## Guiding Principles

* Architecture before features
* Server-side truth
* UI is a consumer, not an authority
* Monetization and security are first-class
* Prefer deletion over abstraction

---

## Feature Development Lifecycle

### 1. Feature Qualification

Before writing code, answer:

* Which **domain** does this belong to? (see DOMAIN_MAP.md)
* Is this feature:

  * Free
  * Pro
  * Enterprise
  * Flag-controlled
* Does it affect:

  * Billing
  * Permissions
  * Limits
  * Data integrity

If yes → **Edge Function required**.

---

### 2. Domain Validation

Rules:

* One feature = one primary domain
* Cross-domain communication must be explicit
* No "utility" domains

If the domain is unclear, stop and clarify.

---

### 3. Decide Placement

| Concern              | Location       |
| -------------------- | -------------- |
| UI rendering         | `components/`  |
| Page orchestration   | `pages/`       |
| Reusable state logic | `hooks/`       |
| External APIs        | `services/`    |
| Business rules       | Edge Functions |
| Data rules           | Database / RLS |

If unsure → **do not place in frontend**.

---

### 4. Naming Rules

* Files: PascalCase for components, camelCase for hooks
* Domains use **business language**, not technical
* Avoid abbreviations
* Avoid generic names (Utils, Helpers, Manager)

---

## Creating UI Components

Checklist:

* Stateless when possible
* No direct Supabase access
* No plan checks
* No permission checks
* Uses existing design tokens
* Exported via barrel file

Violation = reject.

---

## Creating Hooks

Hooks may:

* Coordinate UI state
* Call services
* Normalize data

Hooks may NOT:

* Enforce plans
* Decide permissions
* Contain billing logic

---

## Edge Functions Workflow

Edge Functions are required when:

* Subscription is validated
* Limits are enforced
* Data integrity is critical
* Privileged operations exist

Rules:

* Validate auth server-side
* Validate plan server-side
* Validate ownership
* Return explicit error codes

Never assume frontend correctness.

---

## Feature Flags Workflow

When introducing flags:

* Default to OFF
* Server-side evaluation first
* UI reads flags, never decides
* Flags must be removable

Avoid long-lived flags without plan.

---

## Billing-Aware Development

Before merging any feature:

* Is it monetizable?
* Does it increase perceived value?
* Does it create a natural upsell moment?

Hard blocks are discouraged.
Prefer:

* Soft limits
* Contextual upsell
* Progressive disclosure

---

## Data Model Changes

Rules:

* Schema first
* Constraints before code
* Migrations reviewed
* No silent breaking changes

Frontend must adapt to schema, not the inverse.

---

## Testing Requirements

* Edge Functions: unit tests
* Hooks: logic tests
* Critical flows: E2E

No feature merges without tests when logic is non-trivial.

---

## Pre-Merge Checklist

* ESLint passes
* Architecture respected
* No forbidden imports
* No client-side trust
* No duplicated logic
* Naming consistent
* Upsell impact considered

---

## Post-Merge Review

Ask:

* Did this increase complexity?
* Can something be deleted?
* Is the boundary still clear?

If not → refactor immediately.

---

## Enforcement

Any contribution that violates:

* AI_PROMPT.md
* ARCHITECTURE.md
* SECURITY_MODEL.md
* BILLING_FLOW.md

Must be rejected.

This workflow exists to keep Cronos **fast, safe, and scalable** as it grows.

**Compliance is mandatory.**

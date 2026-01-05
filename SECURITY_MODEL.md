SECURITY_MODEL.md

Cronos SaaS — Security, Access Control & Tenant Isolation

Purpose

This document defines the security model of Cronos, covering:

Tenant isolation

Authentication & authorization

Role-based access control (RBAC)

Row Level Security (RLS)

Data integrity & anti-duplication rules

Abuse prevention

Secure extensibility

Security is treated as infrastructure, not as feature logic.

Core Security Principles

Zero Trust by Default

Server is the source of truth

Every row belongs to exactly one tenant

Access is explicit, never implicit

Security rules live close to data

Frontend never decides permissions

Identity & Authentication
Auth Provider

Supabase Auth

Supported Methods

Email + password

OAuth (future-ready)

Canonical Identity
auth.users.id (UUID)


This ID is the root of all authorization.

Multi-Tenancy Model
Tenant Definition

Tenant = Salon

Each salon is an isolated tenant.

salons.id (UUID)

User ↔ Salon Relationship

Users can belong to multiple salons.

user_salons
- user_id
- salon_id
- role

Roles & Access Levels
System Roles (Per Salon)
Role	Description
owner	Full control, billing access
admin	Manage operations
staff	Operational access
viewer	Read-only

Roles are data, not logic.

Authorization Strategy
Layered Enforcement
Layer	Responsibility
UI	UX gating only
API	Capability checks
DB	Final enforcement

Database always wins.

Row Level Security (RLS)
Mandatory Rules

Every tenant-scoped table MUST:

Contain salon_id

Enforce RLS

Example:

salon_id = current_salon()

Forbidden

Global tables without RLS

Client-side filtering for security

RLS Policy Patterns
Read
USING (
  salon_id IN (
    SELECT salon_id FROM user_salons
    WHERE user_id = auth.uid()
  )
)

Write
WITH CHECK (
  salon_id IN (
    SELECT salon_id FROM user_salons
    WHERE user_id = auth.uid()
  )
)

Capability Model
Principle

Roles ≠ Capabilities.

Capabilities are derived from:

Role

Subscription plan

Feature flags

Enforcement

Frontend: useCapabilities()

Backend: SQL + Edge Functions

Subscription-Aware Security
Rules

Plan limits are enforced server-side

Downgrades never delete data

Access is restricted, not removed

Example:

Over-limit records become read-only

Data Integrity & Anti-Duplication
Canonical Rules

Phone numbers normalized (E.164)

Emails lowercased

Unique constraints at DB level

Example:

UNIQUE (salon_id, phone)


No UI-only validation is trusted.

Sensitive Operations

Operations that require elevated trust:

Billing changes

Ownership transfer

Data export

Salon deletion

Enforcement

Owner role only

Re-authentication recommended

Edge Functions preferred

Edge Functions Security
Use Cases

Billing webhooks

Plan enforcement

Abuse detection

Bulk operations

Rules

Never trust client input

Validate auth context

Enforce rate limits

Abuse Prevention
Controls

Rate limiting

Soft caps

Monitoring anomalies

Examples:

Excessive appointment creation

API spam

Repeated failed auth

Audit & Traceability
Logged Events

Role changes

Subscription changes

Destructive actions

Audit logs are append-only.

Frontend Security Rules
Allowed

Conditional rendering

Disabled buttons

UX hints

Forbidden

Security decisions

Data filtering for access

Hidden endpoints

Security Testing
Required

RLS policy testing

Role simulation

Plan downgrade scenarios

Security regressions are release blockers.

Non-Goals

Client-side encryption (future)

Zero-knowledge architecture (out of scope)

Status

Tenant isolation: Defined

RLS mandatory: Yes

Role system: Explicit

Plan-aware security: Yes
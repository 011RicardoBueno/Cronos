FEATURE_FLAGS.md

Cronos SaaS — Capability & Growth Control System

Purpose

This document defines how features are gated, exposed, and evolved in Cronos.

Feature flags are used to:

Enforce subscription plans

Enable progressive rollout

Support upsell UX

Protect the system from hard forks

Allow experimentation without refactors

Features are capabilities, not components.

Core Principles

Flags represent business capabilities

Flags are evaluated server-side

UI reacts, it does not decide

Limits are part of flags

Flags enable growth, not fragmentation

What Is a Feature Flag in Cronos

A feature flag is a boolean or quantitative capability derived from:

subscription → plan → limits → flags


Examples:

can_create_professionals

max_professionals = 3

advanced_reports = false

Flag Categories
1. Subscription Flags (Primary)

Derived from plan.

Examples:

appointments_unlimited

financial_exports

multi_location

2. Limit Flags (Quantitative)

Numeric constraints.

Examples:

max_clients

max_professionals

max_services

Limits are hard-enforced server-side.

3. UX Flags (Secondary)

Used to guide UI behavior.

Examples:

show_upgrade_prompt

show_usage_meter

show_watermark

Never trusted for security.

4. Experimental Flags

Temporary, time-bound.

Examples:

new_dashboard_layout

beta_scheduler

Must have:

Owner

Expiration

Rollback plan

Source of Truth

Feature flags are resolved:

In Edge Functions

Persisted or derived from DB

Cached safely

Frontend receives resolved capabilities, never raw plan data.

Evaluation Flow
request →
  Edge Function →
    resolve_subscription →
    resolve_plan →
    resolve_flags →
    enforce →
    return capabilities


No client-side inference allowed.

Flag Resolution Contract

Frontend receives:

{
  plan: "free" | "pro" | "enterprise",
  flags: {
    can_create_professionals: boolean,
    max_professionals: number,
    advanced_reports: boolean
  }
}


No hidden logic in UI.

Enforcement Rules
Hard Enforcement (Server)

Creation limits

Export access

Role escalation

Billing-sensitive actions

Soft Enforcement (UI)

Disabled buttons

Upgrade CTAs

Informational modals

UI-only enforcement is forbidden.

Upsell Integration

Flags drive:

Contextual upgrade prompts

Locked feature previews

Usage-based nudges

Example:

“You are using 3/3 professionals — upgrade to add more.”

No dark patterns.

Flag Storage Strategy
Allowed

Derived dynamically from subscription

Cached in memory

Returned per request

Forbidden

Hardcoding in frontend

Storing in localStorage

Manual toggles without audit

Enterprise Overrides

Enterprise flags:

May bypass limits

Are explicitly listed

Are contract-driven

No implicit behavior.

Flag Naming Conventions
can_<verb>_<entity>
max_<entity>
has_<feature>


Examples:

can_export_financials

max_professionals

has_custom_branding

Lifecycle Management

Every flag must have:

Owner

Purpose

Plan mapping

Removal strategy

Flags are not permanent by default.

Forbidden Practices

UI-only gating

Plan checks in React

Feature forks by plan

Flag explosion without governance

Testing Strategy

Tests must cover:

Free vs Pro vs Enterprise

Boundary conditions

Downgrade safety

Flag resolution integrity

Status

Feature flags are:

Mandatory

Server-resolved

Plan-driven

Growth-oriented
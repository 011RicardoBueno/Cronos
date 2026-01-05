ARCHITECTURE.md
Purpose

This document defines non-negotiable architectural rules for the Cronos SaaS project.
Its role is to preserve scalability, cognitive clarity, and long-term maintainability as the system grows.

This is not a suggestion guide.
Violations are architectural regressions.

Core Architectural Philosophy (GEMINI)

Cronos follows the GEMINI profile:

Growth-oriented

Engineering Mastery

Marketing-aware Architecture

Clear Domain Boundaries

Best Practices enforced by tooling

Architecture exists to:

Scale teams and features

Reduce refactor cost

Prevent accidental complexity

Align product, brand, and engineering

High-Level Layering
pages        → orchestration, routing, composition
components   → pure UI (no business rules)
hooks        → reusable logic
services     → external communication (Supabase, APIs)
lib          → infrastructure utilities
context      → cross-cutting state (auth, salon)
utils        → pure helper functions


Dependencies flow downward only.

Layer Rules (Strict)
pages/

Allowed

Import from: components, hooks, services, lib, utils, context

Route composition

Data orchestration

Forbidden

Business logic implementation

Heavy conditional logic

UI primitives definition

Pages are composition roots, not logic containers.

components/

Purpose
Pure, reusable UI.

Allowed

Props

Presentational logic

Local state (UI-only)

Forbidden

Direct Supabase calls

Direct context mutations

Importing from pages

Importing from services or lib (except UI-safe helpers)

Components must be portable and dumb by default.

components/ui/

This is the design system layer.

Rules

Zero business logic

Zero domain awareness

Fully reusable

If a component knows what it is rendering (e.g. “Salon”, “User”, “Plan”), it does not belong here.

hooks/

Purpose
Encapsulate reusable behavior.

Rules

May call services

May consume context

Must not import from pages

Must be domain-specific or cross-domain, never UI-specific

Hooks are logic extractors, not state managers.

services/

Purpose
External systems integration.

Rules

Supabase access

API calls

Data fetching and persistence

Forbidden

UI imports

React components

Direct DOM interaction

Services know how to talk to the world, not why.

context/

Purpose
Cross-cutting application state.

Rules

Auth

Salon

Global app concerns

Context should be thin.
Complex logic belongs in hooks or services.

lib/

Purpose
Infrastructure and low-level utilities.

Examples:

Supabase client

Environment helpers

Configuration loaders

Lib must never depend on React.

utils/

Purpose
Pure, deterministic helpers.

Rules

No side effects

No React

No external services

Settings Architecture (Explicit Decision)
Internal (Admin)
src/pages/admin/settings/


Domain-driven

Each file represents a feature section

Orchestration only

UI pulled from components

Public
src/pages/public-settings/


Isolated from admin logic

No shared state with admin settings

components/salon/

UI-only salon components.
No settings logic allowed.

Import Rules (Enforced by ESLint)

Barrel files are the only public import surface

Direct deep imports are forbidden

Relative imports preferred inside the same domain

Alias imports may be introduced later, but not before stabilization

Barrel Files Policy

Barrel files exist to:

Define a public API per folder

Reduce refactor blast radius

Improve readability

If a folder has an index file, it is the only allowed import target.

What Will NEVER Be Accepted

Components importing from pages

Business logic inside UI components

Supabase queries inside components

Circular dependencies

Bypassing barrel files

“Temporary” architecture violations

There are no temporary violations.

Decision Process for Changes

Any change that affects:

Folder structure

Dependency direction

Import surface

Domain boundaries

Must be documented before implementation.

If it is not documented, it is not approved.

Final Note

Cronos is built to scale code, team, and product simultaneously.

Architecture is not a constraint —
it is the growth engine.

Status

ESLint governance: ENFORCED

Settings consolidation: COMPLETED

Barrel files: ACTIVE

Architecture rules: LOCKED
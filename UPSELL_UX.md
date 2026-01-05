UPSELL_UX.md

Cronos SaaS — Upsell UX, Triggers & Conversion Strategy

Purpose

This document defines how, when, and why Cronos presents upgrade opportunities to users.

Goals:

Increase conversion without harming UX

Make limits visible but not frustrating

Create desire, not coercion

Align monetization with perceived value

Upsell is part of the product, not a popup.

Core Principles

Upsell appears at the moment of intent

Limits are educational, not punitive

Value is shown before price

Enterprise feels premium, not restricted

Free users must still succeed

Plans Overview (Recap)
Plan	Positioning
Free	Try, learn, trust
Pro	Operate professionally
Enterprise	Scale without friction
Upsell Trigger Types
1. Hard Limit Reached (Blocking)

Used sparingly.

Examples:

Max professionals reached

Max monthly appointments reached

Feature not available in current plan

UX Rule

Never block without explanation

Always show what unlocks

Pattern

Action → Explanation → Value → CTA

2. Soft Limit Approaching (Preferred)

This is the highest converting trigger.

Examples:

“You are using 80% of your appointment limit”

“2 of 3 professionals in use”

UX Components

Progress bar

Subtle color escalation

Inline CTA

No modals.

3. Feature Discovery (Non-blocking)

Triggered when user sees a locked feature.

Examples:

Advanced reports

Custom branding

Multiple salons

Rule
Feature must be visible but disabled.

Core Upsell Surfaces
1. Dashboard (Primary)

Components

Usage cards

Plan badge

Inline upgrade hints

Do

Show remaining capacity

Compare current vs next plan

Do Not

Show pricing table immediately

2. Settings → Subscription (Intentional)

This is where pricing tables live.

Structure

Current plan summary

Usage vs limits

Comparison table

Upgrade CTA

No dark patterns.

3. Contextual Modals (High Intent)

Used only when:

User actively tries to exceed a limit

User clicks “Upgrade”

Never auto-open.

Messaging Guidelines (Copy Rules)
Language

Professional

Non-threatening

Value-oriented

Avoid

“You can’t”

“Blocked”

“Upgrade now or…”

Prefer

“Unlock”

“Increase capacity”

“Designed for teams like yours”

Plan-Specific UX Strategy
Free Plan

Goal
Build trust + habit.

Allowed

All core flows

Limited scale

Upsell Tone
Educational

Example:

“Running more appointments? Pro removes this limit.”

Pro Plan

Goal
Operational efficiency.

Allowed

Most features

High enough limits for SMBs

Upsell Tone
Productivity & scale

Example:

“Managing multiple locations? Enterprise centralizes everything.”

Enterprise Plan

Goal
Frictionless scale.

UX Rules

No visible limits

No aggressive upsell

Priority support messaging

CTA:

“Talk to Sales”

Visual Language (Tailwind Guidance)

Free → Neutral grays

Pro → Primary brand color

Enterprise → Dark / premium accent

Never

Use red for upsell

Flashing animations

Countdown timers

Gamification (Allowed & Encouraged)

Examples:

“You unlocked 90% capacity efficiency”

“Your salon is growing”

Gamification must:

Reinforce success

Point to next level

Never shame usage.

Technical Implementation Notes
Source of Truth

Subscription + usage counters from DB

Never from client state

Capability Checks

Feature flags derived from plan

Centralized hook: useCapabilities()

Tracking

Track impressions, not just clicks

Measure upgrade intent, not only conversion

Forbidden Patterns

Surprise paywalls

Feature removal after downgrade without warning

Blocking core flows for free users

Fake urgency

Success Metrics

Upgrade conversion rate

Time-to-upgrade

Feature interaction before upgrade

Churn after upgrade

Status

UX aligned with monetization: YES

Scales with growth: YES

Dark-pattern free: YES
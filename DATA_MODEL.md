DATA_MODEL.md

Cronos SaaS — Data Model & Integrity Rules

Purpose

This document defines the official data model principles for Cronos.

Its goals are to:

Guarantee data integrity

Prevent duplication and fraud

Enable monetization enforcement

Support scale without refactors

Align database rules with business rules

If it is not enforced at the database level, it is not guaranteed.

Core Data Principles (Non-Negotiable)

Database enforces truth

Frontend never guarantees integrity

Normalization over convenience

Constraints > validations

Every core entity is auditable

Core Entities Overview
User
Salon
Subscription
Professional
Customer
Appointment
Transaction

1. User
Purpose

Represents a real authenticated person.

Source

Supabase Auth (auth.users)

Rules

One auth user = one real person

Email must be unique

Phone (if present) normalized to E.164

No business data stored here.

2. Salon (Core Business Entity)
Table: salons
id UUID PK
owner_id UUID FK → auth.users.id
name TEXT NOT NULL
slug TEXT UNIQUE NOT NULL
phone TEXT NOT NULL
address TEXT
logo_url TEXT
created_at TIMESTAMP
updated_at TIMESTAMP

Constraints
UNIQUE (slug)
UNIQUE (owner_id, phone)

Rules

A salon cannot exist without an owner

Slug is immutable after creation (except enterprise/manual)

Phone must be normalized (E.164)

3. Subscription
Table: subscriptions
id UUID PK
salon_id UUID FK → salons.id
plan_type TEXT CHECK (plan_type IN ('free', 'pro', 'enterprise'))
started_at TIMESTAMP
expires_at TIMESTAMP
limits_snapshot JSONB

Rules

One active subscription per salon

Limits snapshot is immutable

Plan changes create new records

4. Professional
Table: professionals
id UUID PK
salon_id UUID FK → salons.id
name TEXT NOT NULL
phone TEXT
active BOOLEAN DEFAULT true

Constraints
UNIQUE (salon_id, phone)

Rules

Professionals belong to a salon

Phone is optional but unique if present

Count enforced by subscription limits

5. Customer (Anti-Duplication Critical)
Table: customers
id UUID PK
salon_id UUID FK → salons.id
name TEXT NOT NULL
phone TEXT NOT NULL
created_at TIMESTAMP

Constraints (MANDATORY)
UNIQUE (salon_id, phone)

Rules

Phone number is the primary identity

No duplicate customers per salon

Phone must be normalized before insert

This is non-negotiable.

6. Appointment
Table: appointments
id UUID PK
salon_id UUID FK → salons.id
customer_id UUID FK → customers.id
professional_id UUID FK → professionals.id
starts_at TIMESTAMP
ends_at TIMESTAMP
status TEXT

Constraints
CHECK (ends_at > starts_at)

Rules

Appointment cannot exist without a customer

Time integrity enforced by DB

Monthly count enforced by subscription

7. Transaction (Finance Domain)
Table: transactions
id UUID PK
salon_id UUID FK → salons.id
amount NUMERIC(10,2)
type TEXT CHECK (type IN ('income', 'expense'))
category TEXT
created_at TIMESTAMP

Rules

Immutable records (no updates, only inserts)

Deletes are forbidden (soft delete only if needed)

Indexing Strategy (Performance)

Mandatory indexes:

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_appointments_salon_date ON appointments(salon_id, starts_at);
CREATE INDEX idx_transactions_salon ON transactions(salon_id);


Indexes are part of the model, not optimization later.

Normalization Rules
Phone Numbers

Always E.164

Normalized before persistence

Never stored in multiple formats

Slugs

Lowercase

Hyphenated

ASCII only

Anti-Abuse & Fraud Prevention

One free plan per user (default)

Duplicate salon detection via phone + owner

Rate limits enforced at API / Edge Functions (future)

Enforcement Strategy
Layer	Responsibility
Database	Constraints, uniqueness, integrity
Services	Validation + limits
Hooks	Capability awareness
UI	Feedback only
Forbidden Patterns

Relying on frontend validation

Removing DB constraints for convenience

Allowing duplicates “temporarily”

Silent normalization without visibility

Status

Data integrity: ENFORCED

Anti-duplication: GUARANTEED

Monetization-safe: YES

Scale-ready: YES
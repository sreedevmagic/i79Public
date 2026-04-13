Requirement Specification: Subscription, Usage Billing, and Stripe Integration Module
1. Objective

Implement a subscription and usage billing module for the SaaS platform using Stripe as the payment and billing provider.

The platform already has the core product features. This module must add:

plan-based subscriptions

monthly recurring billing

metered / credit-based usage

add-on credit purchases

invoice and payment tracking

subscription lifecycle management

Stripe webhook processing

customer-facing billing visibility

platform-admin-only billing support APIs

The implementation must be Stripe-configurable, because the actual Stripe configuration values, product IDs, price IDs, webhook secrets, and environment keys will be provided later.

The design must avoid hardcoding Stripe identifiers and must support clean configuration by environment.

2. Business Context

The product has multiple subscription plans with constraints and optional add-on credits:

Plans
Starter

monthly fixed subscription

includes candidate processing credits

includes voice interview credits

defined usage limits and constraints

Growth

monthly fixed subscription

higher included credits

more active jobs / users / storage / limits

Scale

monthly fixed subscription

much larger included credits

enterprise-like limits but still self-serve or assisted

Enterprise

custom pricing

negotiated limits

possibly invoiced manually or via Stripe custom subscription later

Usage Concepts
Candidate Processing Credits

A credit consumed when the platform processes one candidate through the defined AI workflow.

Voice Interview Credits

A credit consumed when one AI voice interview is completed, or when one billable interview session begins according to the final billing rule.

Add-On Credit Packs

Customers can purchase additional packs for:

candidate processing credits

voice interview credits

The platform must enforce plan limits and support top-ups.

3. Goals

The module must:

support recurring subscription billing

support credit entitlements per billing cycle

support one-time add-on purchases

reset included recurring credits every billing cycle

preserve separately purchased add-on credits according to configurable expiry policy

prevent service overuse when limits are exceeded

expose a clean billing API for the rest of the platform

be configurable without code changes when Stripe values are available later

support test and production environments cleanly

maintain strong auditability and idempotency

4. Non-Goals

This phase does not need to implement:

admin billing UI or admin console pages

accounting ERP integration

tax engine customization beyond Stripe defaults

multi-currency custom FX logic unless explicitly configured later

revenue recognition reporting

marketplace payouts

commission sharing

annual contracts unless later configured

manual bank transfer workflows unless required later for Enterprise

The module should still be designed so these can be added later.

5. Core Functional Scope
5.1 Subscription Management

The system must support:

creating a subscription for a customer

upgrading plan

downgrading plan

cancel at period end

immediate cancellation if triggered by platform admin API

resume subscription before cancellation date

renew automatically each billing cycle

trial support as configurable option

handling failed payments and dunning status from Stripe

5.2 Billing Plans

Each plan must define:

plan code

display name

description

billing interval

base monthly price

included candidate credits per cycle

included voice interview credits per cycle

max recruiter users

max active jobs

max candidates per job

max interviews per job

transcript retention period

support tier

feature flags / entitlements

overage behavior

add-on eligibility

Plan definitions must be configurable in application configuration or database, not hardcoded in business logic.

5.3 Add-On Credit Purchases

Customers must be able to purchase one-time add-on packs for:

candidate processing credits

voice interview credits

The system must support:

multiple pack sizes

Stripe checkout or payment flow for one-time purchase

balance update after successful payment

invoice visibility

optional expiry rule per pack type

configurable pricing from Stripe mapping

5.4 Credit Consumption

The module must provide a reusable internal service to consume credits.

It must support:

consume candidate credit

consume voice interview credit

check balance before action

reserve credit if needed before long-running process

commit consumption after successful completion

release reservation on failure or timeout if reservation pattern is used

This must be robust enough for async workflows and prevent double charging.

5.5 Limit Enforcement

The module must enforce plan constraints for:

recruiter seat limit

active jobs limit

candidate processing limit

interview credit limit

per-job candidate cap

per-job interview cap

The enforcement behavior must be configurable:

hard block

warn only

allow with platform-admin override via API if needed

5.6 Stripe Integration

Stripe integration must support:

customer creation / mapping

subscription checkout

one-time payment checkout for add-ons

customer billing portal access if enabled

webhook-driven status synchronization

payment success / failure handling

invoice synchronization

subscription status synchronization

idempotent webhook processing

Stripe product/price mapping via configuration

6. Key Functional Requirements
6.1 Customer Billing Profile

Each tenant / customer account must have a billing profile containing:

internal account ID

billing contact name

billing contact email

company name

billing status

Stripe customer ID

current plan

subscription status

billing cycle start and end

default currency

tax-related fields if needed later

billing portal eligibility

created by / updated by

timestamps

Rules

one tenant should map to one Stripe customer by default

Stripe customer ID must be stored once created

duplicate customer creation must be prevented

6.2 Subscription Checkout

The system must allow a user with tenant admin role to start subscription purchase.

Flow

admin selects plan

backend validates tenant eligibility

backend creates Stripe checkout session or subscription session

redirect user to Stripe hosted payment page or configured flow

Stripe completes payment

webhook confirms success

platform activates plan only after authoritative webhook confirmation

included credits are provisioned according to the plan and cycle

Rules

do not trust frontend success callback alone

subscription activation must be based on webhook event and verified data

initial entitlements must only be granted once

6.3 Plan Upgrade / Downgrade

The system must support plan changes.

Upgrade

may be immediate or next cycle depending on configuration

proration behavior must be configurable

new limits and entitlements must apply correctly

duplicate credit grants must be avoided

Downgrade

may apply next billing cycle by default

if current usage exceeds new plan limits, tenant should still downgrade but see warnings and enforced limits at renewal or via grace policy

over-limit state must be visible in the customer billing UI

6.4 Subscription Cancellation

The system must support:

cancel at period end

resume before end date

immediate cancellation through platform-admin API if needed

Rules

cancellation should not delete billing history

at subscription expiry, plan should transition to configurable fallback:

free/trial

suspended

read-only

credit behavior after cancellation must be configurable

6.5 Failed Payment Handling

When payment fails, the module must:

synchronize the failed status from Stripe

mark billing state accordingly

notify tenant admins

apply grace period policy if configured

restrict product usage based on billing policy

Billing states

Suggested states:

active

trialing

past_due

incomplete

unpaid

canceled

paused

suspended_internal

Internal state model should not depend only on raw Stripe status; map Stripe status into internal normalized states.

6.6 Add-On Purchase Flow

A tenant admin can purchase add-on packs.

Flow

choose add-on pack type and quantity

backend creates Stripe checkout session for one-time payment

payment completes

webhook confirms payment success

credit ledger is updated

receipt / invoice becomes visible in billing history

Rules

credits must not be added before confirmed payment

repeated webhook delivery must not duplicate balances

failed or expired checkout sessions must not change balances

6.7 Credit Ledger

A ledger-based model is required.

Do not store only a mutable balance field without transaction history.

Ledger entry types

grant_recurring_plan

grant_addon_purchase

reservation

release_reservation

consume_usage

manual_adjustment_add

manual_adjustment_subtract

expire_credit

refund_reversal

migration_adjustment

Each ledger entry should include

ledger entry ID

tenant ID

credit type

quantity

direction

source type

source reference

related Stripe object ID where relevant

status

notes

created by system/user/platform_admin

timestamps

idempotency key if applicable

Credit types

candidate_processing

voice_interview

Balances

Balances should be derived or cached from ledger, not manually edited without ledger updates.

6.8 Billing Cycle Credit Renewal

At each billing cycle renewal:

recurring included credits should be granted according to active plan

cycle-based recurring credits should be tracked separately from purchased add-ons

rollover policy must be configurable

Recommended default

recurring monthly credits do not roll over

purchased add-on credits do roll over, optionally with configurable expiry

This should be configurable per credit type.

6.9 Usage Metering API

Implement an internal service / module used by the rest of the platform.

Required capabilities

get current effective balance

get plan entitlements

validate whether action is allowed

consume candidate credit

consume voice interview credit

optionally reserve and finalize usage

return machine-readable error when balance insufficient

return machine-readable warning when approaching threshold

support concurrency safely

Example use cases

before processing a candidate, check candidate credit and plan limits

before starting voice interview, check voice credit

after interview completes, consume voice interview credit

if interview fails before start threshold, optionally release reserved credit

6.10 Customer-Facing Billing UI Requirements

A customer-facing billing page is required.

Must show:

current plan

subscription status

billing cycle dates

included credits

used credits

remaining credits

add-on balances

available add-on packs

invoices / receipts

payment history

payment method management link

upgrade / downgrade / cancel actions

warnings for nearing limits

No admin billing page or internal admin UI is required in this phase.

6.11 Notifications

The system should support notifications for:

subscription created

payment successful

payment failed

plan upgraded

cancellation scheduled

subscription canceled

credits low

credits exhausted

add-on purchased successfully

Notification channels can be email initially. Architecture should allow in-app notifications later.

7. Stripe Configuration Requirements

Stripe integration must be fully configurable.

7.1 Configuration must not be hardcoded

The implementation must support environment-driven or database-driven configuration for:

Stripe secret key

Stripe publishable key

webhook secret

product IDs

price IDs

checkout mode

billing portal configuration

success URL

cancel URL

trial settings

proration settings

tax behavior if enabled

supported currencies

7.2 Product / Price Mapping

The system must have a configurable mapping structure such as:

internal plan code -> Stripe price ID

internal add-on pack code -> Stripe price ID

This mapping should support:

test environment values

production environment values

future annual pricing values

future regional pricing values

7.3 Environment Separation

Must support at minimum:

local / development

test / staging

production

Each environment must have separate Stripe values.

8. Data Model Requirements

The implementation must include, at minimum, the following entities.

8.1 TenantBillingProfile

Fields:

id

tenant_id

stripe_customer_id

billing_contact_name

billing_contact_email

company_name

currency

billing_status

active_subscription_id

created_at

updated_at

8.2 Subscription

Fields:

id

tenant_id

plan_code

provider

provider_subscription_id

provider_price_id

status

billing_interval

current_period_start

current_period_end

cancel_at_period_end

canceled_at

trial_start

trial_end

next_plan_code_if_scheduled

metadata

created_at

updated_at

8.3 CreditLedgerEntry

Fields:

id

tenant_id

credit_type

entry_type

quantity

balance_effect

source_type

source_id

stripe_reference_id

idempotency_key

notes

expires_at

created_by

created_at

8.4 CreditBalanceCache

Optional but recommended:

tenant_id

credit_type

available_balance

reserved_balance

updated_at

8.5 AddOnPurchase

Fields:

id

tenant_id

add_on_code

quantity

stripe_checkout_session_id

stripe_payment_intent_id

stripe_invoice_id

status

purchased_at

created_at

updated_at

8.6 BillingInvoice

Fields:

id

tenant_id

stripe_invoice_id

stripe_customer_id

stripe_subscription_id

invoice_number

amount_due

amount_paid

currency

hosted_invoice_url

invoice_pdf_url

status

period_start

period_end

raw_snapshot

created_at

updated_at

8.7 WebhookEventLog

Fields:

id

provider

event_id

event_type

payload_hash

received_at

processed_at

processing_status

error_message

retry_count

9. API / Service Requirements

The module must expose internal APIs or service methods for:

Billing

create subscription checkout session

create add-on checkout session

get current billing summary

get available plans

get available add-on packs

get invoices

cancel subscription

resume subscription

change plan

open billing portal session

Credit / Usage

get credit balance

validate candidate processing

validate voice interview

consume credit

reserve credit

release credit

finalize reserved usage

Platform admin APIs

These are backend APIs only and no admin UI is required.

Must support:

list tenant billing profiles

view subscription details

view ledger

adjust credits manually

resync Stripe customer/subscription/invoice if needed

replay failed webhook processing internally

force cancel or suspend if needed

inspect webhook event history

All such APIs must be protected by platform_admin role only.

10. Webhook Processing Requirements

Webhook processing is critical.

10.1 Must support webhook events for at least:

checkout session completed

customer subscription created

customer subscription updated

customer subscription deleted

invoice paid

invoice payment failed

invoice finalized

payment intent succeeded

payment intent failed

charge refunded, if refunds supported

customer updated

10.2 Webhook design rules

verify signature

store raw event log

process asynchronously if needed

guarantee idempotency

handle out-of-order event delivery safely

never grant credits twice

never activate subscription twice

expose processing failures through logs and platform-admin APIs

10.3 Source of truth

Stripe is source of truth for payment status.
Internal system is source of truth for entitlement usage and platform enforcement.

11. Entitlement Rules

The system must separate:

subscription plan entitlements

current cycle included recurring credits

purchased add-on credits

consumed credits

reserved credits

Consumption priority

Recommended default order:

consume recurring cycle credits first

then consume purchased add-on credits

This priority should be configurable if needed later.

Expiry priority

If multiple credit buckets exist, consume the earliest-expiring bucket first.

12. Permissions and Roles
Tenant-level roles

Do not introduce any new tenant billing roles.

Use the existing tenant admin role for:

viewing billing page

starting subscription checkout

changing plan

canceling subscription

resuming subscription

purchasing add-ons

viewing invoices and usage

Non-admin tenant users should not have billing management permissions by default.

Platform-level roles

Use platform_admin for internal operational APIs only.

platform_admin can:

inspect tenant billing state

inspect ledger entries

manually adjust credits

replay webhook handling

resync Stripe state

force internal status corrections when needed

No platform-admin UI is required in this phase.

13. Error Handling Requirements

The system must handle gracefully:

duplicate webhook events

missing Stripe mapping

failed checkout session creation

payment failure

stale frontend state

race conditions on concurrent credit consumption

canceled sessions

partial failures between payment confirmation and entitlement grant

webhook processing downtime

For entitlement grant actions, idempotency keys and transactional updates are required.

14. Audit and Observability Requirements

The module must log and audit:

plan changes

add-on purchases

ledger adjustments

subscription cancellations

payment failures

webhook events

platform-admin overrides

entitlement grant operations

credit consumption operations for billable events

Provide structured logs and metrics for:

checkout success rate

payment failure rate

webhook failure rate

credits granted

credits consumed

low-balance accounts

delinquent accounts

15. Security Requirements

The module must:

never expose Stripe secret key to frontend

verify all webhooks

use least-privilege secrets management

protect billing endpoints by authorization

avoid client-side trust for billing status

secure platform-admin APIs

redact sensitive payment details where not needed

store only references, not raw card data

Use Stripe-hosted payment collection wherever possible to reduce PCI scope.

16. UX Requirements

The customer-facing billing page should clearly communicate:

current plan

plan inclusions

current usage

remaining credits

what happens when credits run out

what happens when plan is downgraded

whether recurring credits reset monthly

whether add-on credits expire

billing cycle dates

payment failure action needed

Warnings should appear at configurable thresholds, for example:

80% used

95% used

exhausted

17. Configurability Requirements

All of the below must be configurable without code changes where possible:

plan catalog

plan limits

included credits

add-on pack catalog

rollover policy

expiry policy

trial days

proration policy

grace period days

allowed payment methods

currency

Stripe price mappings

webhook endpoint secret

billing portal availability

fallback plan on cancellation

18. Edge Cases to Support

Include handling for:

user opens checkout but never completes payment

webhook arrives before frontend redirect completes

duplicate successful webhook events

subscription updated manually in Stripe dashboard

invoice paid after temporary failure

customer changes payment method

tenant with multiple pending checkout sessions

plan change mid-cycle

add-on purchase during delinquent state

downgrade below current usage

refund of add-on purchase

refund of latest invoice

platform-admin manual credit correction

customer merged / tenant migration scenario

data backfill or migration from initial manual plans

19. Suggested Implementation Approach

The coding agent should implement the module as a separate bounded billing domain/module with clear services:

BillingConfigurationService

StripeCustomerService

StripeCheckoutService

StripeWebhookService

SubscriptionService

CreditLedgerService

EntitlementService

UsageMeteringService

BillingPortalService

InvoiceSyncService

PlatformBillingOpsService

Avoid scattering Stripe logic across unrelated modules.

All Stripe-specific logic should be behind an abstraction so future providers can be added if needed.

20. Acceptance Criteria

The implementation is accepted when:

a tenant admin can subscribe to a plan using Stripe

Stripe identifiers are externally configurable

webhook-driven activation works reliably

included monthly credits are granted once per cycle

add-on candidate credits can be purchased and consumed

add-on voice interview credits can be purchased and consumed

usage is blocked or warned when limits are exceeded according to policy

plan upgrades and downgrades work correctly

invoice and payment history are visible in the customer billing page

webhook processing is idempotent

manual platform-admin credit adjustment is possible with audit trail

billing summaries are visible to tenant admins

failed payments move account into correct internal state

recurring credits and add-on credits are tracked separately

the rest of the platform can call a clear API to validate and consume credits

no admin billing UI is required or implemented in this phase

21. Suggested Default Business Rules

Unless otherwise configured, use these defaults:

billing interval: monthly

recurring included credits reset each cycle

recurring included credits do not roll over

add-on credits do roll over

add-on credits expire after 12 months

consume recurring credits before add-ons

plan upgrades are immediate with proration

plan downgrades apply next cycle

cancellation is at period end

grace period after failed payment: 7 days

block billable usage when no credits remain

billing status changes only from verified internal logic and Stripe webhook events

22. Open Configuration Inputs to Be Provided Later

The developer / coding agent must leave placeholders and configuration support for:

Stripe secret key

Stripe publishable key

webhook signing secret

product IDs

price IDs for each plan

price IDs for each add-on pack

success/cancel URLs

billing portal return URL

environment-specific keys

currency / tax setup

trial rules

proration rules

These must be documented in .env.example and configuration docs.

23. Developer Deliverables

The coding / design agent should deliver:

database schema / migrations

backend services and APIs

Stripe integration abstraction

webhook endpoint and processor

customer-facing billing UI

usage metering service

credit ledger implementation

platform-admin support APIs

configuration documentation

environment variable template

test cases

seed/config examples for plans and add-ons
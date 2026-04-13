# Implementation Progress Tracker

## Overview
This tracker mirrors the roadmap in `PLAN.MD` and captures execution status, owners, and checkpoints. Overall duration remains ~20 weeks with sequential phases and limited overlap for QA and documentation.

## Phase Status Summary
| Phase | Status | Owner | Target Finish | Notes |
| --- | --- | --- | --- | --- |
| Phase 1 – Requisitions & Approvals | ✅ Complete | Core Eng | Week 4 | Pilot tenant enabled via feature flag |
| Phase 2 – Applications & Pipeline | ✅ Complete | Core Eng | Week 9 | Pipeline feature flag enabled for pilot tenants (Week 10) |
| Phase 3 – Interview Loop & Scorecards | ✅ Complete | Platform Eng | Week 15 (19 Jan 2026) | Email delivery ✅, n8n scheduler ✅, Scorecard portal UI ✅ |
| Phase 4 – Decision Packs & Integrations | Planned | Platform Eng | Week 20 | Requires n8n + HRIS contract testing |

## Milestones & Tasks

### Phase 1
- [x] Finalize requisition schema + indexes
- [x] Implement approval routes + RBAC guards
- [x] Ship frontend requisition pages + approval inbox
- [x] Run pilot tenant enablement behind `feature.requisitions`
- [x] Add `(companyId, status, submittedAt)` index (build via `db.requisitions.createIndex({ companyId: 1, status: 1, submittedAt: -1 }, { background: true, name: "companyId_status_submittedAt" })` before enabling for each tenant)
- [x] Provide `scripts/migrate_jobs_to_requisitions.py` with dry-run + default user options for legacy job backfill
- [x] Enforce tenant timezone capture + API-boundary localization for requisitions/approvals

### Phase 2
- [x] Harden application model (stage enums, rejection codes, forward-only transitions)
- [ ] ~~Run application migrations/backfill for legacy candidate links~~ (not required — no prod data)
- [x] Implement pipeline APIs (move, reject, import)
- [x] Build Kanban UI + candidate import wizard
- [x] Enable `feature.pipeline` after regression tests (rolled out to tenants Week 10)

Phase 2 outcome: pipeline Kanban, import wizard, and enriched CV parsing are live for all pilot tenants with monitoring alerts clean for the first week of usage.

### Phase 3
- [x] Extend interview model + MS365 scheduling service
- [x] Ship scorecard templates + submission endpoints
- [x] Build interview plan builder + scheduling UI flows
- [x] Ship interviewer scorecard capture UI
- [x] Implement requisition-level hiring plan overrides, migrations, and candidate interview creation APIs
- [x] **Add manual "Mark as Conducted" flow (Phase 3A Priority 1)**
  - [x] Add conductedAt and webhookEventId fields to Interview model
  - [x] Create POST /interviews/{id}/mark-conducted endpoint
  - [x] Implement mark_conducted service method
  - [x] Add "Mark as Conducted" button to InterviewPlanSection
  - [x] Update TypeScript types and API service
  - [x] Add conducted status styling and timestamp display
- [x] **Candidate Email Notifications for Interview Scheduling**
  - [x] Create HTML email templates (AI interview with magic link/passcode, Human interview with Teams join URL)
  - [x] Integrate Resend email service (Backend/app/services/email_service.py)
  - [x] Auto-send emails on interview creation (both AI and human interviews)
  - [x] Implement "Resend Invite" functionality with email auto-send
  - [x] Move timezone conversion logic from frontend to backend (DB stores UTC, emails display in company timezone)
  - [x] Remove redundant manual invite generation UI (popup and copy/paste dialogs)
  - [x] Update generate-invite endpoint to send email automatically
- [ ] Add scorecard dashboards + SLA alert surfacing
  - [x] Backend: add `/dashboard/pending-scorecards` (summary + items) and `/dashboard/pending-scorecards/remind` (queue reminders)
  - [x] Service: `sla_service.compute_pending_scorecards()` and `send_scorecard_reminders()` (stubbed send)
  - [x] Frontend: Dashboard card with bucket counts and list, "Send Reminders" action
  - [x] Wire real email delivery (provider config + templates) and add per-interviewer throttle (e.g., max once/24h) ✅ **COMPLETE (19 Jan 2026)**
  - [x] n8n scheduler workflow configured and running ✅ **COMPLETE (19 Jan 2026)**
  - [x] Complete scorecard portal form UI ✅ **COMPLETE (19 Jan 2026)**
- [ ] Pilot `feature.interview_loop` with internal recruiters

### Phase 4
- [ ] Implement decision packs + audit event model
- [ ] Deliver HRIS import + webhook handlers
- [ ] Add n8n AI artifact storage + surfacing
- [ ] Roll out `feature.decision_packs` and integrations flags

## Risks & Dependencies
- MS365 and HRIS credentials per tenant must be provisioned before Phases 3 and 4.
- Multi-tenant data migrations require maintenance windows; need DB backups prior to each phase.
- n8n workflow contracts pending; delay would impact AI artifact exposure.
- Staffing: additional frontend support may be required for Phases 2 and 3 UI volume.

## Next Checkpoints
- Finalize MS365 credential onboarding + calendar service review ahead of Phase 3 build.
- Lock scorecard template catalogue and reviewer policy (evidence checks, AI scorecard governance).
- ~~Select email provider (MS365 SMTP vs SES/SendGrid)~~ ✅ **Completed: Resend integrated for candidate interview notifications**
- Implement email throttle (24h per interviewer) for scorecard SLA reminders
- Expose tenant SLA thresholds in Settings
- Define AI voice interview provider contracts + webhook specs before coding starts.
- Schedule pilot tenant for `feature.interview_loop` two weeks prior to rollout.

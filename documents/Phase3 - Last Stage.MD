# Phase 3 – Last Stage: Manual Scorecards, Reminders, Magic Links

**Date:** 12 Jan 2026  
**Context:** Post-greenfield interview flow is validated (AI + standard). Remaining scope covers manual scorecard completion, SLA-based reminders, and white-labeled magic-link submission for human interviews. Scheduler is offloaded to n8n calling our API. Reuse existing services/utilities wherever possible.

---
## Goals
- Ensure every interviewer receives a magic link when an interview moves to `conducted`.
- Automate SLA-driven reminders for pending scorecards (via n8n trigger → backend API).
- Allow Hiring Manager/Recruiter/Admin to submit scorecards on behalf of interviewers with full audit.
- Provide a white-labeled public scorecard page that reuses the public interview portal header/layout for consistency.

---
## Architecture Overview
- **Triggering:** n8n schedule trigger → calls backend reminder endpoint; no in-app cron.
- **Notifications:** Existing notification/email pipeline; add templates for initial magic link, reminders, final notice.
- **Tokens:** Signed, single-use (or time-limited) magic-link tokens scoped to `companyId`, `interviewId`, `interviewerId`, with `exp` and `nonce` for revocation.
- **Public UI:** Reuse public interview portal shell/header; render scorecard form; handle used/expired tokens gracefully.
- **RBAC:** Admin/Recruiter/Hiring Manager can resend links and submit on behalf; all operations filtered by `companyId`.

---
## Data Model Adjustments (Backend)
- **Interview**
  - Ensure/extend: `status`, `roundId`, `companyId`, `interviewerIds` (or assignments), `completedAt`.
  - Add/confirm map: `scorecardStatusByInterviewer` (e.g., `{"<interviewerId>": "pending|submitted|delegated"}`) and `lastReminderAtByInterviewer` timestamps.
  - Optional: `magicLinkNonces` per interviewer if storing server-side revocation.
- **Scorecard**
  - Add audit fields: `submittedBy`, `submittedByRole`, `submittedByDelegate: bool`, `originalInterviewerId`, `submittedAt`.
- **Company**
  - SLA config: `firstReminderHours`, `secondReminderHours`, `finalReminderHours`, `reminderChannel` (email), optional `tokenTtlHours`.

---
## Backend Endpoints (FastAPI)
1) **Send Magic Links (auto + manual)**
   - `POST /interviews/{interview_id}/send-magic-links`
   - Auth: Admin/Recruiter/Hiring Manager
   - Action: For each assigned interviewer without submitted scorecard, generate token and send email (white-label template). Idempotent; respects last-sent cooldown.

2) **Resend Magic Link (single interviewer)**
   - `POST /interviews/{interview_id}/resend-magic-link/{interviewer_id}`
   - Auth: Admin/Recruiter/Hiring Manager
   - Regenerates token, invalidates prior nonce, sends email; rate-limited.

3) **Public Scorecard Submit (magic-link auth)**
   - `POST /public/scorecards/{interview_id}/{interviewer_id}` with `Authorization: Bearer <magic_link_token>`
   - Validates token (companyId, interviewId, interviewerId, exp, nonce unused), rejects used/expired.
   - On success: save scorecard, mark `scorecardStatusByInterviewer` to `submitted`, consume token.

4) **Delegate Scorecard Submit**
   - `POST /scorecards/{interview_id}/{interviewer_id}/delegate`
   - Auth: Admin/Recruiter/Hiring Manager
   - Payload includes scorecard content + `reason` (optional); sets `submittedByDelegate=true`, `submittedBy=<user>`, `originalInterviewerId=<interviewer_id>`.

5) **Reminder Runner (for n8n)**
   - `POST /ops/reminders/scorecards/run`
   - Auth: service token / admin-only
   - Logic:
     - Query interviews with `status=conducted`, `companyId=current`, pending scorecards.
     - For each interviewer pending, check SLA windows vs `lastReminderAtByInterviewer`.
     - Send reminder emails; update `lastReminderAtByInterviewer`.
     - Stop reminders when all submitted; optionally set `interview.completedAt` when all in.

---
## Token & Security Details
- Token claims: `sub` (interviewerId), `intv` (interviewId), `cid` (companyId), `exp`, `jti` (nonce).
- Single-use: store `jti` per interviewer per interview; mark consumed on submit or resend.
- TTL: min(company SLA window, e.g., 72h) or configurable via `tokenTtlHours`.
- Multi-tenancy: All queries filter `companyId`; never trust request body `companyId`.
- Rate-limit resend endpoints; audit all sends (who, when, target interviewer).

---
## Reminder Cadence (Example SLA)
- `firstReminderHours`: 24h after `conducted`
- `secondReminderHours`: 48h
- `finalReminderHours`: 72h
- Apply company-specific overrides if present.

---
## Frontend Changes (React/Vite)
- **Types**: Extend `Interview` with per-interviewer pending/reminder metadata; extend `Scorecard` with delegate audit fields.
- **Services**: Add `sendMagicLinks`, `resendMagicLink`, `submitScorecardViaMagicLink(token)`, `submitDelegateScorecard`.
- **Public Page**: White-labeled scorecard page that reuses the public interview portal header/layout; handles states: loading, valid, expired/used, submitted.
- **Internal UI**: On interview detail, show pending/submitted per interviewer, buttons to resend link, and a "Submit on behalf" action (guarded by role).
- **Error States**: Token expired/used → show friendly message and CTA to request new link.

---
## Sequence Flows
1) **Interview → Conducted**
   - Status transition triggers `send-magic-links` (or manual call).
   - Emails sent with white-label template + token link.

2) **Scorecard Submission (Interviewer)**
   - Click magic link → public page → submit → token consumed → status updated.

3) **Reminders (n8n)**
   - n8n scheduled call → `/ops/reminders/scorecards/run` → backend sends reminders to pending interviewers based on SLA and last reminder.

4) **Delegate Submission**
   - HM/Recruiter/Admin opens internal UI → submit on behalf → audit fields set → pending list shrinks.

---
## Reuse Guidelines
- Reuse existing notification/email sender and templates where possible; add variants for magic link and reminders.
- Reuse token/crypto utilities for signing/verification; add nonce store if needed.
- Reuse interview/scorecard service helpers for status updates and validation.
- Reuse public portal header/layout component to keep white-label consistency.

---
## Testing Plan
- Unit: token generation/verification; SLA window calculation; reminder selection logic; delegate flagging.
- Integration: conducted → magic links sent; submit via magic link; reminder endpoint only notifies pending; resend invalidates old token; delegate submit sets audit fields.
- UI: public page valid/expired/used flows; internal resend + delegate flows; permissions enforced.

---
## Definition of Done
- 100% of conducted interviews trigger magic-link emails to assigned interviewers.
- Reminders fire per SLA until all scorecards submitted; no duplicate spam.
- Delegate submission works with audit (`submittedBy`, `submittedByRole`, `submittedByDelegate`, `originalInterviewerId`).
- Public page is white-labeled and reuses the existing portal header; tokens are single-use and expire correctly.
- All endpoints enforce `companyId` filtering and RBAC; resend/reminder actions are audited.

# Business Requirements — Public Candidate AI Interview Portal (Magic Link, White-Labeled)

## 1. Purpose
Build a **public-facing Candidate AI Interview Portal, not the platform Frontend, this should indepentant deployable React App** that allows a candidate to join an assigned AI interview using a **token-based URL (Magic Link)**, validated with a **passcode**, and governed by **explicit consent** for recording/transcription. The portal must be **white-labeled per tenant/company** and fall back to the **default theme** aligned with the existing frontend design system and the already-defined platform architecture.

This portal is part of **Phase 3 (AI voice interview)** and must integrate with:
- Existing Recruitment SaaS backend services
- Email engine (invite delivery)
- Ultravox voice call session creation + joining via Ultravox React SDK
- Optional “full-session replay” capture (tab/screen + audio) capability (feature-flagged)

---

## 2. Scope
### In Scope (Phase 3 extension)
- Public portal accessible without login using **Magic Link token**
- Tenant-aware branding (white label) with fallback default theme
- Consent capture and audit logging
- Passcode verification
- Session readiness checks (schedule window, expiry, attempt limits)
- Backend-triggered **Ultravox call session creation** and return of join URL
- Client joins Ultravox voice call using **Ultravox React SDK**
- Candidate guidance UI (mic check, speaker check, help)
- Status screens (waiting room, in-progress, completed)
- Store artifacts and provide recruiter visibility (via internal portal)
- Anti-abuse controls (rate limit, token expiry, one-time-use optional)

### Optional (Feature-flagged / later in Phase 3)
- “Record the interview experience” (tab/screen video + mixed audio) for playback
- Candidate camera video capture in portal (if required) independent of Ultravox
- Observer / proctor view link (recruiter QA) to monitor session (policy controlled)

### Out of Scope
- Candidate login/registration
- Job application workflow (apply forms)
- Offer and onboarding flows
- Video conferencing replacement for Teams/Meet (portal is interview-only)

---

## 3. Key Users & Personas
1) **Candidate (Public User)**
- No account
- Receives email invite with magic link + passcode
- Must consent to recording/transcription

2) **Recruiter (Authenticated User)**
- Schedules AI interview and selects AI agent profile
- Receives completion notifications and reviews AI-generated scorecard

3) **Tenant Admin (Authenticated User)**
- Manages tenant branding and legal text (consent language)
- Controls policies (recording required/optional, expiry window, retries, etc.)

---

## 4. Business Goals & Success Metrics
### Goals
- Reduce recruiter time spent on initial screening
- Ensure consistent and auditable candidate evaluation
- Improve candidate experience with clear, branded and secure joining flow
- Increase completion rate of AI interviews

### Metrics
- Invite-to-join conversion rate
- Interview completion rate
- Average time-to-completion
- Consent acceptance rate
- Drop-off rate at passcode/permissions
- Recruiter review turnaround time for AI scorecards

---

## 5. Candidate Journey (End-to-End)
1) Recruiter schedules AI interview in internal portal.
2) System generates:
   - **Magic link**: tokenized URL containing no PII
   - **Passcode** (short, human-enterable)
3) Candidate receives email with:
   - Join link + passcode
   - What to expect
   - Consent/recording notice
4) Candidate opens link → portal loads tenant branding.
5) Portal displays:
   - session summary (role, time window, duration)
   - consent screen (mandatory)
6) Candidate enters passcode:
   - validated against backend + token
7) Candidate starts session:
   - backend creates Ultravox call, returns join URL
8) Portal joins Ultravox call via Ultravox React SDK:
   - shows live status (listening/thinking/speaking)
   - optionally displays transcripts (tenant setting)
9) Call completes:
   - backend receives completion webhook
   - n8n generates AI scorecard draft
10) Recruiter reviews and finalizes scorecard.

---

## 6. Functional Requirements

### 6.1 Magic Link Access (Token URL)
- Candidate accesses portal using URL format:
  - `https://{publicBase}/i/{token}`
- Token must be:
  - opaque (not guessable)
  - time-bound (expiry policy)
  - mapped to a single InterviewSession
- Portal must call backend to fetch session metadata using token.
- Portal must not expose internal IDs in the UI.

**Acceptance**
- Invalid/expired token shows a friendly error and support instruction.

### 6.2 White Label Branding (Tenant Theme)
- Portal must render tenant-specific branding:
  - logo, primary color, font (optional), button styles
  - custom consent/legal text (tenant admin)
- If tenant branding is unavailable, portal uses **default theme** consistent with existing frontend.
- Branding must be fetched via token context (tenant resolved from session).

**Acceptance**
- Same link loads different branding based on tenant.

### 6.3 Consent to Record/Transcribe
- Candidate must explicitly consent before joining:
  - checkbox + “I agree” action
  - consent text must be tenant-configurable with fallback default
- Store consent record:
  - sessionId, timestamp, consentVersion, IP (optional), userAgent (optional)
- If consent declined:
  - portal blocks join and shows escalation message (“contact recruiter”)

**Acceptance**
- Consent is recorded and retrievable in recruiter audit view.

### 6.4 Passcode Validation
- Candidate must enter passcode to proceed.
- Validation rules:
  - rate limit attempts (e.g., 5 attempts)
  - lockout window after failures
  - passcode expires with session expiry
- Backend returns:
  - pass/fail
  - remaining attempts
  - whether start is allowed (time window, status)

**Acceptance**
- Wrong passcode never reveals “which part is correct”.

### 6.5 Session Readiness Checks
Before start:
- Confirm:
  - session is Scheduled
  - within join window (e.g., -15 min to +24h)
  - candidate not already completed (unless retries allowed)
- Show “waiting room” if too early.
- Show “expired” if outside allowed window.

### 6.6 Start Interview (Ultravox Session Creation)
On “Start Interview”:
- Portal calls backend:
  - `POST /public/ai-interview/{token}/start`
- Backend creates Ultravox call session and returns:
  - `callJoinUrl`
  - UI config (agent name, optional transcript display)
- Backend persists mapping: interviewId ↔ ultravoxCallId

**Acceptance**
- Backend ensures idempotency (double-click safe).

### 6.7 Join Voice Call (Ultravox React SDK)
- Portal uses Ultravox SDK to join via `callJoinUrl`.
- Must show call state:
  - connecting, listening, thinking, speaking
- Provide controls:
  - mute/unmute mic
  - mute/unmute speaker
  - end call (if allowed by policy)
- Handle network reconnect gracefully.

**Acceptance**
- Candidate can complete interview without login.

### 6.8 Browser Capability Checks (Candidate Readiness)
- Before joining:
  - mic permission check
  - speaker/audio test
  - “recommended browser” guidance if unsupported
- Provide clear troubleshooting steps.

### 6.9 Completion & Confirmation Screen
When call ends:
- Show:
  - “Interview completed”
  - next steps (thank you, recruiter will review)
- Backend receives webhook from Ultravox and updates session state.

### 6.10 Optional: Full Session Recording (Portal Screen + Mixed Audio)
Feature-flag per tenant.
- If enabled:
  - portal asks candidate to share tab/window (browser prompt)
  - records portal screen + mixed audio into a single recording
  - uploads to storage and stores playback URL in session
- Must still work if candidate declines recording (policy-driven: either block or proceed).

**Acceptance**
- Recruiter can replay a single recording file (if enabled).

---

## 7. Non-Functional Requirements

### 7.1 Security
- Token must not be guessable; use strong random + hash storage.
- Token should be single-use optionally (tenant policy).
- Rate-limit public endpoints (IP + token).
- All recordings/transcripts stored with signed URLs + RBAC access from internal portal only.
- No PII in URL or client logs.

### 7.2 Privacy & Compliance
- Consent required and auditable.
- Retention policies per tenant (e.g., delete recordings after 90 days).
- Ability to disable transcript display to candidate (tenant option).

### 7.3 Availability & Reliability
- Public portal must be highly available (CDN + static hosting recommended).
- Backend start must be idempotent and resilient.
- Webhook ingestion must be retry-safe (idempotency keys).

### 7.4 Performance
- Portal initial load < 2 seconds on average broadband.
- Join flow should complete within reasonable time (10–30s) with progress UI.

---

## 8. Configuration (Tenant Policies)
- Branding theme (logo/colors)
- Consent text + version
- Recording policy:
  - required / optional / disabled
- Transcript visibility:
  - hidden / partial / full
- Join window:
  - early join minutes, late join hours
- Retry policy:
  - allow reattempts? max attempts
- Passcode rules:
  - format, length, expiry

---

## 9. Integration Requirements (Aligned with Existing Architecture)
- Public portal uses backend public endpoints only (no direct DB access).
- Backend triggers Ultravox session creation using existing service layer.
- n8n handles post-call processing:
  - fetch transcript/audio refs (if applicable)
  - generate scorecard draft
  - store scorecard submission (AI) with review pending
- Email engine sends invitation and reminders.

---

## 10. Public API Requirements (Candidate Portal, This should be in the same Backend FAST API poroject)
> Names are indicative; implement in your existing API conventions.

- `GET /public/ai-interview/{token}/session`
  - returns tenant theme + session summary + policy flags
- `POST /public/ai-interview/{token}/consent`
  - stores consent record
- `POST /public/ai-interview/{token}/validate-passcode`
  - validates passcode and returns canStart status
- `POST /public/ai-interview/{token}/start`
  - creates Ultravox call and returns callJoinUrl + config
- `POST /public/ai-interview/{token}/status`
  - optional, for client heartbeat/reporting
- `POST /webhooks/ultravox`
  - call completed + artifacts (server-to-server)

---

## 11. Deliverables
- Public portal React app pages and components
- Tenant theme loader + fallback default theme support
- Backend endpoints + token/passcode services
- Audit logs for consent and access
- Integration with Ultravox call create/join
- n8n workflow trigger on completion for scorecard generation
- Recruiter-facing links in internal portal to:
  - view session status
  - view transcript/recording links (if allowed)
  - review AI scorecard draft

---

## 12. Acceptance Criteria (MVP for Public Portal)
1) Candidate can open magic link, see correct tenant branding, consent, enter passcode, and join voice interview.
2) Backend creates Ultravox call and returns join URL; client joins via Ultravox React SDK.
3) Consent is stored and visible in internal audit view.
4) Interview completion updates session state and triggers AI scorecard workflow.
5) Default theme is used when no tenant branding exists.
6) Security: token expiry + rate limiting + no PII leakage.

---

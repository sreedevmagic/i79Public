# Technical Design — Hiring Operations Overview Dashboard (Revamp)

## 0) Summary
The current screen is framed as a **“Recruiter Command Center”** and mixes personal productivity widgets with pipeline stats, leaving large areas underutilized. This revamp redesigns it into a **Hiring Operations Overview** (cross-role: TA Lead / Hiring Ops / Recruiter / Hiring Manager) with:
- a **single global filter bar**
- a **work-queue first** layout (what needs attention now)
- **pipeline health** + **SLA risk**
- **automation impact** (AI value) without being “recruiter-centric”
- clear **metric derivation logic** and data contracts

No visual mockups are provided; this is a backend+frontend technical design aligned to your existing stack (React + FastAPI + MongoDB + n8n).

---

## 1) Goals & Non-Goals

### Goals
1. Provide a **tenant-wide operational view** of hiring that works for:
   - Hiring Ops / TA Leads (team + workload + bottlenecks)
   - Recruiters (my queue + my reqs)
   - Hiring Managers (interviews & decisions pending)
2. Make the dashboard **actionable** (queue + SLAs) rather than decorative KPIs.
3. Standardize metric definitions (same numbers across app).
4. Keep it fast: 95p dashboard load < 1.5s (cached aggregates).

### Non-Goals
- This is not a BI tool replacement (PowerBI etc.).
- No advanced cost attribution until job board spend + HR finance feeds exist.

---

## 2) Who the dashboard is for (Role-based view)
The same dashboard screen, but default filters & widgets adapt by role:

- **Hiring Ops / TA Lead**
  - default scope: tenant/team-wide
  - emphasis: SLA risk, throughput, bottlenecks, aging
- **Recruiter**
  - default scope: “My Reqs / My Candidates”
  - emphasis: work queue, pending decisions, pending scorecards
- **Hiring Manager**
  - default scope: reqs where user is hiring manager
  - emphasis: interviews scheduled, scorecards pending, decision packs

> Implementation: role-based defaults, NOT separate dashboards (avoid fragmentation).

---

## 3) Information Architecture & Widget Placement (12-column grid spec)

### 3.1 Global header (sticky)
**Row H (12 cols): Global Filter Bar**
- Time range: `Today | 7d | 30d | Month-to-date | Custom`
- Scope selector (role-aware):
  - Org/Tenant
  - Business Unit / Department
  - Recruiter / HM (multi-select)
  - Requisition (optional)
- Toggles:
  - Include On Hold
  - Include Archived
- Quick actions (permission-based):
  - Create Requisition (internal)
  - Invite candidate (if enabled)

**Why:** every metric on the page must be filter-consistent.

---

### 3.2 Row 1 — “Operational Pulse” (4–6 compact KPI cards)
**Row 1 (12 cols, 4 cards x 3 cols each OR 6 cards x 2 cols each)**  
Cards should be small, consistent, and clickable to drill down.

Recommended cards:
1. **Open Reqs** (with aging badge: `X > 30 days`)
2. **Candidates in Motion (7d)** (stage changes last 7d)
3. **Interviews This Week**
4. **SLA at Risk** (items breaching/near-breaching)
5. **Pending Decisions** (offers/shortlist/decision pack pending)
6. **Automation Hours Saved (MTD)**

> Replace “Choose your plan” and personal welcome message with this operational header. Subscription CTA should live in Admin/Billing, not Ops.

---

### 3.3 Row 2 — “Work Queue” + “Pipeline Health”
**Left (7 cols): Work Queue (Actionable)**
- A prioritized list of items requiring action (with SLA countdown):
  - Pending scorecards
  - Interviews to schedule
  - Candidates awaiting screening decision
  - Decision packs ready but not decided
  - Integration exceptions (email ingestion failures, webhook failures)
- Filters inside widget:
  - `All | Mine | My Team`
  - `Overdue | Due <24h | Due <3d`
- Each row has a CTA deep link (e.g., “Submit scorecard”, “Review candidate”, “Decide”).

**Right (5 cols): Pipeline Health**
- Mini funnel or stacked stage counts (Screen → Interview → Offer → Hired)
- A “bottleneck indicator”:
  - stage with max median age
  - stage with highest drop-off vs baseline
- Drill-down on click.

---

### 3.4 Row 3 — “Candidate Quality Signals” + “Quality & Source”
**Left (7 cols): Decision-Ready Candidates (Top List)**
- The replacement for “High Priority Candidates”
- Only shows candidates with **actionable state** (e.g., AI-ready scorecard draft, high match above threshold, decision pack ready)
- Columns:
  - Candidate initials
  - Requisition
  - Current stage
  - Score signal (AI/human)
  - Risk flags (missing scorecard, incomplete loop)
  - CTA: “Open decision pack”

**Right (5 cols): Quality & Source Snapshot**
- Metrics (time-range filtered):
  - Screen pass rate
  - Interview-to-offer conversion
  - Top sources by “quality candidates”
  - Drop-off reasons (top 3)
- This replaces the current “This Week’s Impact” box, which is too narrow and ambiguous.

---

### 3.5 Row 4 — “Activity & Exceptions”
**Full width (12 cols): Activity Timeline + Exceptions**
- Recent events (audit-like):
  - requisition approved
  - candidate moved stage
  - interview completed
  - AI interview completed
  - scorecard submitted
- Exceptions panel (if any):
  - Ultravox webhook retry queue
  - email ingestion parse failure
  - calendar sync failures (if applicable)

---

## 4) Core Data Entities Needed (existing/common in your platform)
Minimum collections (names can match your codebase):
- `requisitions`
- `applications` (candidate↔requisition)
- `interview_sessions` (human or AI)
- `scorecard_submissions`
- `stage_events` (or `activity_log`)
- `ai_outputs` (match scores, AI screening results, AI scorecard drafts)
- `tenant_branding` (already used by public portal)
- `integration_events` (errors/retries)

All records must be tenant-scoped:
- `companyId` (or `tenantId`) on every doc
- optional scoping fields: `businessUnitId`, `departmentId`, `recruiterUserId`, `hiringManagerUserId`

---

## 5) Metric Definitions & Derivation Logic (authoritative)

### 5.1 Open Reqs
**Definition:** requisitions currently approved/open and not closed/cancelled.
- `openReqs = count(requisitions where status in ['approved','open'] AND isClosed=false AND (includeOnHold ? true : onHold=false))`

**Aging > 30 days**
- `agedReqs30 = count(openReqs where now - approvedAt >= 30d)`

---

### 5.2 Candidates in Motion (7d)
**Definition:** number of applications whose pipeline stage changed in the time range.
- Requires `stage_events` (recommended) or `applications.stageHistory[]`

Formula:
- `candidatesInMotion = countDistinct(applicationId where stage_events.timestamp in range AND eventType='stage_changed')`

---

### 5.3 Interviews This Week
**Definition:** interviews scheduled in next 7 days (or within selected range).
- `interviewsScheduled = count(interview_sessions where scheduledAt in range AND status in ['scheduled','confirmed'])`

Optional split:
- Human vs AI interview:
  - `type in ['human','ai']` or `provider='ultravox'`

---

### 5.4 SLA at Risk
**Definition:** count of actionable items that will breach SLA within the next X hours OR already overdue.
SLA policies should be configurable per tenant (defaults recommended):
- Scorecard due: 24h after interview end
- Screening decision due: 48h after application enters screen stage
- Interview scheduling due: 72h after shortlist

Compute:
- Build queue items (see 5.8) and calculate:
  - `isOverdue = now > dueAt`
  - `isAtRisk = (dueAt - now) <= riskWindow` (e.g., 12h)

Metric:
- `slaAtRisk = count(queueItems where isOverdue OR isAtRisk)`

---

### 5.5 Pending Decisions
**Definition:** number of applications in “decision-required” state (e.g., decision pack ready, or final round complete but decision not recorded).
- `pendingDecisions = count(applications where decisionStatus='pending' AND currentStage in ['final_interview','decision'])`

If you don’t have `decisionStatus`, infer it:
- final interview complete (all required scorecards submitted) AND no decision recorded.

---

### 5.6 Automation Hours Saved (MTD)
**Definition:** estimated recruiter hours saved due to AI automation replacing manual steps.
This must be transparent and configurable to avoid mistrust.

Approach:
- Define baseline times (tenant config, defaults):
  - `baselineScreenMinutes = 15` (manual screening per candidate)
  - `baselineSchedulingMinutes = 5` (per interview scheduled)
- Define automation events:
  - `ai_screen_completed` (candidate screened by AI)
  - `auto_shortlist_created` (optional)
  - `auto_schedule_suggested` (optional)

Compute:
- `hoursSaved = (aiScreenCount * baselineScreenMinutes + autoScheduleCount * baselineSchedulingMinutes) / 60`

Month-over-month:
- Compare to same-length prior period:
  - `deltaPct = (hoursSavedThisMonth - hoursSavedLastMonth) / max(1, hoursSavedLastMonth)`

> IMPORTANT: Only count automation where it actually reduced human work.
Example rule: AI screening counts only if candidate moved out of “screen” without human screen scorecard.

---

### 5.7 Pipeline Funnel (Screen → Interview → Offer → Hired)
**Definition:** counts of active applications by current stage bucket.
- Stage bucket mapping table (configurable):
  - Screen: `['applied','ingested','screen']`
  - Interview: `['interview_scheduled','interview','panel']`
  - Offer: `['offer_requested','offer_sent']`
  - Hired: `['hired']`

Compute:
- `funnelCounts[bucket] = count(applications where currentStage in bucketStages AND isActive=true)`

Add “median age in stage” for bottleneck:
- `medianAge(stage) = median(now - enteredStageAt)`  
Requires `enteredStageAt` per application.

---

### 5.8 Work Queue (Action Required) — canonical logic
**Definition:** actionable items derived from system state, not manually curated.
Queue item types and derivation:

1) **Pending Scorecards**
- Source: `interview_sessions` + `scorecard_submissions`
- Rule:
  - Interview ended (status='completed')
  - Required scorecard(s) missing
- `pendingScorecards = interviews where completedAt exists AND requiredScorecardsCount > submittedScorecardsCount`
- SLA:
  - `dueAt = completedAt + tenantPolicy.scorecardDueHours (default 24h)`

2) **Interviews to Schedule**
- Source: `applications`
- Rule:
  - stage='shortlisted'
  - no interview_sessions scheduled within `X` hours
- SLA:
  - `dueAt = stageEnteredAt + tenantPolicy.scheduleDueHours (default 72h)`

3) **Screen Decision Required**
- Source: `applications` + `screen_scorecard`
- Rule (aligning with your requirement): cannot exit Screen without a screen scorecard
  - stage='screen'
  - screen scorecard not submitted
- SLA:
  - `dueAt = stageEnteredAt + tenantPolicy.screenDecisionDueHours (default 48h)`

4) **Decision Pack Ready**
- Source: `applications` + `scorecard_submissions`
- Rule:
  - all required scorecards submitted
  - no decision recorded
- SLA:
  - `dueAt = lastScorecardSubmittedAt + tenantPolicy.decisionDueHours (default 48h)`

5) **Integration Exceptions**
- Source: `integration_events`
- Rule:
  - status='failed' and retryCount < max
- SLA:
  - `dueAt = failedAt + tenantPolicy.integrationFixHours (default 24h)`

---

### 5.9 Decision-Ready Candidates (Top List)
**Definition:** shortlist of candidates that are most likely to progress but require a human action.
Eligibility:
- in stage `screen` with AI match score ≥ threshold AND missing screen scorecard
OR
- in stage `interview` with AI draft scorecard ready for review
OR
- decision pack ready

Ranking (example weighted):
- `rankScore = 0.5*aiMatchScore + 0.3*stageUrgencyScore + 0.2*recencyScore`
Where:
- `stageUrgencyScore` based on time-to-SLA breach

---

### 5.10 Quality & Source Snapshot
These become meaningful once sourcing module exists; still implement with current data:

1) **Screen Pass Rate**
- `passRate = passedScreen / screenedTotal`
Where:
- `screenedTotal = count(applications with screenScorecardSubmittedAt in range)`
- `passedScreen = count(screenedTotal where screenDecision='pass' OR movedTo='shortlist')`

2) **Interview-to-Offer Conversion**
- `conversion = offersRequested / interviewsCompleted`
Where:
- `interviewsCompleted = count(interview_sessions completed in range)`
- `offersRequested = count(applications where offerRequestedAt in range)`

3) **Top Sources by Quality Candidates**
Requires `application.source` (manual/import/job board).
Define “quality candidate” minimally as:
- reached interview stage OR passed screen
- `quality = count(applications where source=X AND (passedScreen OR reachedInterview))`

---

## 6) Backend Implementation Design

### 6.1 Read Model Strategy (fast dashboard)
Do NOT compute everything on-demand with multiple heavy Mongo aggregations per request.

Recommended:
- A **Metrics Read Store** (Mongo collection) refreshed incrementally:
  - `dashboard_snapshots` (per tenant + filter keys + time window)
- Update by:
  - event-driven increments (preferred)
  - scheduled recompute (fallback)

**Snapshot key**
- `{companyId, timeRangeKey, scopeKeyHash}`

### 6.2 Event Sources
Events that should trigger partial recompute:
- requisition status changes
- application stage changes
- interview scheduled/completed
- scorecard submitted
- AI screening completed
- AI interview completed webhook
- integration failure/resolution

### 6.3 n8n role
n8n can:
- process Ultravox artifacts → create AI scorecard draft
- emit “ai_scorecard_ready” event to backend
But dashboard metrics should be computed in backend or a dedicated worker for consistency.

### 6.4 API Contracts (FastAPI)
Single endpoint to load dashboard:
- `GET /api/dashboard/ops-overview`
Query params:
- `companyId` (derived from auth)
- `range=7d|30d|mtd|custom`
- `startAt`, `endAt` (custom)
- `scopeType=tenant|bu|team|user`
- `scopeIds[]=...`
- `includeOnHold=true|false`

Response sections:
- `kpis: {openReqs, candidatesInMotion, interviewsThisWeek, slaAtRisk, pendingDecisions, automationHoursSaved}`
- `workQueue: [{type, count, dueBuckets, topItems[]}]`
- `pipelineHealth: {funnelCounts, medianAgeByStage, bottleneckStage}`
- `decisionReadyCandidates: [{applicationId, requisitionId, stage, aiSignals, ctas}]`
- `qualitySource: {passRate, conversion, topSources[]}`
- `activity: [{eventType, entityId, text, timestamp}]`
- `exceptions: [{type, count, sample[]}]`

### 6.5 Index Requirements (MongoDB)
Minimum indexes:
- `requisitions`: `{companyId, status, approvedAt}`
- `applications`: `{companyId, currentStage, updatedAt}`, `{companyId, recruiterUserId, currentStage}`, `{companyId, hiringManagerUserId, currentStage}`
- `interview_sessions`: `{companyId, scheduledAt, status}`, `{companyId, completedAt, status}`
- `scorecard_submissions`: `{companyId, interviewSessionId, submittedAt}`
- `stage_events/activity_log`: `{companyId, timestamp}`, `{companyId, actorUserId, timestamp}`
- `integration_events`: `{companyId, status, failedAt}`

---

## 7) Frontend Implementation Notes (React)
- Dashboard should be built as **composable widgets**:
  - each widget has a `dataKey`, `loading`, `emptyState`, `errorState`
- Use one API call for initial page load.
- Support drill-down navigation:
  - clicking KPI or queue item routes to filtered list views (requisitions/applications/interviews).
- Tenant white-label does NOT apply here unless your main product supports theming; if yes, reuse the same theme provider.

---

## 8) Empty States & UX Rules (important)
- No giant empty boxes.
- If a widget has no results:
  - show a compact empty state + suggested action (e.g., “No pending scorecards”)
- If tenant is new:
  - show “Getting started” guidance *only* in a small onboarding banner, not in the main widget grid.

---

## 9) Rollout Plan
Phase A (1 sprint):
- Implement Ops Overview layout + API read model skeleton
- KPIs + Work Queue + Activity
Phase B:
- Pipeline Health funnel + bottleneck logic
- Decision-ready candidate list
Phase C:
- Quality & Source snapshot (as sourcing module matures)

---

## 10) Definition of Done
- Metrics are consistent across dashboard and list views.
- Role-based defaults work (TA lead vs recruiter vs hiring manager).
- Dashboard loads within target latency under typical tenant sizes.
- All metrics have clear, documented derivations (this doc), and are test-covered with fixtures.

---

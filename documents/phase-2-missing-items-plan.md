# Phase 2 – Missing Items Plan

_Last updated: 2026-01-02_

## Context
Phase 2 (Applications & Pipeline) shipped the kanban board, imports, and stage APIs, but the MVP specification in `Business/RequirementDocumention.MD`, `RequirmentFrontEndUIDoc.MD`, and `PLAN.MD` still calls for several recruiter-facing workflows that remain incomplete. This document tracks the outstanding scope so we can close Phase 2 before starting Phase 3 (Interview Loop & Scorecards).

## Outstanding Scope (Summary)
1. **Candidate Detail Experience** – Dedicated page/drawer showing full application snapshot, parsed CV, AI insights, stage history, and recruiter actions.
2. **CV Re-Upload & Re-Parse** – Allow recruiters to attach a CV to imported candidates that lack files, triggering parsing + AI analysis.
3. **Candidate Workspace** – `/candidates` list, manual add form, CSV/resume ingestion page, and dedupe review modal as described in §8 of the requirement doc.
4. **Stage Policy Enforcement & Hold State** – Enforce guardrails (e.g., cannot move to Shortlist without screen scorecard) and expose Hold/Compare state per UX spec.
5. **Recruiter Screen Scorecards** – Provide the 1–5 scorecard with evidence requirement before moving candidates beyond Screen.
6. **Duplicate Handling UX** – Surface detected duplicates during import with merge/keep decisions instead of silent skips.
7. **Candidate Metadata Management** – Expose `source`, tags, recruiter summary notes, and activity timeline editing in the candidate detail view.

## Execution Tracker
| ID | Workstream | Owner | Backend Impact | Frontend Impact | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| P2-1 | Candidate Detail page/drawer (data API + UI) | Core Eng | `ApplicationOut` detail endpoint with CV analysis, timeline | New `CandidateDetail` route, app context wiring | 🔜 Planned | Blocks scorecard entry + AI visibility |
| P2-2 | CV re-upload + parsing for existing applications | Core Eng | New `/applications/{id}/upload-cv` route, blob upload + parser reuse | Detail + pipeline actions, toast handling | 🔜 Planned | Required for imports without files |
| P2-3 | Candidate workspace (list, manual add, import wizard) | Core Eng + FE | Extend candidate routes for manual add/dedupe | Pages `/candidates`, `/candidates/import`, dedupe modal | 🔜 Planned | Aligns with UX §8 |
| P2-4 | Stage policy enforcement + Hold state | Core Eng | Stage validation in `application_service`, optional Hold enum | Kanban rules + Hold column toggle | 🔜 Planned | Prevents noncompliant moves |
| P2-5 | Recruiter screen scorecard flow | Platform Eng | Screen scorecard model/API lite version | Scorecard form + trigger from detail | 🔜 Planned | Needed before Interview Loop |
| P2-6 | Duplicate handling UX | Core Eng | Import endpoint returns duplicates metadata | Modal to merge/skip rows | 🔜 Planned | Avoid silent skips |
| P2-7 | Candidate metadata editing (source, tags, notes) | Core Eng | Extend application/candidate schema updates | Detail page editors + validations | 🔜 Planned | Supports analytics + filtering |

_Status legend: ✅ Done · 🔄 In Progress · 🔜 Planned · ⏸ Blocked_

## Sequencing & Milestones
1. **Milestone A – Candidate Insight Readiness** (P2-1, P2-2, P2-7)
   - Goal: recruiters/hiring managers can open any candidate, view AI analysis, upload missing CVs, edit tags/notes.
2. **Milestone B – Intake Workspace** (P2-3, P2-6)
   - Goal: CSV/manual imports match requirement doc with dedupe review and activity logging.
3. **Milestone C – Pipeline Guardrails** (P2-4, P2-5)
   - Goal: enforce stage policies and capture recruiter screen scorecards before Phase 3 interview planning.

Each milestone should complete with regression checks on import flows, kanban interactions, and RBAC (admin/recruiter/hiring manager).

## QA / Regression Checklist
- Candidate detail endpoint returns correct data scoped by `companyId` and role.
- CV re-upload updates application status and refreshes kanban without full page reload.
- Candidate workspace supports manual creation, CSV import with dedupe, and error reporting (row + reason).
- Kanban stage transitions respect policy checks (screen scorecard required, hold state available) with clear user messaging.
- Screen scorecard submission enforces evidence requirements and logs in timeline.
- All new UIs covered by protected routes and multi-tenant filtering.

## Next Steps
1. Assign owners per tracker and create implementation tickets referencing this document.
2. Prioritize Milestone A to unblock recruiters currently missing AI insights or CV uploads.
3. Update `IMPLEMENTATION_PROGRESS.md` once each workstream lands to reflect Phase 2 completion readiness.

# i79Engage Delivery Plan

## Source Documents
- Business/RequirementDocumention.MD
- documents/ARCHITECTURE_V2.md
- documents/FRONTEND_ARCHITECTURE_V2.md

## Objective
Elevate the current i79Engage MVP to the enterprise-grade specification outlined in the Requirement Document by layering requisitions, approvals, pipeline management, interview orchestration, decision packs, audit trails, and HRIS/AI integrations while preserving tenant isolation and RBAC guarantees.

## Phase Breakdown

### Phase 1 — Requisitions & Approvals (Weeks 1-4)
- **Scope & Value:** Hiring managers create requisitions, submit for approval, and approvers enforce governance with auditable decisions. Unlocks compliant headcount control.
- **UI Screens:** Navigation update, `/requisitions`, `/requisitions/new`, `/requisitions/:id`, `/approvals/inbox`, dashboard cards for open requisitions and pending approvals.
- **Backend:** New `models/requisition.py`; optional `models/approval_action.py` (or embedded). Routes `api/routes/requisitions.py`, `api/routes/approvals.py`; services `requisition_service.py`, `approval_service.py`. Indexes `{companyId, status}`, `{companyId, external.externalReqId}` plus timestamps. Migration script to seed indexes and default hiring-team mappings.
- **Frontend:** Types for `Requisition`, `Approval`, enums; API clients `requisitionService.ts`, `approvalService.ts`. Components `RequisitionForm`, `ApprovalTimeline`, `ApprovalInbox`. Router wiring with protected routes.
- **Security:** Enforce `companyId` filtering everywhere, restrict approval actions to assigned approvers, hiring managers limited to their requisitions, recruiters read/update only if assigned.
- **Tests:** Unit—requisition validation, approval workflow transitions, RBAC checks. Integration—draft → approval path, rejection handling, audit logging. Manual QA—create, submit, approve, audit timeline review.
- **Rollout & Flags:** Feature flag `feature.requisitions`. Pilot with internal tenant before global enablement. Migration to map existing jobs to requisitions if required.

### Phase 2 — Applications & Pipeline (Weeks 5-9)
- **Scope & Value:** Introduce `application` entity linking candidates to requisitions, Kanban pipeline, structured rejection reasons, candidate import/dedupe workflow.
- **UI Screens:** `/requisitions/:id/pipeline`, `/candidates`, `/candidates/import`, `/candidates/:id` timeline updates, dashboard pipeline metrics.
- **Backend:** New `models/application.py` with stage enums and rejection reason codes; indexes `{companyId, requisitionId, stage}`. Extend `candidate.py` with dedupe metadata and resume text. Routes `api/routes/applications.py` (create/list/move/reject) and enhanced `api/routes/candidates.py` for import/upload. Services `application_service.py`, updated `candidate_service.py`. Stage transitions executed in transactions.
- **Frontend:** Types `Application`, `ApplicationStage`, `RejectionReason`. Services `applicationService.ts`, extended `candidateService.ts`. Components `PipelineKanban`, `StageMoveDialog`, `RejectModal`, `CandidateTimeline`, `ImportCandidatesWizard`.
- **Security:** Recruiters limited to assigned requisitions; hiring managers read-only; stage mutations restricted to recruiter/admin. Candidate dedupe scoped per `companyId`.
- **Tests:** Unit—stage transition validation, dedupe logic, rejection reason enforcement. Integration—CSV import + dedupe, Kanban move API, tenant isolation. Manual QA—import file, resolve duplicates, drag-drop pipeline, capture rejection reason.
- **Rollout & Flags:** Feature flag `feature.pipeline`. Backfill script creating applications from existing job-candidate pairs. Monitor Kanban performance before enabling for all tenants.

### Phase 3 — Interview Loop & Scorecards (Weeks 10-15)
- **Scope & Value:** Build interview plan builder, MS365 scheduling with Teams links, recruiter screen scorecards, interviewer scorecards with evidence requirements, SLA widgets.
- **UI Screens:** `/interviews/:applicationId/plan`, `/interviews/:id/schedule`, `/applications/:id/screen-scorecard`, `/scorecards/:id`, dashboard widgets for pending scorecards and scheduling bottlenecks, candidate profile interview tab.
- **Backend:** Extend `models/interview.py` to support rounds, MS365 metadata, interviewer assignments. Create `models/scorecard_template.py` and `models/scorecard_submission.py`; indexes `{companyId, candidateId, requisitionId}`. Routes `api/routes/interviews.py` (plan builder, scheduling), `api/routes/scorecards.py` (template CRUD, submission). Services `interview_service.py` (MS Graph integration) and `scorecard_service.py` (evidence enforcement, SLA tracking). Secure MS365 credential storage per tenant.
- **Frontend:** Types for interview plans, rounds, scorecard templates/submissions. Services `interviewService.ts`, `scorecardService.ts`, `ms365Service.ts`. Components `InterviewPlanBuilder`, `ScheduleInterviewModal`, `ScorecardForm`, `ScorecardTemplateManager`, `PendingScorecardsList`.
- **Security:** RBAC—only recruiters/admins manage plans; interviewers view/submit only their assignments. Validate MS365 callbacks via signed secrets. Continue strict `companyId` filters. Evidence required fields prevent empty scorecards.
- **Tests:** Unit—MS365 payload handling mocks, scorecard validation rules, SLA calculations. Integration—plan builder through scheduling + scorecard submission, interviewer-only access paths. Manual QA—plan creation, Teams scheduling, scorecard submissions.
- **Rollout & Flags:** Feature flag `feature.interview_loop`. Tenant-level MS365 credential onboarding checklist. Provide manual scheduling fallback while feature flag disabled.

### Phase 3.1 — AI Voice Interview Rounds (Weeks 15-18)
- **Scope & Value:** Layer AI voice agents onto the interview loop so recruiters can assign automated interviewers for screening rounds, capture transcripts, and ingest AI-generated scorecards that remain under human oversight. Unlocks faster early-stage interviews without sacrificing governance.
- **UI Screens:** Updates to `InterviewPlanBuilder` (AI agent picker), scheduling modal (AI session creation + candidate join link), recruiter review queue for AI scorecards, candidate notifications template editor, decision pack section for AI rounds.
- **Backend:** Extend `models/interview.py` with `interviewerType="ai"`, agent metadata, and provider session IDs. New `models/ai_voice_agent.py` (catalog) and `models/ai_voice_session.py` (execution + artifacts). Routes `api/routes/ai_voice_agents.py` (admin CRUD), `api/routes/interviews_ai.py` (schedule AI session), `api/routes/webhooks/voice_provider.py` (results ingestion). Services `ai_voice_agent_service.py`, `ai_voice_session_service.py`, and webhook verification utilities. Store transcripts/audio references in secure object store links; persist AI scorecard submissions with `submittedByType="ai"` and `reviewStatus` workflow.
- **Frontend:** Types for AI agents, AI sessions, and AI scorecard submissions. Enhance `interviewService.ts` plus new `aiVoiceService.ts`. Components: AI agent catalog admin table/form, AI agent picker inside plan builder, AI session status badge on pipeline cards, recruiter review drawer to approve/reject AI scorecards, candidate email template preview. Ensure toast + inline validation for governance rules (human approval required).
- **Security:** Strict `companyId` filters on agent catalog and sessions. Limit agent management to admins, scheduling to recruiters/admins, approval UI to recruiters/hiring managers. Validate provider webhooks via HMAC/shared secret, block payloads missing transcript + scoring metadata, and redact transcripts from list APIs. Require explicit approval before AI scorecard influences stage transitions.
- **Tests:** Unit—agent catalog validation, webhook signature verification, AI scorecard state machine (pending→approved/rejected). Integration—plan builder with AI round, schedule flow through webhook ingestion, approval action updating candidate stage. Manual QA—end-to-end AI round including candidate invite, simulated webhook, recruiter approval, decision pack display.
- **Rollout & Flags:** Feature flags `feature.ai_voice_agents` and `feature.interview_loop_ai`. Tenant-level provider credential checklist (API key, webhook secret, allowed domains). Start with internal recruiter pilot; require legal/compliance sign-off before enabling per tenant.

### Phase 4 — Decision Packs, Audit & Integrations (Weeks 16-20)
- **Scope & Value:** Generate decision packs, immutable audit trails, HRIS requisition import, outbound HRMS trigger, n8n AI artifact storage for JD/match/decision summaries.
- **UI Screens:** `/decision-packs/:id`, audit log tab on requisition detail, integration settings page, AI artifact panels in requisition/candidate views, dashboard insights on SLA/audit health.
- **Backend:** New models `decision_pack.py`, `audit_event.py`, `integration_mapping.py`, `ai_artifact.py`; indexes `{companyId, entityType, entityId, createdAt}`. Routes `api/routes/decision_packs.py`, `api/routes/audit.py`, `api/routes/integrations_hris.py`, `api/routes/webhooks_n8n.py`, `api/routes/webhooks_hrms.py`. Services `decision_pack_service.py`, `audit_service.py`, `integration_service.py`, `ai_artifact_service.py`. Transactions for HRIS import + audit logging, decision capture + outbound HRMS trigger. Service-token auth for HRIS endpoint.
- **Frontend:** Types for decision packs, audit events, AI artifacts. Services `decisionPackService.ts`, `auditService.ts`, `integrationService.ts`, `aiArtifactService.ts`. Components `DecisionPackView`, `DecisionSummaryPanel`, `AuditTrailTimeline`, `IntegrationConfigForm`. New routes wired with RBAC.
- **Security:** HRIS endpoint uses service JWT/HMAC to derive `companyId`. Decision capture limited to hiring team roles. Audit events immutable with sensitive field masking. n8n webhooks verified via signed secret.
- **Tests:** Unit—HRIS import idempotency, audit log creation, decision aggregation. Integration—AI webhook ingestion, decision pack generation, HRMS trigger handling. Manual QA—simulate HRIS payload, generate decision pack, capture decision, review audit trail, verify outbound trigger.
- **Rollout & Flags:** Feature flags `feature.decision_packs`, `feature.integrations.hris`, `feature.ai_assist`. Tenant opt-in for HRIS tokens and AI artifacts. Staged rollout after MS365 + scorecards stabilize.

## Cross-Cutting Concerns
- **Multi-tenancy:** Consistent `companyId` filtering via dependencies; never trust payload provided IDs.
- **RBAC:** Existing roles (admin, recruiter, hiring_manager) plus approver/interviewer; all new routes specify allowed roles explicitly.
- **Transactions:** Use `mongo_transaction()` for multi-document updates (approvals, stage moves, interview credits, HRIS import, decision capture).
- **Observability:** Expand structured logging, add audit events, define metrics for stage SLAs and scorecard compliance.
- **Integrations:** Secure storage for MS365 + HRIS credentials; shared-secret validation for n8n webhooks; rate limiting to protect shared resources.

## Timeline & Durations
| Phase | Duration | Target Window |
| --- | --- | --- |
| Phase 1 — Requisitions & Approvals | 4 weeks | Weeks 1-4 |
| Phase 2 — Applications & Pipeline | 5 weeks | Weeks 5-9 |
| Phase 3 — Interview Loop & Scorecards | 6 weeks | Weeks 10-15 |
| Phase 3.1 — AI Voice Interview Rounds | 3 weeks | Weeks 15-18 |
| Phase 4 — Decision Packs & Integrations | 5 weeks | Weeks 18-22 |

**Total expected duration:** ~22 weeks end-to-end assuming sequential execution with light overlap for QA and documentation. 

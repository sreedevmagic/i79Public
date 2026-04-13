# Plan: Retire Legacy Job & Candidate Domains (Non-Prod Cleanup)

## 1. Context & Goals
- Phase 1 (tenant timezone + feature flags) and Phase 2 groundwork (Requisitions + Applications + feature gating) already merged.
- Legacy `Job` + `Candidate` stacks were placeholders during discovery; no production tenants, so we can delete without data migration.
- Objective: converge on a requisition-driven pipeline where `Application` is the single source of truth for talent data, while preserving completed Phase 1/2 behaviors (timezone enforcement, feature toggles, requisition approvals, application APIs).

## 2. High-Level Approach
1. **Promote Applications** to own all candidate-facing attributes (profile info, CV metadata, interview state).
2. **Refactor Interviews & Results** to reference `applicationId` + `requisitionId` directly.
3. **Remove Legacy Domains** (`Job`, `Candidate`, their schemas, services, routes, scripts, frontend pages/components, feature flags, documentation).
4. **Validate** feature guard + timezone pipelines remain intact (Phase 1) and requisition/application APIs stay functional (Phase 2).

## 3. Target Architecture Snapshot
- **Entities:** `Requisition`, `Application` (with embedded candidate snapshot + CV + status), `Interview`, `Result`, `Company`, `User`, `FeatureToggle`, etc.
- **Assignments:** `User.assignedRequisitionIds` controls recruiter visibility; hiring team info lives on `Requisition`.
- **Workflows:**
  - Candidate intake → `POST /applications` (accepts profile + CV upload, optional requisition assignment).
  - Pipeline views -> read from `Application` filtered by `requisitionId/stage`.
  - Interviews/Results reference `Application` ID to avoid dangling candidate references.
  - Feature flags unchanged (`feature.requisitions`, `feature.pipeline`).

## 4. Detailed Work Plan

### 4.1 Backend Data Model & Schema
1. **Application Enhancements**
   - Embed candidate/contact fields that currently live on `Candidate` (phone, CV links, analysis artifacts, interview flags, etc.).
   - Ensure indexes cover `companyId`, `requisitionId`, `stage`, and searchable fields like email.
2. **Interview & Result Models**
   - Replace `candidate_id`/`job_id` with `applicationId` + `requisitionId` (keep `candidateId` only if required for audit logs).
3. **User Assignments**
   - Remove `assignedJobIds`; keep `assignedRequisitionIds` only.
4. **Delete Legacy Models**
   - Remove `app/models/job.py`, `app/models/candidate.py`, indexes, and references in `__all__`/init files.

### 4.2 Backend Services & Routes
1. **Application Service Expansion**
   - Port CV upload, parsing, scoring, status updates, and interview authorization from `candidate_service`.
   - Ensure Azure blob paths, background processing, and credit checks remain intact.
2. **Route Cleanup**
   - Remove `/jobs` and `/candidates` routers entirely.
   - Enhance `/applications` endpoints to cover create, list (with filters equivalent to old candidate filters), detail, status updates, CV re-analysis, interview authorization, etc.
   - Update `/requisitions` routes only if they depended on job listings.
3. **Service Layer Adjustments**
   - Delete `job_service.py`, `candidate_service.py`; move reusable helpers into `application_service.py` or shared modules.
   - Update dependent services (e.g., CV analysis, dashboard, billing, webhooks) to consume the new application-centric interfaces.
4. **Background Jobs & Webhooks**
   - Ensure `cv_analysis` and interview webhook handlers now fetch/update `Application` documents instead of `Candidate`.
5. **Scripts**
   - Remove job/candidate-specific scripts (bulk upload, job backfills). Retain/adjust `enable_all_features.py` etc.

### 4.3 Frontend Refactor
1. **Data Layer**
   - Remove `Job` and `Candidate` interfaces/services from `src/types` and `src/services/api`.
   - Introduce/expand `Application` types to include candidate profile, CV analytics, interview state.
2. **Pages & Components**
   - Delete `Jobs`, `JobDetail`, `CreateJob`, `Candidates`, `CandidateDetail`, `AddCandidateDialog`, etc.
   - Replace navigation entries with requisition/application pipeline views (e.g., `Requisitions`, `Pipeline`, `Applications` detail drawer).
   - Update any dashboard widgets or cards to pull metrics from requisitions/applications.
3. **State & Context**
   - Remove `assignedJobIds` references from `AuthContext`; rely on `assignedRequisitionIds` for recruiter scoping.
   - Ensure feature guards still reference `feature.requisitions` / `feature.pipeline` (Phase 1 flagging intact).
4. **UX Considerations**
   - Provide redirects or user messaging when legacy routes disappear (e.g., `/candidates` → `/applications`).

### 4.4 Testing & Validation
1. **Unit/Integration Tests**
   - Add coverage for new application endpoints (create/list/update, CV re-analysis, interview auth).
   - Update any tests stubbing job/candidate services.
2. **Manual Regression**
   - Validate Phase 1 timezone enforcement (API responses still localized) and feature flag gating (tenants without `feature.pipeline` cannot access new UI).
   - Smoke-test Phase 2 flows: requisition creation/approval, application intake, pipeline stage transitions, interview authorization, webhook processing.

### 4.5 Deployment & Data Cleanup
1. **Database**
   - Drop `jobs` and `candidates` collections + unused indexes in dev/staging/prod (since no prod data, perform immediately after merge).
2. **Config/Docs**
   - Update requirement docs, architecture diagrams, and `.env` samples to remove job/candidate references.
   - Communicate change in `IMPLEMENTATION_PROGRESS.md`.
3. **Monitoring**
   - Temporarily log hits to removed endpoints (return 410 Gone) to ensure no clients still call them; remove shim once quiet.

## 5. Risk Mitigation
- **Phase 1 Stability:** Keep timezone + feature flag logic centralized (no linked job/candidate references). Tests ensure localization wrappers still run per request.
- **Phase 2 Guarantees:** Application + requisition features already exist; expanding application service rather than inventing new domain minimizes churn.
- **Auth & RBAC:** Align recruiters to requisitions; ensure no path relies on removed job assignments. Add checks in new endpoints mirroring previous multi-tenant filters.
- **Operational Simplicity:** No data migration required, but we still document DB drop commands and keep snapshots for debugging.

## 6. Execution Order
1. Land application schema/service upgrades (behind tests). ✅ (Application now embeds candidate snapshot + CV metadata; creation flow updated.)
2. Switch API routes/clients to application-centric paths.
3. Remove candidate/job services/routes.
4. Clean frontend and context/state.
5. Delete dead scripts/docs and drop Mongo collections.

This sequence keeps feature-complete code running at each step (existing candidate UI continues to work until the application-based replacement is wired through), ensuring Phase 1 + Phase 2 commitments remain stable during the transition.

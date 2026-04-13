# Plan: Deprecate Job Entity in Favor of Requisitions

## 1. Objectives
- Remove legacy `Job` domain (model, routes, services, frontend usage) now that requisitions own candidate sourcing.
- Prevent orphaned data by migrating any `jobId` references to requisition-based identifiers.
- Preserve tenant isolation, RBAC, and feature-flag behavior throughout the change.

## 2. Scope & Assumptions
- Scope covers Backend (models, schemas, services, routes, scripts) and Frontend (types, services, UI, navigation) plus infrastructure artifacts that reference `jobs`.
- Assumes every active candidate/application is already linked to a requisition or can be mapped deterministically.
- Job-related analytics/dashboards can be removed or re-pointed to requisition metrics.

## 3. Impact Analysis
- **Data:** `jobs` collection, job IDs embedded in candidates, applications, interviews, and any denormalized arrays on users (e.g., `assignedJobIds`). Need migration strategy.
- **Auth/RBAC:** Recruiter assignments tied to jobs must transition to requisition assignments or be dropped.
- **Feature Flags:** Ensure no tenant flag still guards job functionality; pipeline/requisition flags remain authoritative.
- **Frontend UX:** Navigation links, pages (`Jobs`, `JobDetail`, `CreateJob`) and components (cards, dialogs) must be removed or repurposed.

## 4. Detailed Work Plan

### 4.1 Data & Migration
1. Inventory collections referencing `jobId` (`candidates`, `applications`, `interviews`, `users.assignedJobIds`, any others discovered via search).
2. Define migration script:
   - For records where `jobId` maps to a known requisition, copy value to new `requisitionId` field.
   - Flag/park records with unmapped `jobId` for manual review (write to CSV/log).
   - Remove `jobId` fields post-migration and compact indexes.
3. Update requirement doc/architecture notes to reflect new sourcing model.

_Status 2025-12-31:_ Inventory captured in `documents/job-removal-step4.1-data-plan.md`; audit script `Backend/scripts/audit_job_references.py` now available to produce tenant-level reports plus CSV exports of unmapped job references.

### 4.2 Backend Removal
1. Delete `Backend/app/models/job.py` and related indexes after confirming migrations.
2. Remove Pydantic schemas (`schemas/job.py`) and service layer (`services/job_service.py`).
3. Rip out API routes (`api/routes/jobs.py`, any job-specific endpoints elsewhere) and unregister routers.
4. Clean up dependencies:
   - Replace `jobId` usage with `requisitionId` in models (`Candidate`, `Interview`, `Application`, etc.).
   - Adjust services (candidate, interview, application) to reference requisitions.
   - Drop RBAC helpers tied to job assignments; introduce requisition-based equivalents if needed.
5. Update feature config/validation so `feature.jobs` (if any) is removed.
6. Ensure tests (unit/integration) and scripts no longer import job constructs.

### 4.3 Frontend Removal
1. Remove pages and routes: `Jobs.tsx`, `JobDetail.tsx`, `CreateJob.tsx`; delete navigation links/menus pointing to them.
2. Purge components tied exclusively to jobs (cards, forms). Repurpose if they can display requisition data.
3. Update TypeScript types to drop `Job` interfaces and any `jobId` fields replaced by `requisitionId`.
4. Adjust API service layer (`jobService.ts`, hooks) to use requisition endpoints.
5. Verify feature guards and contexts (e.g., `AuthContext` assigned job IDs) are updated or removed.

### 4.4 RBAC & Assignments
1. Decide replacement for `assignedJobIds` on users (likely `assignedRequisitionIds`).
2. Update backend logic enforcing recruiter/hiring manager visibility to use requisition assignments.
3. Reflect assignment changes in frontend forms and display components.

### 4.5 Validation & Cleanup
1. Run lint/tests for both backend and frontend; add new tests covering requisition-only flow.
2. Double-check multi-tenancy filters remain intact after refactors.
3. Remove dead env vars, feature flags, and documentation referencing jobs.
4. Communicate migration steps (scripts to run, order of operations) in implementation progress doc.

## 5. Risks & Mitigations
- **Data integrity loss:** mitigate with dry-run migration script and backups.
- **RBAC regression:** ensure new requisition assignment logic mirrors previous restrictions; add tests.
- **Frontend broken links:** remove routes and navigation concurrently; add redirects (e.g., `/jobs` → `/requisitions`).
- **3rd-party integrations using job IDs:** audit webhooks/exports before deletion.

## 6. Execution Strategy
1. Finalize migration script and run in staging with snapshot.
2. Merge backend refactor (models/services/routes) once migration verified.
3. Follow with frontend cleanup to avoid dangling API calls.
4. Monitor logs for old route hits; return 410 Gone with guidance if necessary.

## 7. Open Questions
- Do any external integrations still post job IDs we must accept temporarily? Answer : No
- Should historical job data be archived/exported for reporting? : We were not in production, it is not required to archive.
- What is the official replacement for recruiter assignments (per-requisition vs. global)? per - requeisition. 

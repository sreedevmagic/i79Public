# Phase 1 Feedback Tasks

| Task | Status | Notes |
| --- | --- | --- |
| Approval RBAC alignment | Done | Helper enforces admin/approver/current-stage access; seed script ensures approver role availability |
| Hiring team & approver validation | Done | Validation enforces expected roles and stores resolved display names for hiring team and approvals |
| Submission note guardrails | Done | Comment trimmed + 2k cap via `RequisitionSubmitRequest`, stored on submit |
| Feature flag implementation | Done | Backend flag gates routers; frontend FeatureGuard hides nav/routes via `VITE_FEATURE_REQUISITIONS` |
| Approval badge styling | Done | `RequisitionDetail.tsx` badge map covers all statuses |
| ProtectedRoute typing | Done | ProtectedRoute now requires `UserRole[]`, and routes honor the stricter typing |
| Requisition form user selection | Done | `/users`-backed dropdowns enforce recruiter/hiring manager picks and approver selections |
| Sorting readability | Done | `RequisitionService.list_requisitions` now uses tuple-based sort for clarity |
| Approval inbox UX | Done | Prompt cancellations now silently cancel; empty submissions still show "comment required" |
| Indexes for approvals | Done | Compound index `(companyId, status, submittedAt)` added with background creation instructions |
| Job→Requisition migration task | Done | `scripts/migrate_jobs_to_requisitions.py` added with dry-run + default user options for controlled rollout |

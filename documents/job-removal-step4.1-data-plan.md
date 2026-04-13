# Step 4.1 – Job Data Inventory & Migration Plan

## Inventory Summary
| Collection | Fields containing job references | Notes/Implications |
|------------|----------------------------------|--------------------|
| `candidates` | `jobId`, `job_matches[]`, `interviewResults[].jobId`, Azure CV blob path segments (`{company}/{jobId}/...`) | Primary candidate records still keyed by legacy job IDs. `job_matches` list may contain historical recommendations that need either migration or pruning. `interviewResults` embeds job IDs per session log. Index on `jobId` must be replaced with requisition index after migration. |
| `applications` | `jobId` (nullable) | `Application` already owns `requisitionId`; `jobId` is stored only for legacy linkage/backfill. Safe removal once data is exported for reconciliation. |
| `interviews` | `job_id` | Every interview references a job in snake_case. No requisition linkage today, so conversion requires deterministic mapping or historical cutoff. |
| `results` | `job_id` | Final decision records keyed by job. Needs remap to requisition for analytics continuity. |
| `users` | `assignedJobIds[]` | Recruiter routing is job-based. Must introduce `assignedRequisitionIds[]` (or reuse nested hiring team data on requisitions) before removing. |
| `jobs` | Entire document (`jobs` collection) + indexes | Legacy domain slated for deletion. Any denormalized copies (e.g., `candidate.job_matches`) point back here. |

## Migration Strategy by Collection
- **Candidates**
  1. Introduce `requisitionId` on the model (nullable) while `jobId` remains.
  2. Run audit + migration script (see below) to copy deterministic mappings (exact requisition ID match or `Requisition.external.externalReqId`).
  3. For unresolved pairs, emit CSV for manual mapping or fallback to "orphaned" bucket.
  4. Update blob storage layout to `{company}/{requisitionId}/...` after data is moved; keep compatibility reader for existing blobs until GC completes.
  5. Replace indexes referencing `jobId` with `requisitionId` once data is clean.

- **Applications**
  1. Freeze writes to `jobId` (validation) and mark field deprecated.
  2. Use migration script to backfill historical `jobId` into the requisition-level audit report (no schema change needed since `requisitionId` already exists).
  3. Drop field from schema + collection after validation period.

- **Interviews**
  1. Add `requisition_id` field.
  2. Migration script uses `candidateId → candidate.requisitionId` (once available) as source of truth; fallback to job→requisition mapping.
  3. Update interview scheduling APIs/services to require `requisitionId` and optionally derive job metadata from the requisition document.

- **Results**
  1. Same approach as interviews: introduce `requisition_id`, migrate using candidate/application linkage, drop `job_id` after verification.

- **Users**
  1. Replace `assignedJobIds` with `assignedRequisitionIds`.
  2. Migration pulls job assignments, resolves requisition, and writes to the new array. Any job without mapping will move recruiter to “unassigned” queue for manual fix.

- **Jobs collection**
  1. Snapshot/export for archival (even though prod traffic is not live) so we can debug mismatches later.
  2. Remove indexes and document definitions after all upstream references release the dependency.

## Audit & Migration Tooling
- Added `Backend/scripts/audit_job_references.py` (see PR) to produce a tenant-scoped report before making schema changes.
  - Accepts `--company-id` to limit the scan and `--unmatched-report <csv>` to dump unresolved pairs.
  - Outputs per-collection counts (how many documents carry `jobId`, how many map to requisitions, how many still rely on legacy jobs) plus unique ID tallies to size the migration.
- Next iteration of the script will, once new fields exist, support `--migrate` to write `requisitionId`/`assignedRequisitionIds` in-place. For now it is read-only and safe to run in production.

## Next Steps after Audit
1. Run the audit in staging + production to understand blast radius (`python Backend/scripts/audit_job_references.py --unmatched-report unmatched.csv`).
2. Review `unmatched.csv`, decide whether to create manual mapping table or treat as historical noise.
3. Land schema changes introducing `requisitionId` equivalents.
4. Upgrade the audit script into a dual-mode migration tool and execute it with backups enabled.
5. Once metrics show zero legacy job references, proceed with Step 4.2 (backend removal) and Step 4.3 (frontend removal).

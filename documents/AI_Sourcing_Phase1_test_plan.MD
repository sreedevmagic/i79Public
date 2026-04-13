# AI Sourcing — Phase 1 Backend Manual Test Plan

**Feature:** AI Sourcing — Outbound Candidate Discovery & Outreach  
**Phase:** 1 (Backend only — no Frontend required)  
**Date:** April 2026  
**Scope:** All 5 sourcing endpoints + security guards + credit/reveal logic + dedup

---

## Prerequisites

### 1. Environment Setup

Start the backend with MongoDB available:

```bash
cd Backend
uvicorn app.main:app --reload --port 8000
```

Confirm the **Sourcing** tag appears at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Required Test Data

Before running any tests, you need:

| Item | How to get |
|---|---|
| Admin JWT (`$TOKEN`) | Log in via `POST /api/auth/login` |
| Company ID (`$COMPANY_ID`) | From login response `data.user.companyId` |
| Approved Requisition ID with `jobSlug` set (`$REQ_ID`) | From `GET /api/requisitions?status=approved` — must have been published to career page at least once so `jobSlug` is populated |

---

## Test Cases

---

### TC-01 — Feature Flag Guard (Level 2 off by default)

**Goal:** Verify that sourcing endpoints return `403` when `feature.sourcing` is not yet enabled on the company.

```bash
curl -s http://localhost:8000/api/sourcing/candidates \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Expected:** `403 Forbidden` — *"Feature not enabled for this company"*

---

### TC-02 — Enable `feature.sourcing`

**Goal:** Enable the feature for your company and confirm it is accepted by the allowed features gate.

```bash
# Step 1: get current feature list
curl -s http://localhost:8000/api/companies/current \
  -H "Authorization: Bearer $TOKEN" | jq '.data.enabledFeatures'

# Step 2: add feature.sourcing (include all your existing flags)
curl -s -X PATCH http://localhost:8000/api/companies/$COMPANY_ID/features \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabledFeatures": ["feature.requisitions", "feature.pipeline", "feature.sourcing"]
  }' | jq '.data.enabledFeatures'
```

**Expected:** Response array includes `"feature.sourcing"`. No other flags are removed.

---

### TC-03 — Empty State — Candidates & Outreach Lists

**Goal:** Verify both list endpoints return clean empty arrays (not 500s) before any data exists.

```bash
curl -s http://localhost:8000/api/sourcing/candidates \
  -H "Authorization: Bearer $TOKEN" | jq .

curl -s http://localhost:8000/api/sourcing/outreach \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Expected:** Both return `{ "success": true, "data": [], "total": 0 }`

---

### TC-04 — Level 1 Kill Switch (CSS API Key Empty)

**Goal:** Verify that search submit returns `503` when `CANDIDATE_SEARCH_SERVICE_API_KEY` is not set (default dev state). This is the Level 1 guard firing before any HTTP call is made.

```bash
curl -s -X POST http://localhost:8000/api/sourcing/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requisitionId": "'$REQ_ID'",
    "query": {
      "title": "Senior Software Engineer",
      "location": "London",
      "skills": ["Python", "FastAPI"],
      "page": 1,
      "page_size": 25
    }
  }' | jq .
```

**Expected:** `503 Service Unavailable` — *"CandidateSearchService API key not configured"*

> This confirms the safe-default behaviour: no silent failures, no CSS calls with an empty key.

---

### TC-05 — RBAC: `hiring_manager` Cannot Contact

**Goal:** Verify `POST /sourcing/contact` returns `403` for `hiring_manager` role regardless of other conditions.

Log in as a `hiring_manager` user and save their token as `HM_TOKEN`.

```bash
curl -s -X POST http://localhost:8000/api/sourcing/contact \
  -H "Authorization: Bearer $HM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourcedCandidateId": "sc-any",
    "requisitionId": "'$REQ_ID'"
  }' | jq .
```

**Expected:** `403 Forbidden` — *"Insufficient permissions"*

> RBAC check fires before any DB lookup — no data is touched.

---

### TC-06 — Seed a SourcingCandidate (Already Revealed)

**Goal:** Insert a test candidate with `emailRevealed: true` directly into MongoDB to test the free-reuse contact path without needing the CandidateSearchService.

Run in **mongosh** or **MongoDB Compass**:

```javascript
db.sourced_candidates.insertOne({
  _id: "sc-test-manual-001",
  companyId: "<YOUR_COMPANY_ID>",
  name: "Test Candidate",
  currentTitle: "Senior Software Engineer",
  currentCompany: "Test Corp Ltd",
  location: "London, UK",
  linkedinUrl: "https://linkedin.com/in/testcandidate-i79",
  email: "testcandidate@example.com",
  emailRevealed: true,
  emailRevealedAt: new Date(),
  emailRevealedByUserId: "manual-seed",
  source: "external_search",
  personProfileId: null,
  providerPersonId: null,
  providerId: null,
  createdByUserId: null,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Set `SC_ID=sc-test-manual-001`.

Verify it appears via the API:

```bash
curl -s "http://localhost:8000/api/sourcing/candidates?emailRevealed=true" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {id, name, emailRevealed, email}'
```

**Expected:** Candidate appears with `email: "testcandidate@example.com"` (email visible because `emailRevealed: true`).

---

### TC-07 — Schema Email Enforcement (`@model_validator`)

**Goal:** Verify that `email` is always `null` in API responses for candidates where `emailRevealed: false` — regardless of what is stored in the database. This tests the schema boundary guard.

Seed a second candidate with `emailRevealed: false` but a real email stored:

```javascript
db.sourced_candidates.insertOne({
  _id: "sc-test-manual-002",
  companyId: "<YOUR_COMPANY_ID>",
  name: "Hidden Email Candidate",
  currentTitle: "Product Manager",
  currentCompany: "Acme Corp",
  location: "Manchester, UK",
  email: "hidden@example.com",
  emailRevealed: false,
  source: "external_search",
  personProfileId: "pprofile-123",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

```bash
curl -s "http://localhost:8000/api/sourcing/candidates?emailRevealed=false" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {name, emailRevealed, email}'
```

**Expected:** `email: null` for all results — the `@model_validator` on `SourcingCandidateOut` strips the email at the schema boundary. The value `"hidden@example.com"` must **not** appear in the response.

---

### TC-08 — Contact (Free-Reuse Path — No CSS, No Credit)

**Goal:** Use the seeded revealed candidate to test the full contact flow without touching the CandidateSearchService or billing. Requires requisition to have a `jobSlug`.

```bash
curl -s -X POST http://localhost:8000/api/sourcing/contact \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourcedCandidateId": "'$SC_ID'",
    "requisitionId": "'$REQ_ID'"
  }' | jq .
```

**Expected `201`:**
```json
{
  "success": true,
  "data": {
    "outreachId": "otr-...",
    "emailSentTo": "testcandidate@example.com",
    "creditConsumed": false,
    "status": "email_failed"
  }
}
```

| Field | Expected Value | Why |
|---|---|---|
| `creditConsumed` | `false` | Email already revealed — no credit charged |
| `status` | `"email_failed"` | Resend not configured in dev — safe, expected |
| `emailSentTo` | `"testcandidate@example.com"` | Correct email snapshot |
| `outreachId` | `"otr-..."` | Outreach record committed before email attempt |

> `email_failed` is the correct success case in a dev environment with no Resend key. The outreach record and credit accounting are committed regardless.

---

### TC-09 — Verify Outreach Record in Database

**Goal:** Confirm the Outreach document was persisted correctly.

```bash
curl -s "http://localhost:8000/api/sourcing/outreach?requisitionId=$REQ_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {id, status, creditConsumed, emailSnapshot, sourcedCandidateId}'
```

**Expected:**
```json
{
  "id": "otr-...",
  "status": "email_failed",
  "creditConsumed": false,
  "emailSnapshot": "testcandidate@example.com",
  "sourcedCandidateId": "sc-test-manual-001"
}
```

Also verify directly in MongoDB:
```javascript
db.outreach.findOne({ _id: /otr-/ })
```

---

### TC-10 — Duplicate Outreach Prevention (409)

**Goal:** Confirm the unique index and pre-check both work — calling contact again for the same candidate + requisition must be rejected.

```bash
curl -s -X POST http://localhost:8000/api/sourcing/contact \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourcedCandidateId": "'$SC_ID'",
    "requisitionId": "'$REQ_ID'"
  }' | jq .
```

**Expected:** `409 Conflict` — *"Outreach already sent to this candidate for this job"*

> Verify in MongoDB that only ONE outreach document exists for this `(companyId, sourcedCandidateId, requisitionId)` combination.

---

### TC-11 — Contact Requires Published Job (400)

**Goal:** Verify that contacting a candidate for a requisition without a `jobSlug` returns `400`.

Find or create a `draft` or `approved` requisition that has **never been published** (no `jobSlug`).

```bash
curl -s -X POST http://localhost:8000/api/sourcing/contact \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourcedCandidateId": "'$SC_ID'",
    "requisitionId": "<UNPUBLISHED_REQ_ID>"
  }' | jq .
```

**Expected:** `400 Bad Request` — *"Publish the job before contacting candidates"*

---

### TC-12 — Contact Non-Existent Candidate (404)

```bash
curl -s -X POST http://localhost:8000/api/sourcing/contact \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourcedCandidateId": "sc-does-not-exist",
    "requisitionId": "'$REQ_ID'"
  }' | jq .
```

**Expected:** `404 Not Found` — *"Sourced candidate not found"*

---

### TC-13 — Search Poll Tenant Isolation (404 on wrong company)

**Goal:** Verify that polling a `cssSearchRequestId` belonging to another company returns `404` — not the results. This is the critical multi-tenancy guard.

Insert a fake `SourcingSearchLog` belonging to a **different** company:

```javascript
db.sourcing_search_log.insertOne({
  _id: "ssl-other-company-test",
  companyId: "other-company-id-that-is-not-yours",
  requisitionId: "req-fake",
  initiatedByUserId: "user-fake",
  cssSearchRequestId: "css-req-cross-tenant-test",
  status: "pending",
  totalResultsReturned: null,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Now poll it with your token (your `companyId` is different):

```bash
curl -s "http://localhost:8000/api/sourcing/search/css-req-cross-tenant-test?requisitionId=$REQ_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Expected:** `404 Not Found` — *"Search not found"*

> The log exists in MongoDB but `log.companyId != current_user.companyId` — access denied. This is the tenant isolation gate for the poll path.

---

### TC-14 — Filter: Candidates by `emailRevealed`

```bash
# Only revealed
curl -s "http://localhost:8000/api/sourcing/candidates?emailRevealed=true" \
  -H "Authorization: Bearer $TOKEN" | jq '{total: .total, names: [.data[].name]}'

# Only not revealed
curl -s "http://localhost:8000/api/sourcing/candidates?emailRevealed=false" \
  -H "Authorization: Bearer $TOKEN" | jq '{total: .total, names: [.data[].name]}'
```

**Expected:** Disjoint sets — `sc-test-manual-001` only in `emailRevealed=true`, `sc-test-manual-002` only in `emailRevealed=false`.

---

### TC-15 — Filter: Candidates by `source`

```bash
curl -s "http://localhost:8000/api/sourcing/candidates?source=external_search" \
  -H "Authorization: Bearer $TOKEN" | jq '.total'
```

**Expected:** Count matches only candidates with `source: "external_search"`.

---

### TC-16 — Outreach Filter by `status`

```bash
curl -s "http://localhost:8000/api/sourcing/outreach?status=email_failed" \
  -H "Authorization: Bearer $TOKEN" | jq '.total'

curl -s "http://localhost:8000/api/sourcing/outreach?status=sent" \
  -H "Authorization: Bearer $TOKEN" | jq '.total'
```

**Expected:** `email_failed` returns the record created in TC-08. `sent` returns 0 (no successful sends without Resend configured).

---

### TC-17 — `hiring_manager` Read-Only Access to List Endpoints

**Goal:** `hiring_manager` can read but cannot contact.

```bash
# Should work (200)
curl -s http://localhost:8000/api/sourcing/candidates \
  -H "Authorization: Bearer $HM_TOKEN" | jq '{success: .success, total: .total}'

curl -s "http://localhost:8000/api/sourcing/outreach?requisitionId=$REQ_ID" \
  -H "Authorization: Bearer $HM_TOKEN" | jq '{success: .success, total: .total}'
```

**Expected:** Both return `200` with data. Confirms read access is granted.

---

### TC-18 — Background Dedup Task (Application → SourcingCandidate Link)

**Goal:** Verify that creating an application via `POST /api/applications` triggers the background task that creates/links a `SourcingCandidate`.

Create a new application for the test requisition:

```bash
curl -s -X POST http://localhost:8000/api/applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requisitionId": "'$REQ_ID'",
    "candidateName": "Background Dedup Test",
    "candidateEmail": "dedup-test@example.com",
    "source": "manual"
  }' | jq '{id: .id, candidateExternalId: .candidateExternalId}'
```

Wait 1–2 seconds, then check MongoDB:

```javascript
// Should find a SourcingCandidate linked to this application
db.sourced_candidates.findOne({ email: "dedup-test@example.com", companyId: "<YOUR_COMPANY_ID>" })

// Should show the application with candidateExternalId set to the SourcingCandidate id
db.applications.findOne({ candidateEmail: "dedup-test@example.com" }, { candidateExternalId: 1 })
```

**Expected:**
- A `SourcingCandidate` with `email: "dedup-test@example.com"`, `emailRevealed: true`, `source: "manual"` is created
- `application.candidateExternalId` == `SourcingCandidate._id`

> If you re-create the application with the same email, the background task should find the existing `SourcingCandidate` (not create a duplicate) and link the new application to it.

---

### TC-19 — Apply Link Resolution (`?ref` param on career page)

**Goal:** Verify that a candidate applying via an outreach link updates the `Outreach` record and sets `application.source = "ai_outreach"`.

Use `$OUTREACH_ID` from TC-08 (the `otr-...` value).

Submit a career page application with the ref param. This requires an actual HTML form POST to the public career page. You can simulate it with curl:

```bash
# Replace company_slug and job_slug with actual values from your test requisition
curl -s -X POST \
  "http://localhost:8000/careers/<company_slug>/jobs/<job_slug>/apply?ref=$OUTREACH_ID" \
  -F "candidate_name=Outreach Test Applicant" \
  -F "candidate_email=outreachapplicant@example.com" \
  -F "cover_letter=Test cover letter" \
  -F "gdpr_consent=true" \
  -F "cv_file=@/tmp/test_cv.pdf" | grep -o "<title>[^<]*</title>"
```

> You need a valid PDF at `/tmp/test_cv.pdf`. Any small PDF works: `echo "%PDF-1.4 test" > /tmp/test_cv.pdf`

After the apply, check the outreach record:

```bash
curl -s "http://localhost:8000/api/sourcing/outreach?requisitionId=$REQ_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {id, status, appliedAt, applicationId}'
```

**Expected:**
- `status: "applied"`
- `appliedAt` populated
- `applicationId` set to the new application ID

Also verify the application:
```javascript
db.applications.findOne({ candidateEmail: "outreachapplicant@example.com" }, { source: 1, candidateExternalId: 1 })
```

**Expected:** `source: "ai_outreach"`, `candidateExternalId: "sc-test-manual-001"` (linked to the sourced candidate)

---

### TC-20 — Authorization: Unauthenticated Request (401)

```bash
curl -s http://localhost:8000/api/sourcing/candidates | jq .
```

**Expected:** `401 Unauthorized`

---

## Test Results Tracker

| TC | Name | Status | Notes |
|---|---|---|---|
| TC-01 | Feature flag guard (Level 2 off) | | |
| TC-02 | Enable `feature.sourcing` | | |
| TC-03 | Empty state — list endpoints | | |
| TC-04 | Level 1 kill switch (empty API key) | | |
| TC-05 | RBAC: `hiring_manager` cannot contact | | |
| TC-06 | Seed SourcingCandidate (revealed) | | |
| TC-07 | Schema email enforcement (`@model_validator`) | | |
| TC-08 | Contact — free-reuse path | | |
| TC-09 | Outreach record persisted correctly | | |
| TC-10 | Duplicate outreach prevention (409) | | |
| TC-11 | Contact requires published job (400) | | |
| TC-12 | Contact non-existent candidate (404) | | |
| TC-13 | Search poll tenant isolation (404 cross-tenant) | | |
| TC-14 | Filter candidates by `emailRevealed` | | |
| TC-15 | Filter candidates by `source` | | |
| TC-16 | Filter outreach by `status` | | |
| TC-17 | `hiring_manager` read-only access | | |
| TC-18 | Background dedup task (application linking) | | |
| TC-19 | Apply link resolution (`?ref` param) | | |
| TC-20 | Unauthenticated request (401) | | |

---

## With CandidateSearchService Running (Full Search → Contact Flow)

Set in `.env`:
```
CANDIDATE_SEARCH_SERVICE_URL=http://localhost:8090
CANDIDATE_SEARCH_SERVICE_API_KEY=your-css-api-key
```

Then the full flow unlocks:

1. `POST /api/sourcing/search` → returns `{ searchRequestId, status: "pending" }`
2. Poll `GET /api/sourcing/search/{searchRequestId}?requisitionId={id}` every 2s until `status` is `"completed"` or `"partial"`
3. Verify `SourcingSearchLog` was written to MongoDB (`db.sourcing_search_log.find()`)
4. Check result rows contain `hasEmail`, `emailRevealed`, `alreadyContacted`, `alreadyApplied`, `matchScore`, `matchRecommendation`
5. Pick a result where `hasEmail: true` and `emailRevealed: false` and call `POST /sourcing/contact` — this triggers the real CSS enrich + credit consumption

> For TC-09 (credit path): check billing credits before and after — balance should decrease by 1. Verify `creditConsumed: true` in the outreach response and `db.credit_ledger_entries` for the deduction record.

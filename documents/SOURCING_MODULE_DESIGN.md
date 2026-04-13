# Sourcing Module — Career Page & Google Jobs Integration
## Design Document v1.1 | i79Engage | March 2026

> **Changelog v1.1:** Replaced per-tenant sitemaps + sitemap index with a single platform-wide `GET /sitemap.xml`. All other sections unchanged from v1.0.

---

## Table of Contents

1. [Overview & Objectives](#1-overview--objectives)
2. [Architecture Decision Record](#2-architecture-decision-record)
3. [URL Design & Domain Strategy](#3-url-design--domain-strategy)
4. [Data Model Changes](#4-data-model-changes)
5. [Backend — New API Routes](#5-backend--new-api-routes)
6. [Backend — Service Layer](#6-backend--service-layer)
7. [Backend — Configuration Changes](#7-backend--configuration-changes)
8. [Career Portal — Server-Rendered HTML](#8-career-portal--server-rendered-html)
9. [Google Jobs Compliance](#9-google-jobs-compliance)
10. [Sitemap Strategy](#10-sitemap-strategy)
11. [Guest Application Flow](#11-guest-application-flow)
12. [Frontend — Recruiter Portal Changes](#12-frontend--recruiter-portal-changes)
13. [Multi-Channel Publishing Architecture](#13-multi-channel-publishing-architecture)
14. [Custom Domain (CNAME) — Future Design Note](#14-custom-domain-cname--future-design-note)
15. [Security & Rate Limiting](#15-security--rate-limiting)
16. [Database Indexes](#16-database-indexes)
17. [Implementation Steps](#17-implementation-steps)
18. [Testing Plan](#18-testing-plan)
19. [Open Questions / Decisions Deferred](#19-open-questions--decisions-deferred)

---

## 1. Overview & Objectives

This module adds a **public-facing career page** for every tenant on the i79Engage platform. When a recruiter or hiring manager publishes an approved requisition, a fully public, SEO-optimised job listing is automatically created at a predictable URL — with no extra configuration required.

**Business goals:**
- Drive organic candidate traffic via Google Jobs integration
- Eliminate dependency on third-party job boards for MVP sourcing
- Establish the foundation for future multi-channel publishing (LinkedIn, Naukri, Indeed)
- Allow candidates to apply directly on the platform — no redirects

**In scope (MVP):**
- Tenant career listing page
- Individual job detail pages with JSON-LD structured data
- Per-company `isPublished` toggle on requisitions (separate from approval status)
- Guest application form (no candidate login required)
- Single platform-wide `sitemap.xml` covering all published jobs across all tenants
- Server-side rendered pages (mandatory for Google crawlability)
- Tenant branding (logo, primary colour) applied to career pages

**Out of scope (deferred):**
- Multi-channel publishing (LinkedIn, Naukri, Indeed)
- Candidate accounts and application tracking portal
- Custom CNAME domains per tenant
- Application status notification emails (Phase 2)

---

## 2. Architecture Decision Record

### ADR-001: Server-Rendered HTML vs. SPA for Career Pages

**Decision: FastAPI + Jinja2 server-rendered HTML**

**Rationale:**
Google Jobs requires JSON-LD structured data to be present in the **initial HTML response**. A pure React SPA (like the recruiter portal) delivers an empty `<div id="root">` on first load; Googlebot does not reliably execute JavaScript for structured data indexing. Server-side rendering is mandatory for this requirement.

The existing backend already has a `Backend/app/templates/` directory. FastAPI's built-in Jinja2 integration makes server-rendered career pages straightforward to implement without introducing a new framework.

The application form on the job detail page is a lightweight HTML `<form>` that submits via `fetch()` (progressive enhancement). A minimal vanilla JS snippet handles the AJAX submit and success/error state — no React bundle required.

**Alternatives rejected:**
- Next.js/Astro: Would introduce an entirely new deployment unit and technology stack for what amounts to 3 page templates.
- React SPA with `ReactDOMServer` hydration: Possible but overly complex given the team already operates Jinja2 templates elsewhere.
- Prerendering service (e.g., Prerender.io): Third-party dependency; fragile; does not guarantee JSON-LD crawlability.

### ADR-002: Publishing Model

**Decision: Explicit `isPublished` flag, separate from approval status**

This cleanly separates two independent concerns:
- **Approval workflow:** Has the requisition been approved internally? (`status == "approved"`)
- **Publishing decision:** Should the job appear publicly? (`isPublished == true`)

It also serves as the extensibility anchor for multi-channel publishing. The `publishedChannels` array (added alongside `isPublished`) tracks where the job has been pushed — initially `["careers"]`, later `["careers", "linkedin", "naukri"]`.

**Rule enforced in service layer:** A requisition can only be published if `status == "approved"`. Publishing a `draft` or `pending_approval` requisition is a 400 error.

### ADR-003: Tenant Slug vs. Company ID in URL

**Decision: Separate `careerPageSlug` field on Company, not the internal company ID**

The internal ID is an opaque string like `company_abc123`. The career page slug is human-readable (`acme-corp`) and safe to expose publicly. It must be unique across the platform, URL-safe, and changeable by admins (with a redirect from the old slug — deferred to Phase 2).

### ADR-004: Routing the Career Portal

**Decision: Career portal routes served at `/careers/*` path on the FastAPI backend**

The main SPA handles `/dashboard`, `/requisitions`, etc. The career portal is a completely separate concern. FastAPI will handle all routes under `/careers/` and return server-rendered HTML responses.

This keeps deployment simple: one backend, one domain. In the future, `careers.i79engage.com` can be routed to the same backend with a path rewrite at the CDN/nginx layer.

### ADR-005: Single Platform Sitemap

**Decision: One `sitemap.xml` at the platform root, not one per tenant**

A single `GET /sitemap.xml` covers all tenants and all published jobs across the entire platform. This is simpler to register (one URL submitted once to Google Search Console), easier to maintain, and well within Google's 50,000 URL limit for any realistic tenant count at MVP scale. When the platform grows past ~900 tenants with active jobs, it can be split into a sitemap index with per-tenant files — the `careerPage.slug` field already on `Company` makes that migration trivial.

---

## 3. URL Design & Domain Strategy

### MVP URL Structure (Path-Based)

| Page | URL Pattern |
|------|------------|
| Tenant career home | `https://app.i79engage.com/careers/{tenant_slug}` |
| All open jobs list | `https://app.i79engage.com/careers/{tenant_slug}/jobs` |
| Job detail page | `https://app.i79engage.com/careers/{tenant_slug}/jobs/{job_slug}` |
| Application submit | `POST https://app.i79engage.com/careers/{tenant_slug}/jobs/{job_slug}/apply` |
| Platform sitemap | `https://app.i79engage.com/sitemap.xml` |

**`{tenant_slug}` examples:** `acme-corp`, `infosys-recruitment`, `techno-india`
**`{job_slug}` examples:** `senior-python-engineer-bangalore`, `product-manager-remote`

### Slug Generation Rules

- Derived from `Company.name` (for tenant slug) and `Requisition.title + location` (for job slug)
- Lowercased, spaces → hyphens, special characters stripped, max 80 chars
- Slug collision on the same company resolved by appending a counter: `product-manager-remote-2`
- Job slug is stored on the `Requisition` document at publish time (immutable after first publish)
- Tenant slug stored on `Company` document, editable by admin (Phase 2: auto-redirect from old slug)

### Future: Custom Domain per Tenant

When a tenant configures a CNAME (e.g., `jobs.acme.com → app.i79engage.com`):
- FastAPI middleware reads the `Host` header
- Looks up `Company` by `customCareerDomain == "jobs.acme.com"`
- Routes to the career page handler with `{tenant_slug}` resolved
- The tenant_slug segment disappears from the URL: `https://jobs.acme.com/jobs/{job_slug}`
- No code changes required in route handlers — resolved at the middleware layer

See [Section 14](#14-custom-domain-cname--future-design-note) for full design.

---

## 4. Data Model Changes

### 4.1 `Company` Model — `Backend/app/models/company.py`

**New fields to add:**

```python
class CareerPageConfig(BaseModel):
    """Configuration for the public career page."""
    slug: str | None = None                     # e.g. "acme-corp" — URL-safe, unique
    enabled: bool = False                        # Master switch for career page
    tagline: str | None = None                   # "Join our team and build the future"
    description: str | None = None              # Markdown acceptable, shown on career home
    bannerImageUrl: str | None = None           # Hero banner image URL (Azure Blob)
    customCareerDomain: str | None = None       # Future CNAME: "jobs.acme.com"
    showCompanyDescription: bool = True
    showBenefits: bool = False
    benefits: list[str] = Field(default_factory=list)  # e.g. ["Remote-first", "Health cover"]
    contactEmail: str | None = None             # "careers@acme.com" shown on career page
```

**Add to `Company` document:**
```python
careerPage: CareerPageConfig = Field(default_factory=CareerPageConfig)
```

**Also extend existing `Branding` model** (already exists in `company.py`):
```python
class Branding(BaseModel):
    logoUrl: str | None = None
    primaryColor: str | None = None             # Hex: "#1A56DB" — used for buttons/headings
    fontFamily: str | None = None
    buttonStyle: str | None = None
    # ADD:
    faviconUrl: str | None = None               # For career page <link rel="icon">
    coverImageUrl: str | None = None            # OG image for social sharing
```

**New indexes to add to `Company.Settings.indexes`:**
```python
IndexModel(
    [("careerPage.slug", 1)],
    unique=True,
    sparse=True,
    name="careerPage_slug_unique"
),
IndexModel(
    [("careerPage.enabled", 1), ("updatedAt", -1)],
    name="career_enabled_updated"
),
IndexModel(
    [("careerPage.customCareerDomain", 1)],
    unique=True,
    sparse=True,
    name="career_custom_domain"
),
```

---

### 4.2 `Requisition` Model — `Backend/app/models/requisition.py`

**New fields to add to the `Requisition` document:**

```python
# --- Sourcing / Career Page ---
jobSlug: str | None = None                  # URL slug, generated at first publish (immutable)
isPublished: bool = False                   # Master: is this on the career page?
publishedAt: datetime | None = None         # When first published
unpublishedAt: datetime | None = None       # When last unpublished (for audit)
publishedChannels: list[str] = Field(default_factory=list)
# e.g. ["careers"]  — future: ["careers", "linkedin", "naukri", "indeed"]

channelPublishStatus: dict[str, str] = Field(default_factory=dict)
# e.g. {"careers": "published", "linkedin": "pending", "naukri": "failed"}

channelPublishMeta: dict[str, dict] = Field(default_factory=dict)
# Stores channel-specific metadata (external job IDs, etc.)
# e.g. {"linkedin": {"jobId": "3842938", "publishedAt": "2026-03-05T10:00:00Z"}}
```

**Business rules (enforced in service layer):**
- `isPublished` can only be `True` when `status == "approved"`
- `jobSlug` is generated on first publish and never changes (URL stability for Google indexing)
- `publishedChannels` always contains `"careers"` when `isPublished == True`

**New indexes to add to `Requisition.Settings.indexes`:**
```python
IndexModel(
    [("companyId", 1), ("jobSlug", 1)],
    unique=True,
    sparse=True,
    name="companyId_jobSlug_unique"
),
IndexModel(
    [("companyId", 1), ("isPublished", 1), ("updatedAt", -1)],
    name="companyId_isPublished_updatedAt"
),
# Sitemap query: all published jobs across all companies
IndexModel(
    [("isPublished", 1), ("updatedAt", -1)],
    name="isPublished_updatedAt"
),
```

---

### 4.3 `PublicApplication` Model — `Backend/app/models/public_application.py` *(new file)*

> **Note:** We do **not** reuse the existing `Application` model for public submissions. The existing `Application` is a rich internal ATS entity with many required internal fields (hiring plan, round assignments, etc.). A `PublicApplication` is an inbound guest submission that transitions into an internal `Application` after staff review.

```python
from beanie import Document
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from pymongo import IndexModel
from ..core.id import generate_id


class PublicApplication(Document):
    """
    Guest application submitted via the public career page.
    This is a staging record — staff review and convert it to a full Application.
    """
    id: str = Field(
        default_factory=lambda: generate_id("papp"),
        alias="_id",
        serialization_alias="id",
    )
    companyId: str                              # Tenant isolation
    requisitionId: str
    jobSlug: str                                # Snapshot at time of apply (slug is stable)
    jobTitle: str                               # Denormalised snapshot

    # Candidate data (guest — no account)
    candidateName: str
    candidateEmail: str                         # EmailStr validation
    candidatePhone: str | None = None
    candidateLinkedIn: str | None = None
    candidateLocation: str | None = None

    # CV
    cvFileUrl: str | None = None               # Azure Blob URL after upload
    cvFileName: str | None = None
    cvText: str | None = None                  # Extracted text (async, post-upload)
    cvProcessingStatus: str = "pending"        # pending | processing | done | failed

    # Acquisition meta
    source: str = "careers"                    # "careers" | future: "linkedin" | "naukri"
    ipAddress: str | None = None               # For spam detection
    userAgent: str | None = None
    utmSource: str | None = None
    utmMedium: str | None = None
    utmCampaign: str | None = None

    # Status
    status: str = "new"                        # new | reviewed | converted | rejected_spam
    reviewedByUserId: str | None = None
    reviewedAt: datetime | None = None
    convertedApplicationId: str | None = None  # Set when promoted to full Application

    submittedAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)

    class Settings:
        name = "public_applications"
        indexes = [
            "companyId",
            [("companyId", 1), ("requisitionId", 1)],
            [("companyId", 1), ("status", 1)],
            [("companyId", 1), ("submittedAt", -1)],
            [("companyId", 1), ("requisitionId", 1), ("submittedAt", -1)],
            # Duplicate detection: same email + same job
            IndexModel(
                [("candidateEmail", 1), ("requisitionId", 1)],
                name="email_requisition_unique",
                unique=True,
            ),
        ]
```

---

## 5. Backend — New API Routes

### 5.1 Public Career Page Routes (No Auth) — `Backend/app/api/routes/public_careers.py` *(new file)*

All routes return **server-rendered HTML** via Jinja2. No auth dependency. Rate-limited by IP.

```
GET  /careers/{tenant_slug}                        → Career home page (HTML)
GET  /careers/{tenant_slug}/jobs                   → All open jobs list (HTML)
GET  /careers/{tenant_slug}/jobs/{job_slug}        → Job detail page (HTML + JSON-LD)
POST /careers/{tenant_slug}/jobs/{job_slug}/apply  → Submit guest application
GET  /sitemap.xml                                  → Single platform-wide sitemap
```

**Closed job handling:**
- If `requisition.isPublished == False` AND the requisition was previously published (slug exists) → return **HTTP 410 Gone**
- If slug does not exist at all → return **HTTP 404 Not Found**
- 410 is preferred over 404 for permanently closed jobs; it explicitly signals to Google to deindex the URL rather than wait for it to drop off

**Response headers on all career pages:**
```
Cache-Control: public, max-age=300, stale-while-revalidate=60
X-Robots-Tag: index, follow          (job detail + career home + open job list)
X-Robots-Tag: noindex                (410 closed job page, apply confirmation page)
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
```

---

### 5.2 Public Applications API — same file `public_careers.py`

```
POST /careers/{tenant_slug}/jobs/{job_slug}/apply
```

**Request:** `multipart/form-data`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `candidateName` | string | ✅ | min 2, max 100 chars |
| `candidateEmail` | string | ✅ | valid email format |
| `candidatePhone` | string | ❌ | regex validated if present |
| `candidateLocation` | string | ❌ | |
| `candidateLinkedIn` | string | ❌ | valid URL format |
| `cv` | file | ❌ | PDF/DOC/DOCX, max 10 MB |
| `utmSource` | string | ❌ | captured from hidden form field |
| `utmMedium` | string | ❌ | |
| `utmCampaign` | string | ❌ | |

**Response (success):** HTTP 200, JSON `{"success": true, "message": "Application received."}` when `Accept: application/json` header present; otherwise renders `apply_success.html`.

**Error responses:**
- `409` — Duplicate: "You have already applied for this role."
- `404` — Job not found or not published
- `422` — Validation error (invalid email, file type, etc.)
- `429` — Rate limit exceeded

---

### 5.3 Recruiter-Side Publishing Routes — `Backend/app/api/routes/requisitions.py` *(extend existing)*

```
POST /requisitions/{id}/publish
POST /requisitions/{id}/unpublish
GET  /requisitions/{id}/public-url
```

**`POST /requisitions/{id}/publish`**
- Required roles: `admin`, `recruiter`
- Validates: `requisition.status == "approved"` → 400 if not
- Validates: `company.careerPage.enabled == True` → 400 if not (career page not configured)
- Generates `jobSlug` via `slug_service` if not already set (immutable after)
- Sets: `isPublished=True`, `publishedAt=now` (if first publish), appends `"careers"` to `publishedChannels`
- Sets: `channelPublishStatus["careers"] = "published"`
- Returns: `{ "publicUrl": "https://app.i79engage.com/careers/{slug}/jobs/{job_slug}" }`

**`POST /requisitions/{id}/unpublish`**
- Sets: `isPublished=False`, `unpublishedAt=now`
- Removes `"careers"` from `publishedChannels`
- Sets: `channelPublishStatus["careers"] = "unpublished"`
- Does **not** clear `jobSlug` — URL stability ensures returning visitors get 410, not 404

**`GET /requisitions/{id}/public-url`**
- Returns: `{ "publicUrl": "...", "isPublished": true }` or `{ "publicUrl": null, "isPublished": false }`

---

### 5.4 Company Career Page Settings — `Backend/app/api/routes/companies.py` *(extend existing)*

```
GET  /companies/me/career-page
PUT  /companies/me/career-page
POST /companies/me/career-page/banner
GET  /companies/career-page/slug-check?slug={slug}
```

**`PUT /companies/me/career-page`** payload:
```json
{
  "slug": "acme-corp",
  "enabled": true,
  "tagline": "Build the future with us",
  "description": "We are a fast-growing fintech...",
  "contactEmail": "careers@acme.com",
  "benefits": ["Remote-first", "Health insurance", "ESOP"]
}
```

**`GET /companies/career-page/slug-check?slug={slug}`**
- No auth required (used by frontend debounce checker)
- Returns: `{ "available": true }` or `{ "available": false }`
- Slug uniqueness: queries `Company.find_one(careerPage.slug == slug, id != current_company_id)`

---

### 5.5 Public Applications Inbox — `Backend/app/api/routes/public_applications.py` *(new file)*

Recruiter-facing routes to manage inbound guest applications.

```
GET  /public-applications                     → List (filterable by requisitionId, status)
GET  /public-applications/{id}                → Get one
POST /public-applications/{id}/convert        → Promote to internal Application
POST /public-applications/{id}/reject-spam    → Mark as spam
```

**`POST /public-applications/{id}/convert`**
- Creates a full `Application` record from `PublicApplication` data
- Sets `Application.source = "apply"`, `Application.stage = "new"`
- Sets `PublicApplication.status = "converted"`, `convertedApplicationId = new_app.id`
- Requires: `admin` or `recruiter` role
- Multi-tenancy enforced: `publicApp.companyId == current_user.companyId`

All list/get routes enforce `companyId == current_user.companyId`.

---

## 6. Backend — Service Layer

### 6.1 `Backend/app/services/career_page_service.py` *(new file)*

| Function | Responsibility |
|----------|---------------|
| `get_company_by_slug(slug)` | Resolve Company from tenant slug; returns None if not found or career page disabled |
| `get_published_jobs(company)` | Return all `isPublished=True` requisitions for a company, ordered by `publishedAt desc` |
| `get_job_by_slug(company, job_slug)` | Find requisition by companyId + jobSlug |
| `build_job_jsonld(req, company, base_url, tenant_slug)` | Build the complete `JobPosting` JSON-LD dict |
| `build_career_page_context(company, jobs)` | Assemble Jinja2 template context dict |
| `build_platform_sitemap(base_url)` | Query all published jobs + enabled companies; return rendered XML string |

### 6.2 `Backend/app/services/slug_service.py` *(new file)*

```python
import re
from ..models.requisition import Requisition
from ..models.company import Company


def slugify(text: str, max_length: int = 80) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text[:max_length].strip('-')


async def ensure_unique_job_slug(company_id: str, base_slug: str) -> str:
    """Appends -2, -3 etc. until slug is unique within the company."""
    slug = base_slug
    counter = 2
    while True:
        existing = await Requisition.find_one(
            Requisition.companyId == company_id,
            Requisition.jobSlug == slug
        )
        if not existing:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


async def ensure_unique_tenant_slug(base_slug: str) -> str:
    """Appends -2, -3 etc. until slug is unique across the platform."""
    slug = base_slug
    counter = 2
    while True:
        existing = await Company.find_one(
            Company.careerPage.slug == slug
        )
        if not existing:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


def generate_job_slug(title: str, location: str | None) -> str:
    parts = [title]
    if location:
        parts.append(location)
    return slugify(" ".join(parts))


def generate_tenant_slug(company_name: str) -> str:
    return slugify(company_name)
```

### 6.3 `Backend/app/services/public_application_service.py` *(new file)*

| Function | Responsibility |
|----------|---------------|
| `submit_application(company, requisition, form_data, cv_file, request)` | Duplicate check → CV upload (non-blocking) → create `PublicApplication` |
| `convert_to_application(public_app, acting_user)` | Create `Application` from guest data; update `PublicApplication.status = "converted"` |
| `list_for_company(company_id, filters)` | Paginated list with `requisitionId` / `status` filters |

CV upload fires as a `BackgroundTasks` task so the HTTP response is not blocked by the Azure Blob upload. `cvProcessingStatus` starts as `"pending"` and the background task updates it to `"done"` or `"failed"`.

---

## 7. Backend — Configuration Changes

### `Backend/app/core/config.py` — New settings

```python
# --- Sourcing / Career Page ---
CAREER_PAGE_BASE_URL: str = "https://app.i79engage.com"
# Override for local dev: "http://localhost:8000"

FEATURE_CAREER_PAGE: bool = True

# Max file size for CV uploads from public career page (bytes)
CAREER_PAGE_CV_MAX_BYTES: int = 10 * 1024 * 1024  # 10 MB

# Rate limit for public application form submissions (per IP per 10 minutes)
CAREER_APPLY_RATE_LIMIT: int = 3
```

### `Backend/app/core/features.py` — New constant

```python
FEATURE_CAREER_PAGE = "career_page"
```

---

## 8. Career Portal — Server-Rendered HTML

### Template Structure — `Backend/app/templates/careers/`

```
Backend/app/templates/careers/
├── base.html                   ← Base layout (branding, nav, attribution footer)
├── home.html                   ← Career home: company intro + open jobs list
├── job_detail.html             ← Individual job: full JD + apply form + JSON-LD
├── job_closed.html             ← 410 page: role no longer accepting applications
├── apply_success.html          ← Post-submission confirmation (noindex)
└── partials/
    ├── _job_card.html          ← Job card component (reused in home + list)
    └── _apply_form.html        ← Application form + JS submit handler
```

### `base.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>{{ page_title }} | {{ company.name }} Careers</title>
  <meta name="description" content="{{ meta_description }}">

  <!-- Open Graph (social sharing) -->
  <meta property="og:title" content="{{ page_title }}">
  <meta property="og:description" content="{{ meta_description }}">
  <meta property="og:image" content="{{ company.branding.coverImageUrl or default_og_image }}">
  <meta property="og:url" content="{{ canonical_url }}">
  <meta property="og:type" content="website">

  <!-- Canonical URL (critical for Google deduplication) -->
  <link rel="canonical" href="{{ canonical_url }}">

  {% if company.branding.faviconUrl %}
  <link rel="icon" href="{{ company.branding.faviconUrl }}">
  {% endif %}

  <!-- Inject tenant primary colour as CSS variable -->
  <style>
    :root {
      --primary: {{ company.branding.primaryColor or '#1A56DB' }};
      --primary-foreground: #ffffff;
    }
  </style>

  <!-- Tailwind CDN — no build step needed for server-rendered templates -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- JSON-LD block (populated only on job_detail.html) -->
  {% block jsonld %}{% endblock %}
</head>
<body class="bg-gray-50 font-sans text-gray-800">

  <header class="bg-white border-b border-gray-200 py-4">
    <div class="max-w-5xl mx-auto px-4 flex items-center gap-3">
      {% if company.branding.logoUrl %}
      <img src="{{ company.branding.logoUrl }}" alt="{{ company.name }}" class="h-10 w-auto">
      {% else %}
      <span class="text-xl font-bold" style="color: var(--primary)">{{ company.name }}</span>
      {% endif %}
      <span class="text-sm text-gray-500 ml-auto">Careers</span>
    </div>
  </header>

  <main class="max-w-5xl mx-auto px-4 py-8">
    {% block content %}{% endblock %}
  </main>

  <!-- Mandatory attribution — must be visibly present on all career pages -->
  <footer class="border-t border-gray-200 mt-12 py-6 text-center text-xs text-gray-400">
    Posted by i79 Recruitment Platform on behalf of <strong>{{ company.name }}</strong>.
    <br>
    Powered by <a href="https://i79engage.com" class="underline">i79Engage</a>.
  </footer>

</body>
</html>
```

### `home.html`

```html
{% extends "careers/base.html" %}
{% block content %}

<section class="mb-10">
  {% if company.careerPage.bannerImageUrl %}
  <img src="{{ company.careerPage.bannerImageUrl }}" alt="Careers at {{ company.name }}"
       class="w-full h-48 object-cover rounded-xl mb-6">
  {% endif %}
  <h1 class="text-3xl font-bold text-gray-900">Careers at {{ company.name }}</h1>
  {% if company.careerPage.tagline %}
  <p class="mt-2 text-lg text-gray-600">{{ company.careerPage.tagline }}</p>
  {% endif %}
  {% if company.careerPage.description and company.careerPage.showCompanyDescription %}
  <p class="mt-4 text-gray-600">{{ company.careerPage.description }}</p>
  {% endif %}
</section>

{% if company.careerPage.showBenefits and company.careerPage.benefits %}
<section class="mb-10">
  <h2 class="text-xl font-semibold mb-3">Why join us?</h2>
  <ul class="flex flex-wrap gap-2">
    {% for benefit in company.careerPage.benefits %}
    <li class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">{{ benefit }}</li>
    {% endfor %}
  </ul>
</section>
{% endif %}

<section>
  <h2 class="text-2xl font-semibold mb-6">Open Positions ({{ jobs | length }})</h2>
  {% if jobs %}
    {% for job in jobs %}
      {% include "careers/partials/_job_card.html" %}
    {% endfor %}
  {% else %}
  <p class="text-gray-500">No open positions at this time. Check back soon.</p>
  {% endif %}
</section>

{% endblock %}
```

### `job_detail.html`

```html
{% extends "careers/base.html" %}

{% block jsonld %}
<script type="application/ld+json">
{{ job_jsonld | tojson | safe }}
</script>
{% endblock %}

{% block content %}
<article>
  <nav class="text-sm text-gray-400 mb-4">
    <a href="/careers/{{ tenant_slug }}" class="hover:underline">{{ company.name }} Careers</a>
    <span class="mx-1">›</span>
    <span>{{ requisition.title }}</span>
  </nav>

  <header class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900">{{ requisition.title }}</h1>
    <div class="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">Processing...

      {% if requisition.location %}
      <span>📍 {{ requisition.location }}</span>
      {% endif %}
      {% if requisition.employmentType %}
      <span>💼 {{ requisition.employmentType | title }}</span>
      {% endif %}
      {% if requisition.businessUnit %}
      <span>🏢 {{ requisition.businessUnit }}</span>
      {% endif %}
      {% if requisition.publishedAt %}
      <span>📅 Posted {{ requisition.publishedAt.strftime('%d %b %Y') }}</span>
      {% endif %}
    </div>

    <a href="#apply-form"
       class="inline-block mt-5 px-6 py-3 rounded-lg text-white font-semibold text-base"
       style="background-color: var(--primary)">
      Apply Now
    </a>
  </header>

  {% if requisition.jdText %}
  <section class="mb-8">
    <h2 class="text-xl font-semibold mb-3">About the Role</h2>
    <div class="prose prose-lg max-w-none text-gray-700">
      {{ requisition.jdText | nl2br | safe }}
    </div>
  </section>
  {% endif %}

  {% if requisition.requirements.mustHave %}
  <section class="mb-8">
    <h2 class="text-xl font-semibold mb-3">Requirements</h2>
    <ul class="list-disc pl-5 space-y-1 text-gray-700">
      {% for req in requisition.requirements.mustHave %}
      <li>{{ req }}</li>
      {% endfor %}
    </ul>
  </section>
  {% endif %}

  {% if requisition.requirements.niceToHave %}
  <section class="mb-8">
    <h2 class="text-xl font-semibold mb-3">Nice to Have</h2>
    <ul class="list-disc pl-5 space-y-1 text-gray-600">
      {% for req in requisition.requirements.niceToHave %}
      <li>{{ req }}</li>
      {% endfor %}
    </ul>
  </section>
  {% endif %}

  <!-- Application Form -->
  <section id="apply-form" class="bg-white border border-gray-200 rounded-xl p-6 mt-10">
    <h2 class="text-xl font-semibold mb-5">Apply for this role</h2>
    {% include "careers/partials/_apply_form.html" %}
  </section>

</article>
{% endblock %}
```

### `partials/_apply_form.html`

```html
<form id="application-form" enctype="multipart/form-data" class="space-y-4" novalidate>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium mb-1">Full Name <span class="text-red-500">*</span></label>
      <input type="text" name="candidateName" required minlength="2" maxlength="100"
             class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
             style="--tw-ring-color: var(--primary)">
    </div>
    <div>
      <label class="block text-sm font-medium mb-1">Email Address <span class="text-red-500">*</span></label>
      <input type="email" name="candidateEmail" required
             class="w-full border border-gray-300 rounded-lg px-3 py-2">
    </div>
    <div>
      <label class="block text-sm font-medium mb-1">Phone Number</label>
      <input type="tel" name="candidatePhone"
             class="w-full border border-gray-300 rounded-lg px-3 py-2">
    </div>
    <div>
      <label class="block text-sm font-medium mb-1">Current Location</label>
      <input type="text" name="candidateLocation"
             class="w-full border border-gray-300 rounded-lg px-3 py-2">
    </div>
  </div>

  <div>
    <label class="block text-sm font-medium mb-1">LinkedIn Profile URL</label>
    <input type="url" name="candidateLinkedIn"
           placeholder="https://linkedin.com/in/your-profile"
           class="w-full border border-gray-300 rounded-lg px-3 py-2">
  </div>

  <div>
    <label class="block text-sm font-medium mb-1">Upload CV
      <span class="text-gray-400 font-normal">(PDF, DOC, DOCX — max 10 MB)</span>
    </label>
    <input type="file" name="cv" accept=".pdf,.doc,.docx"
           class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
                  file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700">
  </div>

  <!-- Honeypot — invisible to humans, filled by bots -->
  <div style="display:none" aria-hidden="true">
    <input type="text" name="company_name" tabindex="-1" autocomplete="off">
  </div>

  <!-- UTM params captured from URL by JS -->
  <input type="hidden" name="utmSource" id="utm_source">
  <input type="hidden" name="utmMedium" id="utm_medium">
  <input type="hidden" name="utmCampaign" id="utm_campaign">

  <button type="submit"
          id="submit-btn"
          class="w-full py-3 px-6 rounded-lg text-white font-semibold text-base"
          style="background-color: var(--primary)">
    Submit Application
  </button>

  <p id="form-message" class="text-center text-sm hidden"></p>
</form>

<script>
// Capture UTM params from URL into hidden fields
const params = new URLSearchParams(window.location.search);
['source', 'medium', 'campaign'].forEach(k => {
  const el = document.getElementById('utm_' + k);
  if (el) el.value = params.get('utm_' + k) || '';
});

document.getElementById('application-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  const msg = document.getElementById('form-message');

  btn.disabled = true;
  btn.textContent = 'Submitting\u2026';
  msg.className = 'text-center text-sm hidden';

  try {
    const res = await fetch(window.location.pathname + '/apply', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(this),
    });
    const data = await res.json();

    if (res.ok) {
      this.innerHTML = `
        <div class="text-center py-10">
          <p class="text-2xl font-semibold text-green-600">\u2713 Application Received!</p>
          <p class="text-gray-500 mt-2">Thank you. The team will be in touch shortly.</p>
        </div>`;
    } else if (res.status === 409) {
      msg.textContent = 'You have already applied for this role.';
      msg.className = 'text-center text-sm text-orange-600';
      msg.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Submit Application';
    } else {
      throw new Error(data.detail || 'Submission failed');
    }
  } catch (err) {
    msg.textContent = 'Something went wrong. Please try again.';
    msg.className = 'text-center text-sm text-red-600';
    msg.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Submit Application';
  }
});
</script>
```

### `job_closed.html`

```html
{% extends "careers/base.html" %}
{% block content %}
<div class="text-center py-20">
  <p class="text-5xl mb-4">🔒</p>
  <h1 class="text-2xl font-bold text-gray-800">This position is no longer available</h1>
  <p class="text-gray-500 mt-2">{{ company.name }} is not currently accepting applications for this role.</p>
  <a href="/careers/{{ tenant_slug }}"
     class="inline-block mt-6 px-5 py-2 rounded-lg text-white text-sm font-medium"
     style="background-color: var(--primary)">
    View Other Open Roles
  </a>
</div>
{% endblock %}
```

---

## 9. Google Jobs Compliance

Google Jobs reads the `JobPosting` schema from **`<script type="application/ld+json">`** in the `<head>`. This must be present in the **initial HTML response** (not injected by JavaScript after load) — which is why server-side rendering is mandatory.

### JSON-LD Builder — `career_page_service.build_job_jsonld()`

```python
def build_job_jsonld(
    requisition: Requisition,
    company: Company,
    base_url: str,
    tenant_slug: str,
) -> dict:
    job_url = f"{base_url}/careers/{tenant_slug}/jobs/{requisition.jobSlug}"

    jsonld = {
        "@context": "https://schema.org/",
        "@type": "JobPosting",

        # --- Required by Google ---
        "title": requisition.title,
        "description": requisition.jdText or "",   # Full text, min 50 chars
        "datePosted": requisition.publishedAt.strftime("%Y-%m-%d"),
        "hiringOrganization": {
            "@type": "Organization",
            "name": company.name,
            "sameAs": job_url,
            "logo": company.branding.logoUrl or "",
        },
        "jobLocation": {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": requisition.location or "",
                "addressCountry": "IN",  # TODO: derive from company.country in Phase 2
            }
        },

        # --- Strongly recommended ---
        "employmentType": _map_employment_type(requisition.employmentType),
        # Valid Google values: FULL_TIME | PART_TIME | CONTRACTOR | TEMPORARY | INTERN | VOLUNTEER | PER_DIEM | OTHER

        # --- Direct apply (application on same domain — no external redirect) ---
        "url": job_url,
        "directApply": True,
        "applicationContact": {
            "@type": "ContactPoint",
            "url": f"{job_url}#apply-form",
        },

        # --- Identifier ---
        "identifier": {
            "@type": "PropertyValue",
            "name": "i79Engage",
            "value": requisition.id,
        },
    }

    # Expiry date — include only if targetStartDate is set
    if requisition.targetStartDate:
        jsonld["validThrough"] = requisition.targetStartDate.strftime("%Y-%m-%dT%H:%M:%S")

    # Salary range — include only if budget configured
    if requisition.budgetRange and requisition.budgetRange.min:
        jsonld["baseSalary"] = {
            "@type": "MonetaryAmount",
            "currency": requisition.budgetRange.currency or "USD",
            "value": {
                "@type": "QuantitativeValue",
                "minValue": requisition.budgetRange.min,
                "maxValue": requisition.budgetRange.max,
                "unitText": "YEAR",
            }
        }

    # Strip None values — Google rejects null required fields
    return {k: v for k, v in jsonld.items() if v is not None}


def _map_employment_type(emp_type: str | None) -> str:
    mapping = {
        "full-time": "FULL_TIME",
        "part-time": "PART_TIME",
        "contract": "CONTRACTOR",
        "intern": "INTERN",
        "temporary": "TEMPORARY",
    }
    return mapping.get((emp_type or "").lower(), "FULL_TIME")
```

### Mandatory Page Requirements Checklist

| Requirement | Implementation |
|-------------|---------------|
| No login required | Public routes have no auth dependency |
| HTTPS | Enforced at nginx/Caddy layer (HTTP → HTTPS redirect) |
| Mobile responsive | Tailwind responsive grid in templates |
| Full job description visible | `jdText` rendered in `<section>` |
| JSON-LD in `<head>` initial response | Jinja2 `{% block jsonld %}` in `<head>` |
| "Posted by i79 Recruitment Platform on behalf of {tenant}" | Mandatory footer in `base.html` |
| Visible "Apply Now" button | CTA button in `job_detail.html` header |
| Application on same domain | `POST /careers/{slug}/jobs/{slug}/apply` — same origin |
| No redirect to external job board | All application handling in-platform |
| Closed job returns 410 | Route handler checks `isPublished` and returns 410 |

### Google Search Console

After go-live, submit `https://app.i79engage.com/sitemap.xml` once in Google Search Console. Monitor the "Job Postings" rich result coverage report.

Validate individual job pages at:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

---

## 10. Sitemap Strategy

### Single Platform Sitemap — `GET /sitemap.xml`

One sitemap file covers all tenants and all published jobs across the entire platform.

**Register this single URL once in Google Search Console.** No per-tenant setup required.

```python
# Backend/app/api/routes/public_careers.py

@router.get("/sitemap.xml", include_in_schema=False)
async def platform_sitemap():
    """
    Single platform-wide sitemap covering all tenants and all published jobs.
    Cache-Control: 1 hour — safe given Google crawls sitemaps at most once per day.
    """
    # All published jobs across all tenants — one query
    published_jobs = await Requisition.find(
        Requisition.isPublished == True
    ).to_list()

    # All tenants with career pages enabled
    companies = await Company.find(
        Company.careerPage.enabled == True
    ).to_list()

    # Build companyId → company map for URL construction
    company_map = {c.id: c for c in companies if c.careerPage.slug}

    entries = []

    # Career home page per tenant
    for company in companies:
        if not company.careerPage.slug:
            continue
        entries.append({
            "loc": f"{settings.CAREER_PAGE_BASE_URL}/careers/{company.careerPage.slug}",
            "lastmod": company.updatedAt.strftime("%Y-%m-%d"),
            "changefreq": "weekly",
            "priority": "0.8",
        })

    # Individual job pages
    for job in published_jobs:
        company = company_map.get(job.companyId)
        if not company:
            continue
        lastmod = max(
            job.publishedAt or job.updatedAt,
            job.updatedAt
        ).strftime("%Y-%m-%d")
        entries.append({
            "loc": f"{settings.CAREER_PAGE_BASE_URL}/careers/{company.careerPage.slug}/jobs/{job.jobSlug}",
            "lastmod": lastmod,
            "changefreq": "daily",
            "priority": "1.0",
        })

    return Response(
        content=_render_sitemap_xml(entries),
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=3600"},
    )


def _render_sitemap_xml(entries: list[dict]) -> str:
    urls = ""
    for e in entries:
        urls += f"""
  <url>
    <loc>{e['loc']}</loc>
    <lastmod>{e['lastmod']}</lastmod>
    <changefreq>{e['changefreq']}</changefreq>
    <priority>{e['priority']}</priority>
  </url>"""
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}
</urlset>"""
```

**XML output example:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://app.i79engage.com/careers/acme-corp</loc>
    <lastmod>2026-03-05</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://app.i79engage.com/careers/acme-corp/jobs/senior-python-engineer-bangalore</loc>
    <lastmod>2026-03-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

**`<lastmod>` update triggers:**
- `requisition.updatedAt` is already updated on every modification (title, JD, location, publish/unpublish)
- The sitemap reads `updatedAt` directly — no extra audit trail required
- Unpublished jobs are excluded from the sitemap entirely; Google deindexes on next crawl

**Scale ceiling:**
- Google's limit: 50,000 URLs per sitemap file (~50 MB)
- At 100 tenants × 50 avg open jobs ≈ 5,100 URLs — well within limits
- When the platform exceeds ~900 active tenants, split into a sitemap index with per-tenant files. The `careerPage.slug` field already on `Company` makes that migration a one-day task

---

## 11. Guest Application Flow

### Happy Path

```
Candidate arrives at job URL (Google search, shared link, etc.)
  → Reads full job description
  → Clicks "Apply Now" button (smooth-scrolls to #apply-form anchor)
  → Fills form: name*, email*, phone, location, LinkedIn, CV upload
  → Clicks "Submit Application"
  → [JS] POST multipart/form-data to /careers/{slug}/jobs/{job_slug}/apply
      → [Server] Validate inputs (Pydantic)
      → [Server] Duplicate check: same email + requisitionId → 409 if exists
      → [Server] Honeypot check: filled → mark spam silently, return 200
      → [Server] Create PublicApplication record (status="new")
      → [Server] Fire background task: upload CV to Azure Blob
      → [Server] Return { success: true }
  → [JS] Replace form with "Application Received" confirmation message
```

### Duplicate Prevention

On submit, query: `PublicApplication.find_one(requisitionId==X, candidateEmail==Y)`

If found → HTTP 409. Message: **"You have already applied for this role."**

The duplicate check fires **before** the file upload (fail fast — no wasted upload).

### Spam / Bot Protection

| Layer | Mechanism |
|-------|----------|
| Honeypot | Invisible `<input name="company_name">` — if filled, silently save with `status="rejected_spam"` |
| Rate limiting | Max 3 submissions per IP per 10 minutes (extend existing `RateLimitMiddleware`) |
| File validation | PDF/DOC/DOCX only, 10 MB max (MIME type + extension check) |
| Future | hCaptcha or Cloudflare Turnstile behind a `FEATURE_CAREER_CAPTCHA` flag |

### Recruiter Inbox Flow (Post-Apply)

```
New PublicApplication created (status="new")
  ↓
Recruiter opens Inbound Applications tab on RequisitionDetail page
  ↓
Reviews candidate: name, email, CV download link, location
  ↓
  Option A: "Promote to Pipeline"
    → POST /public-applications/{id}/convert
    → Application created (stage="new", source="apply")
    → PublicApplication.status = "converted"
    → Recruiter continues normal ATS workflow
  ↓
  Option B: "Mark as Spam"
    → POST /public-applications/{id}/reject-spam
    → PublicApplication.status = "rejected_spam"
```

---

## 12. Frontend — Recruiter Portal Changes

### 12.1 `RequisitionDetail.tsx` — Publishing Panel

Add a collapsible "Career Page" panel below the requisition header. Visible to `admin` and `recruiter` roles only. Renders as disabled/grayed when `company.careerPage.enabled == false`.

**State: Not published (approved requisition)**
```
┌─────────────────────────────────────────────────┐
│  🌐  Career Page                                │
│                                                 │
│  Status: Not Published                          │
│                                                 │
│  [  Publish to Career Page  ]                   │
└─────────────────────────────────────────────────┘
```

**State: Not published (non-approved requisition)**
```
┌─────────────────────────────────────────────────┐
│  🌐  Career Page                                │
│                                                 │
│  Status: Not Published                          │
│  ⚠ Requisition must be approved before         │
│    publishing. Current status: pending          │
│                                                 │
│  [  Publish to Career Page  ]  ← disabled       │
└─────────────────────────────────────────────────┘
```

**State: Published**
```
┌─────────────────────────────────────────────────┐
│  🌐  Career Page                           ✅   │
│                                                 │
│  Status: Live                                   │
│  Published: 5 March 2026                        │
│                                                 │
│  https://app.i79engage.com/careers/acme-...     │
│  [ Copy URL ]   [ Open ↗ ]                      │
│                                                 │
│  [ Unpublish ]                                  │
└─────────────────────────────────────────────────┘
```

### 12.2 `Settings.tsx` — Career Page Tab

New "Career Page" tab with the following fields:

| Field | Component | Notes |
|-------|-----------|-------|
| Enable career page | Toggle | Master switch |
| Slug | Text input + availability badge | Debounced GET to `/companies/career-page/slug-check`; shows ✅/❌; preview URL auto-renders below |
| Tagline | Text input | max 120 chars |
| Description | Textarea | Shown on career home |
| Contact email | Email input | |
| Benefits | Tag input | Add/remove tags |
| Banner image | File upload with preview | Stored in Azure Blob `images` container |
| Logo | Already in existing branding settings | Link displayed for reference |

### 12.3 New Page: `PublicApplications.tsx`

Route: `/public-applications`

Accessible from `/requisitions/:id` pipeline view via an "Inbound Applications" tab badge.

**Table columns:** Name · Email · Role · CV · Location · Submitted · Status · Actions

**Actions per row:** "Promote to Pipeline", "Mark as Spam"

**Filters:** Requisition (dropdown), Status (all / new / reviewed / converted / spam)

### 12.4 `Frontend/src/services/api/careerPageService.ts` *(new file)*

```typescript
import apiClient from './apiClient';
import { CareerPageSettings, PublicApplication } from '@/types';

export const careerPageService = {
  async publishJob(requisitionId: string) {
    const res = await apiClient.post(`/requisitions/${requisitionId}/publish`);
    return res.data.data as { publicUrl: string };
  },

  async unpublishJob(requisitionId: string) {
    return await apiClient.post(`/requisitions/${requisitionId}/unpublish`);
  },

  async getPublicUrl(requisitionId: string): Promise<string | null> {
    const res = await apiClient.get(`/requisitions/${requisitionId}/public-url`);
    return res.data.data?.publicUrl ?? null;
  },

  async getCareerPageSettings(): Promise<CareerPageSettings> {
    const res = await apiClient.get('/companies/me/career-page');
    return res.data.data;
  },

  async updateCareerPageSettings(payload: Partial<CareerPageSettings>) {
    const res = await apiClient.put('/companies/me/career-page', payload);
    return res.data.data;
  },

  async checkSlugAvailability(slug: string): Promise<boolean> {
    const res = await apiClient.get(`/companies/career-page/slug-check`, { params: { slug } });
    return res.data.data.available as boolean;
  },

  async listPublicApplications(filters?: {
    requisitionId?: string;
    status?: string;
  }): Promise<PublicApplication[]> {
    const res = await apiClient.get('/public-applications', { params: filters });
    return res.data.data;
  },

  async convertApplication(publicAppId: string) {
    const res = await apiClient.post(`/public-applications/${publicAppId}/convert`);
    return res.data.data;
  },

  async rejectSpam(publicAppId: string) {
    return await apiClient.post(`/public-applications/${publicAppId}/reject-spam`);
  },
};
```

### 12.5 `Frontend/src/types/index.ts` — New / Updated Types

```typescript
// ── Extend existing Requisition interface ──────────────────────────────────
interface Requisition {
  // ... all existing fields ...
  jobSlug?: string;
  isPublished: boolean;
  publishedAt?: string;
  unpublishedAt?: string;
  publishedChannels: string[];
  channelPublishStatus: Record<string, string>;  // { "careers": "published" }
  channelPublishMeta: Record<string, Record<string, unknown>>;
}

// ── New ────────────────────────────────────────────────────────────────────
export interface CareerPageSettings {
  slug: string | null;
  enabled: boolean;
  tagline: string | null;
  description: string | null;
  bannerImageUrl: string | null;
  contactEmail: string | null;
  benefits: string[];
  customCareerDomain: string | null;
}

export interface PublicApplication {
  id: string;
  companyId: string;
  requisitionId: string;
  jobSlug: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string | null;
  candidateLinkedIn: string | null;
  candidateLocation: string | null;
  cvFileUrl: string | null;
  cvFileName: string | null;
  source: string;
  status: 'new' | 'reviewed' | 'converted' | 'rejected_spam';
  convertedApplicationId: string | null;
  submittedAt: string;
}
```

### 12.6 `App.tsx` — New Route

```tsx
<Route
  path="/public-applications"
  element={
    <ProtectedRoute allowedRoles={["admin", "recruiter"]}>
      <PublicApplications />
    </ProtectedRoute>
  }
/>
```

### 12.7 `Navigation.tsx` — New Link

Add "Inbound Applications" under the Sourcing section with a badge showing the count of `status="new"` applications.

---

## 13. Multi-Channel Publishing Architecture

This is designed **today** so that adding LinkedIn, Naukri, or Indeed in Phase 2 requires **no schema migrations**.

### Current State (MVP — careers only)

```json
{
  "publishedChannels": ["careers"],
  "channelPublishStatus": { "careers": "published" },
  "channelPublishMeta": {}
}
```

### Future State (Phase 2 — multi-channel)

```json
{
  "publishedChannels": ["careers", "linkedin", "naukri"],
  "channelPublishStatus": {
    "careers": "published",
    "linkedin": "published",
    "naukri": "pending"
  },
  "channelPublishMeta": {
    "linkedin": {
      "externalJobId": "3842938472",
      "publishedAt": "2026-06-01T10:00:00Z",
      "listingUrl": "https://linkedin.com/jobs/view/3842938472"
    },
    "naukri": {
      "externalJobId": null,
      "errorMessage": "API rate limit exceeded",
      "lastAttemptAt": "2026-06-01T10:05:00Z"
    }
  }
}
```

### Phase 2 Channel Plugin Interface

```python
# Backend/app/services/channel_publishers/base.py

from abc import ABC, abstractmethod
from ...models.requisition import Requisition
from ...models.company import Company


class ChannelPublisher(ABC):
    channel_name: str  # "linkedin" | "naukri" | "indeed"

    @abstractmethod
    async def publish(self, requisition: Requisition, company: Company) -> dict:
        """Publish job to channel. Returns metadata stored in channelPublishMeta[channel_name]."""
        ...

    @abstractmethod
    async def unpublish(self, requisition: Requisition, company: Company) -> None:
        """Take job down from channel."""
        ...

    @abstractmethod
    async def sync_status(self, requisition: Requisition) -> str:
        """Returns: published | pending | failed | expired"""
        ...
```

`CareersPagePublisher`, `LinkedInPublisher`, `NaukriPublisher` each implement this interface.

**Phase 2 routes (for reference — not in scope for MVP):**
```
POST /requisitions/{id}/publish-channel    Body: { "channel": "linkedin" }
POST /requisitions/{id}/unpublish-channel  Body: { "channel": "naukri" }
GET  /requisitions/{id}/channel-status     Returns channelPublishStatus + channelPublishMeta
```

---

## 14. Custom Domain (CNAME) — Future Design Note

When a tenant wants `jobs.acme.com` to show their career page:

### Step 1 — Tenant DNS

Tenant adds: `jobs.acme.com CNAME app.i79engage.com`

Admin enters `jobs.acme.com` into Career Page Settings → `customCareerDomain` field.

### Step 2 — TLS Certificate

Platform (Caddy or nginx with `certbot`) auto-provisions a Let's Encrypt cert for `jobs.acme.com`. No wildcard cert needed — one cert per custom domain.

### Step 3 — FastAPI Middleware

```python
@app.middleware("http")
async def custom_domain_resolver(request: Request, call_next):
    host = request.headers.get("host", "").split(":")[0]

    if host not in {"app.i79engage.com", "localhost"}:
        company = await Company.find_one(
            Company.careerPage.customCareerDomain == host,
            Company.careerPage.enabled == True,
        )
        if company:
            request.state.custom_domain_company = company

    return await call_next(request)
```

### Step 4 — Route Handler Adjustment

Career page routes detect `request.state.custom_domain_company` and use it instead of slug resolution. URL seen by candidates:

`https://jobs.acme.com/jobs/senior-python-engineer-bangalore`

(`{tenant_slug}` path segment disappears — no code changes to route handlers required.)

### Sitemap for Custom Domains

When a company has a custom domain, its job URLs use the custom domain in `sitemap.xml`:

`https://jobs.acme.com/jobs/senior-python-engineer-bangalore`

rather than the path-based URL. The middleware resolves both, so both URLs work — only the canonical one (custom domain) appears in the sitemap.

---

## 15. Security & Rate Limiting

| Concern | Mitigation |
|---------|-----------|
| Tenant data leakage | `companyId` resolved server-side from slug — never a user-provided query param |
| Slug enumeration | Disabled career pages return 404 with no distinction between "company not found" and "career page off" |
| Application spam | Rate limit 3/10 min per IP + honeypot field |
| Bot flood | Extend existing `RateLimitMiddleware`; dedicated limit for `/careers/*/apply` |
| CV upload abuse | Whitelist PDF/DOC/DOCX; 10 MB max; Azure Defender for Storage (virus scan on blob write) |
| PII in logs | Mask `candidateEmail`, `candidateName` in uvicorn access logs for `/careers/*` paths |
| Email harvesting | `candidateEmail` stored server-side only; never rendered on public pages |
| Insecure direct object reference | All `/public-applications/*` routes verify `companyId == current_user.companyId` |
| HTTPS enforcement | nginx/Caddy: HTTP 301 → HTTPS for all `/careers/*` and `/sitemap.xml` |

**Security response headers (add to all `/careers/*` responses):**
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 16. Database Indexes

### `companies` collection

```python
IndexModel([("careerPage.slug", 1)], unique=True, sparse=True, name="career_slug_unique"),
IndexModel([("careerPage.enabled", 1), ("updatedAt", -1)], name="career_enabled_updated"),
IndexModel([("careerPage.customCareerDomain", 1)], unique=True, sparse=True, name="career_custom_domain"),
```

### `requisitions` collection

```python
IndexModel([("companyId", 1), ("jobSlug", 1)], unique=True, sparse=True, name="companyId_jobSlug"),
IndexModel([("companyId", 1), ("isPublished", 1), ("updatedAt", -1)], name="companyId_isPublished"),
# Sitemap query: all published jobs across all companies
IndexModel([("isPublished", 1), ("updatedAt", -1)], name="isPublished_updatedAt"),
```

### `public_applications` collection

```python
IndexModel([("candidateEmail", 1), ("requisitionId", 1)], unique=True, name="dupe_check"),
IndexModel([("companyId", 1), ("status", 1), ("submittedAt", -1)], name="inbox_query"),
IndexModel([("companyId", 1), ("requisitionId", 1), ("submittedAt", -1)], name="requisition_inbox"),
```

---

## 17. Implementation Steps

### Phase A — Backend Foundation (1–2 days)

- [ ] A1. `slug_service.py` — `slugify()`, `ensure_unique_job_slug()`, `ensure_unique_tenant_slug()`, `generate_job_slug()`, `generate_tenant_slug()`
- [ ] A2. Extend `Company` model — add `CareerPageConfig` class; add `careerPage` field; extend `Branding` with `faviconUrl`, `coverImageUrl`
- [ ] A3. Extend `Requisition` model — add `jobSlug`, `isPublished`, `publishedAt`, `unpublishedAt`, `publishedChannels`, `channelPublishStatus`, `channelPublishMeta`
- [ ] A4. Create `PublicApplication` model (`Backend/app/models/public_application.py`)
- [ ] A5. Register `PublicApplication` in `Backend/app/core/db.py` Beanie document list
- [ ] A6. Add new settings to `config.py` (`CAREER_PAGE_BASE_URL`, `FEATURE_CAREER_PAGE`, `CAREER_PAGE_CV_MAX_BYTES`, `CAREER_APPLY_RATE_LIMIT`)
- [ ] A7. Add `FEATURE_CAREER_PAGE` constant to `features.py`
- [ ] A8. Add all new indexes — applied automatically on next `init_db()` startup

### Phase B — Backend Services (1–2 days)

- [ ] B1. `career_page_service.py` — `get_company_by_slug()`, `get_published_jobs()`, `get_job_by_slug()`, `build_job_jsonld()`, `build_career_page_context()`
- [ ] B2. `career_page_service.py` — `build_platform_sitemap()`, `_render_sitemap_xml()`
- [ ] B3. `public_application_service.py` — `submit_application()`, `convert_to_application()`, `list_for_company()`

### Phase C — Backend Routes (1–2 days)

- [ ] C1. `public_careers.py` — Career home, job list, job detail, job closed (410) routes; all return Jinja2 HTML responses
- [ ] C2. `public_careers.py` — `POST /careers/{slug}/jobs/{job_slug}/apply` with duplicate check, honeypot, file validation, background CV upload
- [ ] C3. `public_careers.py` — `GET /sitemap.xml` (single platform sitemap)
- [ ] C4. `public_applications.py` — Recruiter inbox: list, get, convert, reject-spam
- [ ] C5. Extend `requisitions.py` — `POST /publish`, `POST /unpublish`, `GET /public-url`
- [ ] C6. Extend `companies.py` — `GET/PUT /companies/me/career-page`, banner upload, slug availability check
- [ ] C7. `main.py` — Register `public_careers` and `public_applications` routers; mount `GET /sitemap.xml`

### Phase D — Jinja2 Templates (1–2 days)

- [ ] D1. `templates/careers/base.html` — Branding CSS variable injection, header, mandatory attribution footer
- [ ] D2. `templates/careers/home.html` — Career home with company intro and job cards
- [ ] D3. `templates/careers/job_detail.html` — Full JD, requirements, Apply Now CTA, JSON-LD block in `<head>`
- [ ] D4. `templates/careers/partials/_apply_form.html` — Form + honeypot + UTM capture + async JS submit handler
- [ ] D5. `templates/careers/partials/_job_card.html` — Reusable card component
- [ ] D6. `templates/careers/job_closed.html` — Branded 410 page with link to other open roles
- [ ] D7. `templates/careers/apply_success.html` — Confirmation page (noindex)
- [ ] D8. Register `Jinja2Templates` in FastAPI; add `nl2br` and `tojson` Jinja2 filters

### Phase E — Frontend Changes (1–2 days)

- [ ] E1. `types/index.ts` — Extend `Requisition`; add `CareerPageSettings`, `PublicApplication`
- [ ] E2. `services/api/careerPageService.ts` — New service file (all career page API calls)
- [ ] E3. `RequisitionDetail.tsx` — Add `PublishJobPanel` component (publish/unpublish/copy URL)
- [ ] E4. `Settings.tsx` — Add "Career Page" tab with slug availability debounce checker
- [ ] E5. `pages/PublicApplications.tsx` — New inbound applications inbox page
- [ ] E6. `App.tsx` — Register `/public-applications` route (admin + recruiter)
- [ ] E7. `Navigation.tsx` — Add "Inbound Applications" nav link with new-count badge

### Phase F — Validation & Go-Live (0.5 days)

- [ ] F1. Validate JSON-LD in Google Rich Results Test for a live job page
- [ ] F2. Confirm HTTP 410 response for an unpublished job URL
- [ ] F3. Confirm HTTP 404 for a completely unknown slug
- [ ] F4. Verify `sitemap.xml` renders valid XML (W3C validator)
- [ ] F5. Mobile responsiveness check (Chrome DevTools, 375 px viewport)
- [ ] F6. Rate limiter test: 4 rapid submissions from same IP; 4th should get 429
- [ ] F7. Honeypot test: submit form with `company_name` field filled; verify `status="rejected_spam"`
- [ ] F8. Submit `https://app.i79engage.com/sitemap.xml` in Google Search Console

---

## 18. Testing Plan

### Backend Unit Tests

| Test | What to verify |
|------|---------------|
| `test_slugify` | Special chars stripped, max length, hyphen normalisation |
| `test_ensure_unique_job_slug` | Counter appended on collision: `-2`, `-3` |
| `test_publish_requires_approved` | 400 returned if `status != "approved"` |
| `test_publish_requires_career_page_enabled` | 400 returned if `company.careerPage.enabled == False` |
| `test_publish_generates_slug` | `jobSlug` set on first publish |
| `test_publish_slug_immutable` | Second publish call does not change `jobSlug` |
| `test_unpublish_preserves_slug` | `jobSlug` intact, `isPublished=False` |
| `test_closed_job_returns_410` | Unpublished job with existing slug → HTTP 410 |
| `test_unknown_slug_returns_404` | Non-existent slug → HTTP 404 |
| `test_career_home_renders` | HTML contains company name, open job titles |
| `test_jsonld_required_fields` | All required Google fields present in output |
| `test_jsonld_employment_type_mapping` | All `employmentType` values map to valid Google enum |
| `test_jsonld_salary_omitted_when_absent` | `baseSalary` absent when no `budgetRange` |
| `test_sitemap_xml_valid` | Valid XML, all published jobs present, unpublished jobs absent |
| `test_sitemap_lastmod_updates` | `lastmod` reflects `requisition.updatedAt` |
| `test_guest_apply_success` | `PublicApplication` created with `status="new"` |
| `test_guest_apply_duplicate` | Same email + same job → 409 |
| `test_guest_apply_closed_job` | Apply to unpublished job → 404 |
| `test_guest_apply_bad_file_type` | `.exe` upload → 422 |
| `test_honeypot_marks_spam` | Filled honeypot → 200 but `status="rejected_spam"` |
| `test_convert_public_application` | Creates `Application`, `PublicApplication.status="converted"` |
| `test_tenant_isolation_public_applications` | Company A cannot GET/POST on Company B's records |

### Frontend Component Tests

| Test | What to verify |
|------|---------------|
| `PublishJobPanel — not published` | Shows "Not Published", button enabled for approved req |
| `PublishJobPanel — unapproved` | Publish button disabled, warning text shown |
| `PublishJobPanel — published` | Shows "Live", public URL, copy + open buttons |
| `PublishJobPanel — unpublish` | Calls `unpublishJob`, reverts to not-published state |
| `CareerPageSettings slug check` | Debounce fires after 500 ms; shows ✅/❌ |
| `PublicApplications table` | Renders inbox rows from API |
| `PublicApplications promote` | Calls `convertApplication`, row updates to "converted" |

### Manual Integration Tests

1. Create company → configure career page → set slug → verify slug availability check
2. Create requisition → get approved → publish → open public URL in incognito → verify full JD visible
3. Paste job URL into Google Rich Results Test → verify `JobPosting` detected
4. Submit guest application → open recruiter inbox → promote to pipeline
5. Unpublish job → verify 410 in browser dev tools
6. Request unknown slug → verify 404
7. Fetch `/sitemap.xml` → W3C XML validate → confirm all published jobs present, unpublished absent
8. Mobile: open job page at 375 px → no horizontal scroll; apply form usable

---

## 19. Open Questions / Decisions Deferred

| # | Question | Default Assumption for MVP |
|---|----------|---------------------------|
| 1 | `addressCountry` in JSON-LD — derive from company field or parse from location string? | Hardcode `"IN"` for MVP; add `Company.country` field in Phase 2 |
| 2 | Should candidates receive an email confirmation after applying? | No for MVP; add in Phase 2 with email service integration |
| 3 | Should recruiters receive a notification when a new inbound application arrives? | No for MVP; add in-app badge + notification in Phase 2 |
| 4 | Should the career home and job list pages be indexable by Google? | Yes — both are indexable |
| 5 | What should the 410 closed job page show — branded content or blank? | Branded: company name + link to other open roles |
| 6 | Pagination on career home when > N jobs? | Show all; add pagination when > 20 jobs (Phase 2) |
| 7 | When a tenant slug is changed, should old slug redirect 301 to new? | Yes — implement redirect when slug-change feature is built (Phase 2) |
| 8 | Multilingual / bilingual career pages? | Out of scope |
| 9 | Azure Blob container for career page CV uploads — share `cvs` container or separate? | Share existing `cvs` container for MVP; consider `public-applications` container for access policy separation in Phase 2 |
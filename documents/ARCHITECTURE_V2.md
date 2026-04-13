# i79Engage Backend Architecture - Technical Reference

> **Production-Ready FastAPI Backend for AI-Powered Recruitment Platform**

**Last Updated**: December 31, 2025  
**Version**: 2.0  
**Status**: Production

This document provides the architectural reference for the i79Engage backend system. For code implementation details, refer to the actual codebase.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Principles](#2-architecture-principles)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Data Architecture](#5-data-architecture)
6. [API Architecture](#6-api-architecture)
7. [Service Layer Architecture](#7-service-layer-architecture)
8. [Security Architecture](#8-security-architecture)
9. [AI Integration Architecture](#9-ai-integration-architecture)
10. [Billing & Subscription Architecture](#10-billing--subscription-architecture)
11. [Deployment Architecture](#11-deployment-architecture)

## 1. System Overview

### 1.1 Purpose

i79Engage is a multi-tenant SaaS platform for AI-powered recruitment and candidate evaluation:
- **CV Analysis**: Automated parsing and scoring of resumes against job requirements using AI
- **Candidate Management**: Streamlined pipeline from application to interview scheduling
- **Automated Interviews**: AI-driven interview scheduling via external platforms
- **Subscription Billing**: Credit-based system for interviews with Stripe integration
- **Multi-Role Access**: Admin, recruiter, and hiring manager roles with appropriate permissions

### 1.2 Core Domain Concepts

| Entity | Scope | Purpose |
|--------|-------|---------|
| **Company** | Tenant | Top-level multi-tenant isolation boundary |
| **User** | Company | Admin, Recruiter, or Hiring Manager with role-based permissions |
| **Job** | Company | Job posting with requirements and candidate tracking |
| **Candidate** | Job | Applicant with CV, analysis results, and interview status |
| **Interview** | Candidate | Scheduled AI interview via external platform |
| **InterviewerProfile** | Company | Customizable AI interviewer configurations |
| **Result** | Candidate | Final evaluation and hiring decision |
| **Subscription** | Company | Billing plan with limits and features |

### 1.3 Key Architectural Constraints

| Constraint | Impact | Solution |
|-----------|---------|---------|
| **AI Processing Limits** | CV analysis and interview scheduling restrictions | Async processing with error handling and retries |
| **Multi-Tenancy** | Data isolation required | Company-scoped queries with MongoDB indexes |
| **External API Dependencies** | Interview platform and payment provider reliability | Fallback mechanisms and webhook handling |
| **Credit-Based Billing** | Usage tracking and limits | Pre-checks and transaction logging |
| **Scalability** | Growing number of candidates/jobs | Efficient indexing and pagination |
| **Data Consistency** | Multi-document operations | MongoDB transactions for atomicity |

---

## 2. Architecture Principles

### 2.1 Design Principles

**1. Multi-Tenant by Default**
- All data operations scoped by `companyId`
- Indexes optimized for tenant queries (`companyId` as first index key)
- No cross-tenant data leakage (enforced at service layer)

**2. Async-First Processing**
- All I/O operations are async (DB queries, external API calls)
- Non-blocking CV analysis and interview scheduling
- Future: RabbitMQ message broker for async job processing

**3. Transactional Consistency**
- MongoDB transactions for multi-collection writes
- Optimistic locking for concurrent batch processing
- Rollback on partial failures

**4. API-First Design**
- RESTful endpoints with OpenAPI documentation
- Standardized response format (`ApiResponse<T>`)
- Pagination for all list endpoints

**5. Security in Depth**
- JWT bearer tokens (access tokens with refresh capability)
- Secure password hashing with bcrypt
- Role-based access control (admin, recruiter, hiring_manager)
- Multi-tenant data isolation via companyId

## 2. Architecture Principles

### 2.1 Design Principles

**1. Multi-Tenant by Default**
- All data operations scoped by `companyId`
- Indexes optimized for tenant queries
- No cross-tenant data leakage (enforced at service layer)

**2. Async-First Processing**
- All I/O operations are async (DB queries, external API calls)
- Non-blocking CV analysis and interview scheduling
- Graceful error handling for external service failures

**3. Transactional Consistency**
- MongoDB transactions for multi-document writes
- Atomic operations for candidate creation and updates
- Rollback on partial failures

**4. API-First Design**
- RESTful endpoints with OpenAPI documentation
- Standardized response format (`ApiResponse<T>`)
- Pagination and filtering for all list endpoints

**5. Security in Depth**
- JWT bearer tokens with bcrypt password hashing
- Role-based access control (admin, recruiter, hiring_manager)
- Tenant isolation enforced at query level
- Input validation with Pydantic schemas

**6. AI Integration Reliability**
- Robust error handling for CV analysis failures
- Webhook processing for interview completions
- Fallback mechanisms for external API outages

**7. Business Logic Isolation**
- Services contain domain logic (no direct DB access in routers)
- Routers handle HTTP concerns only
- Models define data structure and validation

**8. Tenant Timezone Consistency**
- Every company records a required IANA timezone identifier at registration (stored as `company.timeZone`).
- All persisted timestamps remain in UTC; presentation and scheduling logic must convert to/from the company timezone via shared helpers.
- Any user input that captures dates (requisition targets, approvals, interviews, billing) must be validated relative to the tenant timezone to avoid cross-tenant drift.
- FastAPI responses are passed through a centralized datetime localization helper which uses the authenticated company's timezone, guaranteeing that every serialized datetime is tenant-correct without per-endpoint boilerplate.

### 2.2 Architectural Patterns

| Pattern | Application | Location |
|---------|-------------|----------|
| **Repository Pattern** | Data access abstraction | Beanie ODM models |
| **Service Layer** | Business logic encapsulation | `app/services/*.py` |
| **Dependency Injection** | FastAPI dependencies | `app/core/deps.py` |
| **Factory Pattern** | ID generation, default profiles | `core/id.py`, model defaults |
| **Observer Pattern** | Webhook handling | `app/api/routes/webhooks.py` |
| **Strategy Pattern** | CV analysis algorithms | `services/cv_analysis.py` |
| **Transaction Script** | CRUD operations with transactions | Service methods |

---

## 3. Technology Stack

### 3.1 Core Stack

```yaml
Runtime: Python 3.13+
Framework: FastAPI 0.100+ (Async ASGI)
ODM: Beanie 1.21+ (Async MongoDB)
Database: MongoDB 6.0+ (Replica Set for transactions)
Validation: Pydantic V2 (Type-safe schemas)
Authentication: python-jose (JWT) + passlib (bcrypt)
HTTP Client: httpx (Async external calls)
File Processing: PyPDF2, python-docx (CV parsing)
AI Integration: Custom CV analysis service
Payments: Stripe (Subscription billing)
```

### 3.2 Additional Libraries

```yaml
ID Generation: shortuuid (Unique identifiers)
Date Handling: python-dateutil
Email: (Future: transactional emails)
Serialization: orjson (Fast JSON)
Async Utils: asyncio, aiofiles
Message Broker: RabbitMQ (Future: async job processing)
```

### 3.3 Infrastructure Requirements

| Component | Requirement | Reason |
|-----------|-------------|---------|
| **MongoDB** | Replica Set (min 3 nodes) | Transactions for data consistency |
| **Stripe** | API integration | Subscription and payment processing |
| **External AI Platform** | HTTP API + Webhooks | Interview scheduling and results |
| **File Storage** | S3-compatible | CV file storage (future) |
| **Redis** | (Optional) Caching | Performance optimization |

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         External Systems                         │
├─────────────────────────────────────────────────────────────────┤
│  Interview AI Platform  │  Stripe API  │  File Storage (S3)     │
└────────┬─────────────────┴──────┬──────┴────────┬───────────────┘
         │                        │               │
    Webhooks                 Webhooks        File Uploads
         │                        │               │
┌────────┴────────────────────────┴───────────────┴───────────────┐
│                      i79Engage Backend (FastAPI)                 │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌─────────────┐ │
│  │   Auth     │  │   CRUD     │  │ Webhooks │  │  Billing    │ │
│  │  Routes    │  │  Routes    │  │  Routes  │  │  Routes     │ │
│  └─────┬──────┘  └─────┬──────┘  └────┬─────┘  └──────┬──────┘ │
│        │               │              │                │        │
│  ┌─────┴───────────────┴──────────────┴────────────────┴─────┐  │
│  │                    Service Layer                           │  │
│  │  Auth│User│Company│Job│Candidate│Interview│CV│Billing     │  │
│  └─────┬───────────────────────────────────────────────┬─────┘  │
│        │                                               │        │
│  ┌─────┴───────────────────────────────────────────────┴─────┐  │
│  │              Beanie ODM (MongoDB Driver)                  │  │
│  └───────────────────────────────┬───────────────────────────┘  │
└────────────────────────────────────┼──────────────────────────────┘
                                    │
                    ┌───────────────┴──────────────┐
                    │                              │
            ┌───────┴──────┐           ┌──────────┴────────┐
            │   MongoDB    │           │   CV Analysis     │
            │ (Replica Set)│           │   AI Service      │
            └──────────────┘           └───────────────────┘
```

### 4.2 Architecture Overview

**Monolithic Backend Service**
- Port: 8000
- Purpose: REST API, business logic, external integrations
- Database: MongoDB with Beanie ODM
- Async Processing: All I/O operations are non-blocking

### 4.3 Directory Structure

```
Backend/
├── app/
│   ├── main.py                      # FastAPI app, CORS, lifespan
│   ├── config.py                    # Pydantic Settings
│   ├── database.py                  # MongoDB + Beanie initialization
│   ├── core/
│   │   ├── security.py              # JWT + password hashing
│   │   ├── deps.py                  # FastAPI dependencies
│   │   ├── config.py                # Settings
│   │   ├── id.py                    # ID generation
│   │   └── tx.py                    # Transaction utilities
│   ├── models/
│   │   ├── user.py                  # User model
│   │   ├── company.py               # Company model
│   │   ├── job.py                   # Job model
│   │   ├── candidate.py             # Candidate model
│   │   ├── interview.py             # Interview model
│   │   ├── interviewer_profile.py   # Interviewer profile model
│   │   ├── result.py                # Result model
│   │   ├── subscription.py          # Subscription model
│   │   └── transaction.py           # Transaction model
│   ├── schemas/
│   │   ├── auth.py                  # Auth schemas
│   │   ├── candidate.py             # Candidate schemas
│   │   ├── common.py                # Common schemas
│   │   ├── cv_analysis.py           # CV analysis schemas
│   │   ├── interview.py             # Interview schemas
│   │   ├── interviewer.py           # Interviewer schemas
│   │   ├── job.py                   # Job schemas
│   │   └── results.py               # Results schemas
│   ├── services/
│   │   ├── auth_service.py          # Authentication logic
│   │   ├── candidate_service.py     # Candidate operations
│   │   ├── cv_analysis_service.py   # CV analysis
│   │   ├── interview_service.py     # Interview scheduling
│   │   ├── job_service.py           # Job management
│   │   ├── results_service.py       # Results aggregation
│   │   ├── user_service.py          # User operations
│   │   └── billing_service.py       # Billing logic
│   └── api/
│       ├── deps.py                  # API dependencies
│       └── routes/
│           ├── auth.py              # Auth endpoints
│           ├── companies.py         # Company CRUD
│           ├── jobs.py              # Job CRUD
│           ├── candidates.py        # Candidate CRUD
│           ├── cv_analysis.py       # CV analysis endpoints
│           ├── interviews.py        # Interview endpoints
│           ├── results.py           # Results endpoints
│           ├── billing.py           # Billing endpoints
│           ├── dashboard.py         # Dashboard data
│           └── webhooks.py          # Webhook handlers
```

---

## 4. Backend Application Structure

```
Backend/
│
├── app/
│   │
│   ├── main.py                      # FastAPI application entry point
│   │
│   ├── models/                      # Beanie Document models
│   │   ├── company.py               # Company (tenant) model
│   │   ├── user.py                  # User model (admin/recruiter/hiring_manager)
│   │   ├── candidate.py             # Candidate model
│   │   ├── job.py                   # Job posting model
│   │   ├── interview.py             # Interview model
│   │   ├── interviewer_profile.py   # Interviewer profile templates
│   │   ├── result.py                # Interview results
│   │   ├── subscription.py          # Subscription plans
│   │   └── transaction.py           # Billing transactions
│   │
│   ├── schemas/                     # Pydantic request/response schemas
│   │   ├── auth.py                  # Login, register schemas
│   │   ├── candidate.py             # Candidate CRUD schemas
│   │   ├── job.py                   # Job CRUD schemas
│   │   ├── interview.py             # Interview schemas
│   │   ├── interviewer.py           # Interviewer profile schemas
│   │   ├── results.py               # Interview result schemas
│   │   ├── cv_analysis.py           # CV analysis schemas
│   │   └── common.py                # Shared schemas (pagination, responses)
│   │
│   ├── api/                         # API routes and dependencies
│   │   ├── deps.py                  # FastAPI dependencies (auth, DB session)
│   │   └── routes/                  # API route handlers
│   │       ├── auth.py              # Login, register, logout
│   │       ├── companies.py         # Company management
│   │       ├── users.py             # User CRUD
│   │       ├── jobs.py              # Job postings CRUD
│   │       ├── candidates.py        # Candidate CRUD
│   │       ├── interviews.py        # Interview management
│   │       ├── interviewer_profiles.py # Interviewer profiles
│   │       ├── results.py           # Interview results
│   │       ├── cv_analysis.py       # CV parsing and scoring
│   │       ├── billing.py           # Subscriptions, transactions
│   │       └── dashboard.py         # Dashboard analytics
│   │
│   ├── services/                    # Business logic services
│   │   ├── auth_service.py          # Registration, login, JWT
│   │   ├── user_service.py          # User management
│   │   ├── candidate_service.py     # Candidate operations
│   │   ├── job_service.py           # Job operations
│   │   ├── interview_service.py     # Interview scheduling
│   │   ├── billing_service.py       # Subscription & credits
│   │   ├── cv_analysis_service.py   # CV parsing with AI
│   │   ├── cv_extract.py            # CV text extraction
│   │   ├── results_service.py       # Interview results processing
│   │   └── dashboard.py             # Dashboard data aggregation
│   │   ├── export_service.py        # NEW: File generation
│   │   ├── dashboard_service.py     # NEW: Aggregation pipelines
│   │   ├── agent_feedback_service.py # NEW: Feedback CRUD
│   │   └── training_service.py      # NEW: n8n orchestration
│   │
│   │
│   └── core/                        # Core utilities
│       ├── config.py                # Pydantic settings (env vars)
│       ├── db.py                    # MongoDB connection & init
│       ├── security.py              # JWT, password hashing
│       ├── id.py                    # ID generation utilities
│       └── tx.py                    # MongoDB transaction helpers
│
├── tests/                           # Pytest test suite (future)
│   ├── unit/                        # Service layer tests
│   ├── integration/                 # API endpoint tests
│   └── conftest.py                  # Test fixtures
│
├── requirements.txt, .env.example, README.md
```

---

## 5. Data Architecture

### 5.1 Database Collections

| Collection | Purpose | Key Indexes | Relationships |
|-----------|---------|-------------|---------------|
| **companies** | Tenant isolation | `name`, `subscriptionTier` | → users, jobs, candidates |
| **users** | Authentication | `email` (unique), `companyId` | → company |
| **jobs** | Job postings | `companyId + status`, `title` | → company, → candidates |
| **candidates** | Applicants | `companyId + jobId`, `email`, `status` | → company, → job, → interviews |
| **interviews** | AI interviews | `candidate_id + job_id`, `company_id + status` | → candidate, → job, → interviewer_profile |
| **interviewer_profiles** | AI interviewer configs | `companyId`, `name` | → company |
| **results** | Final decisions | `candidate_id + job_id`, `company_id` | → candidate, → job |
| **subscriptions** | Billing plans | `companyId`, `tier` | → company |
| **transactions** | Payment records | `companyId + type`, `createdAt` | → company |

### 5.2 Key Data Relationships

```
Company (1) ──┬─→ (N) Users
              ├─→ (N) Jobs
              ├─→ (N) Candidates
              ├─→ (N) Interviewer Profiles
              ├─→ (1) Subscription
              └─→ (N) Transactions

Job (1) ──→ (N) Candidates

Candidate (1) ──┬─→ (N) Interviews
                └─→ (0..1) Result

Interviewer Profile (1) ──→ (N) Interviews
```

### 5.3 Critical Fields

**Company**
- `subscriptionTier: str` (trial/starter/pro/enterprise)
- `interviewCredits: int` (available credits)
- `trialEndsAt: datetime` (trial expiration)

**Candidate**
- `cvText: str` (extracted plaintext, internal only)
- `cvScore: float` (AI analysis score)
- `status: str` (pipeline status: cv_uploaded → cv_scored → interview_scheduled → completed)

**User**
- `role: str` (admin/recruiter/hiring_manager)
- `assignedJobIds: List[str]` (for recruiters)

### 5.4 Model Examples

**Company Model**
```python
class Company(Document):
    id: str = Field(default_factory=lambda: generate_id("company"), alias="_id")
    name: str
    subscriptionTier: str = "trial"
    interviewCredits: int = 0
    trialEndsAt: datetime | None = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)
    class Settings:
        name = "companies"
        indexes = ["subscriptionTier"]
```

**Candidate Model**
```python
class Candidate(Document):
    id: str = Field(default_factory=lambda: generate_id("cand"), alias="_id")
    companyId: str
    jobId: str
    name: str
    email: EmailStr
    cvText: str | None = Field(default=None, exclude=True)  # Internal only
    cvScore: float | None = None
    status: str = "cv_uploaded"
    interview_status: str | None = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)
    class Settings:
        name = "candidates"
        indexes = ["companyId", "jobId", "status", "email"]
```

### 5.5 MongoDB Transactions

**Operations Requiring Transactions:**

| Operation | Collections Modified | Reason |
|-----------|---------------------|---------|
| `AuthService.register()` | Company, User | Atomic company + user creation |
| `CandidateService.create()` | Candidate, Job (counters) | Update candidate counts |
| `InterviewService.schedule()` | Interview, Candidate | Status consistency |

**Transaction Utility**: `app/core/tx.py` provides `mongo_transaction()` async context manager.

---

## 6. API Architecture

### 6.1 API Design Principles

**1. Consistent Response Format**
```typescript
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
  statusCode: number;
  message?: string;
}
```

**2. Pagination for Lists**
```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

**3. Error Handling**
- 400: Validation errors (Pydantic)
- 401: Authentication required
- 403: Insufficient permissions
- 404: Resource not found
- 409: Conflict (duplicate email, etc.)
- 422: Request validation failed
- 500: Internal server error

### 6.2 API Route Groups

**Endpoint Prefix**: `/api`

| Route Group | Prefix | Endpoints | Auth | Purpose |
|-------------|--------|-----------|------|---------|
| **Authentication** | `/auth` | 4 | Public/JWT | Login, register, logout, me |
| **Companies** | `/companies` | 3 | JWT | Get current, update |
| **Users** | `/users` | 4 | JWT | CRUD users in company |
| **Jobs** | `/jobs` | 6 | JWT | CRUD jobs, list by company |
| **Candidates** | `/candidates` | 8 | JWT | CRUD candidates, upload CV, analyze |
| **CV Analysis** | `/cv-analysis` | 2 | JWT | Analyze CV, get results |
| **Interviews** | `/interviews` | 5 | JWT | CRUD interviews, schedule |
| **Interviewer Profiles** | `/interviewer-profiles` | 6 | JWT | CRUD profiles |
| **Results** | `/results` | 4 | JWT | CRUD results, final decisions |
| **Billing** | `/billing` | 6 | JWT | Subscriptions, transactions, credits |
| **Dashboard** | `/dashboard` | 2 | JWT | Company stats, analytics |
| **Webhooks** | `/webhooks` | 2 | Webhook secret | Interview completions |

**Total Endpoints**: 40+

### 6.3 Authentication Mechanisms

| Mechanism | Usage | Header | Validation |
|-----------|-------|--------|------------|
| **JWT Bearer** | User API calls | `Authorization: Bearer <token>` | `get_current_user()` dependency |
| **Webhook Secret** | External webhooks | `X-Webhook-Secret: <secret>` | Environment variable match |

### 6.4 Role-Based Access Control

| Role | Access Level | Restrictions |
|------|-------------|--------------|
| **Admin** | Full access | Manage company, all users/jobs/candidates |
| **Recruiter** | Limited access | Access assigned jobs and their candidates |
| **Hiring Manager** | Limited access | View candidates, make final decisions |

**Implementation**: `get_current_user()` dependency checks `companyId` for tenant isolation.

**Example Tenant Isolation Pattern**:
```python
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    # Validate JWT and extract user
    user = await User.find_one(User.id == user_id)
    return user

# In route handlers
async def get_jobs(current_user: User = Depends(get_current_user)):
    # All queries automatically scoped by companyId
    jobs = await Job.find(Job.companyId == current_user.companyId).to_list()
    return jobs
```

---

## 7. Service Layer Architecture

### 7.1 Service Layer Principles

**Single Responsibility**
- Each service handles one domain entity (User, Client, Agent, etc.)
- Cross-entity operations coordinated at router level

**Transaction Management**
- Services use `@atomic()` decorator for multi-collection writes
- Automatic rollback on exception

**No Direct HTTP**
- Services don't access `Request` or `Response` objects
- Return domain models or raise exceptions

**External Integration Isolation**
- External API calls abstracted into dedicated services (Stripe, Voice Provider, n8n)

### 7.2 Core Services

| Service | Responsibilities | Key Methods | External Deps |
|---------|------------------|-------------|---------------|
| **auth_service** | Registration, login, JWT | `register()`, `login()`, `get_current_user()` | MongoDB |
| **user_service** | User CRUD | `create()`, `update()`, `delete()`, `list_by_company()` | MongoDB |
| **company_service** | Company management | `get_current()`, `update()` | MongoDB |
| **job_service** | Job CRUD | `create()`, `update()`, `list_by_company()` | MongoDB |
| **candidate_service** | Candidate operations | `create()`, `upload_cv()`, `update_status()` | MongoDB |
| **cv_analysis_service** | CV processing | `analyze_cv()` | MongoDB, AI Service |
| **interview_service** | Interview scheduling | `schedule_external_interview()` | MongoDB, Interview API |
| **interviewer_profile_service** | Profile management | `create()`, `list_by_company()` | MongoDB |
| **results_service** | Final decisions | `create()`, `update_decision()` | MongoDB |
| **billing_service** | Subscription management | `get_subscription()`, `deduct_credits()` | MongoDB, Stripe |
| **dashboard_service** | Analytics | `get_stats()` | MongoDB |

### 7.3 Service Interaction Patterns

**Pattern 1: Simple CRUD**
```
Router → Service → Model.find()/save() → MongoDB
```

**Pattern 2: Transaction (Multi-Collection)**
```
Router → Service (with @atomic) → Model1.save() + Model2.save() → MongoDB (transaction)
```

**Pattern 3: External Integration**
```
Router → Service → External Service → HTTP Client → External API
                   ↓
              MongoDB (audit log)
```

**Pattern 4: Event Publishing**
```
Router → Service → Model.save() → WebhookService.deliver() → External webhook URL
                                 → RabbitMQPublisher.publish() → Queue
```

---

## 8. Security Architecture

### 8.1 Authentication Flow

**Registration**
1. User submits email + password + organization details
2. Backend hashes password (bcrypt)
3. Create Organization + Admin User (transaction)
4. Generate JWT access (1 hour) + refresh token (7 days)
5. Return tokens + user data

**Login**
1. User submits email + password
2. Backend finds user, verifies password hash
3. Generate JWT access + refresh tokens
4. Update `last_login_at`
5. Return tokens + user data

**Token Refresh**
1. Client sends refresh token
2. Backend validates token, checks expiry
3. Generate new access + refresh tokens
4. Return new tokens

**JWT Payload**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "companyId": "company_abc123",
  "role": "admin",
  "exp": 1234567890,
  "type": "access"
}
```

### 8.2 Authorization Model

**Dependency Injection**
- `get_current_user()`: Validates JWT, returns `CurrentUser` object
- `require_admin()`: Raises 403 if user.role != "admin"

**Data Access Control**
- All queries filtered by `companyId` from JWT
- Recruiters and hiring managers have access to assigned jobs only (via `assignedJobIds`)
- Admins have full access to all company data

**Role Hierarchy:**
```python
scopes = ["calls:read", "calls:write", "batches:read", "batches:write", "webhooks:manage", "admin"]
```
- `admin` scope grants full access
- Other scopes checked per endpoint

### 8.3 Data Protection

**Password Storage**
- bcrypt hashing (auto-salted)
- Never log or expose passwords

**API Key Storage**
- SHA-256 hash stored in database
- Full key returned ONCE at creation (cannot retrieve later)

**JWT Secret**
- 256-bit random secret in environment variable
- Rotated periodically (invalidates all tokens)

**Webhook Secrets**
- HMAC-SHA256 signature for payload verification
- Per-webhook secret generation

**External Call IDs**
- Voice provider IDs stored for reconciliation only
- **NEVER exposed in API responses or frontend payloads**

### 8.4 Input Validation

**Pydantic V2 Schemas**
- All request bodies validated against Pydantic models
- Type coercion, range checks, regex patterns
- Custom validators for business rules

**Timezone Validation**
- IANA timezone strings validated using Python's `zoneinfo`
- Invalid timezones rejected at registration

**SQL Injection Protection**
- MongoDB ODM (Beanie) uses BSON encoding
- No raw query strings

**XSS Protection**
- API returns JSON only (no HTML rendering)
- Frontend sanitizes user input

---

## 9. AI Integration Architecture

### 9.1 CV Analysis Integration

**CV Processing Flow**
1. Candidate uploads CV file → Backend extracts text using PyPDF2/docx
2. Async call to `analyze_cv_against_job()` function
3. AI analyzes CV text against job description and requirements
4. Returns structured analysis: score, strengths, red flags, justification
5. Update candidate with results, set status to `cv_scored`

**Analysis Algorithm Pattern**
```python
async def analyze_cv_against_job(cv_text: str, job_desc: str, requirements: List[str]) -> dict:
    # AI processing logic here
    # Returns match score, justification, strengths, red flags
    pass
```

**Error Handling**
- CV processing failures logged but don't block candidate creation
- Retry mechanism for transient AI service errors
- Fallback to manual review if AI unavailable

### 9.2 Interview Scheduling Integration

**External Interview Platform Flow**
1. Candidate reaches interview stage → User authorizes interview
2. Backend calls `schedule_external_interview()` 
3. POST to external AI interview platform API with:
   - Candidate details (name, email)
   - Job information
   - Interviewer profile (objectives, data points)
   - Webhook URL for completion
4. Platform returns interview URL and expiry
5. Store interview record, update candidate status

**Webhook Completion Handling**
1. Interview platform sends webhook to `/api/webhooks/interview-complete`
2. Backend validates webhook secret
3. Update interview status to `completed`
4. Fetch results from platform API
5. Deduct interview credits from company
6. Update candidate with interview results

**Credit Validation**
```python
# Before scheduling
if not company.has_interview_credits:
    raise HTTPException(402, "Insufficient interview credits")
```

### 9.3 AI Service Reliability

**Async Processing**
- CV analysis runs in background to avoid blocking UI
- Interview scheduling is immediate but results come via webhook
- Status polling available for real-time updates

**Fallback Mechanisms**
- If AI analysis fails, allow manual scoring
- If interview platform unavailable, queue for retry
- Graceful degradation maintains core functionality

### 9.4 RabbitMQ Message Broker (Future Implementation)

**Planned Use Cases**:
- Async CV analysis queue (decouple upload from processing)
- Batch candidate imports (process large CSV files)
- Email notification queue (transactional emails)
- Interview scheduling queue (retry failed requests)

**Architecture Pattern**:
```
API Endpoint → Publish Message → RabbitMQ Queue → Worker Process → Update DB
```

**Benefits**:
- Improved API response times (async processing)
- Retry mechanism for failed operations
- Horizontal scaling of worker processes
- Better resource utilization

---

## 10. Billing & Subscription Architecture

### 10.1 Subscription Model

**Company Subscription**
```python
class Company(Document):
    subscriptionTier: str = "trial"  # trial | starter | pro | enterprise
    subscriptionStatus: str = "trial"  # active | trial | expired | cancelled
    interviewCredits: int = 0  # Available credits
    creditsPerInterview: int = 15  # Cost per interview
    trialEndsAt: datetime | None = None
```

**Tier Limits**
| Tier | Jobs | Candidates | Credits/Month | Price |
|------|------|------------|---------------|-------|
| Trial | 3 | 50 | 5 | $0 |
| Starter | 10 | 500 | 50 | $99 |
| Pro | 50 | 2000 | 200 | $299 |
| Enterprise | Unlimited | Unlimited | Unlimited | Custom |

### 10.2 Credit System

**Credit Deduction**
```python
# On interview completion
async def deduct_interview_credit(company_id: str):
    company = await Company.find_one(Company.id == company_id)
    if company.interviewCredits > 0:
        company.interviewCredits -= 1
        await company.save()
    else:
        # Handle insufficient credits
        pass
```

**Credit Validation**
- Pre-check before interview scheduling
- Real-time credit updates
- Notifications when credits low

### 10.3 Stripe Integration

**Subscription Management**
- Create/update/cancel subscriptions via Stripe API
- Webhook handling for payment events
- Prorated billing for plan changes

**Payment Flow**
1. User selects plan → Create Stripe Checkout Session
2. Redirect to Stripe → Payment completion
3. Stripe webhook → Update company subscription
4. Grant credits based on plan

---

## 11. Deployment Architecture

### 11.1 Infrastructure Requirements

| Component | Requirement | Purpose |
|-----------|-------------|---------|
| **MongoDB** | Atlas or self-hosted replica set | Data persistence with transactions |
| **Backend** | Docker container | FastAPI application |
| **Frontend** | Static hosting (Vercel/Netlify) | React SPA |
| **File Storage** | S3-compatible | CV file storage |
| **External AI** | API access | CV analysis and interviews |

### 11.2 Environment Configuration

**Required Environment Variables**
```bash
# Database
MONGODB_URL=mongodb://localhost:27017/i79engage
MONGODB_DB_NAME=i79engage

# Security
JWT_SECRET_KEY=<256-bit-secret>
WEBHOOK_SECRET=<webhook-secret>

# External Services
STRIPE_SECRET_KEY=<stripe-key>
INTERVIEW_API_URL=<interview-platform-url>
INTERVIEW_API_KEY=<api-key>

# AI Service
CV_ANALYSIS_API_URL=<cv-analysis-url>
```

### 11.3 Docker Deployment

**Backend Dockerfile**
```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Docker Compose (Development)**
```yaml
version: '3.8'
services:
  backend:
    build: ./Backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongodb:27017
    depends_on:
      - mongodb

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
```

### 11.4 Production Considerations

**Scalability**
- Horizontal scaling of backend instances
- MongoDB read replicas for analytics
- CDN for static assets

**Security**
- HTTPS everywhere
- API rate limiting
- Regular security audits

**Monitoring**
- Health check endpoints
- Error logging and alerting
- Performance monitoring

---
1. Admin clicks "Train Agent" in Mentorship Hub
2. Backend creates `TrainingCycle` (status: pending)
3. Backend fetches last N unused feedbacks + call transcripts
4. POST to n8n webhook URL with:
   ```json
   {
     "training_cycle_id": "cycle_123",
     "agent_id": "agent_456",
     "feedbacks": [{
       "call_id": "...",
       "transcript": "...",
       "what_went_well": "...",
       "what_went_wrong": "..."
     }],
     "agent_config": { "personality": {...} }
   }
   ```
5. Update TrainingCycle (status: processing)

**Complete Training (n8n → Backend)**
1. n8n analyzes feedbacks, generates aggregated feedback loop
2. POST to `/api/v1/training/webhook/complete` with:
   ```json
   {
     "training_cycle_id": "cycle_123",
     "human_feedback_loop": "<XML structure>",
     "summary": {
       "positive_patterns": [...],
       "improvement_areas": [...],
       "critical_issues": [...]
     }
   }
   ```
3. Backend validates webhook secret
4. Create `AgentTrainingSnapshot` with results
5. Update TrainingCycle (status: completed, snapshot_id)
6. Mark feedbacks as `used_in_training = true`

### 9.5 RabbitMQ Delayed Retry Pattern

**Queue Architecture**
```
Call Rejected
     ↓
Delay Queue (TTL: 30s → 60s → 180s → 600s → 1800s)
     ↓ (TTL expires)
Retry Queue (Dead Letter Exchange target)
     ↓ (Consumer reads)
POST /consumer/calls/retry
     ↓
Voice Provider API (retry)
     ↓ (accepted/rejected)
Continue or Re-queue
```

**Exponential Backoff**
- Attempt 1: 30 seconds
- Attempt 2: 60 seconds (1 minute)
- Attempt 3: 180 seconds (3 minutes)
- Attempt 4: 600 seconds (10 minutes)
- Attempt 5: 1800 seconds (30 minutes)
- After 5 attempts: Call status = `failed`

**Consumer Service**
- Separate Python process reading from retry queue
- Calls internal `/consumer/calls/retry` endpoint (authenticated with consumer secret)
- Backend retries call with voice provider

---

## 10. Real-Time Architecture

### 10.1 WebSocket Connection Management

**Connection Flow**
1. Client authenticates (gets JWT)
2. Client connects to `ws://backend/api/v1/ws/connect?token=<jwt>`
3. Backend validates JWT, extracts `companyId`
4. Backend stores connection in `manager.active_connections[company_id]`
5. Backend sends `{"type": "connected"}` confirmation

**Message Broadcasting**
```python
# When interview status changes
await websocket_service.broadcast_to_company(
    company_id,
    {
        "type": "interview_update",
        "data": {
            "interview_id": "...",
            "status": "completed",
            "duration": "45:23"
        }
    }
)
```

**Message Types**
- `interview_update`: Interview status change (scheduled → in-progress → completed)
- `candidate_status_update`: Candidate pipeline stage change (applied → screening → interview → offer)
- `job_progress_update`: Job progress updates (candidates count, interviews scheduled)

**Ping/Pong Keep-Alive**
- Client sends `"ping"` every 30 seconds
- Server responds with `{"type": "pong"}`
- Connection closed if no ping received for 60 seconds

**Multi-Tenant Isolation**
- Connections grouped by `companyId`
- Broadcasts only to connections in same company

### 10.2 Polling (Frontend Fallback)

**Interview Status Polling** (if WebSocket unavailable):
- Frontend polls `/api/v1/interviews/status` every 10 seconds
- Only on relevant pages (dashboard, interview scheduling)
- Paused when user navigates away or WebSocket connects

**Dashboard Auto-Refresh:**
- Frontend polls `/api/v1/dashboard/stats` every 30 seconds
- Disabled when WebSocket available (future enhancement)

---

## 11. Task Scheduling Architecture

### 11.1 Core Platform Service

**Purpose**: Business-agnostic temporal orchestration for scheduled task execution.

**Architecture**
```
Backend Service
     ↓ (schedules task)
POST /api/v1/scheduler/tasks
     ↓
Core Service (stores in scheduled_tasks collection)
     ↓ (n8n dispatcher checks every 60s)
GET /api/v1/dispatcher/fetch?limit=100
     ↓ (n8n executes tasks)
POST to task.webhook_url
     ↓ (mark complete)
POST /api/v1/dispatcher/complete
```

**Task Model**
```python
{
  "tenant_id": "org_123",          # Multi-tenant isolation
  "task_type": "send_reminder",    # Business-specific type
  "scheduled_for": datetime,       # When to execute
  "webhook_url": "http://...",     # Backend endpoint to call
  "webhook_payload": {...},        # Data to send
  "status": "pending",             # pending | processing | completed | failed
  "retry_count": 0,                # Auto-retry on failure
  "max_retries": 3
}
```

**Timezone Handling**
1. Backend stores `scheduled_for` in UTC
2. Backend sends `organization.timezone` in webhook payload
3. Core Service converts UTC → Organization timezone for display
4. Core Service triggers at UTC time (agnostic to business timezone)

**Use Cases**
- Send reminder emails before scheduled calls
- Generate monthly reports
- Clean up expired data
- Scheduled batch deployments

---

## 12. Interview Results Processing

### 12.1 Interview Workflow

**Goal**: Integrate with external interview platform to schedule, conduct, and process candidate interviews.

**Interview Lifecycle:**

1. **Authorization** (Admin/Recruiter Action)
   - User selects candidate and interviewer profile
   - Backend creates Interview document (status: `pending`)
   - Returns interview URL for external platform

2. **External Interview Conduction**
   - Candidate completes interview on external platform
   - Platform evaluates responses and generates results
   - Platform sends webhook callback to i79Engage

3. **Results Processing**
   - Webhook endpoint `/api/v1/interviews/webhook` receives results
   - Backend creates/updates Result document
   - Interview status updated: `pending` → `completed`
   - Candidate's interview score stored

4. **Result Storage**
   - Interview transcript (if available)
   - Evaluation scores per question
   - Overall assessment
   - Hiring recommendation

### 12.2 Result Schema

**Result Model:**
```python
class Result(Document):
    id: PydanticObjectId
    interview_id: str
    candidate_id: str
    job_id: str
    company_id: str
    
    overall_score: float  # 0-100
    transcript: Optional[str]
    evaluation: Dict[str, Any]  # Question-by-question scores
    recommendation: str  # "hire", "maybe", "reject"
    
    created_at: datetime
    
    class Settings:
        name = "results"
        indexes = ["interview_id", "candidate_id", "company_id"]
```

### 12.3 Webhook Security

**Authentication:**
- Webhook endpoint validates signature or shared secret
- Only authorized interview platform can send results

**Data Validation:**
- Pydantic schemas validate incoming webhook payload
- Reject malformed or invalid data
- Log all webhook attempts for audit

---

## 13. Deployment Architecture

### 13.1 Infrastructure Requirements

| Component | Requirement | Purpose |
|-----------|-------------|---------||
| **MongoDB** | Atlas or self-hosted replica set | Data persistence with transactions |
| **Backend** | Docker container | FastAPI application |
| **Frontend** | Static hosting (Vercel/Netlify) | React SPA |
| **File Storage** | S3-compatible | CV file storage |
| **External AI** | API access | CV analysis and interviews |
| **RabbitMQ** | Message broker (future) | Async job processing |

### 11.2 Environment Configuration

**External Services**
- Voice Provider: Cloud API (vendor-managed)
- Stripe: Cloud API (vendor-managed)
- Resend: Cloud API (vendor-managed)
- n8n: Self-hosted or cloud

**Reverse Proxy**
- Nginx / Traefik for SSL termination and load balancing

### 13.2 Environment Configuration

**Required Environment Variables** (Backend):
```bash
# MongoDB
MONGODB_URL=mongodb+srv://...
MONGODB_DB_NAME=i79engage_production

# Security
SECRET_KEY=<256-bit-random>
CONSUMER_API_SECRET=<shared-with-consumer>

# RabbitMQ
RABBITMQ_URL=amqp://...

# Voice Provider
VOICE_PROVIDER_BASE_URL=https://...
VOICE_PROVIDER_API_KEY=<secret>
VOICE_PROVIDER_WEBHOOK_SECRET=<secret>

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...

# n8n
N8N_WEBHOOK_URL=https://n8n.../webhook/train-agent
N8N_WEBHOOK_SECRET=<secret>

# Core Service
CORE_SERVICE_URL=http://core:8001
CORE_SERVICE_SECRET_KEY=<secret>
```

### 13.3 Scaling Strategy

**Horizontal Scaling**
- Backend: Add more FastAPI instances (stateless)
- Core Service: Scale independently based on task volume
- Consumer: Scale based on retry queue depth

**Vertical Scaling**
- MongoDB: Increase node resources for large datasets
- RabbitMQ: Increase memory for high queue volumes

**Database Optimization**
- Indexes on all query paths (`companyId`, `status`, etc.)
- MongoDB aggregation pipelines for analytics
- Connection pooling (Motor driver)

**Caching Strategy** (Future)
- Redis for session storage
- Cache company data (rarely changes)
- Cache active interviewer profiles list

### 13.4 Monitoring & Observability

**Health Checks**
- `/api/v1/health` - Comprehensive system health
- `/api/v1/health/mongodb` - Database connectivity
- `/api/v1/health/rabbitmq` - Queue connectivity
- `/api/v1/health/ping` - Basic liveness probe

**Metrics to Track**
- API response times (p50, p95, p99)
- Call success rate (completed vs failed)
- Retry queue depth
- WebSocket connections count
- Database query performance
- Transaction rollback rate

**Logging**
- Structured JSON logs
- Correlation IDs for request tracing
- Log levels: DEBUG (dev), INFO (staging), WARNING (prod)

**Alerting**
- MongoDB replica set failover
- RabbitMQ queue depth > threshold
- Call failure rate > 10%
- External API errors (Voice, Stripe, Resend)
- Training cycle failures

---

## Summary

### System Capabilities

| Capability | Implementation | Status |
|-----------|----------------|--------|
| **Multi-Tenancy** | Company-scoped data with companyId isolation | ✅ Production |
| **Authentication** | JWT with role-based access control | ✅ Production |
| **Job Management** | Full CRUD with assignment tracking | ✅ Production |
| **Candidate Management** | CV upload, parsing, scoring, status tracking | ✅ Production |
| **Interview Scheduling** | External platform integration with webhooks | ✅ Production |
| **CV Analysis** | AI-powered CV parsing and scoring | ✅ Production |
| **Subscriptions** | Stripe integration with credit tracking | ✅ Production |
| **Dashboard Analytics** | Aggregated statistics and metrics | ✅ Production |
| **User Management** | Role-based permissions (admin/recruiter/hiring_manager) | ✅ Production |

### Technology Decisions

| Decision | Rationale |
|----------|-----------|
| **FastAPI** | High performance, async/await, automatic OpenAPI docs |
| **MongoDB + Beanie** | Flexible schema, async ODM, transaction support |
| **Pydantic V2** | Type-safe validation, schema generation, Python 3.13 compatible |
| **JWT Authentication** | Stateless auth with refresh token capability |
| **Stripe** | Industry-standard payment and subscription management |
| **AI Integration** | External CV analysis service for candidate screening |
| **RabbitMQ (Future)** | Planned for async interview processing and notifications |

### Key Architectural Achievements

1. **40+ API Endpoints**: Comprehensive REST API for recruitment workflows
2. **9 Database Collections**: Normalized data model with proper tenant isolation
3. **20+ Services**: Clean business logic separation
4. **Transaction Safety**: ACID guarantees for critical operations
5. **Multi-Tenant Isolation**: No data leakage between organizations
6. **Fault-Tolerant Calls**: Automatic retry with exponential backoff
7. **Human-in-the-Loop**: Continuous agent improvement through feedback
8. **Optimized Analytics**: Single dashboard call replaces 4+ requests
9. **Timezone-Aware**: Global deployment with local time handling
10. **Observable**: Comprehensive health checks and metrics

---

**Document Version**: 2.0  
**Last Updated**: December 31, 2025  
**Maintained By**: Magic-Hire / i79Engage Development Team

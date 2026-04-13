# Candidate Search Service — Architecture & Implementation Design

**Version:** 1.0
**Date:** 30 March 2026
**Status:** Ready for Implementation
**Audience:** Developer Agent

---

## 1. Overview

The Candidate Search Service is a **standalone, independent Python microservice** that provides people search and enrichment capabilities to internal applications (e.g. i79Engage). It abstracts all third-party data provider integrations (starting with RocketReach) behind a single, provider-agnostic API.

**Core behaviour:**
- Accepts a search or enrich request and responds **immediately with 202 Accepted** + a `request_id`
- Processes the search in the **background** via RabbitMQ consumers
- Stores all results in its **own isolated MongoDB database**
- Exposes a **polling API** for consumers to check status and retrieve results using the `request_id`
- Is **designed for multiple providers** — adding a new provider requires zero changes to the API, queue, or data layer

**This service does NOT:**
- Share a database with any other application
- Expose provider identities, credentials, or account information to consumers
- Store raw provider payloads in its database
- Expose a provider listing/health endpoint to consumers

---

## 2. Technology Stack

| Component | Technology | Reason |
|---|---|---|
| API Framework | FastAPI (Python 3.12) | Async-native, Pydantic v2, production-proven |
| ODM | Beanie + Motor | Async MongoDB ODM, consistent with platform |
| Database | MongoDB (own DB: `candidate_search_service`) | Document model fits variable people profiles |
| Message Queue | RabbitMQ via `aio-pika` | Already in infrastructure; durable, async-native |
| HTTP Client | `httpx` (AsyncClient) | Async, connection pooling, timeout control |
| Validation | Pydantic v2 | Schema enforcement on all inputs and outputs |
| Auth | HMAC API Keys (SHA-256 hashed at rest) | Service-to-service, not user JWTs |
| Rate Limiting | MongoDB sliding window counter | No new infrastructure required |
| Containerisation | Docker + docker-compose | Consistent with platform |

---

## 3. Project Structure

```
candidate-search-service/
├── app/
│   ├── main.py                        # FastAPI app factory + lifespan
│   │
│   ├── api/
│   │   ├── dependencies.py            # Auth, rate limit, caller resolution, scope check
│   │   └── routes/
│   │       ├── search.py              # POST /v1/search, GET /v1/search/{id}
│   │       └── enrich.py              # POST /v1/enrich, GET /v1/enrich/{id}
│   │
│   ├── core/
│   │   ├── config.py                  # Settings from env vars (Pydantic BaseSettings)
│   │   ├── database.py                # MongoDB connection init (Motor + Beanie)
│   │   ├── rabbitmq.py                # Connection, topology declaration
│   │   ├── security.py                # API key hashing and verification
│   │   └── logging.py                 # Loguru config, scrubbing filter, stdlib interception
│   │
│   ├── models/                        # Beanie MongoDB documents
│   │   ├── search_request.py
│   │   ├── enrich_request.py
│   │   ├── person_profile.py          # Normalised, provider-agnostic — NO raw_data
│   │   ├── service_client.py          # Registered consumers + hashed API keys + scopes
│   │   ├── rate_limit_counter.py      # Sliding window counters
│   │   └── provider_call_log.py       # Append-only audit log
│   │
│   ├── schemas/                       # Pydantic v2 API schemas (request/response only)
│   │   ├── search.py
│   │   ├── enrich.py
│   │   └── person.py
│   │
│   ├── providers/
│   │   ├── base.py                    # BaseSearchProvider ABC
│   │   ├── registry.py                # ProviderRegistry (internal only)
│   │   └── implementations/
│   │       └── rocketreach/
│   │           ├── __init__.py
│   │           ├── provider.py        # Implements BaseSearchProvider
│   │           ├── client.py          # httpx wrapper — Loguru logger, stdlib transports suppressed
│   │           ├── mapper.py          # RR response → PersonProfile (NO raw_data)
│   │           └── schemas.py         # RR-specific internal Pydantic models
│   │
│   ├── services/
│   │   ├── search_service.py          # Orchestrates search flow + caller isolation
│   │   ├── enrich_service.py          # Orchestrates enrich flow + caller isolation
│   │   ├── rate_limit_service.py      # Per-caller sliding window enforcement
│   │   └── audit_service.py           # Writes to provider_call_log
│   │
│   └── workers/
│       ├── consumer_manager.py        # Starts/stops aio-pika consumers
│       ├── search_worker.py           # Processes search_queue messages
│       └── enrich_worker.py           # Processes enrich_queue messages
│
├── tests/
│   ├── unit/
│   │   ├── test_rocketreach_mapper.py
│   │   ├── test_security.py
│   │   └── test_rate_limiter.py
│   └── integration/
│       ├── test_search_api.py
│       └── test_enrich_api.py
│
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```

---

## 4. Data Models

### 4.1 `service_client` — Consumer Registry

```python
# models/service_client.py
from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import List, Optional
from enum import Enum


class ClientScope(str, Enum):
    SEARCH = "search"
    ENRICH = "enrich"
    READ   = "read"


class ServiceClient(Document):
    caller_id: str               # human-readable: "i79engage-backend"
    api_key_hash: str            # SHA-256 hash of raw key — NEVER store raw
    api_key_prefix: str          # First 12 chars of raw key for identification only
    scopes: List[ClientScope]    # What this caller is permitted to do
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used_at: Optional[datetime] = None
    description: Optional[str] = None

    class Settings:
        name = "service_clients"
        indexes = ["caller_id", "api_key_prefix"]
```

> **Security Rule:** The raw API key is generated once and shown to the operator at registration time only. It is **never stored**. Only the SHA-256 hash is persisted. On every inbound request, the incoming key is hashed and compared using `secrets.compare_digest`.

---

### 4.2 `search_request` — Job State Document

```python
# models/search_request.py
from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import Optional, List
from enum import Enum


class SearchRequestStatus(str, Enum):
    PENDING    = "pending"
    PROCESSING = "processing"
    COMPLETED  = "completed"
    PARTIAL    = "partial"      # rate-limited mid-search, partial results stored
    FAILED     = "failed"


class SearchRequest(Document):
    request_id: str                              # UUID4, URL-safe prefix "srch_"
    caller_id: str                               # from authenticated service client
    provider_id: str                             # which provider will process this
    query: dict                                  # validated, sanitised query fields only
    status: SearchRequestStatus = SearchRequestStatus.PENDING

    page: int = 1
    page_size: int = 25
    total_results: Optional[int] = None
    enrich_results: bool = False

    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int = 0

    result_ids: List[PydanticObjectId] = []
    result_count: int = 0

    class Settings:
        name = "search_requests"
        indexes = [
            "request_id",
            "caller_id",
            ["caller_id", "status"],
            {"fields": [("submitted_at", -1)]},
            # TTL index: auto-delete after 30 days
            {"fields": [("submitted_at", 1)], "expireAfterSeconds": 2592000},
        ]
```

---

### 4.3 `enrich_request` — Enrichment Job State

```python
# models/enrich_request.py
from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import Optional
from enum import Enum


class EnrichRequestStatus(str, Enum):
    PENDING    = "pending"
    PROCESSING = "processing"
    COMPLETED  = "completed"
    NOT_FOUND  = "not_found"
    FAILED     = "failed"


class EnrichRequest(Document):
    request_id: str              # UUID4, URL-safe prefix "enr_"
    caller_id: str
    provider_id: str
    identifiers: dict            # linkedin_url, email, name+employer — validated
    status: EnrichRequestStatus = EnrichRequestStatus.PENDING

    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int = 0

    result_id: Optional[PydanticObjectId] = None   # FK → person_profiles

    class Settings:
        name = "enrich_requests"
        indexes = [
            "request_id",
            "caller_id",
            ["caller_id", "status"],
            {"fields": [("submitted_at", 1)], "expireAfterSeconds": 2592000},
        ]
```

---

### 4.4 `person_profile` — Normalised, Provider-Agnostic Contact Data

> **Critical:** There is NO `raw_data` field. The raw provider API response is used only during normalisation inside the worker and is then discarded. Only structured, normalised fields are persisted to MongoDB.

```python
# models/person_profile.py
from beanie import Document
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class EmailEntry(BaseModel):
    email: str
    type: Optional[str] = None        # "work" | "personal"
    status: Optional[str] = None      # "verified" | "likely" | "unknown"
    is_primary: bool = False


class PhoneEntry(BaseModel):
    number: str
    type: Optional[str] = None        # "direct" | "mobile" | "hq"


class WorkExperience(BaseModel):
    company: str
    title: Optional[str] = None
    is_current: bool = False
    start_year: Optional[int] = None
    end_year: Optional[int] = None


class EducationEntry(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_year: Optional[int] = None


class PersonProfile(Document):
    # Source trace
    provider_id: str
    provider_person_id: str
    search_request_id: Optional[str] = None
    enrich_request_id: Optional[str] = None
    caller_id: str

    # Identity
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None

    # Contact
    emails: List[EmailEntry] = []
    phones: List[PhoneEntry] = []
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None

    # Current position (denormalised for fast lookup)
    current_title: Optional[str] = None
    current_company: Optional[str] = None
    current_company_domain: Optional[str] = None

    # Career history
    experience: List[WorkExperience] = []
    education: List[EducationEntry] = []
    skills: List[str] = []

    # Location
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    location_string: Optional[str] = None

    # Quality signal
    confidence_score: Optional[float] = None    # 0.0–1.0, normalised by mapper
    profile_picture_url: Optional[str] = None

    # NO raw_data field — provider payload discarded after normalisation

    fetched_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "person_profiles"
        indexes = [
            "provider_person_id",
            "search_request_id",
            "enrich_request_id",
            "caller_id",
            "linkedin_url",
            ["current_company", "current_title"],
        ]
```

---

### 4.5 `rate_limit_counter` — Sliding Window

```python
# models/rate_limit_counter.py
from beanie import Document
from pydantic import Field
from datetime import datetime


class RateLimitCounter(Document):
    caller_id: str
    operation: str       # "search" | "enrich"
    window_start: datetime
    count: int = 0

    class Settings:
        name = "rate_limit_counters"
        indexes = [
            ["caller_id", "operation", "window_start"],
            # TTL: auto-expire counters after 2 hours
            {"fields": [("window_start", 1)], "expireAfterSeconds": 7200},
        ]
```

---

### 4.6 `provider_call_log` — Immutable Audit Log

```python
# models/provider_call_log.py
from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import Optional


class ProviderCallLog(Document):
    caller_id: str
    provider_id: str
    operation: str              # "search" | "enrich"
    request_id: str             # FK → search_request or enrich_request
    endpoint_called: str        # e.g. "/api/v2/person/search"
    http_status: int
    success: bool
    error_reason: Optional[str] = None
    response_time_ms: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "provider_call_logs"
        indexes = [
            "caller_id",
            "request_id",
            "provider_id",
            {"fields": [("timestamp", -1)]},
            # Retain audit logs for 90 days
            {"fields": [("timestamp", 1)], "expireAfterSeconds": 7776000},
        ]
```

---

## 5. Schemas (API Input / Output)

### 5.1 `SearchQuery` — Input Validation

All fields carry explicit length constraints. A custom validator strips whitespace and ensures at least one criterion is provided.

```python
# schemas/search.py
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List


class SearchQuery(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    current_employer: Optional[str] = Field(None, max_length=200)
    titles: Optional[List[str]] = Field(None, max_length=10)       # list: max 10 items
    location: Optional[str] = Field(None, max_length=200)
    skills: Optional[List[str]] = Field(None, max_length=20)       # list: max 20 items
    seniority: Optional[List[str]] = Field(None, max_length=5)
    keywords: Optional[List[str]] = Field(None, max_length=10)

    @field_validator("name", "current_employer", "location", mode="before")
    @classmethod
    def strip_strings(cls, v):
        if v is not None:
            return str(v).strip()[:200]
        return v

    @field_validator("titles", "skills", "seniority", "keywords", mode="before")
    @classmethod
    def strip_list_items(cls, v):
        if v is not None:
            return [str(item).strip()[:100] for item in v if item]
        return v

    @model_validator(mode="after")
    def at_least_one_criterion(self):
        if not any([
            self.name, self.current_employer, self.titles,
            self.location, self.skills, self.seniority, self.keywords
        ]):
            raise ValueError("At least one search criterion must be provided")
        return self


class SearchSubmitRequest(BaseModel):
    provider: Optional[str] = None      # defaults to settings.default_provider
    query: SearchQuery
    page: int = Field(1, ge=1, le=10000)
    page_size: int = Field(25, ge=1, le=100)
    enrich_results: bool = False


class SearchSubmitResponse(BaseModel):
    request_id: str
    status: str
    submitted_at: str
    poll_url: str
```

### 5.2 `EnrichIdentifiers` — Input Validation

```python
# schemas/enrich.py
from pydantic import BaseModel, Field, model_validator
from typing import Optional


class EnrichIdentifiers(BaseModel):
    linkedin_url: Optional[str] = Field(None, max_length=500)
    email: Optional[str] = Field(None, max_length=254)
    name: Optional[str] = Field(None, max_length=100)
    current_employer: Optional[str] = Field(None, max_length=200)

    @model_validator(mode="after")
    def at_least_one_identifier(self):
        if not any([self.linkedin_url, self.email, self.name]):
            raise ValueError(
                "At least one of linkedin_url, email, or name must be provided"
            )
        return self


class EnrichSubmitRequest(BaseModel):
    provider: Optional[str] = None
    identifiers: EnrichIdentifiers
```

---

## 6. API Endpoints

### 6.1 Authentication

Every request must carry:

```
X-Service-Api-Key: <raw_api_key>
```

Keys are never accepted as query parameters.

**Verification flow inside `api/dependencies.py`:**
```
Incoming raw key
  → SHA-256 hash
  → ServiceClient.find_one(api_key_hash == hash, is_active == True)
  → Not found → 401 Unauthorized
  → Update last_used_at
  → Attach ServiceClient to request state
```

### 6.2 Scope Enforcement

```python
# api/dependencies.py

def require_scope(scope: ClientScope):
    async def _check(caller: ServiceClient = Depends(get_current_caller)):
        if scope not in caller.scopes:
            raise HTTPException(403, f"Scope '{scope}' required for this operation")
        return caller
    return _check
```

| Endpoint | Required Scope |
|---|---|
| `POST /v1/search` | `search` |
| `GET /v1/search/{id}` | `read` |
| `POST /v1/enrich` | `enrich` |
| `GET /v1/enrich/{id}` | `read` |

### 6.3 Rate Limiting

Per-caller, per-operation sliding window (1-hour window). Enforced as a FastAPI dependency on all submission endpoints.

```
Default limits (configurable via env):
  search: 100 requests/hour per caller
  enrich: 500 requests/hour per caller

On breach → HTTP 429 with Retry-After header (seconds until window resets)
```

---

### 6.4 `POST /v1/search`

Submit a people search request.

**Request:**
```json
{
  "provider": "rocketreach",
  "query": {
    "name": "Jane Smith",
    "current_employer": "Acme Corp",
    "titles": ["Engineering Manager", "VP Engineering"],
    "location": "London",
    "skills": ["Python", "AWS"],
    "seniority": ["manager", "director"]
  },
  "page": 1,
  "page_size": 25,
  "enrich_results": false
}
```

- `provider` is optional — omitting it uses `settings.default_provider`
- `enrich_results: true` triggers a follow-up enrich job per result — capped at `settings.max_auto_enrich_per_search` (default: 10)

**Response — 202 Accepted (immediate, ~50ms):**
```json
{
  "success": true,
  "data": {
    "request_id": "srch_9f4a1b2c-3d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "status": "pending",
    "submitted_at": "2026-03-30T10:00:00Z",
    "poll_url": "/v1/search/srch_9f4a1b2c-3d5e-6f7a-8b9c-0d1e2f3a4b5c"
  }
}
```

---

### 6.5 `GET /v1/search/{request_id}`

Poll for results. Caller can only retrieve their own requests — enforced in the service layer.

**Response — processing:**
```json
{
  "success": true,
  "data": {
    "request_id": "srch_9f4a1b2c-...",
    "status": "processing",
    "submitted_at": "2026-03-30T10:00:00Z"
  }
}
```

**Response — completed:**
```json
{
  "success": true,
  "data": {
    "request_id": "srch_9f4a1b2c-...",
    "status": "completed",
    "submitted_at": "2026-03-30T10:00:00Z",
    "completed_at": "2026-03-30T10:00:03Z",
    "page": 1,
    "page_size": 25,
    "total_results": 148,
    "result_count": 25,
    "results": [
      {
        "id": "...",
        "full_name": "Jane Smith",
        "current_title": "Engineering Manager",
        "current_company": "Acme Corp",
        "location_string": "London, UK",
        "emails": [
          {
            "email": "jane@acme.com",
            "type": "work",
            "status": "verified",
            "is_primary": true
          }
        ],
        "phones": [],
        "linkedin_url": "https://linkedin.com/in/jane-smith-456",
        "skills": ["Python", "AWS", "Terraform"],
        "confidence_score": 0.91,
        "fetched_at": "2026-03-30T10:00:02Z"
      }
    ]
  }
}
```

**Response — failed:**
```json
{
  "success": false,
  "data": {
    "request_id": "srch_9f4a1b2c-...",
    "status": "failed",
    "error_message": "Provider rate limit exceeded after 3 retries"
  }
}
```

---

### 6.6 `POST /v1/enrich`

**Request:**
```json
{
  "provider": "rocketreach",
  "identifiers": {
    "linkedin_url": "https://linkedin.com/in/jane-smith-456",
    "email": "jane@acme.com"
  }
}
```

**Response — 202 Accepted:**
```json
{
  "success": true,
  "data": {
    "request_id": "enr_3c7d9e1a-...",
    "status": "pending",
    "submitted_at": "2026-03-30T10:01:00Z",
    "poll_url": "/v1/enrich/enr_3c7d9e1a-..."
  }
}
```

---

### 6.7 `GET /v1/enrich/{request_id}`

**Response — completed:**
```json
{
  "success": true,
  "data": {
    "request_id": "enr_3c7d9e1a-...",
    "status": "completed",
    "completed_at": "2026-03-30T10:01:04Z",
    "result": {
      "full_name": "Jane Smith",
      "current_title": "Engineering Manager",
      "current_company": "Acme Corp",
      "emails": [
        {"email": "jane@acme.com", "type": "work", "status": "verified", "is_primary": true}
      ],
      "phones": [
        {"number": "+44 7700 900123", "type": "mobile"}
      ],
      "experience": [
        {"company": "Acme Corp", "title": "Engineering Manager", "is_current": true, "start_year": 2022}
      ],
      "education": [
        {"institution": "University of Edinburgh", "degree": "BSc", "field_of_study": "Computer Science"}
      ],
      "skills": ["Python", "AWS", "Terraform", "Leadership"],
      "location_string": "London, UK",
      "confidence_score": 0.96,
      "fetched_at": "2026-03-30T10:01:03Z"
    }
  }
}
```

**Response — not found:**
```json
{
  "success": true,
  "data": {
    "request_id": "enr_3c7d9e1a-...",
    "status": "not_found",
    "completed_at": "2026-03-30T10:01:02Z"
  }
}
```

---

### 6.8 Standard Error Responses

```json
{ "success": false, "error": "Unauthorized",      "details": "API key missing or invalid" }
{ "success": false, "error": "Forbidden",          "details": "Scope 'search' required" }
{ "success": false, "error": "Not Found",          "details": "Request not found" }
{ "success": false, "error": "Rate Limited",       "details": "Retry after 3600 seconds", "retry_after": 3600 }
{ "success": false, "error": "Validation Failed",  "details": { "field": "message" } }
```

---

## 7. Provider Abstraction Layer

### 7.1 `BaseSearchProvider` — The Contract

```python
# providers/base.py
from abc import ABC, abstractmethod
from typing import Optional
from pydantic import BaseModel


class ProviderCapabilities(BaseModel):
    supports_search: bool = True
    supports_enrich: bool = True
    supports_bulk_enrich: bool = False
    supports_phone_lookup: bool = False
    max_results_per_search: int = 100


class BaseSearchProvider(ABC):

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Stable unique identifier: 'rocketreach', 'hunter', 'clearbit'"""

    @property
    @abstractmethod
    def capabilities(self) -> ProviderCapabilities:
        """Static declaration of what this provider can do"""

    @abstractmethod
    async def search_people(
        self,
        query: "SearchQuery",
        page: int = 1,
        page_size: int = 25,
    ) -> "SearchResultPage":
        """
        Execute a people search.
        Raises:
            RateLimitError(retry_after_seconds)  → worker nacks, DLX retries
            ProviderAuthError                    → worker marks failed, no retry
            ProviderError                        → worker nacks, DLX retries up to limit
        """

    @abstractmethod
    async def enrich_person(
        self,
        identifiers: "EnrichIdentifiers",
    ) -> Optional["NormalizedPerson"]:
        """
        Enrich a specific person.
        Returns NormalizedPerson or None if the person cannot be found.
        """
```

### 7.2 `ProviderRegistry` — Internal Only

The registry is **never exposed to API consumers**. It is an internal routing mechanism used only by the workers.

```python
# providers/registry.py

class ProviderRegistry:
    def __init__(self):
        self._providers: dict[str, BaseSearchProvider] = {}

    def register(self, provider: BaseSearchProvider) -> None:
        self._providers[provider.provider_id] = provider

    def get(self, provider_id: str) -> BaseSearchProvider:
        provider = self._providers.get(provider_id)
        if not provider:
            raise ProviderNotFoundError(f"Unknown provider: '{provider_id}'")
        return provider

    def resolve(self, provider_id: Optional[str]) -> BaseSearchProvider:
        """Returns named provider, or the configured default."""
        pid = provider_id or settings.default_provider
        return self.get(pid)

    def list_ids(self) -> list[str]:
        return list(self._providers.keys())


registry = ProviderRegistry()
```

**Registered at startup — the API has no knowledge of which providers exist:**
```python
# main.py lifespan
if settings.rocketreach_api_key:
    registry.register(RocketReachProvider(
        api_key=settings.rocketreach_api_key,
        base_url=settings.rocketreach_base_url,
    ))
# if settings.hunter_api_key:
#     registry.register(HunterProvider(...))    # future
```

---

### 7.3 RocketReach Provider

#### `providers/implementations/rocketreach/client.py`

```python
import logging
import httpx
from loguru import logger
from app.providers.exceptions import RateLimitError, ProviderAuthError, ProviderError

# Suppress httpx/httpcore stdlib loggers — they are intercepted by Loguru's
# InterceptHandler configured at startup. Setting WARNING here prevents them
# from emitting low-level request/header detail that could expose the API key.
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)


class RocketReachClient:

    def __init__(self, api_key: str, base_url: str):
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={
                "Api-Key": api_key,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            timeout=httpx.Timeout(30.0),
        )

    async def search(self, body: dict) -> dict:
        response = await self._client.post("/person/search", json=body)
        self._handle_errors(response)
        return response.json()

    async def lookup(self, params: dict) -> Optional[dict]:
        response = await self._client.get("/person/lookup", params=params)
        if response.status_code == 404:
            return None
        self._handle_errors(response)
        return response.json()

    def _handle_errors(self, response: httpx.Response) -> None:
        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 60))
            raise RateLimitError(retry_after_seconds=retry_after)
        if response.status_code == 401:
            raise ProviderAuthError("RocketReach API key invalid or expired")
        if response.status_code >= 400:
            raise ProviderError(f"Provider returned HTTP {response.status_code}")

    async def aclose(self):
        await self._client.aclose()
```

#### `providers/implementations/rocketreach/mapper.py`

```python
from typing import Optional
from app.models.person_profile import (
    PersonProfile, EmailEntry, PhoneEntry, WorkExperience, EducationEntry
)
from app.schemas.search import SearchQuery
from app.schemas.enrich import EnrichIdentifiers


class RocketReachMapper:

    @staticmethod
    def to_search_body(query: SearchQuery, page: int, page_size: int) -> dict:
        rr_query = {}
        if query.name:              rr_query["name"]             = [query.name]
        if query.current_employer:  rr_query["current_employer"] = [query.current_employer]
        if query.titles:            rr_query["current_title"]    = query.titles
        if query.skills:            rr_query["skills"]           = query.skills
        if query.location:          rr_query["location"]         = [query.location]
        if query.seniority:         rr_query["seniority"]        = query.seniority
        if query.keywords:          rr_query["keyword"]          = query.keywords
        return {
            "start": ((page - 1) * page_size) + 1,
            "page_size": page_size,
            "query": rr_query,
        }

    @staticmethod
    def to_lookup_params(identifiers: EnrichIdentifiers) -> dict:
        params = {}
        if identifiers.linkedin_url:     params["linkedin_url"]    = identifiers.linkedin_url
        if identifiers.email:            params["email"]           = identifiers.email
        if identifiers.name:             params["name"]            = identifiers.name
        if identifiers.current_employer: params["current_employer"]= identifiers.current_employer
        return params

    @staticmethod
    def to_person_profile(
        rr_profile: dict,
        caller_id: str,
        search_request_id: Optional[str] = None,
        enrich_request_id: Optional[str] = None,
    ) -> PersonProfile:
        """
        Maps a RocketReach raw API response dict → PersonProfile.
        The raw dict (rr_profile) is used here and then DISCARDED — it is
        never written to MongoDB. Only the mapped fields below are persisted.
        """
        emails = [
            EmailEntry(
                email=e.get("email", ""),
                type=e.get("type"),
                status=e.get("status"),
                is_primary=(i == 0),
            )
            for i, e in enumerate(rr_profile.get("emails") or [])
            if e.get("email")
        ]

        phones = [
            PhoneEntry(number=p.get("number", ""), type=p.get("type"))
            for p in rr_profile.get("phones") or []
            if p.get("number")
        ]

        experience = [
            WorkExperience(
                company=exp.get("company_name", ""),
                title=exp.get("title"),
                is_current=exp.get("is_current", False),
                start_year=exp.get("start"),
                end_year=exp.get("end"),
            )
            for exp in (rr_profile.get("past_experience") or [])
        ]

        education = [
            EducationEntry(
                institution=edu.get("school"),
                degree=edu.get("degree"),
                field_of_study=edu.get("field_of_study"),
                graduation_year=edu.get("end"),
            )
            for edu in (rr_profile.get("education") or [])
        ]

        raw_accuracy = rr_profile.get("profile_accuracy") or 0
        confidence = round(raw_accuracy / 100.0, 2) if raw_accuracy else None

        return PersonProfile(
            provider_id="rocketreach",
            provider_person_id=str(rr_profile.get("id", "")),
            search_request_id=search_request_id,
            enrich_request_id=enrich_request_id,
            caller_id=caller_id,
            first_name=rr_profile.get("first_name"),
            last_name=rr_profile.get("last_name"),
            full_name=rr_profile.get("name"),
            current_title=rr_profile.get("current_title"),
            current_company=rr_profile.get("current_employer"),
            current_company_domain=rr_profile.get("current_employer_domain"),
            linkedin_url=rr_profile.get("linkedin_url"),
            twitter_url=rr_profile.get("twitter_url"),
            emails=emails,
            phones=phones,
            experience=experience,
            education=education,
            skills=rr_profile.get("skills") or [],
            location_string=rr_profile.get("location"),
            confidence_score=confidence,
            profile_picture_url=rr_profile.get("profile_pic"),
            # raw_data is intentionally NOT included
        )
```

---

## 8. RabbitMQ Topology

### 8.1 Topology Declaration

```python
# core/rabbitmq.py

EXCHANGE_NAME = "candidate_search.exchange"
SEARCH_QUEUE  = "candidate_search.search"
ENRICH_QUEUE  = "candidate_search.enrich"
DLX_EXCHANGE  = "candidate_search.dlx"
DLX_QUEUE     = "candidate_search.failed"


async def declare_topology(channel: aio_pika.Channel) -> None:
    """Idempotent — safe to call on every startup."""
    exchange = await channel.declare_exchange(
        EXCHANGE_NAME, aio_pika.ExchangeType.DIRECT, durable=True
    )
    dlx = await channel.declare_exchange(
        DLX_EXCHANGE, aio_pika.ExchangeType.FANOUT, durable=True
    )

    search_queue = await channel.declare_queue(
        SEARCH_QUEUE,
        durable=True,
        arguments={
            "x-dead-letter-exchange": DLX_EXCHANGE,
            "x-delivery-limit": 3,
            "x-message-ttl": 3_600_000,     # 1 hour max wait in queue
        },
    )
    await search_queue.bind(exchange, routing_key="search")

    enrich_queue = await channel.declare_queue(
        ENRICH_QUEUE,
        durable=True,
        arguments={
            "x-dead-letter-exchange": DLX_EXCHANGE,
            "x-delivery-limit": 3,
            "x-message-ttl": 7_200_000,     # 2 hours max wait in queue
        },
    )
    await enrich_queue.bind(exchange, routing_key="enrich")

    dlx_queue = await channel.declare_queue(DLX_QUEUE, durable=True)
    await dlx_queue.bind(dlx)
```

### 8.2 Message Payload — Minimal, No PII

Queue messages carry **only the `request_id`**. All query parameters, caller context, and search criteria remain in MongoDB. If the DLQ is inspected by an operator, no personal data or search content is visible.

```json
{
  "request_id": "srch_9f4a1b2c-...",
  "provider_id": "rocketreach",
  "submitted_at": "2026-03-30T10:00:00Z"
}
```

### 8.3 Publisher

```python
# services/search_service.py  (submit path)

async def submit_search(
    body: SearchSubmitRequest,
    caller: ServiceClient,
    connection: aio_pika.Connection,
) -> SearchRequest:
    provider_id = body.provider or settings.default_provider

    # Validate provider exists before accepting the request
    registry.get(provider_id)

    request = SearchRequest(
        request_id="srch_" + str(uuid4()),
        caller_id=caller.caller_id,
        provider_id=provider_id,
        query=body.query.model_dump(exclude_none=True),
        page=body.page,
        page_size=body.page_size,
        enrich_results=body.enrich_results,
    )
    await request.insert()

    async with connection.channel() as channel:
        exchange = await channel.get_exchange(EXCHANGE_NAME)
        await exchange.publish(
            aio_pika.Message(
                body=json.dumps({
                    "request_id": request.request_id,
                    "provider_id": provider_id,
                    "submitted_at": request.submitted_at.isoformat(),
                }).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type="application/json",
                message_id=request.request_id,    # idempotency key
            ),
            routing_key="search",
        )
    return request
```

### 8.4 Search Worker

```python
# workers/search_worker.py

async def start_search_consumer(connection: aio_pika.RobustConnection) -> None:
    channel = await connection.channel()

    # Throttle concurrency: respect RocketReach's 10 req/sec global limit
    await channel.set_qos(prefetch_count=3)

    queue = await channel.get_queue(SEARCH_QUEUE)

    async with queue.iterator() as messages:
        async for message in messages:
            async with message.process(requeue=False):
                # requeue=False: on unhandled exception → message goes to DLX
                payload = json.loads(message.body)
                request_id = payload["request_id"]
                try:
                    await search_service.execute(request_id)
                except RateLimitError:
                    # Re-raise so aio-pika nacks the message → DLX handles retry
                    raise
                except ProviderAuthError:
                    # Auth failures should not retry — mark permanently failed
                    await search_service.mark_failed(
                        request_id, "Provider authentication failed — check API key"
                    )
                    # Do not raise — message is acked and dropped
```

### 8.5 Retry Strategy

RabbitMQ's `x-delivery-limit: 3` handles retry counting automatically. On the third failed delivery, the message is routed to `candidate_search.failed` (DLQ) with no further processing.

For rate limit cooldown delays (HTTP 429 with `Retry-After`): if the **RabbitMQ Delayed Message Exchange plugin** is available, re-publish with an `x-delay` header equal to `retry_after_seconds * 1000`. If the plugin is not available, the DLX trampoline pattern can be used (TTL queue that re-routes back to the main queue after expiry).

---

## 9. Security Implementation

### 9.1 API Key Generation & Verification

```python
# core/security.py
import hashlib
import secrets


def generate_api_key() -> tuple[str, str, str]:
    """
    Call this once when registering a new service client.
    Returns (raw_key, key_hash, key_prefix).

    raw_key    — shown to the operator exactly once, never stored anywhere
    key_hash   — stored in service_clients.api_key_hash
    key_prefix — stored in service_clients.api_key_prefix (identification only)
    """
    raw_key = "sk_" + secrets.token_urlsafe(40)
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_prefix = raw_key[:12]
    return raw_key, key_hash, key_prefix


def verify_api_key(raw_key: str, stored_hash: str) -> bool:
    """Constant-time comparison to prevent timing attacks."""
    incoming_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    return secrets.compare_digest(incoming_hash, stored_hash)
```

### 9.2 Log Scrubbing — Loguru

Loguru replaces the stdlib `logging` module entirely. All modules import `from loguru import logger` — there is no `getLogger(__name__)`. A single `configure_logging()` call at startup:

- Removes Loguru's default sink and adds a structured, coloured stdout sink
- Applies a scrubbing filter that redacts API keys and auth headers from **every** log record before emission
- Installs an `InterceptHandler` that routes all stdlib `logging` output (httpx, aio-pika, motor) through Loguru, so scrubbing applies to third-party logs too
- Suppresses noisy transport-level loggers (httpx, httpcore, aio-pika, aiormq) to `WARNING`

```python
# core/logging.py
import logging
import re
import sys
from loguru import logger


SENSITIVE_PATTERNS = [
    re.compile(r"(Api-Key|Authorization|X-Service-Api-Key):\s*\S+", re.IGNORECASE),
    re.compile(r'"api_key["\s]*:\s*"[^"]*"', re.IGNORECASE),
    re.compile(r"sk_[A-Za-z0-9_\-]{10,}", re.IGNORECASE),    # raw key pattern
]


def _scrub(message: str) -> str:
    """Redact sensitive values from a log message string."""
    for pattern in SENSITIVE_PATTERNS:
        message = pattern.sub(r"\1: [REDACTED]", message)
    return message


def _scrub_filter(record: dict) -> bool:
    """
    Loguru filter applied to every record before it reaches the sink.
    Mutates record["message"] in-place — safe because Loguru calls filters
    before serialisation.
    """
    record["message"] = _scrub(record["message"])
    return True


class InterceptHandler(logging.Handler):
    """
    Routes all stdlib logging (httpx, aio-pika, motor, uvicorn, etc.)
    into Loguru so the scrubbing filter applies universally.
    """
    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = sys._getframe(6), 6
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, _scrub(record.getMessage())
        )


def configure_logging(log_level: str = "INFO") -> None:
    """
    Call exactly once at startup (main.py lifespan).

    Configures Loguru as the single logging backend for the entire service,
    including all third-party libraries.
    """
    logger.remove()   # remove Loguru's default stderr sink

    logger.add(
        sys.stdout,
        level=log_level,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        ),
        filter=_scrub_filter,
        enqueue=True,       # offloads sink I/O from the asyncio event loop
        backtrace=True,
        diagnose=False,     # MUST be False in production — can expose variables
        colorize=True,
    )

    # Route all stdlib logging through Loguru (captures httpx, aio-pika, motor)
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

    # Suppress noisy transport-level loggers
    for noisy_logger in ("httpx", "httpcore", "aio_pika", "aiormq", "motor"):
        logging.getLogger(noisy_logger).setLevel(logging.WARNING)
```

**Usage in any module — no import of `configure_logging` or `get_scrubbed_logger`:**

```python
from loguru import logger

logger.info("Search worker started")
logger.warning("Rate limit hit, request will be retried")
logger.error("Provider auth failed for request {request_id}", request_id=req_id)
```

Loguru's scrubbing filter is applied globally at the sink before any message is emitted — there is no per-module filter setup required.

### 9.3 Caller Isolation — Mandatory Pattern

**Every** MongoDB query that returns caller-visible data must pass through a service function that always includes `caller_id`. Route handlers are **never** permitted to query MongoDB directly.

```python
# services/search_service.py

async def get_request(request_id: str, caller_id: str) -> SearchRequest:
    """
    The ONLY permitted way to retrieve a SearchRequest in a route handler.
    The caller_id filter is mandatory and cannot be bypassed.
    """
    result = await SearchRequest.find_one(
        SearchRequest.request_id == request_id,
        SearchRequest.caller_id == caller_id,   # NEVER remove this line
    )
    if not result:
        raise HTTPException(404, "Request not found")
    return result
```

The same pattern applies to `enrich_service.get_request()` and any future service function returning user-facing data.

### 9.4 Rate Limit Service

```python
# services/rate_limit_service.py
from datetime import datetime, timedelta
from fastapi import HTTPException
from app.models.rate_limit_counter import RateLimitCounter
from app.core.config import settings


async def check_and_increment(caller_id: str, operation: str) -> None:
    """
    Sliding window (1-hour) rate limiter backed by MongoDB.
    Raises HTTP 429 if the caller has exceeded their limit.
    """
    limit = (
        settings.rate_limit_search_per_hour
        if operation == "search"
        else settings.rate_limit_enrich_per_hour
    )

    now = datetime.utcnow()
    window_start = now.replace(minute=0, second=0, microsecond=0)

    counter = await RateLimitCounter.find_one(
        RateLimitCounter.caller_id == caller_id,
        RateLimitCounter.operation == operation,
        RateLimitCounter.window_start == window_start,
    )

    if counter is None:
        counter = RateLimitCounter(
            caller_id=caller_id,
            operation=operation,
            window_start=window_start,
            count=0,
        )

    if counter.count >= limit:
        retry_after = int((window_start + timedelta(hours=1) - now).total_seconds())
        raise HTTPException(
            429,
            detail=f"Rate limit exceeded. Retry after {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

    counter.count += 1
    await counter.save()
```

### 9.5 Audit Service

```python
# services/audit_service.py
import time
from app.models.provider_call_log import ProviderCallLog


async def log_provider_call(
    caller_id: str,
    provider_id: str,
    operation: str,
    request_id: str,
    endpoint_called: str,
    http_status: int,
    response_time_ms: int,
    error_reason: str = None,
) -> None:
    """
    Called inside every worker immediately after each outbound provider HTTP call,
    regardless of success or failure. This is the tamper-evident credit audit trail.
    """
    await ProviderCallLog(
        caller_id=caller_id,
        provider_id=provider_id,
        operation=operation,
        request_id=request_id,
        endpoint_called=endpoint_called,
        http_status=http_status,
        success=(200 <= http_status < 300),
        error_reason=error_reason,
        response_time_ms=response_time_ms,
    ).insert()
```

**Usage inside a worker:**
```python
start = time.monotonic()
try:
    result = await client.search(body)
    elapsed_ms = int((time.monotonic() - start) * 1000)
    await audit_service.log_provider_call(
        caller_id=request.caller_id,
        provider_id="rocketreach",
        operation="search",
        request_id=request.request_id,
        endpoint_called="/api/v2/person/search",
        http_status=200,
        response_time_ms=elapsed_ms,
    )
except ProviderError as e:
    elapsed_ms = int((time.monotonic() - start) * 1000)
    await audit_service.log_provider_call(..., http_status=e.status_code,
                                           error_reason=str(e), ...)
    raise
```

---

## 10. Application Startup

```python
# main.py
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import asyncio
import aio_pika
from beanie import init_beanie
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.logging import configure_logging   # Loguru setup
from app.core.rabbitmq import declare_topology
from app.models import ALL_DOCUMENT_MODELS      # list of all Beanie document classes
from app.providers.registry import registry
from app.providers.implementations.rocketreach.provider import RocketReachProvider
from app.workers.search_worker import start_search_consumer
from app.workers.enrich_worker import start_enrich_consumer
from app.services import search_service, enrich_service
from app.api.routes import search, enrich


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(log_level=settings.log_level)

    # 1. MongoDB
    motor_client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(
        database=motor_client[settings.mongodb_db_name],
        document_models=ALL_DOCUMENT_MODELS,
    )

    # 2. RabbitMQ (robust = transparent auto-reconnect)
    connection = await aio_pika.connect_robust(settings.rabbitmq_url)
    app.state.rmq_connection = connection

    # 3. Declare queue topology (idempotent)
    async with connection.channel() as ch:
        await declare_topology(ch)

    # 4. Register providers (only those with configured API keys)
    if settings.rocketreach_api_key:
        registry.register(RocketReachProvider(
            api_key=settings.rocketreach_api_key,
            base_url=settings.rocketreach_base_url,
        ))

    # 5. Recover any requests stuck in pending/processing before last shutdown
    await _recover_stuck_requests()

    # 6. Start background consumers
    asyncio.create_task(start_search_consumer(connection))
    asyncio.create_task(start_enrich_consumer(connection))

    yield

    await connection.close()
    motor_client.close()


async def _recover_stuck_requests():
    """Re-publish requests that were pending/processing when the service last stopped."""
    from app.models.search_request import SearchRequest, SearchRequestStatus
    from beanie.operators import In

    cutoff = datetime.utcnow() - timedelta(minutes=10)
    stuck = await SearchRequest.find(
        In(SearchRequest.status, [
            SearchRequestStatus.PENDING,
            SearchRequestStatus.PROCESSING,
        ]),
        SearchRequest.submitted_at < cutoff,
    ).to_list()

    for req in stuck:
        await search_service.republish(req)


app = FastAPI(
    title="Candidate Search Service",
    version="1.0.0",
    docs_url=None,      # Disable Swagger UI in production
    redoc_url=None,
)

app.include_router(search.router, prefix="/v1")
app.include_router(enrich.router, prefix="/v1")
```

---

## 11. Full Request Lifecycle

```
POST /v1/search
══════════════════════════════════════════════════════════════
  1. Auth:           Hash incoming X-Service-Api-Key → verify against MongoDB
  2. Scope:          "search" in caller.scopes → 403 if not
  3. Rate limit:     Sliding window check → 429 if exceeded
  4. Validation:     Pydantic SearchQuery (max_length, strip, at_least_one)
  5. Insert:         SearchRequest(status=pending) → MongoDB
  6. Publish:        {request_id} → RabbitMQ search_queue (PERSISTENT)
  7. Respond:        202 + request_id                              [~50ms total]

  ─────── RabbitMQ worker picks up message (aio-pika, prefetch=3) ───────

  8. Deserialise:    request_id from message body
  9. Load:           SearchRequest from MongoDB
  10. Update:        status = processing
  11. Map:           RocketReachMapper.to_search_body(query, page, page_size)
  12. Call:          RocketReachClient.search(body)               [~1–3s]
                     → HTTP 200:  proceed
                     → HTTP 429:  raise RateLimitError → nack → DLX → retry
                     → HTTP 401:  raise ProviderAuthError → mark_failed → ack
                     → HTTP 5xx:  raise ProviderError → nack → DLX → retry
  13. Audit:         ProviderCallLog entry written (always, pass or fail)
  14. Normalise:     RocketReachMapper.to_person_profile() per result
                     raw provider dict is DISCARDED here — not persisted
  15. Insert:        PersonProfile[] → MongoDB
  16. Update:        SearchRequest: status=completed, result_ids, result_count
  17. Enrich:        If enrich_results=True, publish to enrich_queue
                     (capped at max_auto_enrich_per_search)
  18. Ack:           Message removed from queue

GET /v1/search/{request_id}
══════════════════════════════════════════════════════════════
  1. Auth + scope:   As above ("read")
  2. Fetch:          search_service.get_request(request_id, caller_id)
                     ← always includes caller_id filter — no cross-caller access
  3. If pending/processing → return status only
  4. If completed → load PersonProfile[] by result_ids → return full response
  5. If failed → return status + error_message
```

---

## 12. Configuration

```python
# core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    # Service
    service_name: str = "candidate-search-service"
    service_port: int = 8001
    log_level: str = "INFO"

    # MongoDB — ISOLATED database, not shared with any other application
    mongodb_url: str
    mongodb_db_name: str = "candidate_search_service"

    # RabbitMQ — use a dedicated vhost for isolation
    rabbitmq_url: str    # e.g. amqp://user:pass@host/candidate_search_vhost

    # Providers — provider is only registered if its key is present
    rocketreach_api_key: Optional[str] = None
    rocketreach_base_url: str = "https://api.rocketreach.co/api/v2"

    # To add a future provider: add its key here. No other changes required.
    # hunter_api_key: Optional[str] = None

    default_provider: str = "rocketreach"

    # Rate limits per caller per hour
    rate_limit_search_per_hour: int = 100
    rate_limit_enrich_per_hour: int = 500

    # Max auto-enrichments triggered per search request
    max_auto_enrich_per_search: int = 10

    # Data retention
    request_ttl_days: int = 30
    audit_log_ttl_days: int = 90

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
```

### `.env.example`

```env
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DB_NAME=candidate_search_service
RABBITMQ_URL=amqp://css_user:css_pass@rabbitmq-host/candidate_search_vhost
ROCKETREACH_API_KEY=your_rocketreach_key_here
DEFAULT_PROVIDER=rocketreach
LOG_LEVEL=INFO
SERVICE_PORT=8001
```

---

## 13. Infrastructure

### `Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
```

### `docker-compose.yml`

```yaml
version: "3.9"

services:
  candidate-search-api:
    build: .
    ports:
      - "8001:8001"
    env_file: .env
    depends_on:
      - mongo
    restart: unless-stopped
    networks:
      - candidate_search_net

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    expose:
      - "27017"       # internal only — not published externally
    networks:
      - candidate_search_net

# RabbitMQ is external shared infrastructure — not declared here.
# Configure RABBITMQ_URL in .env to point to your existing RabbitMQ instance.

volumes:
  mongo_data:

networks:
  candidate_search_net:
    driver: bridge
```

### Infrastructure Requirements

| Resource | Requirement |
|---|---|
| MongoDB | Dedicated DB user with `readWrite` on `candidate_search_service` only |
| RabbitMQ | Dedicated vhost `candidate_search_vhost`, credentials scoped to that vhost |
| Network | Service should not be publicly internet-accessible — internal network only |

---

## 14. `requirements.txt`

```
fastapi>=0.115.0
uvicorn[standard]>=0.29.0
beanie>=1.26.0
motor>=3.4.0
aio-pika>=9.4.3
httpx>=0.27.0
pydantic>=2.7.0
pydantic-settings>=2.3.0
python-dotenv>=1.0.0
loguru>=0.7.2
```

---

## 15. Adding a Future Provider

To add a second provider (e.g. Hunter.io), only these steps are required:

1. Create `providers/implementations/hunter/` with:
   - `provider.py` — implement `BaseSearchProvider` (`provider_id`, `capabilities`, `search_people`, `enrich_person`)
   - `mapper.py` — map Hunter's response fields to `PersonProfile` (**no `raw_data`**)
   - `client.py` — httpx wrapper with WARNING-level log config
2. Add `hunter_api_key: Optional[str] = None` to `Settings` in `core/config.py`
3. Add to `main.py` lifespan:
   ```python
   if settings.hunter_api_key:
       registry.register(HunterProvider(api_key=settings.hunter_api_key))
   ```

**Zero changes** to routes, workers, schemas, models, queue topology, rate limiting, or audit logging.

---

## 16. Security Controls Summary

| # | Control | Implementation Location |
|---|---|---|
| 1 | API keys SHA-256 hashed at rest, never stored plain | `core/security.py`, `models/service_client.py` |
| 2 | No `raw_data` field — provider payload discarded after mapping | `models/person_profile.py`, `providers/*/mapper.py` |
| 3 | Per-caller inbound rate limiting (1-hour sliding window) | `services/rate_limit_service.py`, applied on all POST routes |
| 4 | `caller_id` filter on every result query — enforced in service layer | `services/search_service.get_request()`, `services/enrich_service.get_request()` |
| 5 | Loguru `_scrub_filter` redacts API keys/headers from all logs; stdlib intercepted globally via `InterceptHandler` | `core/logging.py`, `providers/*/client.py` |
| 6 | Input max_length + strip sanitisation on all query fields | `schemas/search.py`, `schemas/enrich.py` |
| 7 | API key scopes per consumer (`search`, `enrich`, `read`) | `models/service_client.py`, `api/dependencies.py` |
| 8 | Provider call audit log — append-only, 90-day TTL | `services/audit_service.py`, all worker files |
| 9 | Queue messages contain only `request_id` — no PII, no query content | `workers/search_worker.py`, `services/search_service.py` |
| 10 | MongoDB user scoped to `candidate_search_service` DB only | Deployment / MongoDB Atlas config |
| 11 | RabbitMQ vhost isolated: `candidate_search_vhost` | Deployment / RabbitMQ admin config |
| 12 | No provider listing endpoint exposed to consumers | Provider registry is internal only |

---

## 17. Out of Scope (Deferred to Phase 2)

| Feature | Reason Deferred |
|---|---|
| RocketReach webhook receiver (`POST /v1/webhooks/rocketreach`) | Reduces enrichment latency but adds inbound auth complexity; polling is sufficient for MVP |
| Cross-provider fanout (query multiple providers, deduplicate) | Architecture supports it but business need not confirmed |
| Admin endpoint for provider health checks | Internal ops need — not consumer-facing; can be added as an authenticated admin route |
| Webhook signature validation | Required if webhook receiver is implemented in Phase 2 |

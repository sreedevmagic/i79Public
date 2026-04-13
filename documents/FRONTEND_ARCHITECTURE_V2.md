# i79Engage Frontend Architecture - Technical Reference

> **Modern React Application for AI-Powered Recruitment**

**Last Updated**: December 31, 2025  
**Version**: 2.0  
**Status**: Production

This document provides the architectural reference for the i79Engage frontend application. For code implementation details, refer to the actual codebase.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Principles](#2-architecture-principles)
3. [Technology Stack](#3-technology-stack)
4. [Application Structure](#4-application-structure)
5. [State Management Architecture](#5-state-management-architecture)
6. [API Integration Layer](#6-api-integration-layer)
7. [Component Architecture](#7-component-architecture)
8. [Routing & Navigation](#8-routing--navigation)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Real-Time Updates](#10-real-time-updates)
11. [Performance Optimization](#11-performance-optimization)
12. [Development Workflow](#12-development-workflow)

## 1. System Overview

### 1.1 Purpose

Modern web frontend for i79Engage platform providing:
- **Multi-role dashboards**: Admin, recruiter, and hiring manager interfaces
- **Job management**: CRUD operations for job postings
- **Candidate pipeline**: CV upload, AI analysis, and interview scheduling
- **Interview management**: External AI interview coordination
- **Subscription billing**: Plan selection and credit management
- **Analytics & reporting**: Dashboard visualizations and candidate insights

### 1.2 User Roles

| Role | Access Level | Key Features |
|------|-------------|--------------|
| **Admin** | Full access | Company settings, user management, all jobs/candidates, billing, reports |
| **Recruiter** | Limited access | Assigned jobs, candidate management, interview scheduling |
| **Hiring Manager** | Limited access | Candidate review, final decisions, reports |

### 1.3 Application Characteristics

- **Single-Page Application (SPA)**: React Router for client-side routing
- **Real Backend Connection**: Communicates with FastAPI backend at `http://localhost:8000`
- **Type-Safe**: TypeScript throughout with strict mode
- **Responsive**: Mobile-first design with Tailwind CSS
- **Real-Time Capable**: Polling for status updates
- **Accessible**: WCAG compliant components

---

## 2. Architecture Principles

### 2.1 Design Principles

**1. Server State Separation**
- TanStack Query manages ALL server data (companies, users, jobs, candidates, interviews)
- Context API ONLY for client-side state (auth tokens)
- No duplication between query cache and context

**2. Optimistic Updates**
- Mutations update cache immediately before server response
- Automatic rollback on error
- Provides instant UI feedback

**3. Component Composition**
- Small, single-responsibility components
- shadcn-ui primitives for base components
- Feature-specific components in domain folders

**4. Type Safety**
- Strict TypeScript with no `any` types
- API response types match backend schemas
- Zod validation for forms

**5. Performance First**
- Code splitting per route
- Lazy loading for heavy components
- Query caching with smart invalidation

**6. User Experience**
- Loading states for all async operations
- Error boundaries for graceful failures
- Toast notifications for user actions
- Confirmation dialogs for destructive actions

### 2.2 Architectural Patterns

| Pattern | Application | Location |
|---------|-------------|----------|
| **Query Key Factories** | Structured cache keys | `hooks/*.ts` (e.g., `jobKeys`) |
| **Custom Hooks** | Encapsulate data fetching logic | `hooks/*.ts` |
| **Compound Components** | Dialog patterns | `components/ui/*` (shadcn-ui) |
| **Provider Pattern** | Context for auth | `contexts/AuthContext.tsx` |
| **Higher-Order Components** | Route protection | `components/ProtectedRoute.tsx` |
| **Render Props** | Conditional rendering | Query states |

---

## 3. Technology Stack

### 3.1 Core Stack

```yaml
Runtime: Node.js 20+
Framework: React 18+ (Concurrent Features)
Language: TypeScript 5+
Build Tool: Vite 6+ (Fast HMR, ESBuild)
Package Manager: npm
State Management: TanStack React Query v5+
Routing: React Router v6+
Form Handling: React Hook Form + Zod
HTTP Client: Axios
```

### 3.2 UI Framework

```yaml
Design System: shadcn-ui (Radix UI + Tailwind CSS)
CSS Framework: Tailwind CSS 3+
Icons: Lucide React
Animations: Tailwind CSS animations
Charts: Recharts
Date Handling: date-fns
```

### 3.3 Additional Libraries

```yaml
Notifications: React Hot Toast
File Upload: React Dropzone
PDF Processing: react-pdf (future)
```

---

## 4. Application Structure

### 4.1 Directory Structure

```
Frontend/
├── src/
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Router + QueryClientProvider
│   ├── index.css                   # Global Tailwind styles
│   │
│   ├── services/                   # API integration layer
│   │   ├── api/
│   │   │   ├── apiClient.ts        # Unified request handler
│   │   │   ├── authService.ts      # Auth endpoints
│   │   │   ├── candidateService.ts # Candidate CRUD
│   │   │   ├── companyService.ts   # Company endpoints
│   │   │   ├── jobService.ts       # Job CRUD
│   │   │   ├── interviewService.ts # Interview endpoints
│   │   │   ├── billingService.ts   # Billing endpoints
│   │   │   └── dashboardService.ts # Dashboard data
│   │
│   ├── contexts/                   # React contexts
│   │   └── AuthContext.tsx         # Auth state management
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── use-mobile.tsx          # Mobile detection
│   │   └── use-toast.ts            # Toast notifications
│   │
│   ├── lib/                        # Utilities
│   │   └── utils.ts                # Helper functions
│   │
│   ├── components/                 # React components
│   │   ├── ui/                     # shadcn-ui primitives
│   │   │   ├── button.tsx, card.tsx, dialog.tsx
│   │   │   ├── form.tsx, input.tsx, select.tsx
│   │   │   ├── table.tsx, toast.tsx
│   │   │   └── ... (Radix UI + Tailwind)
│   │   │
│   │   ├── AddCandidateDialog.tsx  # Candidate creation
│   │   ├── AuthorizeInterviewDialog.tsx # Interview authorization
│   │   ├── CandidateCard.tsx       # Candidate display
│   │   ├── MetricCard.tsx          # Dashboard metrics
│   │   ├── Navigation.tsx          # Main navigation
│   │   ├── NavLink.tsx             # Navigation links
│   │   ├── ProtectedRoute.tsx      # Route protection
│   │   ├── ScoreDisplay.tsx        # CV score display
│   │   │
│   ├── pages/                      # Page components
│   │   ├── Login.tsx               # Authentication
│   │   ├── Register.tsx            # User registration
│   │   ├── Dashboard.tsx           # Main dashboard
│   │   ├── Jobs.tsx                # Job listings
│   │   ├── JobDetail.tsx           # Job details
│   │   ├── CreateJob.tsx           # Job creation
│   │   ├── Candidates.tsx          # Candidate listings
│   │   ├── CandidateDetail.tsx     # Candidate details
│   │   ├── Billing.tsx             # Subscription management
│   │   ├── Settings.tsx            # User settings
│   │   ├── SubscriptionSelect.tsx  # Plan selection
│   │   ├── Pricing.tsx             # Pricing page
│   │   └── NotFound.tsx            # 404 page
│   │
│   ├── types/                      # TypeScript types
│   │   └── index.ts                # API and component types
│   │
│   ├── services/                   # API integration
│   │   └── api/                    # API service layer
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── use-toast.ts            # Toast notifications
│   │   └── use-mobile.tsx          # Mobile detection
│   │
│   └── lib/                        # Utility functions
│       └── utils.ts                # Class name utilities (cn)
```

**Key Directories:**

- **`components/`**: Reusable UI components
  - `ui/`: shadcn-ui design system primitives
  - Feature components: CandidateCard, AddCandidateDialog, Navigation, ProtectedRoute, etc.
  
- **`pages/`**: Route-level page components (Dashboard, Jobs, Candidates, Billing, Settings, etc.)

- **`contexts/`**: React Context providers for global state (AuthContext for user/company/JWT)

- **`services/api/`**: API client and service functions for backend communication

- **`types/`**: TypeScript interfaces for entities (User, Company, Job, Candidate, Interview)

- **`hooks/`**: Custom React hooks for reusable logic (toast notifications, mobile detection)

---

### 4.2 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Vite over CRA** | 10x faster HMR, native ESM, better dev experience |
| **shadcn-ui over Material-UI** | Copy-paste components (no dependency bloat), full customization |
| **TanStack Query over Redux** | Server state is 90% of state, automatic caching/refetching |
| **React Hook Form over Formik** | Better performance (uncontrolled inputs), TypeScript integration |
| **Bun optional** | 2x faster installs, but npm still supported |
| **No SSR** | SPA sufficient for admin dashboard (authenticated users only) |

---

## 5. State Management Architecture

### 5.1 State Categorization

| State Type | Management | Storage | Example |
|-----------|-----------|---------|---------|
| **Server State** | TanStack Query | Query cache (memory) | Companies, users, jobs, candidates, interviews |
| **UI State** | React useState | Component memory | Dialog open/closed, selected tab |
| **Form State** | React Hook Form | Form memory | Input values, validation errors |
| **Auth State** | Context API | localStorage + memory | JWT tokens, current user/company |

### 5.2 TanStack Query Architecture

**Query Client Configuration** (`App.tsx`):
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes
      retry: 1,                         // Retry failed requests once
    },
    mutations: {
      onError: (error) => {
        toast.error(error.message);     // Global error handling
      },
    },
  },
});
```

**Query Key Factory Pattern**:
```typescript
const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: string) => [...jobKeys.lists(), { filters }] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
};
```

---
- Type-safe query keys (TypeScript inference)
- Consistent naming across hooks

### 5.3 Optimistic Updates Pattern

**Example: Create Client** (`use-clients-query.ts`):
```typescript
const createClient = useMutation({
  mutationFn: clientsApi.createClient,
  onMutate: async (newClient) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: clientKeys.lists() });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(clientKeys.lists());
    
    // Optimistically update cache
    queryClient.setQueryData(clientKeys.lists(), (old) => [...old, newClient]);
    
    return { previous };
  },
  onError: (err, newClient, context) => {
    // Rollback on error
    queryClient.setQueryData(clientKeys.lists(), context.previous);
  },
  onSettled: () => {
    // Refetch to sync with server
    queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
  },
});
```

### 5.4 Context API Usage (Minimal)

**Auth Context** (`contexts/AuthContext.tsx`):
- Stores: JWT tokens, current user, current company
- Methods: `login()`, `register()`, `logout()`
- Persistence: localStorage for tokens
- Does NOT store: Jobs, candidates, interviews (use TanStack Query or Context if needed)

**Note:** i79Engage currently uses simple Context API. Migration to TanStack Query for server state is recommended for better caching and state synchronization.

### 5.5 State Management Best Practices

**Guidelines:**
- Keep authentication state in AuthContext
- Use component state (useState) for UI-only state
- Consider TanStack Query for server state (jobs, candidates, interviews)
- Use React Hook Form for form state management
- Query cache is single source of truth
- Automatic deduplication (multiple components using same query)
- No manual cache synchronization

---

## 6. API Integration Layer

### 6.1 API Configuration

**Base Configuration** (`api/config.ts`):
```typescript
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  useMockApi: false,  // Real backend by default
  timeout: 30000,     // 30 seconds
  apiPrefix: '/api/v1',
};
```

**Environment Variables**:
- `VITE_API_URL`: Backend URL (default: `http://localhost:8000`)

### 6.2 Unified Request Handler

**Client Abstraction** (`api/client.ts`):
- Wraps Axios with standardized error handling
- Automatically attaches JWT token from auth context
- Transforms backend `ApiResponse<T>` format
- Handles 401 (refresh token) and 403 (forbidden)
- Throws typed errors

**Response Format** (from backend):
```typescript
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
  statusCode: number;
  message?: string;
}
```

### 6.3 API Service Modules

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| **authService.ts** | Authentication | `login()`, `register()`, `logout()`, `getCurrentUser()` |
| **companyService.ts** | Company management | `getCurrent()`, `update()` |
| **userService.ts** | User CRUD | `getUsers()`, `createUser()`, `updateUser()` |
| **jobService.ts** | Job management | `getJobs()`, `createJob()`, `updateJob()` |
| **candidateService.ts** | Candidate operations | `getCandidates()`, `createCandidate()`, `uploadCV()`, `analyzeCV()` |
| **jobService.ts** | Job CRUD | `getJobs()`, `createJob()`, `updateJob()`, `deleteJob()` |
| **candidateService.ts** | Candidate CRUD | `getCandidates()`, `addCandidate()`, `updateCandidate()`, `uploadCV()` |
| **interviewService.ts** | Interview scheduling | `getInterviews()`, `scheduleInterview()`, `authorizeInterview()` |
| **billingService.ts** | Subscription management | `getSubscription()`, `getTransactions()`, `purchaseCredits()` |
| **dashboardService.ts** | Analytics | `getStats()`, `getDashboardData()` |
| **authService.ts** | Authentication | `login()`, `register()`, `logout()`, `refreshToken()` |
| **userService.ts** | User management | `getUsers()`, `updateUser()`, `deleteUser()` |
| **cvAnalysisService.ts** | CV analysis | `analyzeCV()`, `getCVScore()`, `extractCVData()` |

### 6.4 Type Safety

**Type Definitions** (`types/index.ts`):
- All backend models have TypeScript interfaces
- Enums for status literals (`CandidateStatus`, `InterviewStatus`, `SubscriptionTier`)
- Request/response types for each endpoint
- Pagination and API response types

**Example Types**:
```typescript
interface Candidate {
  id: string;
  name: string;
  email: string;
  companyId: string;
  jobId: string;
  status: 'cv_uploaded' | 'cv_scored' | 'interview_scheduled' | 'interview_completed';
  cvScore: number | null;
  interviewScore: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Job {
  id: string;
  title: string;
  companyId: string;
  department: string;
  status: 'active' | 'paused' | 'closed';
  candidatesCount: number;
  createdAt: string;
}

interface Candidate {
  id: string;
  companyId: string;
  jobId: string;
  name: string;
  email: string;
  phone?: string;
  cvText?: string;
  cvScore?: number;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';
  createdAt: string;
}

type CreateCandidateDto = Omit<Candidate, 'id' | 'cvScore' | 'createdAt'>;
```

---

## 7. Component Architecture

### 7.1 Component Hierarchy

```
App (Router + QueryClientProvider)
  ├── AuthProvider (JWT tokens, user, company)
  └── Routes
      ├── Public Routes (Login, Register, Pricing)
      └── Protected Routes (ProtectedRoute wrapper)
          ├── Navigation (role-based menu)
          └── Page Content
              ├── Dashboard
              │   └── MetricCard components
              ├── Jobs
              │   ├── Job listings
              │   └── CreateJob form
              ├── Candidates
              │   ├── CandidateCard components
              │   └── AddCandidateDialog
              ├── Billing
              │   └── Subscription management
              └── ...
```

### 7.2 Component Types

**1. Page Components** (`pages/`)
- Route-level screens (Dashboard, Jobs, Candidates, etc.)
- Connected to API services via TanStack Query

**2. Feature Components** (`components/`)
- Reusable components (CandidateCard, AddCandidateDialog, etc.)
- Business logic with hooks

**3. UI Primitives** (`components/ui/`)
- shadcn-ui components (Button, Card, Dialog, Input, etc.)
- Radix UI primitives styled with Tailwind
- Reusable across features (DO NOT modify unless necessary)

**4. Page Components** (`pages/`)
- Route-level components
- Orchestrate feature components
- Minimal logic (delegated to hooks)

### 7.3 shadcn-ui Design System

**Philosophy**: Copy-paste components into your project (not a dependency).

**Components Available** (30+):
- **Form Controls**: Button, Input, Select, Checkbox, Radio, Switch, Textarea
- **Overlays**: Dialog, Popover, Tooltip, Sheet (mobile drawer), Alert Dialog
- **Data Display**: Card, Table, Badge, Avatar, Separator
- **Feedback**: Toast, Alert, Progress, Skeleton
- **Navigation**: Tabs, Dropdown Menu, Command (search)
- **Layout**: Aspect Ratio, Scroll Area

**Styling Approach**:
- Tailwind CSS utility classes
- CSS variables for theme tokens (`--background`, `--foreground`, etc.)
- Dark mode via `dark:` prefix

**Customization**:
- Edit `components/ui/*.tsx` files directly
- Modify `tailwind.config.ts` for theme colors
- Components are YOUR code, not a library

---

## 8. Routing & Navigation

### 8.1 Route Structure

**Public Routes**:
- `/` - Login page
- `/register` - Registration + company setup
- `/pricing` - Pricing plans

**Protected Routes**:
- `/dashboard` - Main dashboard (role-based content)
- `/jobs` - Job listings
- `/jobs/new` - Create new job
- `/jobs/:jobId` - Job details with candidates
- `/candidates/:id` - Candidate details
- `/billing` - Subscription management
- `/settings` - User settings
- `/subscription-select` - Plan selection
### 8.2 Route Protection

**ProtectedRoute Component**:
```typescript
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

**Flow**:
1. Check if JWT token exists (localStorage)
2. If no token → Redirect to `/`
3. If token exists → Validate with backend (`/api/auth/me`)
4. If valid → Render component
5. If invalid → Clear auth and redirect to login

### 8.3 Navigation

**Navigation Menu** (role-based):

| Feature | Admin | Recruiter | Hiring Manager | Route |
|---------|-------|-----------|----------------|-------|
| Dashboard | ✅ | ✅ | ✅ | `/dashboard` |
| Jobs | ✅ | ✅ | ✅ | `/jobs` |
| Candidates | ✅ | ✅ | `/candidates` |
| Billing | ✅ | ❌ | `/billing` |
| Settings | ✅ | ✅ | `/settings` |

---

## 9. Authentication & Authorization

### 9.1 Authentication Flow

**Registration** (`pages/Register.tsx`):
1. User fills form: email, password, name, company details
2. Frontend validates with Zod schema
3. POST `/api/auth/register`
4. Backend creates Company + Admin User (transaction)
5. Backend returns JWT token + user/company data
6. Frontend stores token in localStorage
7. Frontend sets AuthContext state
8. Redirect to dashboard

**Login** (`pages/Login.tsx`):
1. User enters email + password
2. POST `/api/auth/login`
3. Backend validates credentials, generates JWT
4. Frontend stores token in localStorage
5. Frontend sets AuthContext state
6. Redirect to dashboard

**Logout**:
1. Clear localStorage (token)
2. Clear AuthContext state
3. Invalidate all TanStack Query cache
4. Redirect to `/`

### 9.2 Authorization (Role-Based)

**Frontend-Level**:
- `ProtectedRoute` component checks authentication
- Navigation conditionally renders based on role
- Components show/hide actions based on role

**Backend-Level** (source of truth):
- All endpoints check JWT and companyId for tenant isolation
- Recruiters limited to assigned jobs
- Admins have full access
- Admins have full access

**Note**: Frontend checks are UX only, backend enforces security.

### 9.3 Session Management

**Token Storage**:
- Access token: localStorage (short-lived, 1 hour)
- Refresh token: localStorage (long-lived, 7 days)

**Auto-Refresh**:
- Before access token expires, client proactively refreshes
- Fallback: On 401 error, attempt refresh

**Session Expiry**:
- After 7 days of inactivity, user must re-login
- No "Remember Me" (tokens are already long-lived)

---

## 10. Real-Time Updates

### 10.1 Polling Strategy

**Auto-Refresh for Dynamic Data**:

| Hook | Refresh Interval | Purpose |
|------|------------------|---------|
| `useCandidates` | 30 seconds | Update candidate status changes |
| `useInterviews` | 30 seconds | Update interview completions |
| `useDashboard` | 60 seconds | Update metrics |

**Implementation**:
```typescript
const { data: candidates } = useQuery({
  queryKey: ['candidates'],
  queryFn: candidateService.getCandidates,
  refetchInterval: 30000,  // Poll every 30 seconds
});
```

**Benefits**:
- Simple implementation
- Reliable for status updates
- Low server load with reasonable intervals
});
```

---

## 11. Feature Implementations

### 11.1 Dashboard Optimization

**Problem**: V1 made 4+ separate API calls on dashboard load (slow, high latency).

**Solution**: Single optimized endpoint (`/api/v1/dashboard/admin`).

**Frontend Hook** (`hooks/use-dashboard-query.ts`):
```typescript
export const useDashboardQuery = (filters: DashboardFilters) => {
  return useQuery({
    queryKey: ['dashboard', filters.month, filters.year],
    queryFn: () => dashboardApi.getDashboardStats(filters),
    staleTime: 30 * 1000,      // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30s
  });
};
```

**Data Returned** (single API call):
- Total candidates, active jobs, interviews scheduled
- Candidate pipeline distribution (chart data)
- Interview success rate (pie chart)
- CV scores distribution
- Top performing jobs by candidate count
- Recent candidate applications

**Performance Gain**: Reduces multiple API calls to single aggregated endpoint.

---

## 12. Future Enhancements

### 12.1 Advanced Features (Planned)

**Real-Time Notifications:**
- WebSocket connection for live interview status updates
- Candidate application notifications
- Interview completion alerts

**Advanced Analytics:**
- Predictive candidate scoring with ML
- Interview success rate trends
- Department-wise hiring analytics
- Time-to-hire metrics

**Bulk Operations:**
- Bulk candidate import from CSV
- Batch interview scheduling
- Mass email notifications

**Integration Improvements:**
- Calendar integration (Google Calendar, Outlook)
- ATS (Applicant Tracking System) integrations
- Video interview platform webhooks

---

## 13. Development Guidelines

### 13.1 Coding Standards

**TypeScript:**
- Use strict mode (`strict: true` in tsconfig.json)
- Define explicit return types for functions
- Use `interface` for object shapes, `type` for unions/intersections
- Avoid `any`, prefer `unknown` when type is uncertain

**React:**
- Use functional components with hooks
- Extract custom hooks for reusable logic
- Keep components under 250 lines
- Prefer composition over prop drilling (use Context when needed)

**Naming Conventions:**
- Components: PascalCase (`CandidateCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Files: Match export name (`CandidateCard.tsx` exports `CandidateCard`)
- API services: camelCase with `Service` suffix (`candidateService.ts`)

### 13.2 State Management Guidelines

**When to use Context API:**
- Global authentication state (user, company, JWT)
- Theme preferences
- App-wide configuration

**When to use component state:**
- UI state (dialog open/closed, tab selection)
- Form input values (prefer React Hook Form)
- Temporary UI interactions

**Future: TanStack Query for server state:**
- Jobs, candidates, interviews, interviewer profiles
- Dashboard analytics
- Automatic caching, background refetching, optimistic updates

### 13.3 Error Handling

**API Errors:**
```typescript
try {
  const result = await candidateService.addCandidate(data);
  toast({ title: "Success", description: "Candidate added" });
} catch (error) {
  toast({
    title: "Error",
    description: error.message || "Failed to add candidate",
    variant: "destructive"
  });
}
```

**Form Validation:**
- Use Zod schemas for type-safe validation
- Display field-level errors from React Hook Form
- Show summary errors in toast notifications

---

## 14. Performance Optimization

### 14.1 Code Splitting

**Route-Level Splitting:**
```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
const JobDetail = lazy(() => import('./pages/JobDetail'));
const CandidateDetail = lazy(() => import('./pages/CandidateDetail'));
```

**Benefits:**
- Smaller initial bundle
- Faster time-to-interactive
- Load pages only when accessed

### 14.2 Optimization Techniques

**Bundle Size:**
- Tree shaking (Vite + ESBuild automatic)
- Minification (production build)
- Dynamic imports for large components
- Avoid heavy dependencies (moment.js → date-fns)

**Image Optimization:**
- SVG for icons (scalable, small size)
- Lazy loading for images
- Optimized PNG/WebP formats

**Memoization:**
- Use `React.memo()` for expensive components
- Use `useMemo()` for expensive calculations
- Use `useCallback()` for stable function references

---

## 15. Development Workflow

### 15.1 Local Development

---

## Phase 3 Extension (Frontend Requirements): Online AI Voice Interviews (Multi-Agent Interviewers)

**Feature Name:** AI Voice Interview Rounds (Assignable Interviewers)  
**Phase:** 3 (Post v1.5)  
**Scope:** Frontend-only requirement specification (React)  
**Backend dependencies:** AI agent catalog APIs, schedule-ai endpoint, provider webhook ingestion, scorecard review endpoints  
**Email:** Candidate invites sent via platform email engine (UI triggers send)  
**Calendar:** MS365 is NOT used for candidate scheduling here (AI interview uses provider session link)

### 1. UX Goals
1. AI rounds should feel like any other round in the interview loop UI.
2. Recruiters complete the flow with minimal clicks: select agent → schedule → send invite → review scorecard → approve/reject.
3. Candidate join experience remains polished: link → consent → mic test → interview → completion.
4. Governance clarity: AI scorecards labeled clearly and require review before progression.

### 2. Roles & Access Control
- **Admin:** manage AI agent catalog pages.
- **Recruiter:** assign AI agents, schedule AI interviews, review AI scorecards.
- **Hiring Manager:** read-only visibility of AI scorecards/transcripts in decision packs.
- **Interviewer:** not applicable.
- **Candidate:** public join page via signed token.

UI must hide disallowed actions and guard routes with “Not Authorized” messaging when role lacks access.

### 3. Routes (New/Updated)
- Admin: `/admin/ai-agents`, `/admin/ai-agents/new`, `/admin/ai-agents/:id`
- Recruiter: `/applications/:applicationId/interviews/plan` (updated), `/interviews/:interviewId/schedule-ai`, `/scorecards/:scorecardId/review`
- Candidate (public): `/public/ai-interview/:token`

### 4. Navigation Updates
- Recruiter menu adds optional “AI Interviews” filter and “Pending AI Reviews” dashboard widget.
- Admin menu adds “AI Agent Catalog”.

### 5. UI Components

#### 5.1 AI Agent Catalog (Admin)
- **AiAgentListPage** table columns: name, interview types, job families, grades, default scorecard template, status, last updated. Actions: create, edit, toggle active. Filters for type, job family, status, with deactivate confirmation and empty-state CTA.
- **AiAgentForm** fields: immutable `agentId`, `name`, `description`, `interviewTypes[]`, optional `supportedJobFamilies[]`/`supportedGrades[]`, `defaultScorecardTemplateId`, `languageSupport[]` (default `en`), `provider`, `agentVersion`, `voice`, `scriptConfig` (JSON/key-value), `isActive`. Enforce uniqueness, required interview type, scorecard template, and JSON parsing.

#### 5.2 Interview Plan Builder (Recruiter)
- Round editor gains `interviewerType` toggle (`Human`|`AI Agent`).
- If AI selected, display `aiAgentId` dropdown filtered by round type/job family/grade, hide human selectors, show badge (“AI Interview — candidate joins via link”), enforce AI-specific validation.
- Maintain scorecard template requirement and disallow mixed modes within a round.

#### 5.3 Schedule AI Interview
- New `ScheduleAiInterviewPage`/modal handles provider session creation. Fields: `scheduledAt`, read-only `timezone`, `durationMin`, `candidateEmail`/`candidatePhone`, `sendInviteNow`, `emailTemplateId`, subject/body editor with merge tags, toggles for prep notes, optional `rescheduleReason`. Outputs join URL + provider session id. Validate future datetimes, duration bounds, invite template presence, and reschedule reason. Provide guided steps, retry for provider downtime, and resend flow if email fails.

#### 5.4 Interview Detail Page
- When round is AI: show agent name/version, schedule info, join URL, status badges (`Scheduled`, `In Progress`, `Completed`, `Failed`), flags (`Awaiting Results`, `Scorecard Pending Review`). Actions: reschedule, resend invite, cancel session (if API allows).

#### 5.5 AI Scorecard Review
- `AiScorecardReviewPage` sections: header (candidate, requisition, agent, status), transcript summary with key quotes/audio link, rubric display with ratings/evidence/confidence, flags/noise indicators, reviewer actions (approve, reject with reason + next action, request manual interview, re-run AI). Enforce min 10 characters for rejection reason and disable approve if backend flags missing evidence.

#### 5.6 Decision Pack View
- Render AI rounds as “AI Voice Interview — {Agent}” with scores, evidence, summary, reviewer approval metadata, and flags. If review pending, show blocking banner and disable decision submission per policy.

#### 5.7 Dashboard Widgets (Recommended)
- Recruiter: cards for “AI Interviews scheduled today”, “AI Scorecards pending review”, “AI Interviews needing reschedule”.
- Admin (optional future): agent usage analytics.

### 6. Candidate Public Join Page
- Route `/public/ai-interview/:token` with component `PublicAiInterviewJoinPage` supporting states: loading/token validation, consent + mic test, ready, in-interview, completion.
- Consent checkboxes for recording/processing, mic permission guidance, start button once ready, minimal status UI while session runs, completion thank-you screen. Handle expired tokens, network failures, and show `noindex` meta to prevent indexing.

### 7. State & API Contracts
- New types: `AiAgent`, `AiInterviewSession`, `AiScorecardReview`, `VoiceInterviewArtifact` (summary/transcript/flags/confidence).
- API service additions: `getAiAgents`, `createAiAgent`, `updateAiAgent`, `scheduleAiInterview`, `resendAiInvite`, `getScorecard`, `approveAiScorecard`, `rejectAiScorecard`, `validatePublicInterviewToken`, `getPublicInterviewSession`.
- Provide inline errors, toasts on failures, and retries for provider issues.

### 8. Global Validations & Badges
- Block decision finalization if required scorecards missing or AI reviews pending.
- Standard badges: `AI`, `Pending Review`, `Approved`, `Rejected`, `Low Confidence`, `Noise Detected`.

### 9. Acceptance Criteria
1. Recruiters can assign AI agents to rounds and save plans.
2. Recruiters can schedule AI interviews, generate join links, and send invites.
3. Candidates can complete interviews via the public join page with consent + mic test.
4. Recruiters can review AI scorecards and approve/reject with appropriate actions.
5. Decision packs surface AI rounds and block decisions while reviews are pending (per policy).
6. Admins can create/edit AI agents and map them to scorecard templates.

**Prerequisites:**
```bash
# Install dependencies
npm install

# Set environment variables
VITE_API_URL=http://localhost:8000
```

**Start Dev Server:**
```bash
npm run dev
bun dev
```

**Access**:
- Frontend: `http://localhost:5173`
- Backend (must be running): `http://localhost:8000`

**Hot Module Replacement**:
- Vite HMR updates components instantly without full page reload
- CSS changes apply without refresh

### 13.2 Testing Strategy

**Unit Tests** (Jest + React Testing Library):
- Test individual components in isolation
- Mock API calls
- Focus on user interactions

**Integration Tests**:
- Test component + hook integration
- Use TanStack Query with mock data
- Verify optimistic updates and error handling

**E2E Tests** (Cypress / Playwright):
- Full user flows (login, create client, deploy batch, etc.)
- Test against real backend (staging environment)

**Current Status**: Test suite in progress.

### 13.3 Linting & Formatting

**ESLint**:
```bash
npm run lint
```

**Config** (`eslint.config.js`):
- React plugin (hooks rules)
- TypeScript plugin
- Import order rules

**Prettier** (via ESLint):
- Consistent formatting
- Runs on save (VSCode)

### 13.4 Build & Deployment

**Production Build**:
```bash
npm run build
# Output: dist/
```

**Preview Build**:
```bash
npm run preview
# Serves dist/ at http://localhost:4173
```

**Deployment**:
- Build output (`dist/`) uploaded to static hosting (Vercel, Netlify, S3 + CloudFront)
- Environment variables configured in hosting platform
- API_URL points to production backend

---

## Summary

### Key Achievements

| Capability | Implementation | Status |
|-----------|----------------|--------|
| **Authentication** | JWT-based with React Context | ✅ Production |
| **Type Safety** | TypeScript strict mode with full API types | ✅ Production |
| **Role-Based Access** | Admin, Recruiter, Hiring Manager roles | ✅ Production |
| **Job Management** | Full CRUD with assignment tracking | ✅ Production |
| **Candidate Management** | CV upload, scoring, status pipeline | ✅ Production |
| **Interview Scheduling** | Authorization workflow with external platform | ✅ Production |
| **CV Analysis** | AI-powered parsing and scoring | ✅ Production |
| **Subscription Management** | Stripe integration with credit tracking | ✅ Production |
| **Dashboard Analytics** | Real-time stats and metrics | ✅ Production |
| **Theme Support** | Responsive design with shadcn-ui | ✅ Production |

### Technology Benefits

| Technology | Key Benefit |
|-----------|-------------|
| **React 18** | Concurrent rendering, automatic batching |
| **TypeScript** | Catch errors at compile time, better IDE support |
| **React Context API** | Simple global state for auth and company data |
| **React Hook Form + Zod** | Performant forms with type-safe validation |
| **Vite** | Fast dev server with instant HMR |
| **shadcn-ui** | Customizable components without dependency bloat |
| **Tailwind CSS** | Rapid UI development, consistent design system |

### Future Enhancements

1. **WebSocket Integration**: Replace polling with real-time WebSocket events
2. **Advanced Caching**: Implement service worker for offline support
3. **E2E Test Suite**: Comprehensive Playwright test coverage
4. **Accessibility**: Full WCAG 2.1 AA compliance
5. **Internationalization**: Multi-language support (i18next)
6. **Analytics**: User behavior tracking (Plausible/Mixpanel)
7. **Progressive Web App**: Installable app with push notifications

---

**Document Version**: 2.0  
**Last Updated**: December 31, 2025  
**Maintained By**: Magic-Hire / i79Engage Development Team

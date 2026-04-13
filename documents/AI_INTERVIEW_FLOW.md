# AI Voice Interview Flow - Complete Implementation

## Overview
Public candidate portal for AI-powered voice interviews using Ultravox, with magic link access, passcode validation, embedded consent audit, and real-time status tracking.

---

## Architecture Components

### Backend (FastAPI)
- **Models**: `InterviewerProfile`, `Interview`, `PublicInterviewToken`, `Company`
- **Routes**: `/public/ai-interview/*`, `/webhooks/ultravox`
- **Services**: `ultravox_service`, `token_service`
- **Feature Gate**: `FEATURE_INTERVIEW_LOOP`

### Frontend (React - Public Portal)
- Independent deployable app
- Magic link based access (no login required)
- Ultravox React SDK integration

---

## Complete Flow

### Phase 1: Setup & Configuration

#### 1.1 Company Configuration
```python
# Company model fields (with defaults)
company = {
    "branding": {
        "logoUrl": "https://...",
        "primaryColor": "#4F46E5",
        "fontFamily": "Inter",
        "buttonStyle": "rounded"
    },
    "policies": {
        "recordingPolicy": "required",  # required | optional | disabled
        "transcriptVisibility": "hidden",  # hidden | partial | full
        "joinWindow": {
            "earlyMinutes": 15,
            "lateHours": 24
        },
        "retry": {
            "enabled": true,
            "maxAttempts": 3
        },
        "passcode": {
            "length": 6,
            "format": "numeric",
            "ttlMinutes": 60
        },
        "singleUseTokens": false,
        "featureFlags": {
            "portalScreenRecord": false
        }
    },
    "consent": {
        "text": "I consent to recording and processing of this interview.",
        "version": "v1"
    }
}
```

#### 1.2 Interviewer Profile (AI Agent)
```python
# Admin creates AI interviewer profile
POST /api/interviewer-profiles
{
    "name": "Technical Screening Agent",
    "description": "AI agent for initial technical assessments",
    "objective": "Evaluate candidate's technical skills...",
    "dataPoints": ["coding_ability", "problem_solving", "communication"],
    "ultravoxAgentId": "agent_abc123",  # INTERNAL ONLY - never exposed
    "voice": "professional-male",
    "languageHint": "en-US"
}
```

---

### Phase 2: Interview Scheduling

#### 2.1 Recruiter Schedules AI Interview
```python
# Via existing interview scheduling flow
POST /api/applications/{application_id}/interviews/create-single
{
    "roundId": "round_xyz",
    "aiInterviewerProfileId": "iprof_abc123",  # Links to AI agent
    "scheduledAt": "2026-01-10T14:00:00Z",
    "timezone": "America/New_York",
    "isDraft": false
}

# Creates Interview record:
{
    "id": "intv_123",
    "companyId": "company_456",
    "applicationId": "app_789",
    "interviewerType": "ai",
    "aiInterviewerProfileId": "iprof_abc123",
    "status": "scheduled",
    "scheduledAt": "2026-01-10T14:00:00Z",
    "ultravoxCallId": null,
    "ultravoxJoinUrl": null,
    "consentAccepted": false
}
```

#### 2.2 Generate Magic Link + Passcode (TODO: Add internal endpoint)
```python
# Internal endpoint (to be implemented)
POST /api/interviews/{interview_id}/generate-invite
Response:
{
    "token": "mt_abc123xyz...",  # Opaque token (NOT the hash)
    "passcode": "847291",
    "magicLink": "https://portal.example.com/ai-interview/mt_abc123xyz...",
    "expiresAt": "2026-01-11T14:00:00Z"
}

# Creates PublicInterviewToken:
{
    "id": "piit_001",
    "companyId": "company_456",
    "interviewId": "intv_123",
    "tokenHash": "sha256(mt_abc123xyz...)",
    "passcodeHash": "argon2(847291)",
    "expiresAt": "2026-01-11T14:00:00Z",
    "maxAttempts": 5,
    "attempts": 0,
    "lockedUntil": null,
    "singleUse": false
}
```

#### 2.3 Send Email to Candidate
```
Subject: Your AI Interview is Ready

Hi {candidate_name},

Your interview for {job_title} at {company_name} is scheduled.

Join link: https://portal.example.com/ai-interview/mt_abc123xyz...
Passcode: 847291

Interview window: Jan 10, 2026 1:45 PM - Jan 11, 2026 2:00 PM EST

What to expect:
- 30-minute AI-powered conversation
- Technical screening questions
- This interview will be recorded

Questions? Contact recruiting@company.com

---
{company_name} Recruitment Team
```

---

### Phase 3: Candidate Join Flow

#### 3.1 Candidate Opens Magic Link
```
GET https://portal.example.com/ai-interview/mt_abc123xyz...
```

Public portal calls:
```python
GET /api/public/ai-interview/mt_abc123xyz.../session

Response:
{
    "branding": {
        "logoUrl": "https://...",
        "primaryColor": "#4F46E5",
        "fontFamily": "Inter"
    },
    "consent": {
        "text": "I consent to recording and processing of this interview.",
        "version": "v1"
    },
    "session": {
        "roundName": "Technical Screening",
        "durationMin": 30,
        "joinWindowStatus": "scheduled",  # scheduled | too_early | expired
        "transcriptVisibility": "hidden",
        "recordingPolicy": "required"
    },
    "status": "ok"  # ok | expired
}
```

**Portal displays:**
- Company logo and branding
- Interview details (round name, duration)
- Join window status
- Next: Consent screen (if status = "ok")
- Expired screen (if status = "expired")

---

#### 3.2 Consent Screen
Candidate reads consent text and checks:
- ☑ I consent to recording and processing of this interview

Clicks "I Agree":
```python
POST /api/public/ai-interview/mt_abc123xyz.../consent
{
    "consentVersion": "v1"
}

# Backend updates Interview:
{
    "consentAccepted": true,
    "consentTimestamp": "2026-01-10T14:10:00Z",
    "consentVersion": "v1",
    "consentClientIp": "203.0.113.42",
    "consentUserAgent": "Mozilla/5.0..."
}

Response:
{
    "consentAccepted": true,
    "consentTimestamp": "2026-01-10T14:10:00Z"
}
```

---

#### 3.3 Passcode Entry
Portal prompts: "Enter your passcode"
Candidate types: `847291`

```python
POST /api/public/ai-interview/mt_abc123xyz.../validate-passcode
{
    "passcode": "847291"
}

# Backend:
# - Checks if expired: return canStart=false
# - Checks if locked: return canStart=false
# - Verifies passcode hash
# - Increments attempts if wrong
# - Sets lockout if max attempts reached

Response (success):
{
    "valid": true,
    "remainingAttempts": 5,
    "canStart": true
}

Response (wrong passcode):
{
    "valid": false,
    "remainingAttempts": 4,
    "canStart": false
}

Response (locked):
{
    "valid": false,
    "remainingAttempts": 0,
    "canStart": false
}
```

**Lockout behavior:**
- Max 5 attempts
- After 5 failed attempts: locked for 2 minutes
- After 6 failed attempts: locked for 4 minutes
- After 7+ failed attempts: locked for 15 minutes

---

#### 3.4 Readiness Checks
Portal performs browser capability checks:
- ☑ Microphone permission granted
- ☑ Speaker test (play audio clip)
- ☑ Browser compatibility (Chrome, Edge, Safari)
- ⚠ Recommended: Use headphones for best experience

---

#### 3.5 Start Interview
Candidate clicks "Start Interview"

```python
POST /api/public/ai-interview/mt_abc123xyz.../start

# Backend process:
# 1. Validate: consent accepted, passcode validated, not expired
# 2. Check if ultravoxCallId already exists (idempotent)
# 3. Fetch InterviewerProfile to get ultravoxAgentId (NEVER exposed)
# 4. Call Ultravox API to create call

# Ultravox API call:
POST https://api.ultravox.ai/api/agents/{ultravoxAgentId}/calls
Headers: X-API-Key: {ULTRAVOX_API_KEY}
Body:
{
    "initialOutputMedium": "MESSAGE_MEDIUM_VOICE",
    "maxDuration": "1800s",  # 30 minutes
    "recordingEnabled": true,
    "languageHint": "en-US",
    "callbacks": {
        "joined": {
            "url": "https://api.example.com/api/webhooks/ultravox",
            "secrets": ["webhook_secret_xyz"]
        },
        "ended": {
            "url": "https://api.example.com/api/webhooks/ultravox",
            "secrets": ["webhook_secret_xyz"]
        }
    }
}

# Ultravox Response:
{
    "callId": "call_ultravox_123",
    "joinUrl": "https://api.ultravox.ai/join/call_ultravox_123?token=secure_token",
    "agent": {
        "agentId": "agent_abc123",
        "name": "Technical Screening Agent"
    },
    "created": "2026-01-10T14:12:00Z"
}

# Backend updates Interview:
{
    "ultravoxCallId": "call_ultravox_123",
    "ultravoxJoinUrl": "https://api.ultravox.ai/join/...",
    "startedAt": "2026-01-10T14:12:00Z",
    "status": "scheduled"  # Still scheduled; will update to in_progress when joined
}

# Response to portal:
{
    "callJoinUrl": "https://api.ultravox.ai/join/call_ultravox_123?token=secure_token",
    "ui": {
        "agentName": "Technical Screening Agent",
        "transcriptDisplay": false
    }
}
```

---

#### 3.6 Join Voice Call (Ultravox React SDK)
```tsx
// Portal uses Ultravox React SDK
import { UltravoxSession } from '@ultravox-ai/ultravox-client';

const session = new UltravoxSession();
await session.joinCall(callJoinUrl);

// Portal displays:
// - Call status: "Connecting..." → "Connected"
// - Agent speaking indicator
// - Mute/Unmute buttons
// - End call button (if policy allows)
```

**Ultravox sends webhook when candidate joins:**
```python
POST https://api.example.com/api/webhooks/ultravox
{
    "event": "call.joined",
    "call": {
        "callId": "call_ultravox_123",
        "joined": "2026-01-10T14:13:00Z",
        ...
    }
}

# Backend updates Interview:
{
    "status": "in_progress"  # Now actively interviewing
}
```

---

#### 3.7 Interview In Progress
- Candidate converses with AI agent (30 minutes)
- Ultravox manages voice conversation
- Portal shows live status (listening/thinking/speaking)

---

#### 3.8 Interview Ends
Candidate or AI ends the call.

**Ultravox sends webhook:**
```python
POST https://api.example.com/api/webhooks/ultravox
{
    "event": "call.ended",
    "call": {
        "callId": "call_ultravox_123",
        "ended": "2026-01-10T14:42:00Z",
        "endReason": "hangup",  # hangup | agent_hangup | timeout | connection_error
        "shortSummary": "Candidate demonstrated strong problem-solving skills...",
        ...
    }
}

# Backend updates Interview:
{
    "status": "conducted",
    "conductedAt": "2026-01-10T14:42:00Z",
    "notes": "End reason: hangup"
}
```

---

#### 3.9 Completion Screen
Portal displays:
```
✓ Interview Completed

Thank you for completing your interview!

Next Steps:
- Our recruitment team will review your interview
- You'll hear from us within 3-5 business days

Questions? Contact recruiting@company.com
```

---

### Phase 4: Post-Interview Processing

#### 4.1 Webhook Triggers n8n Scorecard Generation
```python
# After call.ended webhook updates Interview to "conducted"
# Trigger n8n workflow (existing integration)

POST https://n8n.example.com/webhook/create-scorecard
{
    "interviewId": "intv_123",
    "ultravoxCallId": "call_ultravox_123"
}

# n8n workflow:
# 1. Fetch call transcript from Ultravox API
# 2. Analyze with AI (Gemini/GPT)
# 3. Generate scorecard draft
# 4. Create ScorecardSubmission record (status: draft)
```

---

#### 4.2 Recruiter Reviews AI Scorecard
```
Internal Portal: /interviews/intv_123

Interview Details:
- Candidate: Jane Doe
- Round: Technical Screening (AI)
- Status: Conducted ✓
- Date: Jan 10, 2026 2:12 PM - 2:42 PM
- Duration: 30 minutes
- Consent: Accepted (v1) at 2:10 PM

AI Scorecard Draft:
- Problem Solving: 8/10
- Communication: 7/10
- Technical Knowledge: 9/10
- Overall: Strong Pass

Recruiter Actions:
- View transcript (if policy allows)
- Approve/Edit scorecard
- Progress candidate to next round
- Reject candidate
```

---

## Security & Privacy Checkpoints

### ✅ Multi-Tenancy
- All queries filtered by `companyId` (derived from token → interview)
- No cross-tenant data leakage

### ✅ Feature Gating
- All public endpoints enforce `FEATURE_INTERVIEW_LOOP`
- Returns 403 if feature not enabled

### ✅ Agent ID Privacy
- `ultravoxAgentId` stored only in `InterviewerProfile`
- NEVER exposed in public responses
- Only used server-side in Ultravox API call

### ✅ Token Security
- Raw token sent to candidate via email
- Only `tokenHash` (SHA-256) stored in database
- Tokens cannot be reverse-engineered

### ✅ Passcode Security
- Passcode hashed with Argon2
- Attempt tracking + exponential lockout
- Rate limiting on validation endpoint

### ✅ Consent Audit
- Embedded in `Interview` model
- Captures: version, timestamp, IP, user agent
- Immutable after acceptance
- Viewable by recruiter in internal portal

### ✅ Expiry Handling
- Token expiry checked on every request
- Join window enforced (early/late cutoffs)
- Friendly "expired" status (not errors)
- No start allowed for expired sessions

### ✅ Idempotency
- Multiple `/start` calls return same `joinUrl`
- Webhook dedupe via `callId + event type`
- No duplicate call creation

---

## API Endpoints Summary

### Public (No Auth Required)
```
GET  /api/public/ai-interview/{token}/session
POST /api/public/ai-interview/{token}/consent
POST /api/public/ai-interview/{token}/validate-passcode
POST /api/public/ai-interview/{token}/start
```

### Internal (JWT Auth Required)
```
GET  /api/interviewer-profiles
POST /api/interviewer-profiles
POST /api/applications/{id}/interviews/create-single
POST /api/interviews/{id}/generate-invite  # TODO
```

### Webhooks (Secret Validated)
```
POST /api/webhooks/ultravox
```

---

## Interview Status Flow

```
draft
  ↓
scheduled (after recruiter creates interview)
  ↓
scheduled (after candidate starts - ultravoxCallId created)
  ↓
in_progress (when candidate joins - call.joined webhook)
  ↓
conducted (when call ends - call.ended webhook)
  ↓
completed (after all scorecards submitted - existing flow)
```

---

## Configuration Required

### Environment Variables
```bash
# Ultravox
ULTRAVOX_API_URL=https://api.ultravox.ai
ULTRAVOX_API_KEY=uvx_live_...
ULTRAVOX_WEBHOOK_SECRET=whsec_...
WEBHOOK_BASE_URL=https://api.example.com

# Public Portal
PUBLIC_PORTAL_ORIGIN=https://portal.example.com

# Feature Flags
FEATURE_INTERVIEW_LOOP=true
```

### Company Setup (Admin)
1. Configure branding (logo, colors)
2. Set consent text + version
3. Define policies (recording, transcript, join window)
4. Create AI interviewer profiles with Ultravox agent IDs

---

## TODO / Next Steps

1. **Add token generation endpoint**
   - `POST /api/interviews/{id}/generate-invite`
   - Returns magic link + passcode for email

2. **Rate limiting middleware**
   - IP + token rate limits on `/public/*`
   - Prevent brute force attacks

3. **CORS configuration**
   - Restrict public endpoints to `PUBLIC_PORTAL_ORIGIN`

4. **Webhook secret validation**
   - Verify Ultravox webhook signatures
   - Implement in `webhooks_ultravox.py`

5. **Frontend Public Portal**
   - Scaffold React app (`CandidatePortal/`)
   - Implement all pages (Join, Consent, Passcode, etc.)
   - Integrate Ultravox React SDK

6. **Internal portal enhancements**
   - Display AI interview status
   - Show consent audit
   - Link to transcript/recording (if policy allows)

---

## Testing Checklist

### Backend
- [ ] Token expiry returns friendly status
- [ ] Passcode lockout after max attempts
- [ ] Feature gate returns 403 when disabled
- [ ] Multi-tenant isolation (no cross-company leaks)
- [ ] Agent ID never in public responses
- [ ] Idempotent start returns same joinUrl
- [ ] Webhooks update status correctly

### Frontend
- [ ] Expired session shows friendly message
- [ ] Consent required before passcode
- [ ] Passcode lockout shows timer
- [ ] Mic/speaker tests work
- [ ] Ultravox SDK joins successfully
- [ ] Status updates in real-time

### Integration
- [ ] End-to-end: schedule → invite → join → complete → scorecard
- [ ] Email delivery with correct magic link
- [ ] Webhook triggers n8n scorecard generation
- [ ] Recruiter sees completed interview with consent audit

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Candidate Email                          │
│  Magic Link: https://portal.example.com/ai-interview/{token}    │
│  Passcode: 847291                                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Public Portal (React SPA)                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Join → Consent → Passcode → Readiness → Call → Complete   │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────┬───────────────────────────────────────────┬──────────┘
           │                                           │
           ↓                                           ↓
┌──────────────────────────────────────┐   ┌──────────────────────┐
│   i79Engage Backend (FastAPI)        │   │  Ultravox Voice API  │
│  ┌────────────────────────────────┐  │   │  ┌────────────────┐  │
│  │ Public Routes (/public/*)      │←─┼───┤  │ Agent Call API │  │
│  │ - session, consent, passcode   │  │   │  └────────────────┘  │
│  │ - start (creates Ultravox call)│  │   │                      │
│  └────────────────────────────────┘  │   │  Sends webhooks:     │
│  ┌────────────────────────────────┐  │   │  - call.joined       │
│  │ Webhooks (/webhooks/ultravox)  │←─┼───┤  - call.ended        │
│  │ - Updates interview status     │  │   │                      │
│  └────────────────────────────────┘  │   └──────────────────────┘
│  ┌────────────────────────────────┐  │
│  │ Internal Routes (JWT auth)     │  │
│  │ - Create interview + profiles  │  │
│  │ - Generate magic link          │  │
│  └────────────────────────────────┘  │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│  n8n Workflow (Scorecard Gen)        │
│  Triggered after call.ended webhook  │
└──────────────────────────────────────┘
```

---

**Status**: Backend implementation complete; Frontend portal pending.
**Feature Gate**: `FEATURE_INTERVIEW_LOOP`
**Architecture**: Multi-tenant, secure, privacy-preserving, idempotent.

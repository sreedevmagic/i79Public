# AI Voice Interview - Implementation Guide

## Quick Start

### 1. Environment Setup

Add to `.env`:
```bash
# Ultravox Configuration
ULTRAVOX_API_URL=https://api.ultravox.ai
ULTRAVOX_API_KEY=your_ultravox_api_key_here
ULTRAVOX_WEBHOOK_SECRET=your_webhook_secret_here

# Public Portal
PUBLIC_PORTAL_ORIGIN=https://portal.yourcompany.com
WEBHOOK_BASE_URL=https://api.yourcompany.com

# Feature Flags
FEATURE_INTERVIEW_LOOP=true
```

### 2. Database Indexes

New collections will auto-create on first use. Ensure MongoDB is running:
```bash
# Verify MongoDB connection
mongo mongodb://your-connection-string
```

### 3. Start Backend

```bash
cd Backend
uvicorn app.main:app --reload --port 8000
```

---

## API Usage Examples

### Admin: Create AI Interviewer Profile

```bash
curl -X POST http://localhost:8000/api/interviewer-profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Technical Screening Agent",
    "description": "AI agent for initial technical assessments",
    "objective": "Evaluate candidates technical skills in Python, algorithms, and system design",
    "dataPoints": ["coding_ability", "problem_solving", "communication"],
    "ultravoxAgentId": "agent_abc123xyz",
    "voice": "professional-male",
    "languageHint": "en-US"
  }'
```

**Response:**
```json
{
  "id": "iprof_xyz",
  "companyId": "company_123",
  "name": "Technical Screening Agent",
  "description": "AI agent for initial technical assessments",
  "objective": "Evaluate candidates technical skills...",
  "dataPoints": ["coding_ability", "problem_solving", "communication"],
  "usageCount": 0,
  "createdAt": "2026-01-07T10:00:00Z",
  "updatedAt": "2026-01-07T10:00:00Z"
}
```

**Note:** `ultravoxAgentId` is NOT returned in responses (internal only).

---

### Recruiter: Schedule AI Interview (Auto-Generates Invite)

**Note:** Magic link + passcode are **automatically generated** when scheduling AI interviews!

```bash
curl -X POST http://localhost:8000/api/applications/app_123/interviews/create-single \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roundId": "round_xyz",
    "aiInterviewerProfileId": "iprof_xyz",
    "scheduledAt": "2026-01-10T14:00:00Z",
    "timezone": "America/New_York",
    "isDraft": false
  }'
```

**Response (includes `inviteData` for AI interviews):**
```json
{
  "id": "intv_456",
  "companyId": "company_123",
  "applicationId": "app_123",
  "requisitionId": "req_789",
  "candidateName": "Jane Doe",
  "candidateEmail": "jane@example.com",
  "roundName": "Technical Screening",
  "roundType": "technical",
  "interviewerType": "ai",
  "status": "scheduled",
  "scheduledAt": "2026-01-10T14:00:00Z",
  "timezone": "America/New_York",
  "durationMin": 30,
  "createdAt": "2026-01-07T10:05:00Z",
  "inviteData": {
    "candidateName": "Jane Doe",
    "candidateEmail": "jane@example.com",
    "companyName": "TechCorp",
    "jobTitle": "Senior Software Engineer",
    "roundName": "Technical Screening",
    "scheduledAt": "2026-01-10T14:00:00Z",
    "timezone": "America/New_York",
    "durationMin": 30,
    "magicLink": "https://portal.yourcompany.com/ai-interview/mt_abc123xyz...",
    "passcode": "847291",
    "expiresAt": "2026-01-08T10:05:00Z",
    "supportEmail": null
  }
}
```

**Use `inviteData` to send candidate email immediately!**

---

### Recruiter: Regenerate Invite (Optional)

**Only needed if:**
- Token expired (generate new)
- Resend email to candidate
- Update expiry duration

```bash
curl -X POST http://localhost:8000/api/interviews/intv_456/generate-invite \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expiresInHours": 48,
    "passcodeLength": 6
  }'
```

**Response:**
```json
{
  "token": "mt_newtoken...",
  "passcode": "123456",
  "magicLink": "https://portal.yourcompany.com/ai-interview/mt_newtoken...",
  "expiresAt": "2026-01-09T10:05:00Z",
  "emailData": {
    "candidateName": "Jane Doe",
    "candidateEmail": "jane@example.com",
    "companyName": "TechCorp",
    "jobTitle": "Senior Software Engineer",
    "roundName": "Technical Screening",
    "scheduledAt": "2026-01-10T14:00:00Z",
    "timezone": "America/New_York",
    "durationMin": 30,
    "magicLink": "https://portal.yourcompany.com/ai-interview/mt_newtoken...",
    "passcode": "123456",
    "expiresAt": "2026-01-09T10:05:00Z",
    "supportEmail": null
  }
}
```

---

## Public Candidate Flow (No Auth)

### 1. Get Session Info

```bash
curl http://localhost:8000/api/public/ai-interview/mt_abc123xyz.../session
```

**Response:**
```json
{
  "branding": {
    "logoUrl": "https://...",
    "primaryColor": "#4F46E5",
    "fontFamily": "Inter",
    "buttonStyle": "rounded"
  },
  "consent": {
    "text": "I consent to recording and processing of this interview.",
    "version": "v1"
  },
  "session": {
    "roundName": "Technical Screening",
    "durationMin": 30,
    "joinWindowStatus": "scheduled",
    "transcriptVisibility": "hidden",
    "recordingPolicy": "required"
  },
  "status": "ok"
}
```

**`joinWindowStatus` values:**
- `scheduled` - Within join window, can proceed
- `too_early` - Before early join time
- `expired` - Past expiry time

**`status` values:**
- `ok` - Can proceed with consent/passcode
- `expired` - Show friendly expired message

---

### 2. Submit Consent

```bash
curl -X POST http://localhost:8000/api/public/ai-interview/mt_abc123xyz.../consent \
  -H "Content-Type: application/json" \
  -d '{
    "consentVersion": "v1"
  }'
```

**Response:**
```json
{
  "consentAccepted": true,
  "consentTimestamp": "2026-01-10T13:50:00Z"
}
```

---

### 3. Validate Passcode

```bash
curl -X POST http://localhost:8000/api/public/ai-interview/mt_abc123xyz.../validate-passcode \
  -H "Content-Type: application/json" \
  -d '{
    "passcode": "847291"
  }'
```

**Response (success):**
```json
{
  "valid": true,
  "remainingAttempts": 5,
  "canStart": true
}
```

**Response (wrong passcode):**
```json
{
  "valid": false,
  "remainingAttempts": 4,
  "canStart": false
}
```

**Response (locked out):**
```json
{
  "valid": false,
  "remainingAttempts": 0,
  "canStart": false
}
```

**Lockout behavior:**
- Exponential backoff: 2 min, 4 min, 8 min, 15 min (max)

---

### 4. Start Interview (Create Ultravox Call)

```bash
curl -X POST http://localhost:8000/api/public/ai-interview/mt_abc123xyz.../start
```

**Response:**
```json
{
  "callJoinUrl": "https://api.ultravox.ai/join/call_ultravox_123?token=secure_token",
  "ui": {
    "agentName": "Technical Screening Agent",
    "transcriptDisplay": false
  }
}
```

**Frontend uses `callJoinUrl` with Ultravox React SDK to join the voice call.**

---

## Webhook Events

Ultravox sends webhooks to: `https://api.yourcompany.com/api/webhooks/ultravox`

### call.joined

```json
{
  "event": "call.joined",
  "call": {
    "callId": "call_ultravox_123",
    "joined": "2026-01-10T14:00:30Z",
    ...
  }
}
```

**Backend action:** Updates interview status to `in_progress`

---

### call.ended

```json
{
  "event": "call.ended",
  "call": {
    "callId": "call_ultravox_123",
    "ended": "2026-01-10T14:30:00Z",
    "endReason": "hangup",
    "shortSummary": "Candidate demonstrated strong problem-solving...",
    ...
  }
}
```

**Backend action:** 
- Updates interview status to `conducted`
- Sets `conductedAt` timestamp
- Stores `endReason` in notes
- Triggers n8n scorecard generation

---

## Testing

### Test Full Flow

```bash
# 1. Create AI interviewer profile (admin)
curl -X POST http://localhost:8000/api/interviewer-profiles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @test-profile.json

# 2. Schedule AI interview (recruiter) - AUTOMATICALLY GENERATES INVITE!
RESPONSE=$(curl -X POST http://localhost:8000/api/applications/app_123/interviews/create-single \
  -H "Authorization: Bearer $RECRUITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d @test-interview.json)

# 3. Extract invite data from response
INTERVIEW_ID=$(echo $RESPONSE | jq -r '.id')
MAGIC_LINK=$(echo $RESPONSE | jq -r '.inviteData.magicLink')
PASSCODE=$(echo $RESPONSE | jq -r '.inviteData.passcode')
TOKEN=$(echo $MAGIC_LINK | sed 's|.*/ai-interview/||')

echo "Interview ID: $INTERVIEW_ID"
echo "Magic Link: $MAGIC_LINK"
echo "Passcode: $PASSCODE"

# 4. Test public flow (no auth)
curl http://localhost:8000/api/public/ai-interview/$TOKEN/session

# 5. Submit consent
curl -X POST http://localhost:8000/api/public/ai-interview/$TOKEN/consent \
  -H "Content-Type: application/json" \
  -d '{"consentVersion": "v1"}'

# 6. Validate passcode
curl -X POST http://localhost:8000/api/public/ai-interview/$TOKEN/validate-passcode \
  -H "Content-Type: application/json" \
  -d "{\"passcode\": \"$PASSCODE\"}"

# 7. Start interview
curl -X POST http://localhost:8000/api/public/ai-interview/$TOKEN/start

# (Optional) 8. Regenerate invite if needed
curl -X POST http://localhost:8000/api/interviews/$INTERVIEW_ID/generate-invite \
  -H "Authorization: Bearer $RECRUITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"expiresInHours": 24}'
```

---

## Security Checklist

- [x] Token hashing (SHA-256) - raw tokens never stored
- [x] Passcode hashing (Argon2) - secure password hashing
- [x] Rate limiting - 10 requests/min per IP+token
- [x] Feature gating - requires FEATURE_INTERVIEW_LOOP
- [x] Multi-tenant isolation - companyId enforced on all queries
- [x] Agent ID privacy - never exposed in public responses
- [x] Consent audit - embedded with IP, user agent, timestamp
- [x] Webhook signature validation - HMAC-SHA256
- [x] Idempotency - safe to retry start endpoint
- [x] Expiry handling - friendly UI messages, not errors

---

## Troubleshooting

### "Feature not enabled for this company"
Enable feature flag:
```bash
# Update company document
db.companies.updateOne(
  { _id: "company_123" },
  { $addToSet: { enabledFeatures: "feature.interview_loop" } }
)
```

### "Agent not configured"
Ensure InterviewerProfile has `ultravoxAgentId`:
```bash
curl -X PUT http://localhost:8000/api/interviewer-profiles/iprof_xyz \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ultravoxAgentId": "agent_abc123"}'
```

### Rate limit exceeded
Wait 60 seconds or adjust rate limit in `app/main.py`:
```python
app.add_middleware(RateLimitMiddleware, requests_per_minute=20)
```

### Webhook signature validation failed
Check webhook secret matches Ultravox configuration:
```bash
# In .env
ULTRAVOX_WEBHOOK_SECRET=same_secret_as_ultravox_dashboard
```

---

## Production Checklist

- [ ] Set `ULTRAVOX_API_KEY` to production key
- [ ] Configure `PUBLIC_PORTAL_ORIGIN` to production domain
- [ ] Enable HTTPS for `WEBHOOK_BASE_URL`
- [ ] Replace in-memory rate limiter with Redis
- [ ] Set up monitoring for webhook failures
- [ ] Configure email service for invite delivery
- [ ] Add company support email to settings
- [ ] Test webhook signature validation
- [ ] Review and adjust rate limits
- [ ] Set up backup/restore for MongoDB
- [ ] Configure CDN for public portal
- [ ] Add observability (logging, metrics, tracing)

---

## Architecture Summary

```
┌─────────────┐
│  Recruiter  │
└──────┬──────┘
       │ (1) Schedule AI Interview (single API call)
       ↓
┌─────────────────────────────────┐
│  i79Engage Backend (FastAPI)    │
│  - Creates Interview record     │
│  - Auto-generates magic link    │  ← NEW: Automatic!
│  - Returns inviteData           │  ← NEW: In response!
└──────┬──────────────────────────┘
       │ (2) Frontend sends email with inviteData
       ↓
┌─────────────┐
│  Candidate  │
└──────┬──────┘
       │ (3) Opens magic link
       ↓
┌─────────────────────────────────┐
│  Public Portal (React)          │
│  - Consent → Passcode → Start   │
└──────┬──────────────────────────┘
       │ (4) POST /start
       ↓
┌─────────────────────────────────┐
│  Backend                        │
│  - Creates Ultravox call        │
│  - Returns joinUrl              │
└──────┬──────────────────────────┘
       │ (5) joinUrl
       ↓
┌─────────────────────────────────┐
│  Ultravox Voice API             │
│  - Manages voice conversation   │
│  - Sends webhooks               │
└──────┬──────────────────────────┘
       │ (6) Webhooks (joined/ended)
       ↓
┌─────────────────────────────────┐
│  Backend                        │
│  - Updates interview status     │
│  - Triggers n8n scorecard       │
└─────────────────────────────────┘

KEY IMPROVEMENT:
✅ Old: 2 API calls (schedule + generate-invite)
✅ New: 1 API call (schedule with auto-generated inviteData)
```

---

## Next Steps

1. **Build Frontend Public Portal**
   - React app with Ultravox SDK
   - Pages: Join, Consent, Passcode, Call, Complete
   - Deploy to CDN

2. **Email Integration**
   - Use `emailData` from generate-invite
   - Send via your email service (SendGrid, SES, etc.)
   - Template with magic link + passcode

3. **Internal Portal Updates**
   - Display AI interview status
   - Show consent audit
   - Link to transcripts (if policy allows)

4. **Production Hardening**
   - Redis-backed rate limiting
   - Enhanced webhook retry logic
   - Monitoring and alerting

---

**Status:** ✅ Backend Implementation Complete  
**Feature Gate:** `feature.interview_loop`  
**Security:** Multi-tenant, rate-limited, consent-audited, agent-private

# Design Decision: Auto-Generate AI Interview Invites

**Date:** 7 January 2026  
**Status:** ✅ Implemented  

---

## Problem

Original design required **2 separate API calls** to schedule an AI interview and send invite to candidate:

```
1. POST /applications/{id}/interviews/create-single
   → Creates Interview record

2. POST /interviews/{id}/generate-invite
   → Generates magic link + passcode
```

**Issues:**
- ❌ **Poor UX**: Recruiters must manually call second endpoint
- ❌ **Easy to forget**: No automatic email trigger
- ❌ **Inconsistent**: Extra step only for AI interviews
- ❌ **API inefficiency**: 2 round trips for 1 logical operation

---

## Solution

**Auto-generate invite when scheduling AI interview.**

### New Flow

```
1. POST /applications/{id}/interviews/create-single
   → Creates Interview record
   → Auto-generates magic link + passcode (for AI interviews only)
   → Returns invite data in response
```

### Response Schema

```typescript
interface InterviewOut {
  id: string;
  companyId: string;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  roundName: string;
  interviewerType: "human" | "ai";
  status: string;
  scheduledAt: string;
  // ... other fields
  
  // NEW: Auto-populated for AI interviews
  inviteData?: {
    candidateName: string;
    candidateEmail: string;
    companyName: string;
    jobTitle: string;
    roundName: string;
    scheduledAt: string;
    timezone: string;
    durationMin: number;
    magicLink: string;       // Full URL
    passcode: string;        // 6-digit code
    expiresAt: string;       // 24h from creation
    supportEmail?: string;
  };
}
```

### Backend Implementation

```python
# In hiring_plan_service.py
async def create_single_interview(...) -> Interview:
    # ... create interview record ...
    
    # Auto-generate invite for AI interviews
    if not is_draft and interviewer_type == "ai":
        try:
            invite_data = await generate_interview_invite(
                interview=interview,
                company=company,
                expires_in_hours=24,  # Default
                passcode_length=6
            )
            # Store as transient attribute (not persisted to DB)
            interview._invite_data = invite_data
        except Exception as e:
            logger.error(f"Failed to auto-generate invite: {e}")
            # Don't fail interview creation
    
    return interview
```

```python
# In applications.py route
interview = await hiring_plan_service.create_single_interview(...)

response = InterviewOut.model_validate(interview, from_attributes=True)

# Include invite data if auto-generated
if hasattr(interview, "_invite_data") and interview._invite_data:
    email_data = await get_email_data_for_interview(...)
    response.inviteData = EmailDataOut(**email_data)

return response
```

---

## Manual Regeneration Endpoint (Kept)

**Use cases for `/interviews/{id}/generate-invite`:**
- Token expired → Generate new with fresh expiry
- Resend email to candidate → Get fresh credentials
- Update expiry duration → Extend deadline

```bash
# Regenerate with custom expiry
POST /interviews/intv_456/generate-invite
{
  "expiresInHours": 48,    # Extend to 2 days
  "passcodeLength": 6
}
```

**Returns:**
```json
{
  "token": "mt_newtoken...",
  "passcode": "123456",
  "magicLink": "https://...",
  "expiresAt": "2026-01-09T10:05:00Z",
  "emailData": { ... }
}
```

---

## Benefits

✅ **Simplified UX**: Single API call schedules + generates invite  
✅ **Immediate email**: Frontend receives all data needed to send candidate email  
✅ **Consistent**: Same flow as MS365 calendar integration (auto-created on schedule)  
✅ **Graceful degradation**: If invite generation fails, interview still created  
✅ **Flexible**: Manual endpoint available for edge cases  

---

## Migration Impact

### Frontend Changes Required

**Before:**
```typescript
// Old flow: 2 API calls
const interview = await interviewService.scheduleAIInterview(data);
const invite = await interviewService.generateInvite(interview.id);
await emailService.sendCandidateInvite(invite.emailData);
```

**After:**
```typescript
// New flow: 1 API call
const interview = await interviewService.scheduleAIInterview(data);

// Invite data auto-populated for AI interviews
if (interview.inviteData) {
  await emailService.sendCandidateInvite(interview.inviteData);
}
```

### Backward Compatibility

✅ **Fully backward compatible**:
- Manual `/generate-invite` endpoint still works
- Response schema only **adds** optional `inviteData` field
- Existing clients ignore unknown fields (JSON tolerance)

---

## Security

**No changes to security model:**
- Token hashing (SHA-256) - raw token never stored
- Passcode hashing (Argon2) - secure password hashing
- Multi-tenant isolation - companyId enforced
- Feature gating - requires `FEATURE_INTERVIEW_LOOP`
- Rate limiting - 10 req/min on public endpoints

---

## Testing Checklist

- [x] Auto-generation for AI interviews
- [x] No generation for human interviews
- [x] No generation for draft interviews
- [x] Graceful failure (interview created even if invite fails)
- [x] Manual regeneration still works
- [x] Response includes inviteData for AI
- [x] Response excludes inviteData for human
- [x] Multi-tenant isolation maintained

---

## Files Changed

```
Backend/app/schemas/interview.py
  - Added `inviteData: EmailDataOut | None` to InterviewOut

Backend/app/services/hiring_plan_service.py
  - Added auto-generation logic in create_single_interview()
  - Sets transient `_invite_data` attribute

Backend/app/api/routes/applications.py
  - Populates inviteData in response if present

Backend/app/api/routes/interviews.py
  - Updated docstring to clarify regeneration use case

Backend/AI_INTERVIEW_API_GUIDE.md
  - Updated examples to show auto-generated inviteData
  - Clarified manual endpoint is for regeneration only
```

---

## Decision Rationale

**Why auto-generate instead of on-demand?**

1. **Scheduling IS the commitment** - Once scheduled, candidate must be notified
2. **Parallel with MS365** - Calendar events auto-created on schedule, invites should too
3. **Reduced complexity** - No "scheduled but not invited" intermediate state
4. **Better UX** - One action in UI instead of two
5. **Fail-safe** - Graceful degradation if email service unavailable

**Why keep manual endpoint?**

1. **Token expiry** - Need to regenerate after 24h
2. **Email failures** - Resend capability
3. **Policy changes** - Update expiry duration
4. **Support requests** - Admin can manually regenerate for candidate

---

**Conclusion:** This design balances automation (default case) with flexibility (edge cases), following the principle of "make common tasks easy, keep rare tasks possible."

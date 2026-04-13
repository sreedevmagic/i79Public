# Implementation Checklist: Interview Correlation & Webhook Flow

**Last Updated:** January 4, 2026  
**Status:** Design Complete - Ready for Implementation

---

## Phase 1: Database & Core Logic Setup

### 1.1 Interview Model Updates

- [ ] Add `conductedAt: datetime | None` field
  - Purpose: Track when interview was marked as conducted
  - Set by: Webhook or manual button
  - Used for: SLA calculations, audit trail

- [ ] Add `scorecardRequestsSentAt: datetime | None` field
  - Purpose: Track when scorecard notification emails were sent
  - Used for: Preventing duplicate notifications, audit trail

- [ ] Add `webhookEventId: str | None` field
  - Purpose: Store MS365 webhook event ID for idempotency
  - Used for: Prevent duplicate processing if webhook retried

- [ ] Update `ms365: Ms365Metadata` with new fields:
  - `subscriptionId: str | None` → Links to Ms365Subscription record
  - `joinWebUrlEncoded: str | None` → URL-encoded version for matching

- [ ] Create database index:
  ```python
  ["companyId", "ms365.teamsJoinUrl"]  # Fast webhook correlation lookup
  ```

### 1.2 Create Ms365Subscription Model

- [ ] New collection: `ms365_subscriptions`
- [ ] Fields:
  ```python
  class Ms365Subscription(Document):
      id: str
      companyId: str
      interviewId: str
      subscriptionId: str  # From MS365 API response
      teamsJoinUrl: str    # For matching
      resource: str
      encryptionCertificateId: str
      status: str  # active | expired | renewal_failed | deleted
      createdAt: datetime
      expirationDateTime: datetime
      lastRenewedAt: datetime | None
      lastWebhookReceivedAt: datetime | None
      lastError: str | None
      lastErrorAt: datetime | None
  ```

- [ ] Indexes:
  ```python
  ["companyId", "interviewId"]
  ["subscriptionId"]
  ["teamsJoinUrl"]
  ["expirationDateTime"]  # For renewal job
  ["status"]
  ```

### 1.3 RoundInstance Model Review

- [ ] Verify RoundInstance has `status` field
  - States: pending | scheduled | completed | cancelled
  - Updated by: Interview.mark_conducted() and scorecard submission

- [ ] Document status transitions:
  - pending → scheduled: When first Interview.mark_conducted() called
  - scheduled → completed: When all scorecards submitted

### 1.4 Task Model Verification

- [ ] Verify Task model exists with:
  - `taskType: str` (for polymorphic support)
  - `interviewId: str`
  - `applicationId: str`
  - `metadata: dict` (for flexible fields)
  - `scheduledFor: datetime`
  - `notificationSentAt: datetime | None`

- [ ] Add index:
  ```python
  ["companyId", "taskType", "status"]
  ```

### 1.5 ScorecardAccessToken Model

- [ ] Verify model exists with:
  - `tokenHash: str` (never store plaintext)
  - `isUsed: bool`
  - `expiresAt: datetime`
  - `usedAt: datetime | None`

- [ ] Add index:
  ```python
  ["tokenHash"]
  ["expiresAt"]  # For cleanup jobs
  ```

---

## Phase 2: Webhook Handler Implementation

### 2.1 Webhook Endpoint Setup

- [ ] Create `POST /webhooks/ms365/meeting-ended` endpoint
  - Location: `Backend/app/api/routes/webhooks.py`
  - Accept: Encrypted webhook payload from MS365

### 2.2 Webhook Validation

- [ ] Implement signature verification
  - Verify HMAC-SHA256 dataSignature
  - Check against encrypted data
  - Reject if invalid (401 Unauthorized)

- [ ] Handle validationTokens
  - Check if `validationTokens` present in payload
  - If yes: Echo back immediately (first subscription validation)
  - If no: Continue normal processing

### 2.3 Payload Decryption

- [ ] Implement decryption logic
  - Load certificate by encryptionCertificateId
  - Decrypt AES key using RSA private key
  - Decrypt content using AES key
  - Remove PKCS7 padding
  - Parse JSON

- [ ] Add cryptography dependencies
  ```python
  from cryptography.hazmat.primitives import hashes
  from cryptography.hazmat.primitives.asymmetric import padding
  from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
  ```

### 2.4 Event Parsing

- [ ] Extract decrypted event data:
  - `eventType: str` (validate == "callEnded")
  - `eventDateTime: datetime` (when meeting ended)
  - `id: str` (webhook event ID)

- [ ] Extract routing info from outer payload:
  - `clientState: str` (should be companyId)
  - `resource: str` (contains joinWebUrl)
  - URL-decode joinWebUrl

### 2.5 Interview Correlation

- [ ] Implement correlation logic:
  ```python
  interview = await Interview.find_one(
      Interview.companyId == clientState,
      Interview.ms365.teamsJoinUrl == joinWebUrl,
      Interview.status == "scheduled"
  )
  ```

- [ ] Handle not found:
  - Log warning
  - Return 200 OK (don't fail)
  - Exit

- [ ] Check idempotency:
  - If interview.webhookEventId == webhook_event_id
  - Return: "already_processed"
  - Don't create duplicate tasks

### 2.6 Core Handler Logic

- [ ] Call shared function:
  ```python
  result = await mark_interview_conducted(
      interview=interview,
      conducted_at=event_datetime,
      webhook_event_id=webhook_event_id,
      reason="webhook"
  )
  ```

### 2.7 Error Handling

- [ ] Always return 2xx status (even on errors)
  - 202 Accepted: Normal flow
  - 200 OK: Already processed, not found, etc.
  - NEVER return 4xx/5xx (MS365 blacklists)

- [ ] Log all errors:
  - Decryption failures
  - Interview not found
  - Database errors
  - Task creation failures

- [ ] Queue failed webhooks for retry:
  - Store in WebhookEventLog
  - Retry after 5, 15, 60 minutes
  - Alert after 3 failed attempts

---

## Phase 3: Manual Button & API Endpoint

### 3.1 Backend Endpoint

- [ ] Implement `PATCH /interviews/{interview_id}/mark-conducted` endpoint
  - Location: `Backend/app/api/routes/interviews.py`

- [ ] Request validation:
  - Authenticate user (verify JWT)
  - Load interview (check companyId match)
  - Verify permissions (admin, recruiter, hiring manager)
  - For hiring_manager: verify access to requisition

- [ ] State validation:
  - Interview.status must be "scheduled"
  - scheduledAt must be in past

- [ ] Call shared function:
  ```python
  result = await mark_interview_conducted(
      interview=interview,
      conducted_at=None,  # Use current time
      webhook_event_id=None,  # No webhook for manual
      reason="manual",
      triggered_by_user_id=current_user.id
  )
  ```

- [ ] Return response:
  ```python
  {
    "success": true,
    "interview": { ... },
    "tasksCreated": 2,
    "notificationsSent": 2,
    "message": "..."
  }
  ```

### 3.2 Frontend Button Component

- [ ] Create or update InterviewCard component
  - Import interview data
  - Check visibility conditions:
    - `interview.status == "scheduled"`
    - `new Date() > scheduledAt`
    - `current_user.role in [admin, recruiter, hiring_manager]`

- [ ] Button states:
  - Enabled: All conditions met
  - Disabled: Future scheduled time (show tooltip)
  - Hidden: Already conducted/completed

- [ ] Button behavior:
  - Click → Call `PATCH /interviews/{id}/mark-conducted`
  - Show loading state
  - Handle success: Show toast, update local state, hide button
  - Handle error: Show error toast, keep button enabled

### 3.3 Frontend API Integration

- [ ] Add method to interviewService:
  ```typescript
  async markInterviewConducted(
    interviewId: string,
    reason: string = "manual"
  ): Promise<MarkConductedResponse>
  ```

- [ ] Call from component:
  ```typescript
  const result = await interviewService.markInterviewConducted(interview.id);
  if (result.success) {
    // Update local state
    interview.status = "conducted";
    // Show success message
    toast.success(`✅ Marked as conducted. ${result.notificationsSent} emails sent.`);
  }
  ```

### 3.4 UI Placement

- [ ] Add button to Pipeline Card view:
  - Position: Right side, below status
  - Label: "Mark as Conducted"
  - Icon: ✓ checkmark

- [ ] Add button to Interview Detail Modal:
  - Position: Bottom action bar
  - Label: "Mark as Conducted"
  - Style: Secondary/outline button

- [ ] Add button to Application Timeline:
  - Position: Interview card action menu
  - Label: "Mark as Conducted"
  - Tooltip: "Mark the interview as completed"

---

## Phase 4: Shared Core Logic

### 4.1 Implement `mark_interview_conducted()` Service

- [ ] Location: `Backend/app/services/interview_service.py`

- [ ] Function signature:
  ```python
  async def mark_interview_conducted(
      interview: Interview,
      conducted_at: datetime | None = None,
      webhook_event_id: str | None = None,
      reason: str = "manual",
      triggered_by_user_id: str | None = None
  ) -> dict
  ```

- [ ] Step 1: Validate interview state
  - Check status == "scheduled"
  - Check idempotency (webhookEventId)

- [ ] Step 2: Update interview
  - interview.status = "conducted"
  - interview.conductedAt = conducted_at or now()
  - interview.webhookEventId = webhook_event_id
  - interview.updatedAt = now()
  - Save to database

- [ ] Step 3: Update RoundInstance
  - Find RoundInstance by interview.roundInstanceId
  - If status == "pending": change to "scheduled"
  - Save to database

- [ ] Step 4: Create scorecard tasks
  - Call `TaskService.create_scorecard_tasks(interview)`
  - Get list of created tasks

- [ ] Step 5: Send notification emails
  - Call `NotificationService.send_scorecard_requests(interview)`
  - Get count of emails sent

- [ ] Step 6: Update interview (final)
  - interview.scorecardRequestsSentAt = now()
  - Save to database

- [ ] Step 7: Audit logging
  - Log action with reason, user, task count
  - Include webhook_event_id if present

- [ ] Return result:
  ```python
  {
    "status": "success",
    "tasksCreated": count,
    "notificationsSent": count,
    "interview": interview.dict()
  }
  ```

### 4.2 Task Creation Service

- [ ] Update `TaskService.create_scorecard_tasks(interview)`
  - For each user in interview.requiredScorecardUserIds:
    - Create Task record
    - Set taskType = "scorecard_submission"
    - Set status = "pending"
    - Set metadata with interview context
    - Set scheduledFor = now()
    - Set notificationSentAt = null (to be updated by notification service)

### 4.3 Notification Service

- [ ] Update `NotificationService.send_scorecard_requests(interview)`
  - For each task:
    - Generate ScorecardAccessToken
    - Create magic link URL
    - Send email with link
    - Update task.notificationSentAt
  - Return count of emails sent

---

## Phase 5: Testing

### 5.1 Unit Tests

- [ ] `test_mark_interview_conducted_manual()`
  - Verify interview marked "conducted"
  - Verify conductedAt set to current time
  - Verify RoundInstance updated
  - Verify tasks created
  - Verify emails sent

- [ ] `test_mark_interview_conducted_webhook()`
  - Verify conductedAt set from webhook time
  - Verify webhookEventId stored
  - Verify idempotency on retry

- [ ] `test_webhook_correlation_by_teamsjoiurl()`
  - Create interview with teamsJoinUrl
  - Simulate webhook with same URL
  - Verify correct interview found

- [ ] `test_webhook_signature_validation()`
  - Valid signature: Accept
  - Invalid signature: Reject with 401

- [ ] `test_webhook_decryption()`
  - Decrypt sample payload
  - Verify eventType and eventDateTime extracted

### 5.2 Integration Tests

- [ ] `test_webhook_end_to_end()`
  - Create interview
  - Send webhook
  - Verify interview marked conducted
  - Verify tasks created
  - Verify emails sent

- [ ] `test_manual_button_end_to_end()`
  - Create interview
  - Call PATCH endpoint
  - Verify same results as webhook

- [ ] `test_webhook_idempotency()`
  - Send webhook twice
  - Verify only processed once
  - Verify no duplicate tasks

- [ ] `test_webhook_not_found()`
  - Send webhook for non-existent interview
  - Verify returns 200 OK
  - Verify no error

### 5.3 E2E Tests

- [ ] `test_full_interview_flow()`
  - Create interview
  - Schedule in Teams
  - Webhook fires
  - Check interviewer receives email
  - Click magic link
  - Submit scorecard
  - Verify interview marked completed

- [ ] `test_manual_button_flow()`
  - Create interview (scheduled)
  - Click "Mark as Conducted" button
  - Verify email received
  - Submit scorecard

- [ ] `test_permission_checks()`
  - Admin can mark conducted ✓
  - Recruiter can mark conducted ✓
  - Hiring manager can mark own requisition ✓
  - Hiring manager cannot mark other requisition ✗
  - Candidate cannot mark conducted ✗

### 5.4 Manual Testing

- [ ] **Pre-Deployment:**
  - [ ] Generate test certificate
  - [ ] Create test meeting in Teams
  - [ ] Create subscription via Graph API
  - [ ] Manually trigger webhook
  - [ ] Verify webhook received and decrypted
  - [ ] Verify interview marked conducted
  - [ ] Verify email sent
  - [ ] Click magic link
  - [ ] Submit scorecard
  - [ ] Test duplicate webhook (idempotency)
  - [ ] Test invalid signature
  - [ ] Test permission validation

- [ ] **Post-Deployment:**
  - [ ] Monitor webhook delivery success rate
  - [ ] Check for decryption errors
  - [ ] Verify email delivery
  - [ ] Monitor magic link click rate
  - [ ] Check scorecard submission rate

---

## Phase 6: Deployment & Configuration

### 6.1 Environment Variables

- [ ] `MS365_WEBHOOK_URL="https://api.i79engage.com/webhooks/ms365/meeting-ended"`
- [ ] `MS365_CERTIFICATE_ID="i79engage_cert_2026_01"`
- [ ] `MS365_CERTIFICATE_PATH="/secrets/ms365/public.pem"`
- [ ] `MS365_PRIVATE_KEY_PATH="/secrets/ms365/private.key"`
- [ ] `WEBHOOK_VALIDATION_TIMEOUT=5` (seconds)
- [ ] `SUBSCRIPTION_RENEWAL_INTERVAL=60` (minutes)
- [ ] `SUBSCRIPTION_RENEWAL_BUFFER_HOURS=24`

### 6.2 Database Migrations

- [ ] Add Interview fields (conductedAt, scorecardRequestsSentAt, webhookEventId)
- [ ] Add Ms365Metadata fields (subscriptionId, joinWebUrlEncoded)
- [ ] Create Ms365Subscription collection
- [ ] Create/update Task collection indexes
- [ ] Create indexes for webhook correlation

### 6.3 Deployment Steps

- [ ] Backup database
- [ ] Run migrations
- [ ] Deploy backend code (webhook handler + endpoints)
- [ ] Deploy frontend code (button + UI)
- [ ] Generate MS365 certificates
- [ ] Store certificates in secrets vault
- [ ] Test webhook endpoint (HTTP accessible, HTTPS, responds < 5s)
- [ ] Load test webhook endpoint
- [ ] Enable logging and monitoring
- [ ] Notify tenant admins about manual setup (subscription creation)

### 6.4 Admin Documentation

- [ ] Create guide for tenant admin to create subscription
- [ ] Include: Graph API request, permissions needed, testing steps
- [ ] Document certificate rotation process
- [ ] Document subscription renewal process
- [ ] Create monitoring dashboard for webhook health

---

## Phase 7: Monitoring & Observability

### 7.1 Metrics to Track

- [ ] `webhook_events_received` - Count of webhooks
- [ ] `webhook_validation_failures` - Invalid signatures
- [ ] `interview_marked_conducted_webhook` - From webhooks
- [ ] `interview_marked_conducted_manual` - From buttons
- [ ] `task_creation_success_rate` - % successful
- [ ] `email_delivery_success_rate` - % sent
- [ ] `scorecard_submission_rate` - % within 24h
- [ ] `subscription_renewal_success_rate` - % renewed
- [ ] `subscription_expiry_warnings` - About to expire

### 7.2 Logging

- [ ] Log all webhook events (received, processed, failed)
- [ ] Log manual button clicks
- [ ] Log task creation
- [ ] Log email sending
- [ ] Log errors and exceptions
- [ ] Include: timestamp, user/system, interview ID, result

### 7.3 Alerts

- [ ] Alert if webhook validation failure rate > 1%
- [ ] Alert if task creation success rate < 95%
- [ ] Alert if email delivery success rate < 99%
- [ ] Alert if subscription renewal fails
- [ ] Alert if subscription will expire in 24 hours

---

## Acceptance Criteria

### Must Haves (MVP)
- [ ] Webhook correlation by teamsJoinUrl working
- [ ] Interview marked "conducted" on webhook arrival
- [ ] Manual button marks interview "conducted"
- [ ] Both paths create identical tasks + emails
- [ ] Idempotency prevents duplicate processing
- [ ] RoundInstance updated on first conduct
- [ ] All tests passing
- [ ] Deployed to production

### Should Haves (Phase 3.1)
- [ ] Subscription renewal scheduler working
- [ ] Monitoring dashboard
- [ ] Admin guide for subscription setup
- [ ] Email reminders for overdue scorecards

### Could Haves (Phase 3.2+)
- [ ] rosterUpdated events for attendance
- [ ] Automatic escalations
- [ ] Interview recording integration
- [ ] External interviewer support

---

## Timeline Estimate

| Phase | Duration | Owner |
|-------|----------|-------|
| Phase 1: Database | 2-3 days | Backend |
| Phase 2: Webhook Handler | 3-4 days | Backend |
| Phase 3: Manual Button | 2-3 days | Backend + Frontend |
| Phase 4: Shared Logic | 1-2 days | Backend |
| Phase 5: Testing | 3-4 days | QA + Backend |
| Phase 6: Deployment | 1-2 days | DevOps |
| Phase 7: Monitoring | 1 day | DevOps + Backend |
| **Total** | **13-19 days** | **Team** |

---

**Status:** ✅ Checklist complete - Ready to assign and begin implementation!


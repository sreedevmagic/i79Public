# M365 Integration Phase 2: Webhook-Based Scorecard Notification

**Document Version:** 1.0  
**Last Updated:** January 4, 2026  
**Status:** Design Phase - Ready for Implementation  
**Depends On:** Phase 1 (M365_INTEGRATION.md) must be completed first  
**Purpose:** Automatic scorecard request triggering when Teams meeting ends  

---

## Executive Summary

**Phase 1** handled interview scheduling:
- Create calendar invite for interviewers
- Send candidate email with magic link to accept/decline
- Extract Teams join URL

**Phase 2** adds automatic scorecard triggering:
- Subscribe to MS365 webhook for `callEnded` event
- When meeting ends → Webhook fires
- System marks interview as "conducted"
- Creates scorecard tasks for all interviewers
- Sends magic link emails to submit scorecards

---

## Key Insight: Simplified Webhook Approach

### Your Thought Process (Correct! ✅)

**You're absolutely right!** We can simplify the webhook subscription significantly:

1. **No encryption certificates needed** ✅
   - Use **basic notifications** (not rich notifications)
   - No RSA-AES decryption required
   - Much simpler setup

2. **Correlation is simple** ✅
   - Webhook payload contains `joinWebUrl` (Teams meeting URL)
   - Query: `Interview.find({ms365.teamsJoinUrl == joinWebUrl, companyId})`
   - That's it!

3. **What we need from webhook:**
   - ✅ `joinWebUrl` - To find the correct Interview
   - ✅ `eventType: "callEnded"` - To know meeting ended
   - ✅ `eventDateTime` - When it ended
   - ❌ No encrypted payload needed
   - ❌ No certificate management

### MS365 API Reality Check

**Basic Notifications Structure:**
```json
{
  "value": [
    {
      "subscriptionId": "sub_xxxxx",
      "clientState": "company_xxxxx",
      "changeType": "updated",
      "resource": "communications/onlineMeetings(joinWebUrl='...')/meetingCallEvents",
      "resourceData": {
        "@odata.type": "#microsoft.graph.callEvent",
        "id": "event_id",
        "eventType": "callEnded",
        "eventDateTime": "2026-01-10T15:30:00Z"
      }
    }
  ],
  "validationTokens": ["..."]  // Only on first subscription
}
```

**Key Points:**
- ✅ **No `encryptedContent`** - Data is in plaintext `resourceData`
- ✅ **eventType** directly visible
- ✅ **joinWebUrl** in resource path (need to extract)
- ✅ **clientState** = companyId (for routing)

**Tradeoff:**
- ⚠️ **Less secure** - Payload not encrypted (but webhook signature still validates authenticity)
- ✅ **Much simpler** - No certificate generation, no decryption logic
- ✅ **Good enough** - For internal interview tracking (not handling PII in webhook)

---

## 1. Architecture Overview

### 1.1 System Flow (Phase 2 Only)

```
┌────────────────────────────────────────────────────────────┐
│  Phase 1 Complete: Interview Scheduled                    │
│  ├─ Interview.status = "scheduled"                        │
│  ├─ Interview.scheduledAt = "2026-01-10T14:00:00Z"        │
│  ├─ Interview.ms365.teamsJoinUrl = "https://teams..."     │
│  ├─ Calendar invite sent to interviewers                  │
│  └─ Candidate received acceptance email                   │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  Meeting Happens (10:00 AM - 11:00 AM)                    │
│  ├─ Interviewers join Teams meeting                       │
│  ├─ Candidate joins via teamsJoinUrl                      │
│  ├─ Interview conducted                                   │
│  └─ Meeting ends at 11:00 AM                              │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  MS365 Webhook Fires (callEnded event)                    │
│  POST https://api.i79engage.com/webhooks/ms365/call-ended │
│                                                            │
│  Payload (basic notification):                            │
│  {                                                         │
│    "subscriptionId": "sub_xxxxx",                         │
│    "clientState": "company_abc123",                       │
│    "resource": "communications/onlineMeetings(            │
│                 joinWebUrl='https%3A%2F%2Fteams...')",    │
│    "resourceData": {                                      │
│      "eventType": "callEnded",                            │
│      "eventDateTime": "2026-01-10T11:00:00Z"              │
│    }                                                      │
│  }                                                        │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  Webhook Handler: Process Event                           │
│  ├─ Extract joinWebUrl from resource                      │
│  ├─ URL-decode: "https://teams.microsoft.com/..."         │
│  ├─ Extract clientState (companyId)                       │
│  ├─ Query Interview:                                      │
│  │  Interview.find({                                      │
│  │    companyId: clientState,                             │
│  │    ms365.teamsJoinUrl: joinWebUrl,                     │
│  │    status: "scheduled"                                 │
│  │  })                                                    │
│  └─ Interview found? → Continue                           │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  Mark Interview as Conducted                               │
│  ├─ interview.status = "scheduled" → "conducted"          │
│  ├─ interview.conductedAt = eventDateTime                 │
│  ├─ interview.webhookEventId = resourceData.id            │
│  ├─ Save to database                                      │
│  └─ Update Application.interviewStatus = "completed"      │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  Create Scorecard Tasks (for each interviewer)            │
│  ├─ For user in interview.requiredScorecardUserIds:       │
│  │  ├─ Create Task record                                │
│  │  │  ├─ taskType: "scorecard_submission"               │
│  │  │  ├─ userId: interviewer.userId                     │
│  │  │  ├─ interviewId: interview.id                      │
│  │  │  ├─ status: "pending"                              │
│  │  │  ├─ dueAt: now() + 24 hours                        │
│  │  │  └─ metadata: {candidateName, roundName, ...}      │
│  │  └─ Save Task                                         │
│  └─ Total tasks created: N (N = number of interviewers)   │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  Generate Magic Link Tokens (for each interviewer)        │
│  ├─ For user in interview.requiredScorecardUserIds:       │
│  │  ├─ Generate secure token (JWT)                       │
│  │  │  ├─ Payload: {interviewId, userId, action}         │
│  │  │  └─ Expires: 7 days                                │
│  │  ├─ Create ScorecardAccessToken record                │
│  │  │  ├─ token: "eyJhbGc..."                            │
│  │  │  ├─ interviewId: interview.id                      │
│  │  │  ├─ userId: interviewer.userId                     │
│  │  │  ├─ expiresAt: +7 days                             │
│  │  │  └─ status: "pending"                              │
│  │  └─ Save Token                                        │
│  └─ Total tokens generated: N                             │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  Send Scorecard Request Emails                            │
│  ├─ For each interviewer:                                 │
│  │  ├─ Email subject: "Scorecard Submission: {candidate}"│
│  │  ├─ Email body:                                        │
│  │  │  ├─ "Hi {interviewer}, interview completed"        │
│  │  │  ├─ Candidate: {name}                              │
│  │  │  ├─ Round: {roundName}                             │
│  │  │  ├─ Duration: {durationMin} minutes                │
│  │  │  ├─ Due: {24 hours from now}                       │
│  │  │  └─ Magic link button: "Submit Scorecard"          │
│  │  └─ Link: /scorecard/submit?token={token}             │
│  ├─ interview.scorecardRequestsSentAt = now()             │
│  └─ Total emails sent: N                                  │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  Return Success to MS365 (CRITICAL)                       │
│  ├─ HTTP 202 Accepted                                     │
│  ├─ Body: {"status": "processed"}                         │
│  └─ NEVER return 4xx/5xx (MS365 blacklists endpoint)      │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  Interviewer Submits Scorecard (Separate Flow)            │
│  ├─ Clicks magic link in email                            │
│  ├─ Fills scorecard form                                  │
│  ├─ Submits scores + feedback                             │
│  ├─ Task.status = "pending" → "completed"                 │
│  ├─ Token.status = "pending" → "used"                     │
│  └─ interview.completedScorecardUserIds.push(userId)      │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Data Models (Updates)

### 2.1 Interview Model (Add Fields)

```python
class Interview(Document):
    # ... existing fields ...
    
    status: str = "draft"  # draft | scheduled | conducted | completed | cancelled
    
    # Webhook tracking (NEW)
    conductedAt: datetime | None = None              # When interview actually happened
    webhookEventId: str | None = None                # MS365 event ID (for idempotency)
    scorecardRequestsSentAt: datetime | None = None  # When emails sent
    
    # ... rest of fields ...
```

### 2.2 Task Model (NEW)

```python
class Task(Document):
    """Task tracking for various workflows"""
    
    id: str = Field(default_factory=lambda: generate_id("task"))
    companyId: str
    userId: str                                      # Assigned to
    
    taskType: str                                    # scorecard_submission | approval | review
    status: str = "pending"                          # pending | in_progress | completed | cancelled
    priority: str = "normal"                         # low | normal | high | urgent
    
    # Scorecard submission specific
    interviewId: str | None = None
    applicationId: str | None = None
    
    # Task details
    title: str
    description: str | None = None
    metadata: dict = {}                              # Flexible metadata
    
    # Scheduling
    dueAt: datetime | None = None
    scheduledFor: datetime | None = None
    completedAt: datetime | None = None
    
    # Notifications
    notificationSentAt: datetime | None = None
    reminderSentAt: datetime | None = None
    
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "tasks"
        indexes = [
            "companyId",
            ["companyId", "userId"],
            ["companyId", "taskType"],
            ["companyId", "status"],
            ["companyId", "interviewId"],
            ["userId", "status", "dueAt"],
        ]
```

### 2.3 ScorecardAccessToken Model (NEW)

```python
class ScorecardAccessToken(Document):
    """Magic link tokens for scorecard submission"""
    
    id: str = Field(default_factory=lambda: generate_id("scat"))
    companyId: str
    interviewId: str
    userId: str                                      # Interviewer who will submit
    
    token: str                                       # Secure JWT token (unique index)
    status: str = "pending"                          # pending | used | expired
    
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    expiresAt: datetime                              # Usually +7 days
    usedAt: datetime | None = None
    
    # Security tracking
    ipAddress: str | None = None
    userAgent: str | None = None
    
    class Settings:
        name = "scorecard_access_tokens"
        indexes = [
            "token",                                 # Unique
            ["companyId", "interviewId"],
            ["userId", "status"],
            ["status", "expiresAt"],
        ]
```

### 2.4 Ms365Subscription Model (NEW)

```python
class Ms365Subscription(Document):
    """Track MS365 webhook subscriptions"""
    
    id: str = Field(default_factory=lambda: generate_id("m365"))
    companyId: str
    interviewId: str
    
    subscriptionId: str                              # MS365 subscription ID
    resource: str                                    # Resource path
    teamsJoinUrl: str                                # For correlation
    
    status: str = "active"                           # active | expired | failed | cancelled
    
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    expirationDateTime: datetime                     # Max 3 days
    lastRenewedAt: datetime | None = None
    
    class Settings:
        name = "ms365_subscriptions"
        indexes = [
            "companyId",
            "subscriptionId",                        # Unique
            ["companyId", "interviewId"],
            ["status", "expirationDateTime"],
        ]
```

---

## 3. Webhook Subscription Setup

### 3.1 Create Subscription (When Interview Scheduled)

**Trigger:** After Phase 1 completes (calendar invite created)

**MS365 Graph API Call:**

```python
async def create_webhook_subscription(
    self,
    *,
    company: Company,
    teams_join_url: str,
    interview_id: str,
) -> Dict[str, Any]:
    """
    Create basic notification subscription for callEnded event
    
    Args:
        company: Company with MS365 credentials
        teams_join_url: Teams meeting URL (from Interview.ms365.teamsJoinUrl)
        interview_id: Interview ID (stored for tracking)
    
    Returns:
        {
            "subscription_id": "sub_xxxxx",
            "expiration_datetime": "2026-01-07T10:00:00Z"
        }
    """
    
    # Step 1: Get access token
    access_token = await self._get_access_token(company)
    
    # Step 2: URL-encode the join URL
    import urllib.parse
    url_encoded = urllib.parse.quote(teams_join_url, safe='')
    
    # Step 3: Build subscription request (BASIC NOTIFICATION)
    expiration = datetime.utcnow() + timedelta(days=3)  # Max allowed
    
    subscription_request = {
        "changeType": "updated",
        "notificationUrl": settings.MS365_WEBHOOK_URL,
        "resource": f"communications/onlineMeetings(joinWebUrl='{url_encoded}')/meetingCallEvents",
        "expirationDateTime": expiration.isoformat() + "Z",
        "clientState": company.id  # For routing to correct company
    }
    # ⚠️ NOTE: No includeResourceData, no encryptionCertificate
    # This creates a BASIC notification (no encryption)
    
    # Step 4: Create subscription via Graph API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{self.graph_api_base}/subscriptions",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            json=subscription_request,
            timeout=10.0
        )
        
        if response.status_code != 201:
            logger.error(f"Subscription creation failed: {response.text}")
            raise HTTPException(
                status_code=500,
                detail=f"MS365 API error: {response.status_code}"
            )
        
        subscription = response.json()
        
        # Step 5: Store subscription in database
        ms365_sub = Ms365Subscription(
            companyId=company.id,
            interviewId=interview_id,
            subscriptionId=subscription["id"],
            resource=subscription["resource"],
            teamsJoinUrl=teams_join_url,
            expirationDateTime=datetime.fromisoformat(
                subscription["expirationDateTime"].replace('Z', '+00:00')
            ),
            status="active"
        )
        await ms365_sub.insert()
        
        logger.info(f"Webhook subscription created: {subscription['id']}")
        
        return {
            "subscription_id": subscription["id"],
            "expiration_datetime": subscription["expirationDateTime"]
        }
```

**When to Call:**
```python
# In interview_service.py, after creating calendar event:
async def schedule_interview(...):
    # ... Phase 1 logic ...
    
    # Create calendar event
    ms365_metadata = await ms365_service.create_calendar_event(...)
    interview.ms365 = ms365_metadata
    
    # NEW: Create webhook subscription
    try:
        sub_result = await ms365_service.create_webhook_subscription(
            company=company,
            teams_join_url=ms365_metadata.teamsJoinUrl,
            interview_id=interview.id
        )
        logger.info(f"Webhook subscription created for interview {interview.id}")
    except Exception as e:
        logger.error(f"Webhook subscription failed: {str(e)}")
        # Don't fail scheduling if webhook setup fails (graceful degradation)
    
    interview.status = "scheduled"
    await interview.save()
```

---

### 3.2 Webhook Validation (First Request)

**When MS365 first creates subscription, it sends validation request:**

```json
{
  "value": [],
  "validationTokens": ["validation_token_string"]
}
```

**Your endpoint MUST echo back the token immediately:**

```python
@router.post("/webhooks/ms365/call-ended")
async def handle_call_ended_webhook(request: Request):
    """Handle MS365 callEnded event webhook"""
    
    body = await request.json()
    
    # Step 1: Handle validation (first subscription request)
    if "validationTokens" in body:
        logger.info("MS365 subscription validation request")
        return {"validationTokens": body["validationTokens"]}
    
    # Step 2: Process actual event
    # ... rest of logic ...
```

---

## 4. Webhook Handler Implementation

### 4.1 Webhook Endpoint

**File:** `Backend/app/api/routes/webhooks.py`

```python
from fastapi import APIRouter, Request
from app.services.webhook_service import WebhookService
import logging

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)
webhook_service = WebhookService()

@router.post("/ms365/call-ended")
async def handle_call_ended_webhook(request: Request):
    """
    Handle MS365 Teams meeting callEnded event
    
    Responsibilities:
    1. Validate request (check validationTokens)
    2. Extract joinWebUrl and companyId
    3. Find Interview by correlation
    4. Mark interview as conducted
    5. Create scorecard tasks
    6. Send notification emails
    7. Always return 202 Accepted
    """
    try:
        body = await request.json()
        
        # Validation request (first subscription)
        if "validationTokens" in body:
            logger.info("MS365 subscription validation")
            return {"validationTokens": body["validationTokens"]}
        
        # Process event
        result = await webhook_service.handle_call_ended_event(body)
        
        # ALWAYS return 202 (even if error)
        return {"status": "accepted", "details": result}
    
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}", exc_info=True)
        # Still return 202 to prevent MS365 blacklisting
        return {"status": "accepted", "error": "logged"}
```

---

### 4.2 Webhook Service

**File:** `Backend/app/services/webhook_service.py`

```python
from datetime import datetime
from typing import Dict, Any
import logging
import urllib.parse
import re
from app.models.interview import Interview
from app.services.interview_service import InterviewService

logger = logging.getLogger(__name__)

class WebhookService:
    async def handle_call_ended_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process MS365 webhook for callEnded event
        
        Returns: {
            "status": "processed" | "skipped" | "error",
            "interview_id": "...",
            "message": "..."
        }
        """
        try:
            # Extract notification
            notifications = payload.get("value", [])
            if not notifications:
                logger.warning("Empty webhook payload")
                return {"status": "skipped", "message": "empty_value"}
            
            notification = notifications[0]
            
            # Step 1: Extract routing information
            client_state = notification.get("clientState")  # = companyId
            resource = notification.get("resource", "")
            resource_data = notification.get("resourceData", {})
            
            event_type = resource_data.get("eventType")
            event_datetime = resource_data.get("eventDateTime")
            event_id = resource_data.get("id")
            
            # Step 2: Validate event type
            if event_type != "callEnded":
                logger.info(f"Skipping event type: {event_type}")
                return {"status": "skipped", "message": f"event_type_{event_type}"}
            
            # Step 3: Extract joinWebUrl from resource
            # Format: communications/onlineMeetings(joinWebUrl='...')/meetingCallEvents
            teams_join_url = self._extract_join_url(resource)
            
            if not teams_join_url or not client_state:
                logger.error("Missing routing information")
                return {"status": "error", "message": "missing_routing_info"}
            
            logger.info(f"Call ended event: company={client_state}, url={teams_join_url[:50]}...")
            
            # Step 4: Find Interview by correlation
            interview = await Interview.find_one(
                Interview.companyId == client_state,
                Interview.ms365.teamsJoinUrl == teams_join_url,
                Interview.status == "scheduled"
            )
            
            if not interview:
                logger.warning(f"Interview not found for joinWebUrl")
                return {"status": "skipped", "message": "interview_not_found"}
            
            # Step 5: Check idempotency
            if interview.conductedAt:
                logger.info(f"Interview already conducted: {interview.id}")
                return {"status": "skipped", "message": "already_processed"}
            
            # Step 6: Mark interview as conducted + trigger scorecards
            interview_service = InterviewService()
            result = await interview_service.mark_interview_conducted(
                interview=interview,
                conducted_at=datetime.fromisoformat(event_datetime.replace('Z', '+00:00')),
                webhook_event_id=event_id,
                reason="webhook"
            )
            
            return {
                "status": "processed",
                "interview_id": interview.id,
                "details": result
            }
        
        except Exception as e:
            logger.error(f"Webhook processing error: {str(e)}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    def _extract_join_url(self, resource: str) -> str | None:
        """Extract and URL-decode joinWebUrl from resource path"""
        try:
            # Pattern: communications/onlineMeetings(joinWebUrl='...')/meetingCallEvents
            match = re.search(r"joinWebUrl='([^']+)'", resource)
            if match:
                encoded_url = match.group(1)
                return urllib.parse.unquote(encoded_url)
        except Exception as e:
            logger.error(f"Error extracting join URL: {str(e)}")
        return None
```

---

## 5. Core Business Logic

### 5.1 Mark Interview as Conducted (Shared Function)

**File:** `Backend/app/services/interview_service.py`

```python
async def mark_interview_conducted(
    self,
    *,
    interview: Interview,
    conducted_at: datetime,
    webhook_event_id: str | None = None,
    reason: str = "webhook",  # "webhook" | "manual"
) -> Dict[str, Any]:
    """
    Mark interview as conducted and trigger scorecard requests
    
    This is the SINGLE SOURCE OF TRUTH for:
    - Webhook-triggered (automatic)
    - Manual button-triggered (fallback)
    
    Args:
        interview: Interview instance
        conducted_at: When interview actually happened
        webhook_event_id: MS365 event ID (for idempotency)
        reason: "webhook" or "manual" (for audit)
    
    Returns:
        {
            "interview_id": "...",
            "tasks_created": 2,
            "notifications_sent": 2
        }
    """
    
    # Step 1: Update Interview status
    interview.status = "conducted"
    interview.conductedAt = conducted_at
    interview.webhookEventId = webhook_event_id
    interview.updatedAt = datetime.utcnow()
    await interview.save()
    
    logger.info(f"Interview marked as conducted: {interview.id} (reason={reason})")
    
    # Step 2: Create scorecard tasks
    task_service = TaskService()
    tasks = await task_service.create_scorecard_tasks(interview)
    
    # Step 3: Generate magic link tokens
    notification_service = NotificationService()
    tokens = await notification_service.generate_scorecard_tokens(interview)
    
    # Step 4: Send notification emails
    await notification_service.send_scorecard_requests(interview, tokens)
    
    # Step 5: Update interview with notification timestamp
    interview.scorecardRequestsSentAt = datetime.utcnow()
    await interview.save()
    
    # Step 6: Update Application status
    from app.models.application import Application
    application = await Application.find_one(
        Application.id == interview.applicationId,
        Application.companyId == interview.companyId
    )
    if application:
        application.interviewStatus = "scorecard_pending"
        application.interviewCompletedAt = conducted_at
        application.updatedAt = datetime.utcnow()
        await application.save()
    
    return {
        "interview_id": interview.id,
        "tasks_created": len(tasks),
        "notifications_sent": len(tokens)
    }
```

---

### 5.2 Create Scorecard Tasks

**File:** `Backend/app/services/task_service.py` (NEW)

```python
from datetime import datetime, timedelta
from typing import List
from app.models.interview import Interview
from app.models.task import Task
import logging

logger = logging.getLogger(__name__)

class TaskService:
    async def create_scorecard_tasks(self, interview: Interview) -> List[Task]:
        """
        Create scorecard submission tasks for all interviewers
        
        Args:
            interview: Interview instance
        
        Returns:
            List of created Task instances
        """
        tasks = []
        due_at = datetime.utcnow() + timedelta(hours=24)  # 24 hour SLA
        
        for user_id in interview.requiredScorecardUserIds:
            # Find interviewer details
            interviewer = next(
                (i for i in interview.interviewers if i.userId == user_id),
                None
            )
            
            if not interviewer:
                logger.warning(f"Interviewer {user_id} not found in interview {interview.id}")
                continue
            
            task = Task(
                companyId=interview.companyId,
                userId=user_id,
                taskType="scorecard_submission",
                status="pending",
                priority="high",
                interviewId=interview.id,
                applicationId=interview.applicationId,
                title=f"Submit Scorecard: {interview.candidateName}",
                description=f"Please submit your scorecard for {interview.roundName} interview with {interview.candidateName}",
                metadata={
                    "candidateName": interview.candidateName,
                    "candidateEmail": interview.candidateEmail,
                    "roundName": interview.roundName,
                    "roundType": interview.roundType,
                    "interviewDuration": interview.durationMin,
                    "conductedAt": interview.conductedAt.isoformat() if interview.conductedAt else None
                },
                dueAt=due_at,
                scheduledFor=datetime.utcnow()  # Immediate
            )
            
            await task.insert()
            tasks.append(task)
            logger.info(f"Created scorecard task: {task.id} for user {user_id}")
        
        return tasks
```

---

### 5.3 Generate Magic Link Tokens

**File:** `Backend/app/services/notification_service.py` (NEW)

```python
import jwt
from datetime import datetime, timedelta
from typing import List
from app.models.interview import Interview
from app.models.scorecard_access_token import ScorecardAccessToken
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    async def generate_scorecard_tokens(
        self,
        interview: Interview
    ) -> List[ScorecardAccessToken]:
        """
        Generate magic link tokens for scorecard submission
        
        Args:
            interview: Interview instance
        
        Returns:
            List of ScorecardAccessToken instances
        """
        tokens = []
        expires_at = datetime.utcnow() + timedelta(days=7)
        
        for user_id in interview.requiredScorecardUserIds:
            # Generate JWT token
            payload = {
                "interview_id": interview.id,
                "user_id": user_id,
                "company_id": interview.companyId,
                "type": "scorecard_submission",
                "iat": datetime.utcnow(),
                "exp": expires_at
            }
            
            token_string = jwt.encode(
                payload,
                settings.SECRET_KEY,
                algorithm="HS256"
            )
            
            # Store token in database
            token = ScorecardAccessToken(
                companyId=interview.companyId,
                interviewId=interview.id,
                userId=user_id,
                token=token_string,
                status="pending",
                expiresAt=expires_at
            )
            
            await token.insert()
            tokens.append(token)
            logger.info(f"Generated scorecard token for user {user_id}")
        
        return tokens
    
    async def send_scorecard_requests(
        self,
        interview: Interview,
        tokens: List[ScorecardAccessToken]
    ) -> None:
        """
        Send scorecard submission emails to all interviewers
        
        Args:
            interview: Interview instance
            tokens: List of ScorecardAccessToken instances
        """
        
        for token in tokens:
            interviewer = next(
                (i for i in interview.interviewers if i.userId == token.userId),
                None
            )
            
            if not interviewer:
                logger.warning(f"Interviewer not found for token {token.id}")
                continue
            
            # Build magic link URL
            magic_link = f"{settings.FRONTEND_URL}/scorecard/submit?token={token.token}"
            
            # Send email
            await self._send_email(
                to=interviewer.email,
                subject=f"Scorecard Submission Required: {interview.candidateName}",
                template="scorecard_request.html",
                template_data={
                    "interviewer_name": interviewer.name,
                    "candidate_name": interview.candidateName,
                    "round_name": interview.roundName,
                    "conducted_at": interview.conductedAt.strftime("%B %d, %Y at %I:%M %p"),
                    "duration_min": interview.durationMin,
                    "due_date": (datetime.utcnow() + timedelta(hours=24)).strftime("%B %d, %Y at %I:%M %p"),
                    "magic_link": magic_link
                }
            )
            
            logger.info(f"Sent scorecard request email to {interviewer.email}")
    
    async def _send_email(self, *, to: str, subject: str, template: str, template_data: dict):
        """Send email via email provider (implement based on your setup)"""
        # TODO: Integrate with SendGrid, AWS SES, or your email provider
        logger.info(f"Email sent: {to} - {subject}")
        pass
```

---

## 6. Subscription Renewal

### 6.1 Background Job

MS365 subscriptions expire in **3 days max**. Need renewal job:

**File:** `Backend/app/core/background_tasks.py`

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.models.ms365_subscription import Ms365Subscription
from app.services.ms365_service import MS365Service
from app.models.company import Company
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

async def renew_expiring_subscriptions():
    """
    Renew MS365 webhook subscriptions expiring within 12 hours
    Runs every 6 hours
    """
    try:
        threshold = datetime.utcnow() + timedelta(hours=12)
        
        expiring = await Ms365Subscription.find(
            Ms365Subscription.expirationDateTime < threshold,
            Ms365Subscription.status == "active"
        ).to_list()
        
        logger.info(f"Found {len(expiring)} subscriptions to renew")
        
        for subscription in expiring:
            try:
                # Load company
                company = await Company.find_one(Company.id == subscription.companyId)
                if not company or not company.ms365Credentials:
                    logger.warning(f"Company {subscription.companyId} has no MS365 credentials")
                    subscription.status = "failed"
                    await subscription.save()
                    continue
                
                ms365_service = MS365Service()
                
                # Delete old subscription
                try:
                    await ms365_service.delete_subscription(
                        company=company,
                        subscription_id=subscription.subscriptionId
                    )
                except Exception as e:
                    logger.warning(f"Failed to delete old subscription: {str(e)}")
                
                # Create new subscription
                result = await ms365_service.create_webhook_subscription(
                    company=company,
                    teams_join_url=subscription.teamsJoinUrl,
                    interview_id=subscription.interviewId
                )
                
                # Update subscription record
                subscription.subscriptionId = result["subscription_id"]
                subscription.expirationDateTime = datetime.fromisoformat(
                    result["expiration_datetime"].replace('Z', '+00:00')
                )
                subscription.lastRenewedAt = datetime.utcnow()
                await subscription.save()
                
                logger.info(f"Renewed subscription: {subscription.id}")
            
            except Exception as e:
                logger.error(f"Error renewing subscription {subscription.id}: {str(e)}")
                subscription.status = "failed"
                await subscription.save()
    
    except Exception as e:
        logger.error(f"Error in renewal task: {str(e)}")

def start_background_scheduler():
    """Start APScheduler for background tasks"""
    scheduler.add_job(
        renew_expiring_subscriptions,
        "interval",
        hours=6,
        id="renew_ms365_subscriptions"
    )
    scheduler.start()
    logger.info("Background scheduler started")
```

**Start scheduler in main.py:**
```python
from app.core.background_tasks import start_background_scheduler

@app.on_event("startup")
async def startup_event():
    start_background_scheduler()
    logger.info("Application started")
```

---

## 7. Manual Fallback (If Webhook Fails)

### 7.1 Manual Trigger Endpoint

**Endpoint:** `POST /interviews/{interview_id}/mark-conducted`

```python
@router.post("/{interview_id}/mark-conducted")
async def mark_interview_conducted_manually(
    interview_id: str,
    company: Company = Depends(get_current_company),
    user: User = Depends(get_current_user)
):
    """
    Manually mark interview as conducted (fallback if webhook fails)
    
    Permissions: admin, recruiter, hiring_manager
    """
    
    # Validate permissions
    if user.role not in ["admin", "recruiter", "hiring_manager"]:
        raise HTTPException(403, "Insufficient permissions")
    
    # Load interview
    interview = await Interview.find_one(
        Interview.id == interview_id,
        Interview.companyId == company.id
    )
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    # Validate state
    if interview.status != "scheduled":
        raise HTTPException(400, f"Interview is not scheduled (status={interview.status})")
    
    if not interview.scheduledAt or interview.scheduledAt > datetime.utcnow():
        raise HTTPException(400, "Interview has not occurred yet")
    
    # Call shared function
    interview_service = InterviewService()
    result = await interview_service.mark_interview_conducted(
        interview=interview,
        conducted_at=datetime.utcnow(),
        webhook_event_id=None,
        reason="manual"
    )
    
    return {"success": True, "data": result}
```

---

## 8. Email Template

### 8.1 Scorecard Request Email

**File:** `Backend/app/templates/emails/scorecard_request.html`

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .action-button { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 15px 40px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>📋 Scorecard Submission Required</h1>
        </div>
        
        <div class="content">
            <p>Hi {{interviewer_name}},</p>
            
            <p>Thank you for completing the interview! Please submit your scorecard feedback for:</p>
            
            <div class="details">
                <h3>Interview Details</h3>
                <p><strong>Candidate:</strong> {{candidate_name}}</p>
                <p><strong>Round:</strong> {{round_name}}</p>
                <p><strong>Date & Time:</strong> {{conducted_at}}</p>
                <p><strong>Duration:</strong> {{duration_min}} minutes</p>
                <p><strong>Due By:</strong> <span style="color: #dc3545;">{{due_date}}</span></p>
            </div>
            
            <div class="action-button">
                <a href="{{magic_link}}" class="btn">Submit Scorecard Now</a>
            </div>
            
            <p style="color: #666;">
                This is a magic link that will take you directly to the scorecard form. 
                No login required. The link expires in 7 days.
            </p>
        </div>
        
        <div class="footer">
            <p>i79Engage Interview Management System</p>
            <p>If you have questions, please contact your recruiter.</p>
        </div>
    </div>
</body>
</html>
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```python
# tests/test_webhook_service.py

async def test_extract_join_url():
    """Test URL extraction from resource path"""
    service = WebhookService()
    
    resource = "communications/onlineMeetings(joinWebUrl='https%3A%2F%2Fteams.microsoft.com%2Fl%2Fmeetup-join')/meetingCallEvents"
    url = service._extract_join_url(resource)
    
    assert url == "https://teams.microsoft.com/l/meetup-join"

async def test_handle_call_ended_event():
    """Test webhook event processing"""
    # Mock payload
    payload = {
        "value": [{
            "clientState": "company_123",
            "resource": "communications/onlineMeetings(joinWebUrl='...')/meetingCallEvents",
            "resourceData": {
                "eventType": "callEnded",
                "eventDateTime": "2026-01-10T15:30:00Z",
                "id": "event_123"
            }
        }]
    }
    
    # ... test logic ...
```

### 9.2 Integration Tests

```python
# tests/integration/test_interview_conducted_flow.py

async def test_full_scorecard_flow():
    """Test complete flow: webhook → mark conducted → tasks → emails"""
    
    # 1. Create interview
    interview = await create_test_interview()
    
    # 2. Simulate webhook call
    result = await mark_interview_conducted(interview, ...)
    
    # 3. Verify interview updated
    assert interview.status == "conducted"
    assert interview.conductedAt is not None
    
    # 4. Verify tasks created
    tasks = await Task.find(Task.interviewId == interview.id).to_list()
    assert len(tasks) == len(interview.requiredScorecardUserIds)
    
    # 5. Verify tokens generated
    tokens = await ScorecardAccessToken.find(
        ScorecardAccessToken.interviewId == interview.id
    ).to_list()
    assert len(tokens) == len(interview.requiredScorecardUserIds)
    
    # 6. Verify emails sent (check mock)
    # ...
```

---

## 10. Implementation Checklist

### Phase 2A: Database & Models (2-3 days)
- [ ] Add Interview fields: `conductedAt`, `webhookEventId`, `scorecardRequestsSentAt`
- [ ] Create Task model
- [ ] Create ScorecardAccessToken model
- [ ] Create Ms365Subscription model
- [ ] Add database indexes
- [ ] Write migration script

### Phase 2B: Webhook Infrastructure (3-4 days)
- [ ] Update MS365Service: Add `create_webhook_subscription()` method
- [ ] Update MS365Service: Add `delete_subscription()` method
- [ ] Create WebhookService with event handler
- [ ] Create webhook endpoint: `POST /webhooks/ms365/call-ended`
- [ ] Handle validation tokens (first subscription)
- [ ] Extract joinWebUrl from resource path
- [ ] Test with real MS365 tenant

### Phase 2C: Business Logic (3-4 days)
- [ ] Create TaskService: `create_scorecard_tasks()`
- [ ] Create NotificationService: `generate_scorecard_tokens()`
- [ ] Create NotificationService: `send_scorecard_requests()`
- [ ] Update InterviewService: `mark_interview_conducted()` (shared function)
- [ ] Add manual fallback endpoint: `POST /interviews/{id}/mark-conducted`
- [ ] Update Application status when interview conducted

### Phase 2D: Email & Templates (2 days)
- [ ] Create email template: `scorecard_request.html`
- [ ] Integrate email provider (SendGrid/SES)
- [ ] Test email delivery
- [ ] Add email logging

### Phase 2E: Background Jobs (1-2 days)
- [ ] Create APScheduler setup
- [ ] Implement `renew_expiring_subscriptions()` job
- [ ] Run every 6 hours
- [ ] Test renewal logic
- [ ] Add monitoring/alerting

### Phase 2F: Testing (3-4 days)
- [ ] Unit tests: Webhook service, token generation, task creation
- [ ] Integration tests: Full flow (webhook → tasks → emails)
- [ ] E2E tests: Real MS365 webhook → scorecard submission
- [ ] Manual testing: Create interview, end meeting, verify emails
- [ ] Load testing: Handle multiple simultaneous webhooks

### Phase 2G: Deployment (2-3 days)
- [ ] Database migrations
- [ ] Deploy backend changes
- [ ] Configure webhook endpoint URL in MS365
- [ ] Monitor webhook delivery
- [ ] Monitor email delivery rates
- [ ] Set up error alerting

**Total Estimated Time:** 16-22 days (3-4 weeks)

---

## 11. Security Considerations

### 11.1 Webhook Security

Even without encryption, validate authenticity:

```python
async def validate_webhook_signature(request: Request) -> bool:
    """
    Validate webhook is from MS365 (optional but recommended)
    
    Options:
    1. Check clientState matches known company ID
    2. Whitelist MS365 IP ranges
    3. Check subscription ID exists in database
    """
    body = await request.json()
    
    # Check clientState
    client_state = body.get("value", [{}])[0].get("clientState")
    company = await Company.find_one(Company.id == client_state)
    
    return company is not None
```

### 11.2 Token Security

```python
# Use strong secret key
SECRET_KEY = os.getenv("SECRET_KEY")  # 32+ characters

# Short expiration for high-sensitivity
SCORECARD_TOKEN_EXPIRY_DAYS = 7

# Rate limiting on token validation
@limiter.limit("10/minute")
async def validate_scorecard_token(token: str):
    # ...
```

### 11.3 Idempotency

```python
# Check webhook already processed
if interview.webhookEventId == event_id:
    return {"status": "already_processed"}

# Store webhook event ID
interview.webhookEventId = event_id
await interview.save()
```

---

## 12. Monitoring & Alerts

### 12.1 Key Metrics

1. **Webhook Delivery Success Rate**
   - Target: 99%+
   - Alert if < 95%

2. **Scorecard Email Delivery Rate**
   - Target: 98%+
   - Alert if < 95%

3. **Task Creation Rate**
   - Track tasks created per interview
   - Alert if mismatch (tasks != interviewers)

4. **Subscription Renewal Success**
   - Target: 100%
   - Alert on any failure

5. **Webhook Processing Latency**
   - Target: < 2 seconds
   - Alert if > 5 seconds

### 12.2 Error Alerting

```python
# Log critical errors
if interview not found:
    logger.error(f"Webhook interview not found: url={teams_join_url}, company={client_state}")
    # Send alert to Slack/PagerDuty

if task creation fails:
    logger.error(f"Task creation failed: interview={interview.id}")
    # Send alert

if email delivery fails:
    logger.error(f"Email delivery failed: to={interviewer.email}")
    # Send alert
```

---

## Summary

**Phase 2 adds automatic scorecard triggering via webhooks:**

✅ **What We're Building:**
1. Basic MS365 webhook subscription (no encryption certificates needed!)
2. Webhook endpoint to receive `callEnded` events
3. Correlation by `teamsJoinUrl` + `companyId`
4. Mark interview as "conducted"
5. Create tasks for all interviewers
6. Generate magic link tokens
7. Send scorecard request emails
8. Background job to renew subscriptions (3-day max)
9. Manual fallback if webhook fails

✅ **Key Simplifications:**
- No encryption certificates (basic notifications)
- Simple correlation (joinWebUrl + companyId)
- Idempotency via webhookEventId
- Always return 202 (prevent blacklisting)

✅ **Timeline:** 16-22 days (3-4 weeks)

**Next Steps:** 
1. Review design
2. Approve Phase 2
3. Begin implementation (Phase 2A: Database)


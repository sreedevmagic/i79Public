# M365 Integration Design: Simplified Interview Scheduling

**Document Version:** 3.0 (Simplified Design)  
**Last Updated:** January 4, 2026  
**Status:** Design Phase - Ready for Implementation  
**Approach:** Calendar Invite + Candidate Email with Magic Link  

---

## Executive Summary

This document outlines a **simplified M365 integration** for interview scheduling. When a human interview is scheduled, the system:

1. **Creates Interview record** in database (apply all business logic)
2. **Checks if M365 is configured** for the company
3. **If configured:** Sends calendar invite to interviewers via MS365
4. **Extracts meeting URL** from calendar event
5. **Sends separate email to candidate** with full interview details + magic link to accept/reject/propose new time

**Key Change from Previous Design:**
- ❌ **No webhook subscriptions** (no meeting end event detection)
- ❌ **No automatic scorecard triggers** (handled separately)
- ✅ **Simple calendar invite flow** (like Calendly/Google Calendar)
- ✅ **Candidate gets magic link** for response (accept/reject/reschedule)
- ✅ **M365 optional** (falls back to email-only if not configured)

---

## 1. Architecture Overview

### 1.1 System Flow

```
┌────────────────────────────────────────────────────────────┐
│  User Action: Schedule Interview (via Frontend)           │
│  ├─ Select candidate + round                              │
│  ├─ Pick interviewers (panel support)                     │
│  ├─ Choose date/time                                      │
│  └─ Click "Schedule Interview"                            │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  Step 1: Create Interview Record (Backend)                │
│  ├─ Validate inputs                                       │
│  ├─ Create Interview in database                          │
│  ├─ interview.status = "draft"                            │
│  ├─ interview.interviewerType = "human"                   │
│  └─ Apply all business logic (permissions, validation)    │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  Step 2: Check M365 Configuration                         │
│  ├─ Load Company record                                   │
│  ├─ Check: company.ms365Credentials exists?               │
│  ├─ If YES → Continue to Step 3                           │
│  └─ If NO  → Skip to Step 5 (email-only mode)             │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼ (M365 configured)
┌────────────────────────────────────────────────────────────┐
│  Step 3: Create Calendar Invite via MS365 Graph API       │
│  ├─ Authenticate with MS365 (OAuth client credentials)    │
│  ├─ POST /calendar/events                                 │
│  │  ├─ Subject: "{roundName} - {candidateName}"           │
│  │  ├─ Start: {scheduledAt}                               │
│  │  ├─ Duration: {durationMin}                            │
│  │  ├─ Attendees: [interviewer emails] (NOT candidate)    │
│  │  └─ isOnlineMeeting: true (generates Teams link)       │
│  ├─ Response contains:                                    │
│  │  ├─ eventId (calendar event ID)                        │
│  │  ├─ onlineMeeting.joinUrl (Teams meeting URL)          │
│  │  └─ webLink (Outlook calendar link)                    │
│  └─ Store in Interview.ms365 metadata                     │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  Step 4: Update Interview Record                          │
│  ├─ interview.status = "scheduled"                        │
│  ├─ interview.scheduledAt = {datetime}                    │
│  ├─ interview.ms365 = {                                   │
│  │    eventId: "...",                                     │
│  │    teamsJoinUrl: "https://teams.microsoft.com/...",   │
│  │    calendarEventLink: "https://outlook.office.com..." │
│  │  }                                                     │
│  └─ Save to database                                      │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  Step 5: Send Candidate Email with Magic Link             │
│  ├─ Generate secure magic link token                      │
│  │  └─ Token contains: interviewId, candidateEmail, action│
│  ├─ Create InterviewInviteToken record                    │
│  │  ├─ token: "secure_jwt_token"                          │
│  │  ├─ interviewId: "intv_xxxxx"                          │
│  │  ├─ candidateEmail: "candidate@example.com"            │
│  │  ├─ expiresAt: +7 days                                 │
│  │  └─ status: "pending"                                  │
│  ├─ Send email to candidate with:                         │
│  │  ├─ Interview details (round, date/time, interviewers) │
│  │  ├─ Teams join URL (if M365 configured)                │
│  │  ├─ Magic link buttons:                                │
│  │  │  ├─ ✅ Accept Interview                             │
│  │  │  ├─ ❌ Decline Interview                            │
│  │  │  └─ 📅 Propose Different Time                       │
│  │  └─ Calendar attachment (.ics file)                    │
│  └─ interview.candidateNotificationSentAt = now()         │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  Step 6: Candidate Interaction (via Magic Link)           │
│  ├─ Candidate clicks link in email                        │
│  ├─ Frontend: /interview/response?token={token}           │
│  ├─ Backend validates token                               │
│  ├─ Shows interview details + action buttons              │
│  └─ Candidate chooses action                              │
└────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ (Accept)           │ (Decline)          │ (Propose)
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Accept Action   │  │ Decline Action  │  │ Propose Action  │
│ ├─ Update token │  │ ├─ Update token │  │ ├─ Show form    │
│ │  status="used"│  │ │  status="used"│  │ │  with calendar│
│ ├─ interview    │  │ ├─ interview    │  │ ├─ Candidate    │
│ │  .candidate   │  │ │  .candidate   │  │ │  picks new    │
│ │  Response     │  │ │  Response     │  │ │  time slots   │
│ │  ="accepted"  │  │ │  ="declined"  │  │ ├─ Submit       │
│ ├─ Notify       │  │ ├─ Notify       │  │ │  proposed     │
│ │  recruiter    │  │ │  recruiter    │  │ │  times        │
│ │  "Confirmed!" │  │ │  "Declined"   │  │ └─ Notify       │
│ └─ Send calendar│  │ └─ Cancel M365  │  │    recruiter    │
│    .ics to      │  │    calendar     │  │    for approval │
│    candidate    │  │    event        │  └─────────────────┘
└─────────────────┘  └─────────────────┘
```

---

## 2. Data Models

### 2.1 Interview Model (Updated)

```python
class Ms365Metadata(BaseModel):
    eventId: str | None = None                    # Calendar event ID from MS365
    teamsJoinUrl: str | None = None               # Teams meeting join URL
    organizerUserId: str | None = None            # User who created the meeting
    calendarEventLink: str | None = None          # Outlook web link to event
    tenantId: str | None = None                   # MS365 tenant ID


class InterviewerAssignment(BaseModel):
    userId: str
    name: str
    email: str


class Interview(Document):
    id: str
    companyId: str
    applicationId: str
    requisitionId: str
    candidateId: str | None = None
    candidateName: str
    candidateEmail: str
    roundName: str
    roundType: str
    sequence: int = 1
    
    interviewerType: str = "human"                # human | ai
    interviewerUserIds: list[str]
    interviewers: list[InterviewerAssignment]
    
    scorecardTemplateId: str
    durationMin: int = 30
    timezone: str | None = None
    scheduledAt: datetime | None = None
    
    status: str = "draft"                         # draft | scheduled | completed | cancelled
    
    # MS365 integration
    ms365: Ms365Metadata | None = None
    
    # Candidate response tracking (NEW)
    candidateResponse: str | None = None          # accepted | declined | no_response
    candidateResponseAt: datetime | None = None
    candidateProposedTimes: list[datetime] = []   # If candidate proposes different times
    candidateNotificationSentAt: datetime | None = None
    
    # Scorecard tracking
    requiredScorecardUserIds: list[str]
    completedScorecardUserIds: list[str] = []
    
    notes: str | None = None
    createdAt: datetime
    updatedAt: datetime

    class Settings:
        name = "interviews"
        indexes = [
            "companyId",
            ["companyId", "applicationId"],
            ["companyId", "requisitionId"],
            ["companyId", "candidateEmail"],
            ["companyId", "status"],
        ]
```

### 2.2 InterviewInviteToken Model (NEW)

```python
class InterviewInviteToken(Document):
    """Magic link token for candidate interview responses"""
    
    id: str = Field(default_factory=lambda: generate_id("iitk"))
    companyId: str
    interviewId: str
    candidateEmail: str
    
    token: str                                    # Secure JWT-like token
    status: str = "pending"                       # pending | used | expired
    
    # What actions can this token perform
    allowedActions: list[str] = ["accept", "decline", "propose"]
    
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    expiresAt: datetime                           # Usually +7 days
    usedAt: datetime | None = None
    ipAddress: str | None = None                  # Track where used from
    userAgent: str | None = None

    class Settings:
        name = "interview_invite_tokens"
        indexes = [
            "token",                              # Unique index
            ["companyId", "interviewId"],
            ["candidateEmail", "status"],
        ]
```

### 2.3 Company Model (Existing - No Changes Needed)

```python
class Ms365Credentials(BaseModel):
    tenantId: str
    clientId: str
    clientSecretEncrypted: str
    authorityUrl: str | None = None
    updatedAt: datetime
    updatedByUserId: str | None = None


class Company(Document):
    id: str
    name: str
    subscriptionTier: str = "trial"
    subscriptionStatus: str = "trial"
    interviewCredits: int = 0
    
    # MS365 integration (optional)
    ms365Credentials: Ms365Credentials | None = None
    
    # ... other fields
```

---

## 3. API Endpoints

### 3.1 Schedule Interview (Updated)

**Endpoint:** `POST /interviews/{interview_id}/schedule`

**Request:**
```json
{
  "scheduledAt": "2026-01-10T14:00:00Z",
  "timezone": "America/New_York",
  "sendCandidateEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "intv_xxxxx",
    "status": "scheduled",
    "scheduledAt": "2026-01-10T14:00:00Z",
    "ms365": {
      "teamsJoinUrl": "https://teams.microsoft.com/l/meetup-join/...",
      "calendarEventLink": "https://outlook.office.com/calendar/..."
    },
    "candidateNotificationSentAt": "2026-01-04T10:30:00Z"
  }
}
```

**Logic Flow:**
1. Validate interview exists and user has permissions
2. Create Interview record with status="draft"
3. Check if `company.ms365Credentials` exists
4. If yes: Create MS365 calendar event (interviewers only)
5. Update Interview with ms365 metadata and status="scheduled"
6. Generate magic link token for candidate
7. Send candidate email with Teams URL + magic link
8. Return updated Interview

---

### 3.2 Candidate Response (NEW)

**Endpoint:** `POST /interviews/response`

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "action": "accept",
  "proposedTimes": []  // Only if action="propose"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Interview accepted. You will receive a calendar invite shortly.",
  "data": {
    "interviewId": "intv_xxxxx",
    "status": "scheduled",
    "candidateResponse": "accepted"
  }
}
```

**Supported Actions:**
- `accept` - Candidate confirms attendance
- `decline` - Candidate rejects interview
- `propose` - Candidate suggests alternative times

**Logic Flow:**
1. Validate token (not expired, not used)
2. Load Interview by token.interviewId
3. Check Interview.status == "scheduled"
4. Process action:
   - **Accept:** 
     - interview.candidateResponse = "accepted"
     - Send calendar .ics file to candidate email
     - Notify recruiter: "Candidate confirmed"
   - **Decline:**
     - interview.candidateResponse = "declined"
     - Cancel MS365 calendar event (if exists)
     - Notify recruiter: "Candidate declined"
   - **Propose:**
     - interview.candidateProposedTimes = proposedTimes
     - Notify recruiter: "Candidate proposed new times"
5. Mark token as used
6. Save Interview
7. Return success response

---

### 3.3 Get Interview Response Page (NEW)

**Endpoint:** `GET /interviews/response?token={token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "interview": {
      "id": "intv_xxxxx",
      "roundName": "Technical Interview",
      "scheduledAt": "2026-01-10T14:00:00Z",
      "durationMin": 60,
      "interviewers": [
        {"name": "Sarah Chen", "email": "sarah@company.com"},
        {"name": "Mike Johnson", "email": "mike@company.com"}
      ],
      "teamsJoinUrl": "https://teams.microsoft.com/..."
    },
    "token": {
      "status": "pending",
      "expiresAt": "2026-01-11T10:30:00Z",
      "allowedActions": ["accept", "decline", "propose"]
    }
  }
}
```

**Logic Flow:**
1. Validate token exists and not expired
2. Load Interview by token.interviewId
3. Return interview details (sanitized, no sensitive data)
4. Frontend renders response page with action buttons

---

## 4. MS365 Service Implementation

### 4.1 Create Calendar Event

**MS365 Graph API Call:**

```python
async def create_calendar_event(
    self,
    *,
    company: Company,
    subject: str,
    scheduled_at: datetime,
    duration_minutes: int,
    organizer_user_id: str,
    attendee_emails: list[str],  # Interviewers only (NOT candidate)
) -> Ms365Metadata:
    """
    Create a calendar event with Teams meeting link
    
    Only interviewers are added as attendees.
    Candidate receives separate email with join link.
    """
    
    # Step 1: Get access token
    access_token = await self._get_access_token(company)
    
    # Step 2: Build event payload
    end_time = scheduled_at + timedelta(minutes=duration_minutes)
    
    event_payload = {
        "subject": subject,
        "start": {
            "dateTime": scheduled_at.isoformat(),
            "timeZone": "UTC"
        },
        "end": {
            "dateTime": end_time.isoformat(),
            "timeZone": "UTC"
        },
        "attendees": [
            {
                "emailAddress": {"address": email},
                "type": "required"
            }
            for email in attendee_emails
        ],
        "isOnlineMeeting": True,
        "onlineMeetingProvider": "teamsForBusiness"
    }
    
    # Step 3: Call MS365 Graph API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://graph.microsoft.com/v1.0/users/{organizer_user_id}/calendar/events",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            json=event_payload
        )
        
        if response.status_code != 201:
            logger.error(f"Failed to create calendar event: {response.text}")
            raise HTTPException(
                status_code=500,
                detail="Failed to create MS365 calendar event"
            )
        
        event_data = response.json()
    
    # Step 4: Extract meeting details
    return Ms365Metadata(
        eventId=event_data["id"],
        teamsJoinUrl=event_data["onlineMeeting"]["joinUrl"],
        organizerUserId=organizer_user_id,
        calendarEventLink=event_data["webLink"],
        tenantId=company.ms365Credentials.tenantId
    )
```

**Key Points:**
- ✅ **Attendees = Interviewers only** (NOT candidate)
- ✅ **isOnlineMeeting: true** - Auto-generates Teams meeting
- ✅ **Returns Teams join URL** - Send to candidate separately
- ✅ **Organizer** - User who scheduled the interview (recruiter)

---

### 4.2 Cancel Calendar Event

```python
async def cancel_calendar_event(
    self,
    *,
    company: Company,
    event_id: str,
    organizer_user_id: str,
) -> None:
    """Cancel MS365 calendar event (when candidate declines)"""
    
    access_token = await self._get_access_token(company)
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"https://graph.microsoft.com/v1.0/users/{organizer_user_id}/calendar/events/{event_id}",
            headers={
                "Authorization": f"Bearer {access_token}"
            }
        )
        
        if response.status_code not in [204, 404]:
            logger.error(f"Failed to cancel event: {response.text}")
            raise HTTPException(
                status_code=500,
                detail="Failed to cancel MS365 calendar event"
            )
    
    logger.info(f"Cancelled MS365 event: {event_id}")
```

---

## 5. Email Service Implementation

### 5.1 Candidate Interview Invite Email

**Email Template:** `candidate_interview_invite.html`

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .action-buttons { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 12px 30px; margin: 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .btn-accept { background: #28a745; color: white; }
        .btn-decline { background: #dc3545; color: white; }
        .btn-propose { background: #ffc107; color: black; }
        .teams-link { background: #5b21b6; color: white; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: center; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Interview Invitation</h1>
        </div>
        
        <div class="content">
            <p>Hi {{candidateName}},</p>
            
            <p>You have been invited to interview for the position of <strong>{{jobTitle}}</strong> at {{companyName}}.</p>
            
            <div class="details">
                <h3>Interview Details</h3>
                <p><strong>Round:</strong> {{roundName}}</p>
                <p><strong>Date & Time:</strong> {{scheduledAt}} ({{timezone}})</p>
                <p><strong>Duration:</strong> {{durationMin}} minutes</p>
                <p><strong>Interviewers:</strong></p>
                <ul>
                    {{#each interviewers}}
                    <li>{{name}} ({{email}})</li>
                    {{/each}}
                </ul>
            </div>
            
            {{#if teamsJoinUrl}}
            <div class="teams-link">
                <h3>🎥 Join Teams Meeting</h3>
                <a href="{{teamsJoinUrl}}" style="color: white; font-size: 18px;">Click here to join</a>
            </div>
            {{/if}}
            
            <div class="action-buttons">
                <h3>Can you make it?</h3>
                <a href="{{acceptUrl}}" class="btn btn-accept">✅ Accept Interview</a>
                <a href="{{declineUrl}}" class="btn btn-decline">❌ Decline Interview</a>
                <a href="{{proposeUrl}}" class="btn btn-propose">📅 Propose Different Time</a>
            </div>
            
            <p style="text-align: center; color: #666; font-size: 12px;">
                This invitation expires on {{expiresAt}}
            </p>
        </div>
    </div>
</body>
</html>
```

**Email Service Function:**

```python
async def send_candidate_interview_invite(
    self,
    *,
    interview: Interview,
    token: str,
    frontend_base_url: str,
) -> None:
    """Send interview invite email to candidate with magic link"""
    
    # Generate magic link URLs
    accept_url = f"{frontend_base_url}/interview/response?token={token}&action=accept"
    decline_url = f"{frontend_base_url}/interview/response?token={token}&action=decline"
    propose_url = f"{frontend_base_url}/interview/response?token={token}&action=propose"
    
    # Prepare template data
    template_data = {
        "candidateName": interview.candidateName,
        "companyName": "Company Name",  # Load from Company model
        "jobTitle": "Job Title",         # Load from Requisition model
        "roundName": interview.roundName,
        "scheduledAt": interview.scheduledAt.strftime("%B %d, %Y at %I:%M %p"),
        "timezone": interview.timezone or "UTC",
        "durationMin": interview.durationMin,
        "interviewers": [
            {"name": i.name, "email": i.email}
            for i in interview.interviewers
        ],
        "teamsJoinUrl": interview.ms365.teamsJoinUrl if interview.ms365 else None,
        "acceptUrl": accept_url,
        "declineUrl": decline_url,
        "proposeUrl": propose_url,
        "expiresAt": (datetime.utcnow() + timedelta(days=7)).strftime("%B %d, %Y")
    }
    
    # Generate .ics calendar attachment
    ics_content = self._generate_ics_file(interview)
    
    # Send email via your email provider (SendGrid, SES, etc.)
    await self._send_email(
        to=interview.candidateEmail,
        subject=f"Interview Invitation: {interview.roundName}",
        template="candidate_interview_invite.html",
        template_data=template_data,
        attachments=[
            {
                "filename": "interview.ics",
                "content": ics_content,
                "type": "text/calendar"
            }
        ]
    )
    
    logger.info(f"Sent interview invite to: {interview.candidateEmail}")
```

---

### 5.2 Generate Calendar .ics File

```python
def _generate_ics_file(self, interview: Interview) -> str:
    """Generate iCalendar (.ics) file for interview"""
    
    from icalendar import Calendar, Event as ICalEvent
    from datetime import timedelta
    
    cal = Calendar()
    cal.add('prodid', '-//i79Engage//Interview Scheduler//EN')
    cal.add('version', '2.0')
    
    event = ICalEvent()
    event.add('summary', f"{interview.roundName} - {interview.candidateName}")
    event.add('dtstart', interview.scheduledAt)
    event.add('dtend', interview.scheduledAt + timedelta(minutes=interview.durationMin))
    event.add('dtstamp', datetime.utcnow())
    event.add('uid', f"interview-{interview.id}@i79engage.com")
    
    # Add description with Teams link if available
    description = f"Interview Round: {interview.roundName}\n"
    description += f"Duration: {interview.durationMin} minutes\n\n"
    description += "Interviewers:\n"
    for i in interview.interviewers:
        description += f"- {i.name} ({i.email})\n"
    
    if interview.ms365 and interview.ms365.teamsJoinUrl:
        description += f"\n\nJoin Teams Meeting:\n{interview.ms365.teamsJoinUrl}"
    
    event.add('description', description)
    
    # Add organizer
    if interview.interviewers:
        event.add('organizer', f"mailto:{interview.interviewers[0].email}")
    
    # Add attendee (candidate)
    event.add('attendee', f"mailto:{interview.candidateEmail}")
    
    cal.add_component(event)
    
    return cal.to_ical().decode('utf-8')
```

---

## 6. Frontend Implementation

### 6.1 Interview Response Page

**Route:** `/interview/response`

**Component:** `InterviewResponsePage.tsx`

```typescript
interface InterviewResponsePageProps {
  token: string;
  preselectedAction?: 'accept' | 'decline' | 'propose';
}

export function InterviewResponsePage({ token, preselectedAction }: InterviewResponsePageProps) {
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(preselectedAction);
  const [proposedTimes, setProposedTimes] = useState<Date[]>([]);
  
  useEffect(() => {
    // Fetch interview details by token
    fetchInterviewByToken(token).then(data => {
      setInterview(data.interview);
      setLoading(false);
    });
  }, [token]);
  
  const handleSubmit = async () => {
    await submitResponse({
      token,
      action,
      proposedTimes: action === 'propose' ? proposedTimes : []
    });
    
    // Show success message
    toast.success(getSuccessMessage(action));
  };
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="interview-response-container">
      <h1>Interview Invitation</h1>
      
      <Card>
        <CardHeader>
          <h2>{interview.roundName}</h2>
        </CardHeader>
        <CardContent>
          <div className="interview-details">
            <p><strong>Date:</strong> {formatDate(interview.scheduledAt)}</p>
            <p><strong>Duration:</strong> {interview.durationMin} minutes</p>
            <p><strong>Interviewers:</strong></p>
            <ul>
              {interview.interviewers.map(i => (
                <li key={i.userId}>{i.name}</li>
              ))}
            </ul>
            
            {interview.teamsJoinUrl && (
              <div className="teams-link">
                <a href={interview.teamsJoinUrl} target="_blank">
                  🎥 Join Teams Meeting
                </a>
              </div>
            )}
          </div>
          
          {!action && (
            <div className="action-buttons">
              <Button onClick={() => setAction('accept')} variant="success">
                ✅ Accept
              </Button>
              <Button onClick={() => setAction('decline')} variant="danger">
                ❌ Decline
              </Button>
              <Button onClick={() => setAction('propose')} variant="warning">
                📅 Propose Different Time
              </Button>
            </div>
          )}
          
          {action === 'accept' && (
            <div className="confirmation">
              <p>Great! Please confirm you will attend this interview.</p>
              <Button onClick={handleSubmit}>Confirm Attendance</Button>
            </div>
          )}
          
          {action === 'decline' && (
            <div className="decline-form">
              <p>We're sorry you can't make it. Please confirm cancellation.</p>
              <Button onClick={handleSubmit} variant="danger">Confirm Decline</Button>
            </div>
          )}
          
          {action === 'propose' && (
            <div className="propose-form">
              <p>Please select 2-3 alternative time slots:</p>
              <DateTimePicker
                value={proposedTimes}
                onChange={setProposedTimes}
                min={new Date()}
                multiple
              />
              <Button 
                onClick={handleSubmit} 
                disabled={proposedTimes.length < 2}
              >
                Submit Proposed Times
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 7. Security Considerations

### 7.1 Magic Link Token Security

**Token Generation:**
```python
import jwt
from datetime import datetime, timedelta
from app.core.config import settings

def generate_interview_token(interview_id: str, candidate_email: str) -> str:
    """Generate secure JWT token for interview response"""
    
    payload = {
        "interview_id": interview_id,
        "candidate_email": candidate_email,
        "type": "interview_invite",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    
    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm="HS256"
    )
    
    return token
```

**Token Validation:**
```python
def validate_interview_token(token: str) -> dict:
    """Validate and decode interview token"""
    
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )
        
        # Verify token type
        if payload.get("type") != "interview_invite":
            raise HTTPException(400, "Invalid token type")
        
        # Check expiration (JWT handles this automatically)
        return payload
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(400, "Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(400, "Invalid token")
```

### 7.2 Rate Limiting

- Limit token validation requests to 10 per minute per IP
- Prevent brute-force token guessing
- Log suspicious activity

### 7.3 Audit Trail

Track all candidate responses:
```python
class InterviewResponseAudit(Document):
    interviewId: str
    candidateEmail: str
    action: str  # accept | decline | propose
    ipAddress: str
    userAgent: str
    timestamp: datetime
```

---

## 8. Error Handling & Edge Cases

### 8.1 M365 Configuration Missing

**Scenario:** Company doesn't have MS365 configured

**Behavior:**
- Skip Step 3 (calendar event creation)
- Still send candidate email with interview details
- No Teams join URL (candidate can ask recruiter for meeting link)
- Email includes note: "Meeting details will be shared separately"

**Code:**
```python
async def schedule_interview(...):
    # Step 1: Create Interview
    interview.status = "draft"
    await interview.insert()
    
    # Step 2: Try MS365 integration
    if company.ms365Credentials:
        try:
            ms365_metadata = await ms365_service.create_calendar_event(...)
            interview.ms365 = ms365_metadata
        except Exception as e:
            logger.error(f"MS365 integration failed: {str(e)}")
            # Continue without MS365 (graceful degradation)
    
    # Step 3: Always send candidate email
    interview.status = "scheduled"
    await interview.save()
    await send_candidate_invite(interview)
```

---

### 8.2 Calendar Event Creation Fails

**Scenario:** MS365 API error (network, permissions, expired credentials)

**Behavior:**
- Log error with details
- Continue scheduling process (don't block)
- Notify admin/recruiter: "MS365 integration failed"
- Candidate still gets email (without Teams link)

---

### 8.3 Candidate Token Expired

**Scenario:** Candidate clicks link after 7 days

**Behavior:**
- Show error page: "This invitation has expired"
- Display recruiter contact info
- Suggest contacting recruiter for new invite
- Log expired token usage attempt

---

### 8.4 Duplicate Accept/Decline

**Scenario:** Candidate clicks accept, then clicks decline

**Behavior:**
- First action is recorded
- Subsequent actions update the response
- Notify recruiter of status change
- Latest action is the source of truth

---

## 9. Implementation Checklist

### Phase 1: Database & Models (1-2 days)
- [ ] Add fields to Interview model:
  - [ ] `candidateResponse`
  - [ ] `candidateResponseAt`
  - [ ] `candidateProposedTimes`
  - [ ] `candidateNotificationSentAt`
- [ ] Create InterviewInviteToken model
- [ ] Create database indexes
- [ ] Write migration script

### Phase 2: MS365 Service (2-3 days)
- [ ] Implement `create_calendar_event()` method
- [ ] Implement `cancel_calendar_event()` method
- [ ] Add graceful fallback when M365 not configured
- [ ] Test with real MS365 tenant
- [ ] Handle token refresh

### Phase 3: Email Service (2-3 days)
- [ ] Create email template: `candidate_interview_invite.html`
- [ ] Implement `send_candidate_interview_invite()` function
- [ ] Implement `.ics` file generation
- [ ] Test email delivery with attachments
- [ ] Configure email provider (SendGrid/SES)

### Phase 4: Backend API (3-4 days)
- [ ] Update `schedule_interview()` endpoint
  - [ ] Integrate M365 calendar creation
  - [ ] Generate magic link token
  - [ ] Send candidate email
- [ ] Create `POST /interviews/response` endpoint
  - [ ] Validate token
  - [ ] Handle accept/decline/propose actions
  - [ ] Update Interview status
  - [ ] Notify recruiter
- [ ] Create `GET /interviews/response` endpoint
  - [ ] Return interview details by token
- [ ] Add audit logging

### Phase 5: Frontend (3-4 days)
- [ ] Create `InterviewResponsePage.tsx` component
- [ ] Add routing: `/interview/response`
- [ ] Implement action buttons (accept/decline/propose)
- [ ] Add date/time picker for proposed times
- [ ] Show success/error messages
- [ ] Mobile-responsive design

### Phase 6: Testing (2-3 days)
- [ ] Unit tests: Token generation/validation
- [ ] Integration tests: Full scheduling flow
- [ ] E2E tests: Candidate response flow
- [ ] Test M365 integration (with real tenant)
- [ ] Test fallback (no M365 credentials)
- [ ] Test email delivery
- [ ] Security tests: Token tampering, expired tokens

### Phase 7: Deployment (1-2 days)
- [ ] Database migration
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Configure email templates
- [ ] Monitor email delivery rates
- [ ] Monitor API error rates

**Total Estimated Time:** 14-21 days (3-4 weeks)

---

## 10. Success Metrics

### Key Metrics to Track

1. **Interview Scheduling Rate**
   - Target: 95%+ of interviews scheduled successfully
   - Track failures (M365 errors, email bounces)

2. **Candidate Response Rate**
   - Target: 80%+ candidates respond within 24 hours
   - Track accept/decline/propose distribution

3. **M365 Integration Success**
   - Target: 99%+ calendar events created successfully
   - Track API errors, timeouts, credential issues

4. **Email Delivery Rate**
   - Target: 98%+ emails delivered
   - Track bounces, spam complaints

5. **Magic Link Usage**
   - Track token expiration rate
   - Track time-to-response distribution

---

## 11. Future Enhancements (Post-MVP)

### Phase 2: Advanced Scheduling
- [ ] **Two-way calendar sync** - Update i79Engage when recruiter changes event in Outlook
- [ ] **Availability checking** - Check interviewer calendars before scheduling
- [ ] **Automatic rescheduling** - If candidate proposes time, auto-check availability
- [ ] **Reminder emails** - Send reminders 24h and 1h before interview
- [ ] **No-show detection** - Track if candidate joined the meeting

### Phase 3: Enhanced Candidate Experience
- [ ] **Add to Google Calendar** button (for non-MS365 candidates)
- [ ] **Interview preparation tips** in email
- [ ] **Upload documents** before interview (portfolio, code samples)
- [ ] **Video intro recording** - Let candidate record intro video

### Phase 4: Recruiter Automation
- [ ] **Bulk scheduling** - Schedule multiple rounds at once
- [ ] **Smart time suggestions** - AI suggests best times based on availability
- [ ] **Interview panel optimizer** - Suggest best interviewer combinations

---

## Summary

This simplified design focuses on:

✅ **Core Flow:**
1. Create Interview record
2. Check M365 configuration
3. If configured: Create calendar invite (interviewers only)
4. Send separate email to candidate with magic link
5. Candidate accepts/declines/proposes new time via magic link

✅ **Key Benefits:**
- Simple, proven pattern (like Calendly)
- Works with or without M365
- Candidate has full control (accept/decline/reschedule)
- No complex webhook subscriptions
- Easy to test and maintain

✅ **Timeline:** 14-21 days for full implementation

**Next Steps:** Review design → Approve → Begin Phase 1 (Database & Models)


# Phase 3 – Last Stage: Complete Flow Diagram

## 1. INTERVIEW WORKFLOW – Auto Magic Link Send

```
┌─────────────────────────────────────────────────────────────────────┐
│ RECRUITER ACTION: Mark Interview as Conducted                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: Interview Detail Page                                      │
│ - Button: "Mark as Conducted"                                        │
│ - POST /api/interviews/{id}/mark-conducted                           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Backend: interview_service.mark_conducted()                          │
│ 1. Validate interview status (must be "scheduled" or "draft")        │
│ 2. Set Interview.status = "conducted"                                │
│ 3. Set Interview.conductedAt = now()                                 │
│ 4. Save interview                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ AUTO-TRIGGER: scorecard_magic_link_service.send_scorecard_magic_links() │
│                                                                       │
│ For each assigned interviewer:                                       │
│  1. Check if scorecard already submitted → SKIP                      │
│  2. Check if token sent recently (< 1h) → SKIP                       │
│  3. Generate magic link token (expires 72h)                          │
│  4. Hash token (SHA-256) → store in ScorecardMagicLinkToken          │
│  5. Render email template with magic link                            │
│  6. Send email via Resend API                                        │
│  7. Update Interview.scorecardStatusByInterviewer[id] = "pending"    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ EMAIL SENT TO INTERVIEWER                                            │
│                                                                       │
│ ╔═══════════════════════════════════════════════════════════════╗   │
│ ║ Subject: {Company}: Submit scorecard for {Candidate}          ║   │
│ ║                                                               ║   │
│ ║ Hi {InterviewerName},                                         ║   │
│ ║                                                               ║   │
│ ║ You're invited to submit a scorecard for {Candidate}'s        ║   │
│ ║ {RoundName} interview for {JobTitle}                          ║   │
│ ║                                                               ║   │
│ ║ [Submit Scorecard]                                            ║   │
│ ║ https://portal.example.com/scorecard-portal.html#{TOKEN}      ║   │
│ ║                                                               ║   │
│ ║ Link expires: {EXPIRY_TIME}                                   ║   │
│ ╚═══════════════════════════════════════════════════════════════╝   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. INTERVIEWER SUBMISSION WORKFLOW – Public Portal

```
┌─────────────────────────────────────────────────────────────────────┐
│ INTERVIEWER: Receives Email & Clicks Magic Link                     │
│ https://portal.example.com/scorecard-portal.html#{TOKEN}            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: Scorecard Portal (White-Labeled)                           │
│ - Loads ScorecardSubmission page                                     │
│ - Calls scorecardMagicLinkService.validateToken(token)              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Backend: GET /api/public/scorecards/{token}/validate                │
│                                                                       │
│ 1. Hash token (SHA-256)                                              │
│ 2. Lookup ScorecardMagicLinkToken by tokenHash                       │
│ 3. Validate: not expired, not used, company exists                   │
│ 4. Load Interview + ScorecardTemplate                                │
│ 5. Return interview + competencies for form                          │
│    {                                                                  │
│      interviewId, candidateName, roundName, templateId,              │
│      competencies: [{key, label, required, weight, helpText}, ...]   │
│    }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: Render Scorecard Form (SKELETON)                           │
│                                                                       │
│ Show:                                                                 │
│ - Candidate name & round name (from validation response)             │
│ - Company header/logo (white-label)                                  │
│ - Competencies with rating sliders (1-5)                             │
│ - Evidence text area (required, min 15 chars)                        │
│ - Overall recommendation dropdown (select)                           │
│ - Overall notes text area (optional)                                 │
│ - Submit button                                                       │
│                                                                       │
│ [Form UI Implementation Pending]                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ INTERVIEWER: Fills Form & Submits                                   │
│                                                                       │
│ Payload:                                                              │
│ {                                                                     │
│   interviewId: "intv_xxx",                                            │
│   templateId: "sct_xxx",                                              │
│   ratings: [                                                          │
│     { competencyKey: "c1", score: 4, evidence: "..." },              │
│     { competencyKey: "c2", score: 3, evidence: "..." }               │
│   ],                                                                   │
│   overallRecommendation: "strong_yes",                                │
│   overallNotes: "..."                                                 │
│ }                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: Call scorecardMagicLinkService.submitViaToken(token, payload) │
│ POST /api/public/scorecards/{token}/submit                           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Backend: POST /api/public/scorecards/{token}/submit (NO AUTH)        │
│                                                                       │
│ 1. Validate & consume token (mark usedAt = now)                      │
│ 2. Load Interview & ScorecardTemplate                                │
│ 3. Validate scorecard payload (ratings, evidence, etc.)              │
│ 4. Call scorecard_service.submit_scorecard(...)                      │
│    - Creates ScorecardSubmission document                             │
│    - Sets submittedByUserId = interviewer_id                          │
│    - Sets submittedByType = "human"                                   │
│    - Stores ratings with competency labels (for history)             │
│ 5. Update Interview.scorecardStatusByInterviewer[id] = "submitted"   │
│ 6. Check if ALL scorecards submitted:                                │
│    - If yes: set Interview.completedAt = now, status = "completed"   │
│ 7. Return ScorecardSubmission with audit trail                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: Scorecard Submitted Successfully                            │
│ - Redirect to ScorecardComplete page                                 │
│ - Show success message with checkmark                                │
│ - "Thank you for submitting the scorecard"                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. SLA-DRIVEN REMINDER WORKFLOW – n8n Scheduler

```
┌─────────────────────────────────────────────────────────────────────┐
│ n8n SCHEDULER: Runs Every 15 Minutes                                 │
│ Trigger: Schedule (cron: */15 * * * *)                               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ n8n: HTTP Request Node                                               │
│ POST /api/ops/reminders/scorecards/run                               │
│ Headers: Authorization: Bearer {ADMIN_JWT_TOKEN}                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Backend: POST /api/ops/reminders/scorecards/run (ADMIN ONLY)         │
│                                                                       │
│ Fetch company SLA config:                                            │
│ - firstReminderHours: 24                                              │
│ - secondReminderHours: 48                                             │
│ - finalReminderHours: 72                                              │
│ - stopAfterSubmit: true                                               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Backend: scorecard_magic_link_service.send_reminder_emails()         │
│                                                                       │
│ Query: Interviews with status="conducted" + pending scorecards       │
│                                                                       │
│ For each interview & pending interviewer:                            │
│                                                                       │
│  1. Calculate hours since Interview.conductedAt                      │
│                                                                       │
│  2. Check SLA windows:                                                │
│     ┌─────────────────────────────────────────────────────────┐      │
│     │ IF hours >= 24h AND not sent in last 24h:              │      │
│     │   → Send FIRST REMINDER (urgency: "blue")              │      │
│     │   → Update lastReminderAtByInterviewer                 │      │
│     │                                                          │      │
│     │ ELSE IF hours >= 48h AND not sent in last 48h:         │      │
│     │   → Send SECOND REMINDER (urgency: "orange")           │      │
│     │   → Update lastReminderAtByInterviewer                 │      │
│     │                                                          │      │
│     │ ELSE IF hours >= 72h AND not sent in last 72h:         │      │
│     │   → Send FINAL REMINDER (urgency: "red")               │      │
│     │   → Update lastReminderAtByInterviewer                 │      │
│     │                                                          │      │
│     │ ELSE IF all scorecards submitted:                       │      │
│     │   → STOP reminders (stopAfterSubmit=true)              │      │
│     └─────────────────────────────────────────────────────────┘      │
│                                                                       │
│  3. If reminder needed:                                               │
│     - Regenerate magic link token (72h expiry)                       │
│     - Send reminder email with urgency color/level                   │
│     - Increment sentCount                                             │
│     - Update lastReminderAtByInterviewer[id] = now                   │
│                                                                       │
│  4. Save Interview with updated reminder timestamps                  │
│                                                                       │
│ Return stats: {reminders_sent, interviews_completed, message}        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ EMAIL SENT TO INTERVIEWER (if needed)                                │
│                                                                       │
│ FIRST REMINDER (24h):                                                │
│ ╔═══════════════════════════════════════════════════════════════╗   │
│ ║ Subject: Reminder: Submit scorecard for {Candidate}           ║   │
│ ║                                                               ║   │
│ ║ Hi {InterviewerName},                                         ║   │
│ ║                                                               ║   │
│ ║ 💙 Just a friendly reminder – we're still waiting for your    ║   │
│ ║ scorecard for {Candidate}'s {RoundName} interview             ║   │
│ ║                                                               ║   │
│ ║ [Submit Scorecard Now]                                        ║   │
│ ║ https://portal.example.com/scorecard-portal.html#{NEW_TOKEN}  ║   │
│ ╚═══════════════════════════════════════════════════════════════╝   │
│                                                                       │
│ SECOND REMINDER (48h):                                               │
│ ╔═══════════════════════════════════════════════════════════════╗   │
│ ║ Subject: ⚠️ REMINDER: Submit scorecard for {Candidate}        ║   │
│ ║                                                               ║   │
│ ║ Hi {InterviewerName},                                         ║   │
│ ║                                                               ║   │
│ ║ 🟠 This is your SECOND reminder...                            ║   │
│ ║ Please submit the scorecard as soon as possible               ║   │
│ ╚═══════════════════════════════════════════════════════════════╝   │
│                                                                       │
│ FINAL REMINDER (72h):                                                │
│ ╔═══════════════════════════════════════════════════════════════╗   │
│ ║ Subject: 🔴 FINAL NOTICE: Scorecard Pending                   ║   │
│ ║                                                               ║   │
│ ║ Hi {InterviewerName},                                         ║   │
│ ║                                                               ║   │
│ ║ 🔴 FINAL REMINDER – This is your last notice...               ║   │
│ ║ Please complete the scorecard immediately                     ║   │
│ ╚═══════════════════════════════════════════════════════════════╝   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. MANUAL MAGIC LINK RESEND WORKFLOW

```
┌─────────────────────────────────────────────────────────────────────┐
│ RECRUITER: Interview Detail Page                                    │
│ - Sees scorecard status per interviewer:                            │
│   ✗ John Doe (pending, sent 2h ago)                                 │
│   ✓ Jane Smith (submitted 1h ago)                                    │
│   ✗ Mike Johnson (pending, never sent)                              │
│                                                                       │
│ - Clicks "Resend Magic Link" for John Doe                            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: Call interviewScorecardService.sendMagicLinks(interviewId) │
│ POST /api/scorecards/{interview_id}/send-magic-links                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Backend: POST /api/scorecards/{interview_id}/send-magic-links        │
│ Auth: Admin, Recruiter, Hiring Manager                               │
│                                                                       │
│ 1. Validate interview exists & status = "conducted"                  │
│ 2. For each assigned interviewer without submitted scorecard:        │
│    - Check rate limit: not sent in last 1h → SKIP                    │
│    - Generate NEW magic link token (invalidates old)                 │
│    - Send email                                                       │
│ 3. Return {sent_count, skipped_count}                                │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: Toast notification                                         │
│ "Magic links sent to 2 interviewers (1 skipped - sent recently)"    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. DELEGATE SUBMISSION WORKFLOW – Edge Case

```
┌─────────────────────────────────────────────────────────────────────┐
│ HIRING MANAGER: Interview Detail Page                                │
│ - Realizes John Doe (interviewer) is unavailable/unresponsive       │
│ - Clicks "Submit on Behalf" button for John                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: Opens Delegate Submission Dialog                            │
│                                                                       │
│ Form:                                                                 │
│ - Interviewer: John Doe (read-only)                                  │
│ - Rating 1: Competency A [●●●○○] (3/5)                              │
│ - Evidence: [text area] "Demonstrated good communication..."        │
│ - Rating 2: Competency B [●●●●○] (4/5)                              │
│ - Evidence: [text area]                                              │
│ - Overall Recommendation: [dropdown] "Proceed to next round"        │
│ - Reason for delegate submission: [required text]                    │
│   "John is on vacation, but I observed the interview"               │
│ - [Submit on Behalf] button                                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: Call interviewScorecardService.submitOnBehalf(...)         │
│ POST /api/scorecards/{interview_id}/delegate-submission              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Backend: POST /api/scorecards/{interview_id}/delegate-submission     │
│ Auth: Admin, Recruiter, Hiring Manager                               │
│                                                                       │
│ 1. Validate interview & template exist                               │
│ 2. Validate ratings (required, 1-5 score, evidence min 15 chars)     │
│ 3. Call scorecard_service.submit_scorecard(...):                     │
│    - submitted_by_type = "human"                                      │
│    - submitted_by_user_id = originalInterviewerId (John)             │
│ 4. Set audit fields on ScorecardSubmission:                          │
│    - submittedByDelegate = TRUE                                       │
│    - originalInterviewerId = "john_id"                                │
│    - delegateReason = "John is on vacation, but I observed..."      │
│    - submittedByUserId = current_user.id (HM)                        │
│ 5. Save & return ScorecardSubmission                                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ DATABASE: Audit Trail Complete                                       │
│                                                                       │
│ ScorecardSubmission record:                                          │
│ {                                                                     │
│   id: "scs_xxx",                                                      │
│   interviewId: "intv_yyy",                                            │
│   submittedByUserId: "john_id",                                       │
│   submittedByDelegate: TRUE ⚠️                                        │
│   originalInterviewerId: "john_id",                                   │
│   delegateReason: "John is on vacation, but I observed...",          │
│   ratings: [...],                                                     │
│   submittedAt: "2026-01-12T10:30:00Z",                                │
│   ...                                                                 │
│ }                                                                     │
│                                                                       │
│ Interview record:                                                    │
│ {                                                                     │
│   scorecardStatusByInterviewer: {                                     │
│     "john_id": "delegated" ⚠️                                         │
│   }                                                                   │
│ }                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: Success Notification                                       │
│ "✓ Scorecard submitted on behalf of John Doe (observed by you)"     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. STATE MACHINE – Interview Scorecard Status

```
Interview.scorecardStatusByInterviewer[interviewerId]:

    ┌─────────────┐
    │   PENDING   │ ← Initial state when conducted
    └──────┬──────┘
           │
           ├─ Magic link sent
           ├─ Reminder 1 @ 24h
           ├─ Reminder 2 @ 48h
           └─ Reminder 3 @ 72h
           │
           ├─── Interviewer submits via portal ────┐
           │                                        │
           └─── HM submits on behalf (delegate) ─┐ │
                                                  │ │
                      ┌────────────────────────────┴─┴─────┐
                      ↓                                      ↓
                ┌──────────────┐               ┌─────────────────┐
                │  SUBMITTED   │               │   DELEGATED     │
                │ (normal flow)│               │ (edge case)     │
                └──────────────┘               └─────────────────┘
                      │                              │
                      │ All scorecards done          │ All scorecards done
                      │                              │
                      └──────────────┬───────────────┘
                                     ↓
                      ┌──────────────────────────┐
                      │  Interview.completedAt   │
                      │  Interview.status =      │
                      │  "completed"             │
                      └──────────────────────────┘
```

---

## 7. INTERVIEW STATUS LIFECYCLE

```
draft
  ↓
scheduled (magic links sent here if enabled)
  ↓
conducted ← KEY TRIGGER: scorecard_magic_link_service.send_scorecard_magic_links()
  ├─ All interviewers get magic links immediately
  ├─ SLA reminders start (24h/48h/72h)
  └─ Status stays "conducted" until all scorecards submitted
       ↓
   completed (set when Interview.scorecardStatusByInterviewer all submitted/delegated)
     ↓
   [candidate moves to next stage or final decision]
```

---

## 8. DATABASE SCHEMA (Key Collections)

```
interviews {
  id: "intv_xxx",
  status: "conducted",
  conductedAt: "2026-01-12T08:00:00Z",
  completedAt: "2026-01-12T10:30:00Z" (when all scorecards in),
  
  scorecardStatusByInterviewer: {
    "user_john": "submitted",
    "user_jane": "submitted",
    "user_mike": "delegated"
  },
  
  lastReminderAtByInterviewer: {
    "user_john": "2026-01-12T08:15:00Z",
    "user_jane": null,
    "user_mike": "2026-01-12T08:30:00Z"
  },
  
  requiredScorecardUserIds: ["user_john", "user_jane", "user_mike"],
  completedScorecardUserIds: ["user_john", "user_jane", "user_mike"],
}

scorecard_submissions {
  id: "scs_xxx",
  interviewId: "intv_xxx",
  submittedByUserId: "user_john",
  submittedByDelegate: false,
  originalInterviewerId: null,
  delegateReason: null,
  submittedAt: "2026-01-12T09:30:00Z",
  ratings: [
    { competencyKey: "c1", score: 4, evidence: "..." },
    { competencyKey: "c2", score: 3, evidence: "..." }
  ],
  overallRecommendation: "strong_yes"
}

scorecard_magic_link_tokens {
  id: "sml_xxx",
  companyId: "comp_yyy",
  interviewId: "intv_xxx",
  interviewerId: "user_john",
  tokenHash: "sha256(token)",
  expiresAt: "2026-01-15T08:00:00Z",
  sentCount: 2,
  lastSentAt: "2026-01-12T08:15:00Z",
  usedAt: "2026-01-12T09:30:00Z",
  singleUse: true
}

companies {
  id: "comp_yyy",
  scorecardReminder: {
    enabled: true,
    firstReminderHours: 24,
    secondReminderHours: 48,
    finalReminderHours: 72,
    channel: "email",
    maxReminders: 3,
    stopAfterSubmit: true
  }
}
```

---

## Summary: What's Implemented ✅

| Feature | Status | Details |
|---------|--------|---------|
| **Auto Magic Links** | ✅ DONE | Sent on interview.status → "conducted" |
| **SLA Reminders** | ✅ DONE | 24h/48h/72h via n8n scheduler |
| **Public Scorecard Portal** | ✅ SKELETON | Routing + pages (form UI pending) |
| **Token Validation** | ✅ DONE | Hash verification, expiry, single-use |
| **Delegate Submission** | ✅ DONE | Full audit trail (submittedByDelegate, etc.) |
| **Manual Resend** | ✅ DONE | Recruiter can resend links with rate-limit |
| **White-Label UI** | ✅ DONE | Reuses PortalHeader, matches public portal |
| **Database Models** | ✅ DONE | All indexes, fields, constraints |
| **Multi-Tenancy** | ✅ DONE | All queries filter by companyId |
| **Email Templates** | ✅ DONE | Invite + 3-level reminders |
| **RBAC** | ✅ DONE | Admin/Recruiter/HM permissions enforced |

---

**Status:** Feature-complete, ready for QA testing and form UI implementation.

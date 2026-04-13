# Documentation Index: Scorecard Notification via MS365 Webhook

**Last Updated:** January 4, 2026  
**Total Documents:** 7  
**Total Pages:** 80+  

---

## Quick Navigation

### 🎯 Start Here (5 min read)
👉 **`README_INTERVIEW_CORRELATION.md`**
- Quick summary of all decisions
- 4 key questions + answers
- Architecture at a glance
- Next steps

### 📚 Deep Dives (Detailed Reading)

#### Design & Strategy
1. **`INTERVIEW_CORRELATION_AND_WEBHOOK_STRATEGY.md`** (30-45 min)
   - Comprehensive strategy document
   - Architecture review
   - Correlation challenge & solution
   - Event requirements analysis
   - Interview status state machine
   - Manual fallback flow
   - Q&A clarifications

2. **`INTERVIEW_CORRELATION_ARCHITECTURE_VISUAL.md`** (20-30 min)
   - Visual diagrams (ASCII)
   - Data model relationships
   - Webhook correlation flow (detailed)
   - Manual button flow (detailed)
   - Idempotency scenarios
   - Database queries
   - Comparison tables

3. **`INTERVIEW_CORRELATION_SUMMARY.md`** (10-15 min)
   - Quick reference
   - Direct Q&A format
   - Architecture summary
   - Decision table
   - Implementation priority

#### Implementation & Specs
4. **`FEATURE_DESIGN_SCORECARD_NOTIFICATION_WEBHOOK.md`** (60+ min)
   - Complete specification
   - MS365 API details (official)
   - Certificate management
   - Encryption/decryption
   - Testing strategy
   - Deployment guide
   - Future enhancements

5. **`DESIGN_UPDATE_SUMMARY_MS365_WEBHOOK.md`** (15 min)
   - What changed from initial design
   - Key technical improvements
   - Alignment with MS365 official docs
   - Implementation readiness status

#### Execution
6. **`IMPLEMENTATION_CHECKLIST.md`** (30-45 min to review, reference during coding)
   - 7 phases breakdown
   - 100+ checkpoints
   - Database changes
   - Backend implementation
   - Frontend components
   - Testing strategy
   - Deployment steps
   - Monitoring setup
   - Timeline estimate
   - Acceptance criteria

7. **`README_INTERVIEW_CORRELATION.md`** (10 min)
   - High-level summary
   - All documents reference
   - Quick decision table
   - "What to do" vs "What not to do"
   - Next steps guidance

---

## Reading Paths by Role

### For Product Manager
1. Start: `README_INTERVIEW_CORRELATION.md` (10 min)
2. Review: `INTERVIEW_CORRELATION_SUMMARY.md` (10 min)
3. Approve: Key decisions in decision table
4. **Total: 20 minutes**

### For Tech Lead
1. Start: `README_INTERVIEW_CORRELATION.md` (10 min)
2. Deep dive: `INTERVIEW_CORRELATION_AND_WEBHOOK_STRATEGY.md` (30 min)
3. Architecture: `INTERVIEW_CORRELATION_ARCHITECTURE_VISUAL.md` (25 min)
4. Implementation: Review checklist overview (15 min)
5. **Total: 80 minutes**

### For Backend Engineer
1. Start: `INTERVIEW_CORRELATION_SUMMARY.md` (15 min)
2. Architecture: `INTERVIEW_CORRELATION_ARCHITECTURE_VISUAL.md` (30 min)
3. Spec: `FEATURE_DESIGN_SCORECARD_NOTIFICATION_WEBHOOK.md` (focus on sections 10-12, 30 min)
4. Checklist: `IMPLEMENTATION_CHECKLIST.md` (30-45 min) - Use as reference during coding
5. **Total: 2-2.5 hours**

### For Frontend Engineer
1. Start: `INTERVIEW_CORRELATION_SUMMARY.md` (15 min)
2. Flow: `INTERVIEW_CORRELATION_ARCHITECTURE_VISUAL.md` (section 3, 15 min)
3. Button Implementation: `IMPLEMENTATION_CHECKLIST.md` (section Phase 3, 20 min)
4. **Total: 50 minutes**

### For QA/Tester
1. Start: `README_INTERVIEW_CORRELATION.md` (10 min)
2. Flows: `INTERVIEW_CORRELATION_ARCHITECTURE_VISUAL.md` (20 min)
3. Test Cases: `FEATURE_DESIGN_SCORECARD_NOTIFICATION_WEBHOOK.md` (section 10, 15 min)
4. Test Checklist: `IMPLEMENTATION_CHECKLIST.md` (section Phase 5, 30 min)
5. **Total: 75 minutes**

---

## Document Structure

### Core Documents (4)

#### 1. INTERVIEW_CORRELATION_AND_WEBHOOK_STRATEGY.md
**What:** Comprehensive strategy & architecture
**Length:** ~12,000 words
**Contains:**
- Current architecture review (1.1-1.2)
- Correlation challenge & solution (2-3)
- Webhook event requirements (4)
- Interview status state machine (5)
- RoundInstance update strategy (6)
- Manual fallback flow (7)
- Implementation checklist (8)
- Q&A section (9)
- Summary table (10)

**Best for:** Architects, tech leads, deep dives

---

#### 2. INTERVIEW_CORRELATION_ARCHITECTURE_VISUAL.md
**What:** Visual architecture & diagrams
**Length:** ~10,000 words + extensive ASCII diagrams
**Contains:**
- Data relationships (visual diagram)
- Webhook correlation flow (visual, step-by-step)
- Manual button flow (visual, step-by-step)
- Comparison table (webhook vs manual)
- Idempotency scenarios (3 detailed examples)
- Database queries (6 examples)
- Index strategy

**Best for:** Visual learners, engineers, architects

---

#### 3. INTERVIEW_CORRELATION_SUMMARY.md
**What:** Quick reference & direct Q&A
**Length:** ~4,000 words
**Contains:**
- Answer to Q1: Correlation strategy
- Answer to Q2: Manual button flow
- Answer to Q3: Event requirements
- Answer to Q4: Manual = same flow
- Architecture summary
- Implementation priority
- Key decisions table

**Best for:** Quick reference, decision makers, busy engineers

---

#### 4. IMPLEMENTATION_CHECKLIST.md
**What:** Actionable checklist with 100+ items
**Length:** ~15,000 words
**Contains:**
- Phase 1: Database (15 checkpoints)
- Phase 2: Webhook Handler (10 checkpoints)
- Phase 3: Manual Button (15 checkpoints)
- Phase 4: Shared Logic (10 checkpoints)
- Phase 5: Testing (20+ checkpoints)
- Phase 6: Deployment (10 checkpoints)
- Phase 7: Monitoring (10 checkpoints)
- Timeline estimate
- Acceptance criteria

**Best for:** Implementation tracking, engineers, project managers

---

### Supporting Documents (3)

#### 5. FEATURE_DESIGN_SCORECARD_NOTIFICATION_WEBHOOK.md
**What:** Complete feature specification
**Length:** ~30,000+ words
**Contains:**
- MS365 API specifications (official)
- Subscription setup (detailed)
- Webhook payload structure
- Certificate management
- Encryption/decryption
- Email templates
- Testing strategy
- Deployment guide
- Future enhancements

**Best for:** Implementation reference, complete spec, MS365 details

---

#### 6. DESIGN_UPDATE_SUMMARY_MS365_WEBHOOK.md
**What:** What changed from initial to updated design
**Length:** ~5,000 words
**Contains:**
- All updates made from MS365 official docs
- Key technical improvements
- Sections updated
- Why each change matters
- Document stats

**Best for:** Tracking changes, version history, understanding MS365 updates

---

#### 7. README_INTERVIEW_CORRELATION.md (This File)
**What:** Documentation index & quick reference
**Length:** ~8,000 words
**Contains:**
- Navigation guide
- Reading paths by role
- Document structure
- Key sections index
- Decision lookup table
- "Do this/Don't do this"

**Best for:** Finding information, navigation, orientation

---

## Key Sections Index

### Architecture Questions Answered

| Question | Answer File | Section |
|----------|------------|---------|
| How to correlate interview from webhook? | SUMMARY.md | Q1 |
| Manual button flow? | SUMMARY.md | Q2 |
| Which events needed? | SUMMARY.md | Q3 |
| Manual = same flow? | SUMMARY.md | Q4 |
| Data model relationships? | VISUAL.md | Section 1 |
| Webhook correlation steps? | VISUAL.md | Section 2 |
| Manual button steps? | VISUAL.md | Section 3 |
| Idempotency handling? | VISUAL.md | Section 5 |
| Database queries? | VISUAL.md | Section 6 |

### Implementation Questions Answered

| Topic | Location | Details |
|-------|----------|---------|
| Database changes | CHECKLIST.md | Phase 1 |
| Webhook handler | CHECKLIST.md | Phase 2 |
| Manual endpoint | CHECKLIST.md | Phase 3 |
| Shared function | CHECKLIST.md | Phase 4 |
| Unit tests | CHECKLIST.md | Phase 5.1 |
| Integration tests | CHECKLIST.md | Phase 5.2 |
| E2E tests | CHECKLIST.md | Phase 5.3 |
| Manual tests | CHECKLIST.md | Phase 5.4 |
| Deployment | CHECKLIST.md | Phase 6 |
| Monitoring | CHECKLIST.md | Phase 7 |

### MS365 Technical Details

| Topic | Location | Details |
|-------|----------|---------|
| Subscription setup | FEATURE_DESIGN.md | Section 4.1 |
| Webhook validation | FEATURE_DESIGN.md | Section 4.1.5 |
| Decryption | FEATURE_DESIGN.md | Section 12 |
| Certificate management | FEATURE_DESIGN.md | Section 10 |
| API reference | FEATURE_DESIGN.md | Section 12 |
| Event types | STRATEGY.md | Section 4.1 |
| Rich notifications | STRATEGY.md | Section 4.1.2 |

---

## Key Decisions Reference Table

| Decision | Value | Why |
|----------|-------|-----|
| Correlation key | teamsJoinUrl | Unique, indexed, fast |
| Interview state | "conducted" (new) | Clear phase indicator |
| Events needed | callEnded only | MVP sufficient |
| Manual flow | Same as webhook | Single source of truth |
| Shared function | mark_interview_conducted() | No duplication |
| Idempotency | webhookEventId tracking | Prevent duplicates |
| RoundInstance update | On first interview.conducted | Controlled progression |
| Task creation | Immediate | No notification delay |
| Email timing | On interview.conducted | Right after meeting |
| Error handling | Always 2xx | MS365 won't blacklist |
| Audit logging | reason field | Full visibility |
| Database index | ["companyId", "ms365.teamsJoinUrl"] | Fast lookup |
| Response status | 202 Accepted | Standard async |
| Retry strategy | 5, 15, 60 min | Exponential backoff |
| Certificate rotation | Per manager | Handled in ops |
| Monitoring | 10+ metrics | Health tracking |

---

## Do This ✅ vs Don't Do This ❌

### ✅ DO THIS

1. **Correlate by teamsJoinUrl**
   - It's unique per meeting
   - Already stored during scheduling
   - Fast indexed lookup

2. **Use shared mark_interview_conducted()**
   - Eliminates code duplication
   - Ensures consistency
   - Easier to test

3. **Always return 2xx from webhook**
   - Even if interview not found
   - Even if error occurs
   - Log errors, don't fail

4. **Track webhookEventId**
   - Prevents duplicate tasks
   - Handles retries gracefully
   - Provides audit trail

5. **Update RoundInstance**
   - Progression: pending → scheduled → completed
   - When first interview.conducted
   - When all scorecards submitted

### ❌ DON'T DO THIS

1. **Correlate by eventId or Interview.id**
   - eventId is MS365 internal
   - Not stable across operations
   - Use teamsJoinUrl instead

2. **Duplicate logic for webhook vs manual**
   - Creates maintenance burden
   - Risk of inconsistency
   - Use shared function

3. **Return error status from webhook**
   - MS365 blacklists endpoints
   - Stops receiving webhooks
   - Always return 2xx

4. **Skip idempotency checks**
   - Webhooks can retry
   - Creates duplicate tasks
   - Track webhookEventId

5. **Leave teamsJoinUrl unindexed**
   - Correlation query becomes slow
   - Add compound index with companyId
   - O(log n) vs O(n)

---

## Testing Strategy Summary

| Level | Count | Location |
|-------|-------|----------|
| Unit Tests | 15+ | CHECKLIST.md 5.1 |
| Integration Tests | 10+ | CHECKLIST.md 5.2 |
| E2E Tests | 5+ | CHECKLIST.md 5.3 |
| Manual Tests | 15+ items | CHECKLIST.md 5.4 |
| **Total** | **45+** | CHECKLIST.md |

---

## Timeline

**Total Duration:** 13-19 days

| Phase | Duration | Parallel? |
|-------|----------|-----------|
| Phase 1: Database | 2-3 days | Sequential |
| Phase 2: Webhook | 3-4 days | After Phase 1 |
| Phase 3: Button | 2-3 days | Parallel with Phase 2 |
| Phase 4: Logic | 1-2 days | With Phase 2-3 |
| Phase 5: Testing | 3-4 days | Parallel with Phase 2-4 |
| Phase 6: Deploy | 1-2 days | After Phase 5 |
| Phase 7: Monitor | 1 day | With Phase 6 |

---

## File Locations

All documents in: `/home/smelethil/projects/Yukthi/i79Engage/documents/`

```
documents/
├─ README_INTERVIEW_CORRELATION.md (INDEX - START HERE)
├─ INTERVIEW_CORRELATION_SUMMARY.md (QUICK REF)
├─ INTERVIEW_CORRELATION_AND_WEBHOOK_STRATEGY.md (DETAILED)
├─ INTERVIEW_CORRELATION_ARCHITECTURE_VISUAL.md (VISUAL)
├─ IMPLEMENTATION_CHECKLIST.md (ACTIONABLE)
├─ FEATURE_DESIGN_SCORECARD_NOTIFICATION_WEBHOOK.md (FULL SPEC)
└─ DESIGN_UPDATE_SUMMARY_MS365_WEBHOOK.md (REFERENCE)
```

---

## Status

✅ **Design Complete**
✅ **Architecture Documented**
✅ **Implementation Ready**
✅ **All Questions Answered**

---

**Next Action:** Pick your reading path above and let's build! 🚀


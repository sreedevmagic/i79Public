# Deployment Guide: Interview Independence Update

## Quick Reference

**Status:** ✅ Ready for deployment
**Breaking Changes:** No
**Database Migration:** Yes (backfill script)
**Estimated Downtime:** None (rolling deployment)

---

## Pre-Deployment Checklist

- [ ] Backend code changes reviewed
- [ ] Frontend code changes reviewed
- [ ] Backfill script tested in staging
- [ ] No pending incomplete applications in critical state

---

## Deployment Steps

### Step 1: Deploy Backend (No Downtime)

```bash
# Navigate to backend
cd Backend

# Pull latest changes
git pull origin main

# Install dependencies (if any new ones)
pip install -r requirements.txt

# Restart backend service
# (Use your deployment method - Docker, systemd, etc.)
sudo systemctl restart i79engage-backend
```

**Verify:**
- [ ] Backend starts successfully
- [ ] API health check passes
- [ ] No errors in logs

---

### Step 2: Run Backfill Script

```bash
# Navigate to backend
cd Backend

# Run backfill script
python scripts/backfill_application_hiring_plans.py
```

**Expected Output:**
```
🚀 Starting application hiring plan backfill...

============================================================
Found 150 applications to process
============================================================

[1/150] Processing application: app_abc123
  ✓ Updated application with 3 rounds, 2 interviews remapped
...

============================================================
✅ Backfill complete:
   Updated:  120
   Skipped:  30
   Errors:   0
   Total:    150
============================================================

✅ Backfill script completed!
```

**What to check:**
- [ ] Updated count > 0 (unless all apps already migrated)
- [ ] Errors = 0
- [ ] No Python exceptions in output

**If errors occur:**
1. Check MongoDB connection
2. Verify all referenced requisitions exist
3. Review error messages for specific issues
4. Re-run script (it's idempotent)

---

### Step 3: Verify Backend Changes

**Test 1: Create New Application**
```bash
curl -X POST https://your-api.com/api/applications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requisitionId": "req_test123",
    "candidateName": "Test User",
    "candidateEmail": "test@example.com",
    "candidatePhone": "+1234567890",
    "source": "manual"
  }'
```

**Expected:** Response includes `hiringPlan` with `rounds[]` containing unique IDs and `sourceRequisitionRoundId`

**Test 2: Schedule Multiple Interviews**
```bash
# Schedule first interview
curl -X POST https://your-api.com/api/applications/{app_id}/interviews/create-single \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roundId": "plrnd_xxx",
    "userIds": ["user_123"],
    "scheduledAt": "2026-01-15T10:00:00Z",
    "timezone": "UTC"
  }'

# Mark first as completed
curl -X PATCH https://your-api.com/api/interviews/{interview_id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# Schedule second interview (should succeed)
curl -X POST https://your-api.com/api/applications/{app_id}/interviews/create-single \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roundId": "plrnd_xxx",
    "userIds": ["user_456"],
    "scheduledAt": "2026-01-16T10:00:00Z",
    "timezone": "UTC"
  }'
```

**Expected:** Second interview creation succeeds (previously would have failed)

---

### Step 4: Deploy Frontend

```bash
# Navigate to frontend
cd Frontend

# Pull latest changes
git pull origin main

# Install dependencies
npm install
# or
bun install

# Build production bundle
npm run build
# or
bun run build

# Deploy to hosting (Vercel, Netlify, etc.)
# OR copy build files to web server
```

**Verify:**
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No missing dependencies

---

### Step 5: Frontend Verification

**Manual Testing:**

1. **Open Application Detail Page**
   - Navigate to any candidate application
   - Scroll to Interview Plan section

2. **Check Round Display**
   - [ ] Rounds show without "Pending" status badges
   - [ ] If interviews exist, they're listed under rounds
   - [ ] Multiple interviews per round are visible

3. **Schedule Interview**
   - [ ] Click "Schedule Interview" on a round
   - [ ] Complete scheduling dialog
   - [ ] Verify interview appears in list

4. **Complete Interview & Retry**
   - [ ] Mark interview as "Conducted" or "Completed"
   - [ ] Verify "Schedule Another Interview" button appears
   - [ ] Schedule second interview for same round
   - [ ] Verify both interviews are visible

5. **View Scorecards**
   - [ ] Submit a scorecard for completed interview
   - [ ] Verify "View Scorecards (1)" button appears
   - [ ] Click button and verify dialog opens
   - [ ] Check tabs (All, AI, Human) work correctly
   - [ ] Verify scorecard details are correct

---

## Rollback Plan (If Needed)

### Backend Rollback
```bash
cd Backend
git checkout <previous-commit-hash>
pip install -r requirements.txt
sudo systemctl restart i79engage-backend
```

**Note:** If backfill already ran, data will have new round IDs. Rollback code will still work (backward compatible), but new features won't be available.

### Frontend Rollback
```bash
cd Frontend
git checkout <previous-commit-hash>
npm run build
# Deploy previous build
```

---

## Post-Deployment Monitoring

### Metrics to Watch (First 24 Hours)

1. **Backend Errors**
   - Monitor error logs for:
     - Round ID not found errors
     - Interview creation failures
     - Scorecard loading issues

2. **Database Queries**
   - Check for slow queries on:
     - `applications` collection (hiring plan lookups)
     - `interviews` collection (roundId filtering)

3. **User Behavior**
   - Track usage of:
     - Multiple interview scheduling
     - Scorecard viewing feature
     - Interview retry functionality

### Known Edge Cases

1. **Applications without hiring plan:**
   - Backfill should handle, but verify in logs
   - Should auto-generate from requisition on access

2. **Orphaned interviews:**
   - Interviews with old round IDs
   - Should be mapped by backfill script
   - Verify interview counts match before/after

3. **Concurrent interview scheduling:**
   - Race condition check: two users scheduling same round
   - Should be handled by active interview validation

---

## Support Contacts

**Backend Issues:**
- Check: `Backend/app/services/application_service.py`
- Check: `Backend/app/services/hiring_plan_service.py`
- Logs: Application service logs for hiring plan cloning

**Frontend Issues:**
- Check: `Frontend/src/components/InterviewPlanSection.tsx`
- Check: `Frontend/src/components/ScorecardViewDialog.tsx`
- Console: Browser dev tools for React errors

**Database Issues:**
- Check: MongoDB Atlas dashboard
- Query: `db.applications.find({ "hiringPlan.rounds.sourceRequisitionRoundId": { $exists: true } })`
- Verify: Round ID uniqueness across applications

---

## Success Metrics

After deployment, verify:

- ✅ **New applications:** All have unique round IDs
- ✅ **Multiple interviews:** Can schedule >1 per round type
- ✅ **Scorecard viewing:** Dialog shows all submissions
- ✅ **No errors:** Backend logs clean for 1 hour
- ✅ **User feedback:** No confusion about round status

---

## Deployment Timeline

**Estimated Total Time:** 30-45 minutes

| Step | Time | Can Run Off-Hours? |
|------|------|--------------------|
| Backend Deploy | 5 min | No (quick, no downtime) |
| Run Backfill | 5-15 min | Yes (optional) |
| Backend Verification | 5 min | No |
| Frontend Deploy | 5 min | No (quick, cached) |
| Frontend Verification | 10 min | No |

**Recommended Deployment Window:**
- Low-traffic period (if possible)
- Have team member available for 1 hour post-deployment
- Schedule during business hours for immediate issue resolution

---

## Completion Checklist

- [ ] Backend deployed successfully
- [ ] Backfill script completed without errors
- [ ] Backend tests passed
- [ ] Frontend deployed successfully
- [ ] Frontend manual tests passed
- [ ] No errors in production logs (1 hour)
- [ ] Team notified of new features
- [ ] Documentation updated (if needed)
- [ ] Deployment summary sent to stakeholders

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Sign-off:** _____________

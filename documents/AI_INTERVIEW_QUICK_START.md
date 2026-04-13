# AI Interview Public Portal - Quick Start Guide

## 🚀 Development

### Start Main App (Internal Recruiter Portal)
```bash
cd Frontend
npm run dev
# Visit: http://localhost:5173
```

### Start Public Portal (Candidate Interview Portal)
```bash
cd Frontend
npm run dev:portal
# Visit: http://localhost:5173/ai-interview/{token}
```

### Get a Test Token
1. Start backend: `cd Backend && uvicorn app.main:app --reload`
2. Login to main app at http://localhost:5173
3. Create AI interview (Jobs → Interview Rounds → Schedule Interview)
4. Copy magic link token from invite dialog
5. Open in portal: `http://localhost:5173/ai-interview/{token}`

---

## 📁 File Structure

```
Frontend/
├── index.html                       # Main app entry
├── public-portal.html               # Public portal entry (NEW)
├── src/
│   ├── App.tsx                      # Main internal app
│   ├── main.tsx                     # Main app entry point
│   └── public-portal/               # PUBLIC PORTAL (NEW)
│       ├── App.tsx                  # Portal router
│       ├── main.tsx                 # Portal entry point
│       ├── components/
│       │   ├── ThemeLoader.tsx      # Branding & logo
│       │   └── PasscodeInput.tsx    # 6-digit input
│       ├── pages/
│       │   ├── JoinInterview.tsx    # Main flow (consent→passcode→ready)
│       │   ├── InterviewCall.tsx    # Voice call (Ultravox SDK)
│       │   ├── InterviewComplete.tsx # Thank you page
│       │   ├── InterviewExpired.tsx  # Expired link
│       │   └── InterviewError.tsx    # Error state
│       └── services/
│           └── publicInterviewApi.ts # API client
```

---

## 🛠️ Common Tasks

### Add New Portal Page
1. Create page in `src/public-portal/pages/`
2. Add route in `src/public-portal/App.tsx`
3. Import and use shadcn-ui components from `@/components/ui/`

### Update API Client
Edit `src/public-portal/services/publicInterviewApi.ts`
- Add new interface for response type
- Add new function for endpoint
- Export for use in pages

### Update Branding/Theme
Edit `src/public-portal/components/ThemeLoader.tsx`
- Modify CSS variable injection
- Add new theme properties
- Update logo fallback logic

---

## 🧪 Testing Flow

### Happy Path (End-to-End)
1. ✅ Load session with valid token
2. ✅ Accept consent (checkbox + button)
3. ✅ Enter correct passcode (6 digits)
4. ✅ Review readiness checklist
5. ✅ Click "Start Interview"
6. 🔄 Join Ultravox call (pending SDK)
7. ✅ Complete interview → Thank you page

### Error Cases
- ❌ Expired token → Navigate to `/expired`
- ❌ Wrong passcode → Show error, decrement attempts
- ❌ Locked out (3 attempts) → Show error, disable input
- ❌ Network error → Show toast, allow retry
- ❌ Invalid URL → Navigate to `/error`

---

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```bash
PUBLIC_PORTAL_ORIGIN=http://localhost:5173
ULTRAVOX_API_URL=https://api.ultravox.ai
ULTRAVOX_API_KEY=uvx_...
ULTRAVOX_WEBHOOK_SECRET=...
```

**Frontend (.env)**
```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_PUBLIC_PORTAL_URL=http://localhost:5173/ai-interview
```

---

## 📦 Deployment

### Build Production Bundle
```bash
cd Frontend
npm run build
```

Output:
```
dist/
├── index.html              # Main app
├── public-portal.html      # Portal app
├── assets/                 # Shared JS/CSS bundles
└── ...
```

### Deploy Options

**Option 1: Same Domain (Nginx)**
```nginx
server {
    listen 443 ssl;
    server_name app.magic-hire.com;
    
    root /var/www/dist;
    
    # Main app
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Public portal
    location /ai-interview/ {
        try_files $uri $uri/ /public-portal.html;
    }
}
```

**Option 2: Subdomain (Nginx)**
```nginx
# Main app
server {
    listen 443 ssl;
    server_name app.magic-hire.com;
    root /var/www/main-app/dist;
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Public portal
server {
    listen 443 ssl;
    server_name interview.magic-hire.com;
    root /var/www/portal/dist;
    location / {
        try_files $uri $uri/ /public-portal.html;
    }
}
```

**Option 3: Vercel/Netlify**
Upload `dist/` folder, configure:
- Main app: `index.html` as default
- Portal: Rewrite `/ai-interview/*` to `public-portal.html`

---

## 🐛 Troubleshooting

### Portal Not Loading
- Check Vite config has both entry points
- Verify `public-portal.html` exists
- Check browser console for errors
- Ensure `/ai-interview` basename in router

### API Calls Failing
- Verify backend is running
- Check CORS configuration
- Check `VITE_API_BASE_URL` in `.env`
- Check network tab for 401/403/500 errors

### Branding Not Applying
- Check `ThemeLoader` wraps page component
- Verify company has `branding` field in database
- Check browser DevTools → Elements → `:root` CSS variables
- Ensure logo URL is accessible (CORS)

### Passcode Not Working
- Check backend logs for validation errors
- Verify token is valid (not expired/used)
- Check attempts count in database
- Test with fresh token

---

## 📚 Documentation

- **Backend API Guide:** `Backend/AI_INTERVIEW_API_GUIDE.md`
- **Portal README:** `Frontend/PUBLIC_PORTAL_README.md`
- **Implementation Status:** `documents/AI_INTERVIEW_PORTAL_STATUS.md`
- **Architecture:** `documents/AIMeetingRequirement.MD`

---

## 🎯 Next Steps

1. **Install Ultravox SDK**
   ```bash
   npm install @ultravox/react-sdk
   ```

2. **Integrate in InterviewCall.tsx**
   - Replace placeholder UI with SDK component
   - Handle mic permissions
   - Test call flow

3. **End-to-End Testing**
   - Test complete flow from scheduling to completion
   - Test on mobile devices
   - Test with different browsers

4. **Deploy to Staging**
   - Build production bundle
   - Deploy to staging environment
   - Test with real Ultravox API

5. **Email Integration (Next Priority)**
   - Implement notification service
   - Design HTML email template
   - Add "Send Email" button to UI

---

**Last Updated:** December 2025

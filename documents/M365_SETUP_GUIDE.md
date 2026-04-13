# M365 Setup Guide: Configure Webhook Integration for Teams Meeting Events

**Document Version:** 1.0  
**Last Updated:** January 4, 2026  
**Audience:** Microsoft 365 Tenant Admins, DevOps Engineers  
**Time to Complete:** 30-45 minutes  

---

## Overview

This guide walks you through setting up MS365 webhook integration to receive Teams meeting end events. This is a **one-time setup per company/tenant**.

### What You're Doing
1. Register an Azure Application (OAuth 2.0 client)
2. Grant necessary permissions (Microsoft Graph)
3. Generate and store certificates (encryption)
4. Configure webhook endpoint in i79Engage backend
5. Test the integration

### Prerequisites
- ✅ Microsoft 365 admin account (Global Admin role)
- ✅ Access to Azure Active Directory
- ✅ Access to i79Engage backend configuration
- ✅ Teams tenant ID (found in Azure AD)
- ✅ Webhook endpoint URL from i79Engage (provided by DevOps)

---

## Phase 1: Register Azure Application

### Step 1.1: Go to Azure Portal

1. Navigate to: **https://portal.azure.com**
2. Sign in with your **Microsoft 365 admin account**
3. In the search box at the top, search for: **"Azure Active Directory"**
4. Click on **Azure Active Directory** in the results

### Step 1.2: Create App Registration

1. In the left sidebar, click: **App Registrations**
2. Click: **New Registration**
3. Fill in the form:
   ```
   Name: "i79Engage Teams Webhook Integration"
   Supported Account Types: "Accounts in this organizational directory only"
   Redirect URI: (leave blank for now)
   ```
4. Click: **Register**
5. Save the following info (you'll need it later):
   - **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Step 1.3: Create Client Secret

1. In the left sidebar, click: **Certificates & Secrets**
2. Click: **New Client Secret**
3. Fill in:
   ```
   Description: "i79Engage Webhook Integration"
   Expires: "24 months" (recommended)
   ```
4. Click: **Add**
5. **Important:** Immediately copy the **Value** (not the ID)
   - Save it securely in your secrets vault
   - You won't be able to see it again!
   
   ```
   CLIENT_SECRET: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

---

## Phase 2: Grant Microsoft Graph Permissions

### Step 2.1: Add API Permissions

1. Go back to your app registration
2. In the left sidebar, click: **API Permissions**
3. Click: **Add a Permission**
4. In the panel that opens, click: **Microsoft Graph**

### Step 2.2: Select Required Permissions

1. Select: **Application Permissions** (not Delegated)
2. Search for each permission and **check the box**:
   - `OnlineMeetings.Read.All` - Read Teams meeting information
   - `Calendars.Read` - Read calendar events
   - `User.Read.All` - Read user profiles

3. Scroll down, click: **Add Permissions**

### Step 2.3: Grant Admin Consent

1. Back on the API Permissions page, click: **Grant Admin Consent for [Organization Name]**
2. Click: **Yes** to confirm

**Verification:** All permissions should now show as **Granted** (green checkmarks)

---

## Phase 3: Generate Encryption Certificate

### Step 3.1: Create Self-Signed Certificate (Development)

For **development/testing**, generate a self-signed certificate:

**On your local machine (Windows PowerShell with admin rights):**

```powershell
# 1. Create self-signed certificate valid for 1 year
$cert = New-SelfSignedCertificate `
  -Subject "CN=i79Engage-Webhook" `
  -FriendlyName "i79Engage Teams Webhook Certificate" `
  -KeyUsage KeyEncipherment, DataEncipherment `
  -Type CodeSigningCert `
  -NotAfter (Get-Date).AddYears(1) `
  -KeyExportPolicy Exportable

# 2. Export public certificate (PEM format)
$pubCertPath = "$env:TEMP\i79engage-webhook-public.cer"
Export-Certificate -Cert $cert -FilePath $pubCertPath -Type CERT

# 3. Export private key (PFX format - password protected)
$pfxPath = "$env:TEMP\i79engage-webhook-private.pfx"
$password = ConvertTo-SecureString -String "YourStrongPassword123!" -AsPlainText -Force
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password

# 4. Display certificate thumbprint
Write-Output "Certificate Thumbprint: $($cert.Thumbprint)"
```

**On macOS/Linux (using OpenSSL):**

```bash
# 1. Generate private key
openssl genrsa -out i79engage-webhook-private.key 2048

# 2. Create self-signed certificate
openssl req -new -x509 -key i79engage-webhook-private.key \
  -out i79engage-webhook-public.crt \
  -days 365 \
  -subj "/CN=i79Engage-Webhook"

# 3. Convert to PEM format
openssl x509 -in i79engage-webhook-public.crt -out i79engage-webhook-public.pem

# 4. Display thumbprint
openssl x509 -in i79engage-webhook-public.crt -noout -fingerprint -sha1
```

### Step 3.2: Store Certificate in Secure Vault

**Save the following securely:**

1. **Private Key File:**
   - Keep `i79engage-webhook-private.key` (or `.pfx`)
   - Store in **AWS Secrets Manager**, **Azure Key Vault**, or **HashiCorp Vault**
   - Never commit to git!

2. **Public Certificate:**
   - Keep `i79engage-webhook-public.pem` (or `.cer`)
   - This gets sent to MS365 during subscription

3. **Certificate Metadata:**
   ```
   CERT_ID: "i79engage_cert_2026_01"
   CERT_THUMBPRINT: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
   CERT_SUBJECT: "CN=i79Engage-Webhook"
   CERT_EXPIRES: "2027-01-04"
   CERT_VALID_FROM: "2026-01-04"
   ```

### Step 3.3: For Production (CA-Signed Certificate)

For **production**, use a **certificate from a trusted CA**:

1. Generate certificate signing request (CSR) using similar OpenSSL commands
2. Submit CSR to your certificate authority (Digicert, GlobalSign, etc.)
3. Receive signed certificate in return
4. Store in secrets vault (same as above)

---

## Phase 4: Configure i79Engage Backend

### Step 4.1: Store Secrets in Environment Variables

**In your `.env` file or secrets manager:**

```bash
# MS365 OAuth Credentials
MS365_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
MS365_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
MS365_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Webhook Configuration
MS365_WEBHOOK_URL="https://api.i79engage.com/webhooks/ms365/meeting-ended"
MS365_WEBHOOK_CERT_ID="i79engage_cert_2026_01"

# Certificate Storage (path or vault)
MS365_WEBHOOK_CERT_PRIVATE_KEY_PATH="/etc/secrets/i79engage-webhook-private.key"
MS365_WEBHOOK_CERT_PUBLIC_PATH="/etc/secrets/i79engage-webhook-public.pem"
MS365_WEBHOOK_CERT_PASSWORD="YourStrongPassword123!"

# Optional: For local testing
NGROK_URL="https://xxxx-xx-xxx-xxx-xx.ngrok.io"  # Temporary tunnel for testing
```

### Step 4.2: Update Backend Configuration

In `Backend/app/core/config.py`:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # MS365 OAuth
    MS365_TENANT_ID: str
    MS365_CLIENT_ID: str
    MS365_CLIENT_SECRET: str
    
    # Webhook
    MS365_WEBHOOK_URL: str
    MS365_WEBHOOK_CERT_ID: str
    MS365_WEBHOOK_CERT_PRIVATE_KEY_PATH: str
    MS365_WEBHOOK_CERT_PUBLIC_PATH: str
    MS365_WEBHOOK_CERT_PASSWORD: str | None = None
    
    # Graph API
    MS365_GRAPH_API_BASE: str = "https://graph.microsoft.com/v1.0"
    
    # Subscription management
    MS365_SUBSCRIPTION_MAX_DAYS: int = 3
    MS365_SUBSCRIPTION_RENEWAL_BUFFER_HOURS: int = 12
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

### Step 4.3: Load Certificate in Startup

In `Backend/app/core/crypto.py` (or security module):

```python
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from app.core.config import settings

class CertificateManager:
    def __init__(self):
        self.public_cert = self._load_public_cert()
        self.private_key = self._load_private_key()
        self.cert_id = settings.MS365_WEBHOOK_CERT_ID
    
    def _load_public_cert(self):
        """Load public certificate from PEM file"""
        with open(settings.MS365_WEBHOOK_CERT_PUBLIC_PATH, 'rb') as f:
            cert_data = f.read()
        return x509.load_pem_x509_certificate(
            cert_data,
            default_backend()
        )
    
    def _load_private_key(self):
        """Load private key from PEM file"""
        with open(settings.MS365_WEBHOOK_CERT_PRIVATE_KEY_PATH, 'rb') as f:
            key_data = f.read()
        
        password = None
        if settings.MS365_WEBHOOK_CERT_PASSWORD:
            password = settings.MS365_WEBHOOK_CERT_PASSWORD.encode()
        
        return serialization.load_pem_private_key(
            key_data,
            password=password,
            backend=default_backend()
        )
    
    def get_public_cert_pem(self) -> str:
        """Return public cert in PEM format for MS365"""
        return self.public_cert.public_bytes(
            encoding=serialization.Encoding.PEM
        ).decode('utf-8')
    
    def get_cert_thumbprint(self) -> str:
        """Return certificate thumbprint"""
        from cryptography.hazmat.primitives import hashes
        digest = self.public_cert.fingerprint(hashes.SHA1())
        return digest.hex().upper()

# Singleton instance
cert_manager = CertificateManager()
```

---

## Phase 5: Configure Webhook Endpoint

### Step 5.1: Create Webhook Handler Route

In `Backend/app/api/routes/webhooks.py`:

```python
from fastapi import APIRouter, Request, HTTPException
from app.core.config import settings
from app.services.webhook_service import WebhookService
import logging

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)
webhook_service = WebhookService()

@router.post("/ms365/meeting-ended")
async def handle_teams_meeting_ended(request: Request):
    """
    Handle MS365 Teams meeting end event via webhook
    
    Responsibilities:
    1. Validate webhook signature
    2. Handle validation tokens (first subscription request)
    3. Decrypt encrypted content
    4. Find Interview by teamsJoinUrl
    5. Mark interview as conducted
    6. Create scorecard tasks
    7. Send notification emails
    """
    try:
        # Get request body
        body = await request.json()
        
        # Step 1: Check for validation tokens (first subscription)
        if "validationTokens" in body:
            logger.info("MS365 subscription validation request")
            return {
                "validationTokens": body["validationTokens"]
            }
        
        # Step 2: Validate and process webhook
        result = await webhook_service.handle_meeting_ended_event(body)
        
        # Always return 202 Accepted (don't fail - even if interview not found)
        return {"status": "accepted", "details": result}
    
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}", exc_info=True)
        # Still return 202 to prevent MS365 blacklisting
        return {"status": "accepted", "error": "logged"}
```

### Step 5.2: Create Webhook Service

In `Backend/app/services/webhook_service.py`:

```python
from datetime import datetime
from typing import Dict, Any
from app.models.interview import Interview
from app.services.interview_service import InterviewService
from app.core.crypto import cert_manager
import logging
import json
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
import hmac

logger = logging.getLogger(__name__)

class WebhookService:
    async def handle_meeting_ended_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process MS365 webhook event for meeting end
        
        Returns: {
            "status": "processed" | "skipped" | "error",
            "interview_id": "...",
            "message": "..."
        }
        """
        try:
            # Extract notification from value array
            notifications = payload.get("value", [])
            if not notifications:
                logger.warning("No notifications in webhook payload")
                return {"status": "skipped", "message": "empty_value_array"}
            
            notification = notifications[0]
            
            # Step 1: Validate signature
            if not self._validate_signature(notification):
                logger.error("Invalid webhook signature")
                return {"status": "error", "message": "invalid_signature"}
            
            # Step 2: Decrypt content
            decrypted = self._decrypt_encrypted_content(
                notification.get("encryptedContent")
            )
            if not decrypted:
                logger.error("Failed to decrypt content")
                return {"status": "error", "message": "decryption_failed"}
            
            event_data = json.loads(decrypted)
            
            # Step 3: Check event type
            event_type = event_data.get("eventType")
            if event_type != "callEnded":
                logger.info(f"Skipping event type: {event_type}")
                return {"status": "skipped", "message": f"event_type_{event_type}"}
            
            # Step 4: Extract routing info
            client_state = notification.get("clientState")  # = companyId
            resource = notification.get("resource", "")
            event_datetime = event_data.get("eventDateTime")
            
            # Extract joinWebUrl from resource
            # Format: communications/onlineMeetings(joinWebUrl='{URL_ENCODED}')/meetingCallEvents
            teams_join_url = self._extract_join_url(resource)
            
            if not teams_join_url or not client_state:
                logger.error("Missing routing information")
                return {"status": "error", "message": "missing_routing_info"}
            
            # Step 5: Find Interview
            interview = await Interview.find_one(
                Interview.companyId == client_state,
                Interview.ms365.teamsJoinUrl == teams_join_url,
                Interview.status == "scheduled"
            )
            
            if not interview:
                logger.warning(f"Interview not found: {teams_join_url}")
                return {"status": "skipped", "message": "interview_not_found"}
            
            # Step 6: Check idempotency
            if interview.conductedAt:
                logger.info(f"Interview already conducted: {interview.id}")
                return {"status": "skipped", "message": "already_processed"}
            
            # Step 7: Update Interview and trigger scorecard requests
            interview_service = InterviewService()
            result = await interview_service.mark_interview_conducted(
                interview=interview,
                conducted_at=datetime.fromisoformat(event_datetime.replace('Z', '+00:00')),
                webhook_event_id=event_data.get("id"),
                reason="webhook"
            )
            
            return {"status": "processed", "interview_id": interview.id, "details": result}
        
        except Exception as e:
            logger.error(f"Webhook processing error: {str(e)}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    def _validate_signature(self, notification: Dict[str, Any]) -> bool:
        """Validate HMAC-SHA256 signature of encrypted content"""
        try:
            encrypted_content = notification.get("encryptedContent", {})
            data = encrypted_content.get("data", "").encode()
            data_signature = encrypted_content.get("dataSignature", "")
            
            # Calculate HMAC-SHA256
            signature = hmac.new(
                self.private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption()
                ),
                data,
                hashes.SHA256()
            ).digest()
            
            expected_signature = base64.b64encode(signature).decode()
            
            return hmac.compare_digest(data_signature, expected_signature)
        except Exception as e:
            logger.error(f"Signature validation error: {str(e)}")
            return False
    
    def _decrypt_encrypted_content(self, encrypted_content: Dict[str, Any]) -> str | None:
        """Decrypt RSA-AES encrypted content from MS365"""
        try:
            # Extract encrypted data
            encrypted_data = base64.b64decode(encrypted_content.get("data", ""))
            encrypted_key = base64.b64decode(encrypted_content.get("dataKey", ""))
            
            # Decrypt AES key using RSA private key
            from cryptography.hazmat.primitives.asymmetric import padding
            aes_key = cert_manager.private_key.decrypt(
                encrypted_key,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA1()),
                    algorithm=hashes.SHA1(),
                    label=None
                )
            )
            
            # Decrypt content using AES key
            # MS365 uses AES-256 CBC
            iv = encrypted_data[:16]
            ciphertext = encrypted_data[16:]
            
            cipher = Cipher(
                algorithms.AES(aes_key),
                modes.CBC(iv),
                backend=default_backend()
            )
            decryptor = cipher.decryptor()
            plaintext = decryptor.update(ciphertext) + decryptor.finalize()
            
            # Remove PKCS7 padding
            padding_length = plaintext[-1]
            plaintext = plaintext[:-padding_length]
            
            return plaintext.decode('utf-8')
        
        except Exception as e:
            logger.error(f"Decryption error: {str(e)}")
            return None
    
    def _extract_join_url(self, resource: str) -> str | None:
        """Extract joinWebUrl from resource path"""
        try:
            # Format: communications/onlineMeetings(joinWebUrl='{URL_ENCODED}')/meetingCallEvents
            import re
            match = re.search(r"joinWebUrl='([^']+)'", resource)
            if match:
                # URL-decode
                import urllib.parse
                return urllib.parse.unquote(match.group(1))
        except Exception as e:
            logger.error(f"Error extracting join URL: {str(e)}")
        return None
```

### Step 5.3: Verify Webhook Endpoint is Reachable

Before creating subscriptions, ensure your webhook endpoint is:

1. **Publicly accessible** (not behind corporate firewall)
2. **HTTPS** (not HTTP)
3. **Responds quickly** (< 5 seconds)
4. **Returns proper status codes** (2xx, especially 202)

**Test with curl:**

```bash
curl -X POST https://api.i79engage.com/webhooks/ms365/meeting-ended \
  -H "Content-Type: application/json" \
  -d '{"validationTokens": ["test_token_123"]}'

# Should return:
# {"validationTokens": ["test_token_123"]}
```

---

## Phase 6: Create Webhook Subscription (Per Meeting)

### Step 6.1: Generate Subscription Request

When an interview is scheduled, create a subscription for that Teams meeting:

In `Backend/app/services/ms365_service.py`:

```python
import httpx
import json
import base64
from app.core.config import settings
from app.core.crypto import cert_manager
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class MS365Service:
    def __init__(self):
        self.graph_api_base = settings.MS365_GRAPH_API_BASE
        self.tenant_id = settings.MS365_TENANT_ID
        self.client_id = settings.MS365_CLIENT_ID
        self.client_secret = settings.MS365_CLIENT_SECRET
    
    async def create_webhook_subscription(
        self,
        teams_join_url: str,
        company_id: str
    ) -> Dict[str, Any]:
        """
        Create MS365 webhook subscription for a Teams meeting
        
        Args:
            teams_join_url: The meeting join URL from Interview.ms365.teamsJoinUrl
            company_id: The company ID (for clientState)
        
        Returns:
            {
                "subscription_id": "sub_xxxxx",
                "expiration_datetime": "2026-01-08T10:00:00Z"
            }
        """
        try:
            # Step 1: Get access token
            access_token = await self._get_access_token()
            
            # Step 2: URL-encode the join URL
            import urllib.parse
            url_encoded = urllib.parse.quote(teams_join_url, safe='')
            
            # Step 3: Build subscription request
            expiration = datetime.utcnow() + timedelta(days=3)
            
            subscription_request = {
                "changeType": "updated",
                "notificationUrl": settings.MS365_WEBHOOK_URL,
                "resource": f"communications/onlineMeetings(joinWebUrl='{url_encoded}')/meetingCallEvents",
                "includeResourceData": True,
                "encryptionCertificate": cert_manager.get_public_cert_pem(),
                "encryptionCertificateId": cert_manager.cert_id,
                "expirationDateTime": expiration.isoformat() + "Z",
                "clientState": company_id
            }
            
            # Step 4: Create subscription via Graph API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.graph_api_base}/subscriptions",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json"
                    },
                    json=subscription_request
                )
                
                if response.status_code != 201:
                    logger.error(f"Subscription creation failed: {response.text}")
                    raise Exception(f"MS365 API error: {response.status_code}")
                
                subscription = response.json()
                
                logger.info(f"Webhook subscription created: {subscription['id']}")
                
                return {
                    "subscription_id": subscription["id"],
                    "expiration_datetime": subscription["expirationDateTime"]
                }
        
        except Exception as e:
            logger.error(f"Error creating webhook subscription: {str(e)}")
            raise
    
    async def _get_access_token(self) -> str:
        """Get MS365 access token using client credentials flow"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token",
                    data={
                        "grant_type": "client_credentials",
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "scope": "https://graph.microsoft.com/.default"
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Token request failed: {response.text}")
                    raise Exception("Failed to get access token")
                
                token_data = response.json()
                return token_data["access_token"]
        
        except Exception as e:
            logger.error(f"Error getting access token: {str(e)}")
            raise
```

### Step 6.2: Trigger Subscription During Interview Scheduling

Update `Backend/app/services/interview_service.py`:

```python
async def schedule_interview(self, interview: Interview, company_id: str):
    """Schedule interview and create webhook subscription"""
    try:
        # ... existing scheduling logic ...
        
        interview.status = "scheduled"
        interview.scheduledAt = datetime.utcnow()
        
        # Create webhook subscription
        if interview.ms365.teamsJoinUrl:
            ms365_service = MS365Service()
            sub_result = await ms365_service.create_webhook_subscription(
                teams_join_url=interview.ms365.teamsJoinUrl,
                company_id=company_id
            )
            
            # Store subscription ID for renewal tracking
            from app.models.ms365_subscription import Ms365Subscription
            subscription = Ms365Subscription(
                companyId=company_id,
                interviewId=interview.id,
                teamsJoinUrl=interview.ms365.teamsJoinUrl,
                subscriptionId=sub_result["subscription_id"],
                expirationDateTime=sub_result["expiration_datetime"],
                status="active"
            )
            await subscription.insert()
            
            interview.ms365.subscriptionId = subscription.id
        
        await interview.save()
        logger.info(f"Interview scheduled: {interview.id}")
    
    except Exception as e:
        logger.error(f"Error scheduling interview: {str(e)}")
        raise
```

---

## Phase 7: Subscription Renewal (Scheduled Task)

### Step 7.1: Create Renewal Background Job

Subscriptions expire in **3 days max**. Create a scheduled task to renew them:

In `Backend/app/core/background_tasks.py`:

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.models.ms365_subscription import Ms365Subscription
from app.services.ms365_service import MS365Service
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

async def renew_expiring_subscriptions():
    """
    Renew MS365 webhook subscriptions that are about to expire
    Runs every 6 hours
    """
    try:
        # Find subscriptions expiring within next 12 hours
        threshold = datetime.utcnow() + timedelta(hours=12)
        
        expiring = await Ms365Subscription.find(
            Ms365Subscription.expirationDateTime < threshold,
            Ms365Subscription.status == "active"
        ).to_list()
        
        logger.info(f"Found {len(expiring)} subscriptions to renew")
        
        for subscription in expiring:
            try:
                ms365_service = MS365Service()
                
                # Delete old subscription
                await ms365_service.delete_subscription(subscription.subscriptionId)
                
                # Create new subscription
                result = await ms365_service.create_webhook_subscription(
                    teams_join_url=subscription.teamsJoinUrl,
                    company_id=subscription.companyId
                )
                
                # Update subscription record
                subscription.subscriptionId = result["subscription_id"]
                subscription.expirationDateTime = result["expiration_datetime"]
                subscription.lastRenewed = datetime.utcnow()
                await subscription.save()
                
                logger.info(f"Renewed subscription: {subscription.id}")
            
            except Exception as e:
                logger.error(f"Error renewing subscription {subscription.id}: {str(e)}")
                subscription.status = "failed"
                await subscription.save()
    
    except Exception as e:
        logger.error(f"Error in subscription renewal task: {str(e)}")

# Schedule the task
def start_background_scheduler():
    scheduler.add_job(
        renew_expiring_subscriptions,
        "interval",
        hours=6,
        id="renew_ms365_subscriptions"
    )
    scheduler.start()
    logger.info("Background scheduler started")
```

---

## Phase 8: Test the Integration

### Step 8.1: Local Testing with ngrok

For local development, use **ngrok** to expose your local webhook:

```bash
# Install ngrok
# https://ngrok.com/download

# Start ngrok tunnel (points to your local backend)
ngrok http 8000

# You'll get a URL like:
# https://xxxx-xx-xxx-xxx-xx.ngrok.io

# Update your .env:
MS365_WEBHOOK_URL="https://xxxx-xx-xxx-xxx-xx.ngrok.io/webhooks/ms365/meeting-ended"
```

### Step 8.2: Create a Test Interview

1. Log into i79Engage frontend
2. Create a requisition and application
3. Schedule an interview for **5 minutes from now**
4. Check logs for webhook subscription creation:
   ```
   INFO: Webhook subscription created: sub_xxxxx
   ```

### Step 8.3: Monitor Webhook Events

1. Open meeting join URL in Teams
2. End the meeting
3. Check backend logs for webhook event:
   ```
   INFO: Webhook validation request
   # or
   INFO: Interview marked as conducted: intv_xxxxx
   INFO: Scorecard tasks created: 2
   ```

### Step 8.4: Verify Database State

```python
# In MongoDB or via backend service:

# Check Interview status
db.interviews.findOne({_id: "intv_xxxxx"})
# Should show:
# {
#   status: "conducted",
#   conductedAt: ISODate("2026-01-05T..."),
#   webhookEventId: "..."
# }

# Check Tasks created
db.tasks.find({interviewId: "intv_xxxxx"})
# Should show 2 tasks (one per interviewer)

# Check Emails sent (in your email logs)
# Should show 2 notification emails with magic links
```

---

## Phase 9: Troubleshooting

### Problem: Subscription creation fails with 401 Unauthorized

**Solution:**
1. Verify client credentials (client ID, secret)
2. Check that app registration has correct permissions granted
3. Ensure Admin Consent is given

### Problem: Webhook endpoint not receiving events

**Solution:**
1. Check that endpoint is publicly accessible
2. Verify HTTPS (not HTTP)
3. Check firewall isn't blocking inbound traffic
4. Monitor webhook delivery status in Azure Portal:
   - Go to: **Subscriptions** → Your app → **Webhook Deliveries**

### Problem: Decryption fails (invalid padding error)

**Solution:**
1. Verify certificate matches `encryptionCertificateId` in payload
2. Check certificate isn't expired
3. Ensure private key is loaded correctly
4. Try rotating certificate (Phase 3.3)

### Problem: Interview not found for joinWebUrl

**Solution:**
1. Verify teamsJoinUrl stored correctly in Interview model
2. Check URL encoding/decoding is consistent
3. Ensure database query filters by correct companyId (tenant isolation)

### Problem: Duplicate scorecard tasks being created

**Solution:**
1. Check `interview.webhookEventId` is being tracked
2. Verify idempotency check in webhook handler
3. Check that `interview.conductedAt` is set (prevents reprocessing)

---

## Checklist: Verification Steps

After completing all phases, verify:

- [ ] Azure app registration created
- [ ] API permissions granted (OnlineMeetings.Read.All, Calendars.Read, User.Read.All)
- [ ] Admin consent given
- [ ] Client secret generated and stored securely
- [ ] Certificate generated (public + private keys)
- [ ] Certificate stored in secrets vault
- [ ] Environment variables configured (.env or vault)
- [ ] Backend code updated with configuration
- [ ] Webhook handler created and tested
- [ ] MS365Service created with token + subscription logic
- [ ] Webhook endpoint publicly accessible
- [ ] ngrok tunnel working (for local testing)
- [ ] Test interview scheduled
- [ ] Webhook subscription created successfully
- [ ] Meeting ended and webhook event received
- [ ] Interview status updated to "conducted"
- [ ] Scorecard tasks created
- [ ] Notification emails sent with magic links
- [ ] Background renewal job deployed
- [ ] Subscription renewal working

---

## Summary

You've now set up the complete M365 webhook integration! 

**What happens when an interview completes:**
1. Teams meeting ends
2. MS365 sends webhook to your endpoint
3. Backend decrypts the event
4. Finds the Interview by teamsJoinUrl
5. Marks interview as "conducted"
6. Creates scorecard tasks
7. Sends notification emails

**Fallback:** If webhook fails, recruiters can click "Request Scorecards" button to manually trigger the same flow.

**Ongoing:** Background job renews subscriptions every 6 hours before expiration.

---

## Support & Next Steps

For issues or questions:
1. Check Troubleshooting section (Phase 9)
2. Review MS365 documentation: https://learn.microsoft.com/en-us/graph/changenotifications-for-onlinemeeting
3. Monitor webhook deliveries in Azure Portal
4. Check backend logs for errors
5. Test locally with ngrok before deploying to production

**Next:** Implement the manual fallback button and scorecard submission logic.


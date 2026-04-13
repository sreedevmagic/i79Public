# Cloud AMQP Configuration Guide for i79Engage

## 🔧 Quick Fix for "StreamLostError: Transport indicated EOF"

This error occurs when trying to connect to Cloud AMQP without SSL/TLS enabled.

### ✅ Solution

Update your `Backend/.env` file with:

```bash
# Cloud AMQP Configuration (REQUIRED for port 8883)
RABBITMQ_HOST=your-instance.cloudamqp.com
RABBITMQ_PORT=8883
RABBITMQ_USER=your_username
RABBITMQ_PASSWORD=your_password
RABBITMQ_VHOST=your_vhost
RABBITMQ_USE_SSL=true  # ← CRITICAL: Must be true for Cloud AMQP
RABBITMQ_CONNECTION_TIMEOUT=30
RABBITMQ_HEARTBEAT=600
RABBITMQ_BLOCKED_CONNECTION_TIMEOUT=300
ENABLE_EVENT_PUBLISHING=true
```

---

## 📋 Step-by-Step Setup

### Step 1: Get Cloud AMQP Credentials

1. Log into your Cloud AMQP account: https://customer.cloudamqp.com/
2. Click on your instance
3. Find the connection URL (format: `amqps://user:pass@host/vhost`)

**Example Connection URL:**
```
amqps://myuser:mypassword@kangaroo.rmq.cloudamqp.com/myuser
```

### Step 2: Extract Connection Parameters

From the URL above, extract:

| Parameter | Value | Example |
|-----------|-------|---------|
| `RABBITMQ_HOST` | `host` (after @, before /) | `kangaroo.rmq.cloudamqp.com` |
| `RABBITMQ_PORT` | Always `8883` for AMQPS | `8883` |
| `RABBITMQ_USER` | `user` (before :) | `myuser` |
| `RABBITMQ_PASSWORD` | `pass` (after : before @) | `mypassword` |
| `RABBITMQ_VHOST` | `vhost` (after last /) | `myuser` |
| `RABBITMQ_USE_SSL` | Always `true` | `true` |

### Step 3: Update Environment File

Create or update `Backend/.env`:

```bash
# Cloud AMQP Configuration
RABBITMQ_HOST=kangaroo.rmq.cloudamqp.com
RABBITMQ_PORT=8883
RABBITMQ_USER=myuser
RABBITMQ_PASSWORD=mypassword
RABBITMQ_VHOST=myuser
RABBITMQ_USE_SSL=true
RABBITMQ_CONNECTION_TIMEOUT=30
ENABLE_EVENT_PUBLISHING=true
```

**⚠️ Important Notes:**
- No `amqps://` prefix in `RABBITMQ_HOST`
- Port must be `8883` (NOT `5672`)
- `RABBITMQ_USE_SSL=true` is mandatory
- `RABBITMQ_VHOST` is often the same as username

### Step 4: Restart Application

```bash
cd Backend
uvicorn app.main:app --reload
```

### Step 5: Verify Connection

Look for this in logs:
```
INFO: Using SSL/TLS for RabbitMQ connection
INFO: Connected to RabbitMQ at amqps://kangaroo.rmq.cloudamqp.com:8883
INFO: RabbitMQ initialized successfully
```

---

## 🔍 Troubleshooting

### Error: "StreamLostError: Transport indicated EOF"

**Cause:** SSL is not enabled or wrong port

**Fix:**
```bash
# In .env file
RABBITMQ_USE_SSL=true  # Must be true
RABBITMQ_PORT=8883     # Must be 8883 for SSL
```

### Error: "Connection timeout"

**Cause:** Network issues or wrong host

**Fix:**
```bash
# Increase timeout
RABBITMQ_CONNECTION_TIMEOUT=30

# Verify host (no protocol prefix)
RABBITMQ_HOST=kangaroo.rmq.cloudamqp.com  # ✅ Good
RABBITMQ_HOST=amqps://kangaroo.rmq.cloudamqp.com  # ❌ Bad
```

### Error: "Access refused - Login was refused"

**Cause:** Wrong credentials

**Fix:**
1. Go to Cloud AMQP dashboard
2. Copy connection URL
3. Extract user/password carefully
4. Update `.env` file

### Error: "Virtual host not found"

**Cause:** Wrong vhost

**Fix:**
```bash
# Check your connection URL
# amqps://user:pass@host/VHOST_HERE
RABBITMQ_VHOST=myuser  # Usually same as username
```

---

## 🔐 Cloud AMQP Plans & Limits

### Free Tier (Little Lemur)
- ✅ Perfect for development/staging
- Max 1 million messages/month
- Shared instances

### Production Tier (Bunny, Rabbit, Panda)
- Dedicated instances
- Higher throughput
- Better performance

---

## 🌍 Environment-Specific Configuration

### Development (Local)
```bash
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
RABBITMQ_USE_SSL=false
ENABLE_EVENT_PUBLISHING=true
```

### Staging (Cloud AMQP)
```bash
RABBITMQ_HOST=staging-instance.cloudamqp.com
RABBITMQ_PORT=8883
RABBITMQ_USER=staging_user
RABBITMQ_PASSWORD=<from-cloudamqp>
RABBITMQ_VHOST=staging_user
RABBITMQ_USE_SSL=true
ENABLE_EVENT_PUBLISHING=true
```

### Production (Cloud AMQP)
```bash
RABBITMQ_HOST=prod-instance.cloudamqp.com
RABBITMQ_PORT=8883
RABBITMQ_USER=prod_user
RABBITMQ_PASSWORD=<from-cloudamqp>
RABBITMQ_VHOST=prod_user
RABBITMQ_USE_SSL=true
RABBITMQ_CONNECTION_TIMEOUT=30
RABBITMQ_HEARTBEAT=600
ENABLE_EVENT_PUBLISHING=true
```

---

## 📊 Monitoring Cloud AMQP

### Cloud AMQP Dashboard

1. **Overview Tab:**
   - Messages/sec
   - Connections
   - Queues
   - Exchanges

2. **Alarms Tab:**
   - Connection limits
   - Message rate limits
   - Disk space alerts

3. **Exchanges Tab:**
   - Verify `candidate.events`, `pipeline.events`, etc. created
   - Check message routing

### i79Engage Application Logs

```bash
# Successful connection
grep "Connected to RabbitMQ" logs/app.log

# Event publishing
grep "Event published" logs/app.log

# Failed events
grep "Failed to publish event" logs/app.log
```

---

## 🧪 Testing Cloud AMQP Connection

### Test 1: Manual Connection Test (Python)

```python
import pika
import ssl

# Your Cloud AMQP credentials
host = "kangaroo.rmq.cloudamqp.com"
port = 8883
user = "myuser"
password = "mypassword"
vhost = "myuser"

# SSL context
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

credentials = pika.PlainCredentials(user, password)
parameters = pika.ConnectionParameters(
    host=host,
    port=port,
    virtual_host=vhost,
    credentials=credentials,
    ssl_options=pika.SSLOptions(ssl_context, host)
)

try:
    connection = pika.BlockingConnection(parameters)
    print("✅ Connection successful!")
    connection.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")
```

### Test 2: Event Publishing Test

1. Start the application
2. Move an application stage
3. Check Cloud AMQP dashboard → Exchanges → `pipeline.events`
4. Should see message count increase

---

## 🚀 Production Deployment Checklist

### Pre-Deployment
- [ ] Cloud AMQP instance provisioned (Bunny tier or higher)
- [ ] Connection URL obtained from dashboard
- [ ] Credentials stored in secure vault (Azure Key Vault, AWS Secrets Manager)
- [ ] `.env` file configured correctly
- [ ] SSL enabled (`RABBITMQ_USE_SSL=true`)

### Deployment
- [ ] Environment variables configured in Azure App Service
- [ ] Application startup logs show successful RabbitMQ connection
- [ ] Test event published successfully
- [ ] Exchanges created automatically

### Post-Deployment
- [ ] Monitor Cloud AMQP dashboard for message flow
- [ ] Set up alerts for connection failures
- [ ] Monitor application logs for failed events
- [ ] Verify event publishing latency < 100ms

---

## 💡 Best Practices

### Security
```bash
# ✅ GOOD: Use environment variables
RABBITMQ_PASSWORD=${CLOUDAMQP_PASSWORD}

# ❌ BAD: Hardcode credentials
RABBITMQ_PASSWORD=mypassword123
```

### Connection Pooling
- RabbitMQManager uses singleton pattern ✅
- Single connection reused across application ✅
- Automatic reconnection on failures ✅

### Error Handling
- Fire-and-forget pattern (never blocks operations) ✅
- Failed events logged and tracked ✅
- Graceful degradation if RabbitMQ unavailable ✅

---

## 📞 Getting Help

### Cloud AMQP Support
- Support Portal: https://customer.cloudamqp.com/support
- Documentation: https://www.cloudamqp.com/docs/
- Status Page: https://status.cloudamqp.com/

### i79Engage Issues
- Check logs: `grep "RabbitMQ" Backend/logs/app.log`
- Verify config: `cat Backend/.env | grep RABBITMQ`
- Test connection: Run manual test script above

---

## ✅ Quick Verification Checklist

After configuration, verify:

- [ ] `RABBITMQ_USE_SSL=true` in `.env`
- [ ] `RABBITMQ_PORT=8883` in `.env`
- [ ] No `amqps://` prefix in `RABBITMQ_HOST`
- [ ] Application starts without connection errors
- [ ] Logs show "Using SSL/TLS for RabbitMQ connection"
- [ ] Logs show "Connected to RabbitMQ at amqps://..."
- [ ] Test event published successfully
- [ ] Cloud AMQP dashboard shows exchanges created

---

**Your Cloud AMQP connection should now work! 🎉**

If you still have issues, check the troubleshooting section or contact support.

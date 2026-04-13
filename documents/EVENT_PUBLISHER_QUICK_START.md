# Event Publisher - Developer Quick Start

## Local Development Setup

### 1. Install RabbitMQ

**Using Docker (Recommended):**
```bash
docker run -d \
  --name i79-rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management

# Access Management UI: http://localhost:15672
# Username: guest
# Password: guest
```

**Using Homebrew (macOS):**
```bash
brew install rabbitmq
brew services start rabbitmq
```

### 2. Configure Environment

**For Local Development (Docker RabbitMQ):**
```bash
# Add to Backend/.env
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
RABBITMQ_USE_SSL=false
ENABLE_EVENT_PUBLISHING=true
```

**For Cloud AMQP (Production/Staging):**
```bash
# Add to Backend/.env
RABBITMQ_HOST=your-instance.cloudamqp.com
RABBITMQ_PORT=8883
RABBITMQ_USER=your_username
RABBITMQ_PASSWORD=your_password
RABBITMQ_VHOST=your_vhost
RABBITMQ_USE_SSL=true  # Required for Cloud AMQP
RABBITMQ_CONNECTION_TIMEOUT=30
ENABLE_EVENT_PUBLISHING=true
```

**Finding Cloud AMQP Credentials:**
1. Log into Cloud AMQP dashboard
2. Go to your instance details
3. Copy connection URL: `amqps://user:pass@host/vhost`
4. Extract: user, pass, host, vhost
5. Port 8883 is for AMQPS (secure)

### 3. Install Dependencies

```bash
cd Backend
pip install pika==1.3.2 tenacity==8.2.3
```

### 4. Verify Installation

```bash
# Start backend
cd Backend
uvicorn app.main:app --reload

# Check logs for:
# INFO: RabbitMQ initialized successfully
```

---

## Publishing Your First Event

### Example 1: Stage Change Event

```python
from app.services.event_publisher import get_event_publisher
from app.schemas.event import create_stage_change_event

# In your service method
event_publisher = get_event_publisher()

event = create_stage_change_event(
    tenant_id=company_id,
    application_id=application.id,
    previous_stage="screen",
    current_stage="interview",
    user_id=user.id,
    note="Moving to technical interview",
    requisitionId=application.requisitionId
)

await event_publisher.publish_event_object(event)
```

### Example 2: Custom Event

```python
from app.services.event_publisher import get_event_publisher
from app.core.event_types import EventType

event_publisher = get_event_publisher()

await event_publisher.publish_event(
    event_type=EventType.CANDIDATE_CREATED,
    tenant_id=company_id,
    entity={"type": "application", "id": application.id},
    actor={"type": "user", "id": user_id},
    context={
        "requisitionId": requisition.id,
        "source": "manual"
    },
    payload={
        "candidateName": name,
        "candidateEmail": email
    }
)
```

---

## Viewing Events in RabbitMQ UI

1. Open http://localhost:15672
2. Login with `guest` / `guest`
3. Navigate to **Exchanges** tab
4. Look for: `candidate.events`, `pipeline.events`, `decision.events`
5. Click exchange → **Publish message** to test
6. View **Queues** tab to create test consumers

---

## Adding a New Event Type

### Step 1: Define Event Type

```python
# Backend/app/core/event_types.py

class EventType(str, Enum):
    # ... existing events ...
    MY_NEW_EVENT = "my.new.event"

# Add to EXCHANGE_MAP
EXCHANGE_MAP: dict[str, str] = {
    # ... existing mappings ...
    "my.new.event": "system.events",
}
```

### Step 2: Create Convenience Constructor (Optional)

```python
# Backend/app/schemas/event.py

def create_my_event(
    tenant_id: str,
    entity_id: str,
    **extra_payload
) -> PlatformEvent:
    """Create a my.new.event."""
    return PlatformEvent(
        eventType="my.new.event",
        tenantId=tenant_id,
        actor=EventActor(type="system"),
        entity=EventEntity(type="my_entity", id=entity_id),
        payload=extra_payload
    )
```

### Step 3: Publish in Service

```python
# In your service method
try:
    event_publisher = get_event_publisher()
    event = create_my_event(
        tenant_id=company_id,
        entity_id=entity.id,
        customField="value"
    )
    await event_publisher.publish_event_object(event)
except Exception as e:
    logger.error(f"Failed to publish event: {e}")
```

---

## Testing Events

### Manual Test: Move Application Stage

```bash
# 1. Start backend
cd Backend
uvicorn app.main:app --reload

# 2. In another terminal, call the API
curl -X POST http://localhost:8000/api/applications/{id}/move-stage \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"stage": "interview", "note": "Test event"}'

# 3. Check RabbitMQ UI → Exchanges → pipeline.events
# You should see 1 message published
```

### Check Failed Events

```python
from app.services.event_publisher import get_event_publisher

publisher = get_event_publisher()
failed = publisher.get_failed_events()

print(f"Failed events: {len(failed)}")
for event in failed:
    print(f"Event: {event['eventType']}, Error: {event['error']}")
```

---

## Troubleshooting

### Event Not Published

**Check 1:** Is RabbitMQ running?
```bash
docker ps | grep rabbitmq
# or
rabbitmqctl status
```

**Check 2:** Is feature flag enabled?
```python
# Backend/app/core/config.py
ENABLE_EVENT_PUBLISHING: bool = True
```

**Check 3:** Check application logs
```bash
# Look for:
# "Event published: candidate.stage.changed"
# or
# "Failed to publish event"
```

### Connection Errors

**For Cloud AMQP TLS Issues:**
```bash
# Verify SSL is enabled in .env
RABBITMQ_USE_SSL=true

# Verify port 8883 (AMQPS) not 5672 (AMQP)
RABBITMQ_PORT=8883

# Check connection string format
RABBITMQ_HOST=hostname-only.cloudamqp.com  # No amqps:// prefix
RABBITMQ_VHOST=your_vhost  # Usually your username

# Test connection timeout
RABBITMQ_CONNECTION_TIMEOUT=30
```

**For Local Docker:**
```bash
# Check RabbitMQ connectivity
telnet localhost 5672

# Check credentials in .env
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_USE_SSL=false
```

**Common Cloud AMQP Errors:**
- `StreamLostError: Transport indicated EOF` → Set `RABBITMQ_USE_SSL=true`
- `Connection timeout` → Increase `RABBITMQ_CONNECTION_TIMEOUT=30`
- `Authentication failed` → Verify credentials from Cloud AMQP dashboard
- `Virtual host not found` → Check `RABBITMQ_VHOST` matches your instance

### Exchange Not Created

Check logs for:
```
INFO: Exchange declared: pipeline.events
```

If missing, RabbitMQ connection may have failed at startup.

---

## Best Practices

### 1. Always Use Try/Except

```python
# ✅ GOOD
try:
    await event_publisher.publish_event(...)
except Exception as e:
    logger.error(f"Failed to publish: {e}")

# ❌ BAD - will crash business operation if event fails
await event_publisher.publish_event(...)
```

### 2. Include Relevant Context

```python
# ✅ GOOD - Rich context for consumers
context={
    "requisitionId": requisition.id,
    "previousStage": old_stage,
    "currentStage": new_stage,
    "userId": user.id
}

# ❌ BAD - Not enough context
context={"stage": new_stage}
```

### 3. Use Type-Safe Event Types

```python
# ✅ GOOD
from app.core.event_types import EventType

event_type=EventType.CANDIDATE_STAGE_CHANGED

# ❌ BAD - String literals can have typos
event_type="candidate.stage.changed"
```

### 4. Never Block on Events

```python
# ✅ GOOD - Fire and forget
async def move_stage(...):
    # Business logic first
    await application.save()
    
    # Event publishing last (never affects business operation)
    try:
        await publish_event(...)
    except:
        pass  # Logged but doesn't fail the operation

# ❌ BAD - Event failure blocks business operation
async def move_stage(...):
    await publish_event(...)  # If this fails, save() never happens
    await application.save()
```

---

## Common Patterns

### Pattern 1: State Change Events

```python
# Capture before/after
previous_stage = application.stage
await application.update(...)  # Business logic
new_stage = application.stage

# Publish event
await publish_stage_change_event(
    previous_stage=previous_stage,
    current_stage=new_stage
)
```

### Pattern 2: Completion Events

```python
# After async processing completes
application.cvScore = result.score
application.status = "ai_screened"
await application.save()

# Publish completion event
await publish_cv_analysis_event(
    cv_score=result.score,
    cv_justification=result.justification
)
```

### Pattern 3: Error Events

```python
try:
    result = await process_decision_pack(...)
    await publish_event(..., status="ready")
except Exception as e:
    await publish_event(..., status="failed", error=str(e))
```

---

## Next Steps

1. ✅ **Complete:** Core infrastructure
2. ✅ **Complete:** Service integration
3. 🔄 **TODO:** Write unit tests
4. 🔄 **TODO:** Write integration tests
5. 🔄 **TODO:** Deploy to staging
6. 🔄 **TODO:** Enable for pilot tenant
7. 🔄 **TODO:** Full production rollout

---

## Getting Help

- **RabbitMQ Docs:** https://www.rabbitmq.com/documentation.html
- **Pika Docs:** https://pika.readthedocs.io/
- **i79Engage Architecture:** See `documents/ARCHITECTURE_V2.md`
- **Troubleshooting:** See `documents/EVENT_PUBLISHER_IMPLEMENTATION.md`

---

**Happy Event Publishing! 🚀**

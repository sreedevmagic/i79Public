# 📄 i79 Engage – Event Publishing Module Requirements (RabbitMQ आधारित)

---

# 1. 🎯 Objective

Design and implement an **internal event publishing module** that enables all backend services to emit **standardized, tenant-aware events** to RabbitMQ.

This module will serve as the **foundation for:**

* Automation Engine (rules + workflows)
* AI Agents orchestration
* Decision Pack generation
* Notifications & integrations
* Analytics

---

# 2. 🧩 Scope

This specification covers:

* Internal event publishing library (NOT external API)
* Standard event schema
* RabbitMQ exchange management
* Dynamic exchange creation
* Routing strategy
* Platform-level event definitions

---

# 3. 🚫 Explicit Non-Scope (Important)

The following are **NOT required in MVP**:

* ❌ External `/events` API
* ❌ Queue creation logic (consumer side responsibility)
* ❌ Time-based / scheduled events (e.g. SLA breach)
* ❌ Event replay system
* ❌ Schema registry

---

# 4. 🧠 Design Principles

---

## 4.1 Internal-Only Publishing

Events MUST be published from backend services (e.g. CandidateService, AIService), NOT via public APIs.

---

## 4.2 Real-Time Domain Events Only

Only emit events when an actual action occurs:

* state change
* AI process completion
* decision made

---

## 4.3 Tenant-Aware by Default

Every event MUST include:

* `tenantId`

---

## 4.4 Standardized Contract

All services MUST use the same event structure.

---

## 4.5 Loose Coupling

Publishers MUST NOT depend on consumers.

---

# 5. ⚙️ Event Structure (Mandatory Schema)

```json
{
  "eventId": "uuid",
  "eventType": "candidate.stage.changed",
  "tenantId": "tenant-001",
  "timestamp": "ISO-8601",

  "actor": {
    "type": "user | system | agent",
    "id": "optional"
  },

  "entity": {
    "type": "candidate | job | interview | decision",
    "id": "entity-id"
  },

  "context": {
    "jobId": "optional",
    "previousStage": "optional",
    "currentStage": "optional"
  },

  "payload": {},

  "metadata": {
    "source": "service-name",
    "version": "v1"
  }
}
```

---

# 6. 🧱 Event Publisher Module

---

## 6.1 Module Name

`eventPublisher`

---

## 6.2 Responsibilities

* Accept event input from services
* Enrich event:

  * generate `eventId`
  * add `timestamp`
  * attach metadata
* Validate required fields
* Resolve correct RabbitMQ exchange
* Ensure exchange exists
* Publish event

---

## 6.3 Public Interface

### Function Signature (example)

```ts
publishEvent(event: {
  eventType: string;
  tenantId: string;
  entity: { type: string; id: string };
  payload?: any;
  context?: any;
  actor?: any;
}): Promise<void>
```

---

## 6.4 Usage Example

```ts
await eventPublisher.publishEvent({
  eventType: "candidate.stage.changed",
  tenantId: tenantId,
  entity: { type: "candidate", id: candidateId },
  context: {
    previousStage: "Screening",
    currentStage: "Interview"
  },
  payload: {
    aiScore: 82
  },
  actor: {
    type: "user",
    id: recruiterId
  }
});
```

---

# 7. 📡 RabbitMQ Configuration

---

## 7.1 Exchange Strategy

### Exchange Type: `topic`

### Standard Exchanges:

| Domain    | Exchange Name      |
| --------- | ------------------ |
| Candidate | `candidate.events` |
| Job       | `job.events`       |
| Pipeline  | `pipeline.events`  |
| AI        | `ai.events`        |
| Decision  | `decision.events`  |
| System    | `system.events`    |

---

## 7.2 Exchange Resolution Logic

Map `eventType` → exchange:

| Event Prefix                                 | Exchange           |
| -------------------------------------------- | ------------------ |
| `candidate.*`                                | `candidate.events` |
| `job.*`                                      | `job.events`       |
| `candidate.stage.*`                          | `pipeline.events`  |
| `screening.*`, `interview.*`, `evaluation.*` | `ai.events`        |
| `decision*`                                  | `decision.events`  |

---

## 7.3 Routing Key Format

```
<tenantId>.<entity>.<event>
```

### Example:

```
tenantA.candidate.stage.changed
```

---

## 7.4 Dynamic Exchange Creation (MANDATORY)

Before publishing:

* Check if exchange exists
* If NOT:

  * Create exchange using:

    * type: `topic`
    * durable: `true`

### Implementation (Node example)

```ts
channel.assertExchange(exchangeName, "topic", { durable: true });
```

---

## 7.5 Message Properties

* persistent: `true`
* contentType: `application/json`

---

# 8. 📚 Supported Events (MVP Scope)

---

## 8.1 Candidate Events

* `candidate.created`
* `candidate.updated`
* `candidate.applied`

---

## 8.2 Pipeline Events (Critical)

* `candidate.stage.changed`

---

## 8.3 AI Events

* `screening.completed.ai`
* `interview.completed.ai`
* `evaluation.completed.ai`

---

## 8.4 Decision Events

* `decision_pack.generated`
* `decision.made`

---

## 8.5 Automation Events (Internal)

* `automation.rule.triggered`
* `automation.action.executed`

---

# 9. 🔐 Reliability Requirements

---

## 9.1 Delivery Guarantees

* Use persistent messages
* Durable exchanges

---

## 9.2 Retry Strategy

* Retry on publish failure (configurable attempts)
* Exponential backoff recommended

---

## 9.3 Error Handling

* Log failures with:

  * eventType
  * tenantId
  * error message

---

# 10. 📊 Observability

---

## Logs

* Event published successfully
* Exchange created
* Publish failures

---

## Metrics (Optional for MVP)

* events published/sec
* failures
* latency

---

# 11. 🔐 Security & Validation

* Validate required fields before publish
* Reject invalid events
* Ensure tenantId is always present
* Prevent publishing malformed payloads

---

# 12. 🧪 Testing Requirements

---

## Unit Tests

* Event validation
* Exchange resolution
* Routing key generation

---

## Integration Tests

* Publish to RabbitMQ
* Exchange auto-creation
* Message delivery

---

# 13. 🚀 Implementation Notes

* Use a shared RabbitMQ connection (singleton)
* Reuse channel where possible
* Keep publisher lightweight (no business logic inside)
* Avoid blocking operations

---

# 14. ✅ Summary

This module provides:

> A **standard, reliable, tenant-aware event publishing layer** for the entire platform.

It ensures:

* Consistency across services
* Clean separation of concerns
* Readiness for automation, AI, and integrations

---

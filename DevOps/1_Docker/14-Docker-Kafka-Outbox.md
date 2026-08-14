# Level 14 — Docker + Kafka ⭐ (Event-Driven Microservices)

---

## 1. 💡 Concept: Event-Driven Microservices & Transactional Outbox

Connecting microservices asynchronously requires a Distributed Event Streaming platform like **Apache Kafka**.

To ensure 100% data consistency between PostgreSQL database updates and Kafka event publishing without distributed transactions (2PC), we implement the **Transactional Outbox Pattern**:

```
                       Transactional Outbox Flow
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   POST /orders ──► Spring Boot Microservice                                 │
│                         │                                                   │
│                         ▼  Single Local DB Transaction                      │
│                    PostgreSQL                                               │
│                    ├── orders table (INSERT)                                │
│                    └── outbox table (INSERT event payload)                  │
│                         │                                                   │
│                         ▼ Change Data Capture (Debezium / Poller)           │
│                    Apache Kafka Cluster                                     │
│                    └── Topic: "order-events"                                │
│                         │                                                   │
│                         ▼ Kafka Consumer                                    │
│                    Analytics / Inventory Container                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 📐 Complete `docker-compose.yml` Architecture

```yaml
version: '3.8'

services:
  # 1. Zookeeper (Kafka Coordination)
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    networks:
      - kafka-net

  # 2. Apache Kafka Broker
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    depends_on:
      - zookeeper
    networks:
      - kafka-net

  # 3. PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: orderdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secretpassword
    networks:
      - kafka-net

  # 4. Spring Boot Order Producer Service
  order-service:
    build: .
    container_name: order-service
    ports:
      - "8080:8080"
    environment:
      SPRING_KAFKA_BOOTSTRAP_SERVERS: kafka:29092
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/orderdb
    depends_on:
      - kafka
      - postgres
    networks:
      - kafka-net

networks:
  kafka-net:
    driver: bridge
```

---

## 3. 💻 Practical Hands-On Execution

```bash
# 1. Start full Kafka + Zookeeper + Postgres + App stack
docker compose up -d

# 2. Verify Kafka broker status
docker compose exec kafka kafka-topics --bootstrap-server kafka:29092 --list

# 3. Create a topic named "order-events"
docker compose exec kafka kafka-topics --bootstrap-server kafka:29092 \
  --create --topic order-events --partitions 3 --replication-factor 1

# 4. Open Kafka Console Consumer to watch incoming messages
docker compose exec kafka kafka-console-consumer --bootstrap-server kafka:29092 \
  --topic order-events --from-beginning

# 5. Trigger order creation from host terminal
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{"item":"MacBook Pro M3","price":2499.00}'
```

---

## 4. 💥 Break It (Troubleshooting)

### Scenario: Kafka Advertised Listeners Mismatch (`KAFKA_ADVERTISED_LISTENERS`)

**Mistake**: Setting `KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092`.

**What happens**: When Spring Boot container (`order-service`) queries Kafka broker, Kafka sends back `localhost:9092` as broker metadata IP. `order-service` tries to connect to `localhost:9092` (inside ITS OWN container) and fails with `TimeoutException`!

**Fix**: Configure dual listeners:
1. Internal listener for container-to-container (`kafka:29092`).
2. External host listener for host machine (`localhost:9092`).

---

## 5. ❓ Interview Questions

### Q1: Why implement the Transactional Outbox Pattern in microservices?
> **Answer**: Direct dual-writes (saving to DB and publishing to Kafka in the same HTTP controller method) is vulnerable to partial failure (e.g. DB saves, but Kafka network fails). The Outbox Pattern writes the event payload into a database `outbox` table in the **same local ACID database transaction**. A separate process (Debezium/CDC or polling worker) reliably reads outbox records and publishes them to Kafka with at-least-once delivery guarantees.

### Q2: What is the purpose of Zookeeper in Kafka Docker setups?
> **Answer**: Zookeeper maintains cluster metadata, elects Kafka broker leaders, and tracks topic partitions. Modern Kafka (KRaft mode) eliminates Zookeeper, but legacy versions require Zookeeper container coordination.

---

## 6. 🏋️ Mini Challenge

Publish a test message to `order-events` topic directly using `kafka-console-producer`.

<details>
<summary>🔍 Show Solution</summary>

```bash
docker compose exec -it kafka kafka-console-producer --bootstrap-server kafka:29092 --topic order-events
# Type payload: {"orderId": 101, "status": "CREATED"} and hit Enter
```
</details>

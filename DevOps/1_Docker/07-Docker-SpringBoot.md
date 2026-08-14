# Level 7 — Docker + Spring Boot (Full Stack Containerization)

---

## 1. 💡 Concept & End-to-End Application Architecture

In this level, we package and containerize a full production-grade 3-tier Spring Boot architecture comprising:
1. **Spring Boot REST API**: User management CRUD service (`/users`).
2. **PostgreSQL Database**: Relational storage for user entities.
3. **Redis Cache**: High-speed RAM caching layer.

```
                    Docker Engine Host
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                  Port Mapping (-p 8080:8080)               │
│  Client ──────►  Host:8080 ──► Spring Boot Container       │
│                                      │                     │
│                                      ├─► PostgreSQL:5432   │
│                                      │   (User Records)    │
│                                      │                     │
│                                      └─► Redis:6379        │
│                                          (Session/Cache)   │
└────────────────────────────────────────────────────────────┘
```

---

## 2. 🛠️ Step-by-Step Implementation

### Step 1: Spring Boot `application.yml`
```yaml
spring:
  application:
    name: user-service
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:userdb}
    username: ${DB_USER:postgres}
    password: ${DB_PASS:secret}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}

server:
  port: 8080
```

---

### Step 2: Production `Dockerfile`
```dockerfile
# Stage 1: Build JAR using Maven
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Minimal Runtime JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --from=builder /build/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
```

---

### Step 3: Complete `docker-compose.yml`
```yaml
version: '3.8'

services:
  api-service:
    build: .
    container_name: user-api
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=postgres-db
      - DB_PORT=5432
      - DB_NAME=userdb
      - DB_USER=postgres
      - DB_PASS=postgres123
      - REDIS_HOST=redis-cache
      - REDIS_PORT=6379
    depends_on:
      postgres-db:
        condition: service_healthy
      redis-cache:
        condition: service_healthy
    networks:
      - backend-net

  postgres-db:
    image: postgres:16-alpine
    container_name: postgres-db
    environment:
      - POSTGRES_DB=userdb
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres123
    volumes:
      - pg-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 3s
      timeout: 3s
      retries: 5
    networks:
      - backend-net

  redis-cache:
    image: redis:7-alpine
    container_name: redis-cache
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 3s
      timeout: 3s
      retries: 5
    networks:
      - backend-net

volumes:
  pg-data:

networks:
  backend-net:
    driver: bridge
```

---

## 3. 💻 Practical Execution & REST API Testing

```bash
# 1. Start full multi-tier stack
docker compose up -d --build

# 2. Monitor container boot sequence
docker compose logs -f api-service

# 3. Test REST endpoints using Curl

# Create User (POST)
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Gaurav","email":"gaurav@example.com"}'

# Get All Users (GET)
curl http://localhost:8080/users

# Get Specific User (GET)
curl http://localhost:8080/users/1
```

---

## 4. 💥 Break It (Troubleshooting)

### Scenario: Hardcoded Database IP Address in Code

**Mistake**: Hardcoding `jdbc:postgresql://172.17.0.2:5432/userdb` inside `application.properties`.

**Why it breaks**: Container IP addresses are dynamic! When container restarts or runs on another host, Docker assigns a new IP (e.g. `172.17.0.4`), causing `ConnectException`.

**Fix**: Always use **Environment Variables** with Docker DNS aliases (`jdbc:postgresql://${DB_HOST:postgres-db}:5432/userdb`).

---

## 5. ❓ Interview Questions

### Q1: How do you configure Spring Boot to read database credentials dynamically inside Docker?
> **Answer**: Leverage Spring Boot's property placeholder syntax `${ENV_VAR:default_value}` inside `application.yml`, allowing Docker Compose or Kubernetes deployment manifests to inject database credentials via container environment variables.

### Q2: Why pass `-Djava.security.egd=file:/dev/./urandom` to JVM inside Docker?
> **Answer**: In headless Docker Linux containers, entropy for secure random number generation (`/dev/random`) can block thread execution on app startup. Passing `/dev/./urandom` prevents JVM startup delays.

---

## 6. 🏋️ Mini Challenge

Add a `PGAdmin` service to `docker-compose.yml` mapped to host port `5050` so developers can visually inspect PostgreSQL tables.

<details>
<summary>🔍 Show Solution</summary>

```yaml
  pgadmin:
    image: dpage/pgadmin4
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@admin.com
      - PGADMIN_DEFAULT_PASSWORD=root
    ports:
      - "5050:80"
    depends_on:
      - postgres-db
    networks:
      - backend-net
```
</details>

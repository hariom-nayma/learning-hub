# Level 13 — Docker Health Checks & Production Concepts

---

## 1. 💡 Concept: Container Running ≠ Application Healthy!

A process can be running inside a container (`docker ps` shows `Up 5 minutes`), yet the application inside may be frozen, stuck in a database deadlock, or throwing `500 Internal Server Error` on every HTTP request.

```
Container Status
   │
   ├── Process Alive (PID 1 Active) ────────► ✅ Container "Up"
   │
   └── API Responding (HTTP 200 OK) ────────► ❌ App Frozen / Deadlocked!
```

Docker `HEALTHCHECK` directive routinely runs a command inside the container to test application readiness.

---

## 2. 📐 Docker `HEALTHCHECK` States & Parameters

A container lifecycle has 3 Health States:
1. `starting`: Initial warmup phase during `interval` / `start-period`.
2. `healthy`: Healthcheck command returned exit code `0` (Success).
3. `unhealthy`: Healthcheck command returned exit code `1` (Failure) consecutively matching `retries`.

---

## 3. 📄 Spring Boot Actuator Dockerfile Healthcheck

```dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY target/app.jar app.jar

# Install curl for health probe
RUN apk add --no-cache curl

# Configure Health Check probe targeting Spring Boot Actuator endpoint
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 4. 💻 Practical Hands-On: Observing Health States

```bash
# 1. Start Nginx container with custom healthcheck
docker run -d \
  --name nginx-health-demo \
  --health-cmd="curl -f http://localhost/ || exit 1" \
  --health-interval=5s \
  --health-retries=2 \
  nginx:alpine

# 2. Watch status transition from "starting" -> "healthy"
docker ps --format "table {{.Names}}\t{{.Status}}"

# 3. Intentionally break Nginx by removing index.html
docker exec nginx-health-demo rm /usr/share/nginx/html/index.html

# 4. Observe container status turn "unhealthy"!
sleep 12
docker ps --format "table {{.Names}}\t{{.Status}}"
# Output: nginx-health-demo    Up 25 seconds (unhealthy)
```

---

## 5. 💥 Break It (Troubleshooting)

### Scenario: High Timeout & Short Interval Cascade

**Wrong Configuration**:
```dockerfile
HEALTHCHECK --interval=2s --timeout=10s CMD curl http://localhost:8080/
```

**Why it breaks**: Probing every 2 seconds when database queries take 1 second creates CPU overhead spikes, spawning hundreds of orphan `curl` processes that exhaust container PIDs!

**Fix**: Set realistic production parameters (`interval=15s`, `timeout=5s`, `start-period=30s`).

---

## 6. ❓ Interview Questions

### Q1: How does Docker Compose / Kubernetes use container Health Checks?
> **Answer**: Docker Compose uses health checks with `depends_on: { condition: service_healthy }` to delay dependent services until upstream databases are fully healthy. Kubernetes uses health status for **Liveness Probes** (restarting crashed pods) and **Readiness Probes** (routing traffic only to healthy pods).

### Q2: What are exit codes expected by Docker `HEALTHCHECK` command?
> **Answer**: 
> * `0`: Success (Container is healthy).
> * `1`: Unhealthy (Container is not working correctly).
> * `2`: Reserved (Do not use).

---

## 7. 🏋️ Mini Challenge

Add a healthcheck to a Redis Docker container using `redis-cli ping`.

<details>
<summary>🔍 Show Solution</summary>

```dockerfile
HEALTHCHECK --interval=5s --timeout=3s --retries=3 \
  CMD redis-cli ping || exit 1
```
</details>

# Level 3 — Dockerfile Deep Dive

---

## 1. 💡 Concept & Principles

A `Dockerfile` is a text document containing sequential instructions to build a Docker image.

### Building a Spring Boot JAR Image Flow

```
┌───────────────────────────┐
│ Spring Boot Source Code   │
└─────────────┬─────────────┘
              │ mvn package / gradle build
┌─────────────▼─────────────┐
│  executable app.jar       │
└─────────────┬─────────────┘
              │ docker build -t myapp:1.0 .
┌─────────────▼─────────────┐
│ Dockerfile Directives     │
│ FROM eclipse-temurin:21   │
│ WORKDIR /app              │
│ COPY app.jar app.jar      │
│ ENTRYPOINT [...]          │
└─────────────┬─────────────┘
              │
┌─────────────▼─────────────┐
│    Docker Image           │
└───────────────────────────┘
```

---

## 2. 📜 Key Dockerfile Directives Reference

| Directive | Purpose | Example |
| :--- | :--- | :--- |
| `FROM` | Sets base image for instructions | `FROM eclipse-temurin:21-jre-alpine` |
| `WORKDIR` | Sets working directory inside container | `WORKDIR /app` |
| `COPY` | Copies files/directories from host to container | `COPY target/app.jar app.jar` |
| `ADD` | Copies host files AND auto-extracts `.tar.gz` or downloads URLs | `ADD https://example.com/app.tar.gz /app/` |
| `RUN` | Executes commands **during image build time** (creates new layer) | `RUN apt-get update && apt-get install -y curl` |
| `ENV` | Sets persistent environment variables inside image | `ENV JAVA_OPTS="-Xmx512m"` |
| `ARG` | Defines build-time variables passed via `--build-arg` | `ARG VERSION=1.0.0` |
| `EXPOSE` | Documents container listening port (Informational metadata) | `EXPOSE 8080` |
| `USER` | Sets non-root user execution context | `USER 10001` |
| `HEALTHCHECK` | Tests if application inside container is healthy | `HEALTHCHECK CMD curl -f http://localhost:8080/actuator/health \|\| exit 1` |
| `CMD` | Provides default arguments or command execution | `CMD ["--server.port=8080"]` |
| `ENTRYPOINT` | Configures executable container default command | `ENTRYPOINT ["java", "-jar", "app.jar"]` |

---

## 3. ⚖️ `CMD` vs `ENTRYPOINT` (Critical Interview Topic)

Both instructions define what command executes when container starts. However:

```
ENTRYPOINT ["java", "-jar", "app.jar"] + CMD ["--server.port=8080"]
                     ▼
Executed: java -jar app.jar --server.port=8080

If user runs: docker run myapp --server.port=9090
                     ▼
Executed: java -jar app.jar --server.port=9090  (CMD is overridden!)
```

### Summary Comparison

* **`ENTRYPOINT`**: Hardcoded main command that **cannot be overridden** easily by `docker run` trailing arguments (unless using `--entrypoint`).
* **`CMD`**: Default arguments passed to `ENTRYPOINT` or default fallback command. Easily overridden at `docker run` execution time.

---

## 4. 💻 Practical Hands-On: Build & Run Custom Dockerfile

### Create Sample `Dockerfile`
```dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

ENV APP_NAME="LearningHub Demo"

# Create a lightweight dummy application runner script
RUN echo '#!/bin/sh' > /app/run.sh && \
    echo 'echo "Starting $APP_NAME on Java $(java -version 2>&1 | head -n 1)"' >> /app/run.sh && \
    echo 'echo "Arguments received: $@"' >> /app/run.sh && \
    chmod +x /app/run.sh

ENTRYPOINT ["/app/run.sh"]
CMD ["default-arg-1", "default-arg-2"]
```

### Terminal Execution Commands
```bash
# 1. Build image
docker build -t docker-demo:1.0 .

# 2. Run with default CMD arguments
docker run --rm docker-demo:1.0

# 3. Override CMD arguments at runtime
docker run --rm docker-demo:1.0 custom-param-alpha custom-param-beta
```

---

## 5. 💥 Break It (Troubleshooting)

### Scenario: Shell Form vs Exec Form Bug

**Wrong (Shell Form)**:
```dockerfile
ENTRYPOINT java -jar app.jar
```
**Correct (Exec Form JSON Array)**:
```dockerfile
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Why it breaks**:
Shell form invokes `/bin/sh -c "java -jar app.jar"`.
This causes `/bin/sh` to become **PID 1** inside the container instead of `java`.
When `docker stop` sends `SIGTERM`, `/bin/sh` ignores Unix signals and **does not pass `SIGTERM` to Java**, preventing graceful shutdown of Spring Boot database connection pools!

---

## 6. ❓ Interview Questions

### Q1: Why should you prefer `COPY` over `ADD` in Dockerfiles?
> **Answer**: `COPY` is explicit and transparent — it only copies local files into container. `ADD` has unexpected magic behavior (auto-extracting tar archives and downloading remote URLs), which can introduce security vulnerabilities or unintended layers.

### Q2: What is layer caching in Dockerfile builds and how do you optimize layer order?
> **Answer**: Every directive in Dockerfile creates an image layer. Docker caches unchanged layers. Put infrequently changed instructions (`FROM`, `WORKDIR`, `COPY pom.xml`, `RUN dependency downloads`) first, and frequently changing instructions (`COPY src/`) last so layer cache is reused efficiently.

---

## 7. 🏋️ Mini Challenge

Write a Dockerfile for a Node.js web app that:
1. Uses `node:20-alpine` base image.
2. Sets directory to `/usr/src/app`.
3. Sets `ENV NODE_ENV=production`.
4. Uses Exec form `ENTRYPOINT` to launch `node` and `CMD` with `"index.js"`.

<details>
<summary>🔍 Show Solution</summary>

```dockerfile
FROM node:20-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production
ENTRYPOINT ["node"]
CMD ["index.js"]
```
</details>

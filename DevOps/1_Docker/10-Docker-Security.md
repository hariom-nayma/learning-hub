# Level 10 — Docker Security Best Practices

---

## 1. 💡 Concept: The Container Security Matrix

By default, Docker containers run as `root` user (`UID 0`) inside container namespaces unless explicitly configured otherwise. If a root container is compromised via remote code execution (RCE) and a kernel container breakout occurs, the attacker gains full `root` control over the entire Host machine!

---

## 2. 🛡️ The 6 Essential Pillars of Docker Security

```
                           Container Security Matrix
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Non-Root Execution    ─► Never run container as root (USER 10001)        │
│ 2. Read-Only Filesystem  ─► Prevent malware code drop (--read-only)         │
│ 3. Secret Management     ─► No hardcoded passwords in Dockerfile/ENV          │
│ 4. Image Vulnerability   ─► Scan images using Trivy / Docker Scout            │
│ 5. Resource Constraints  ─► Prevent DoS memory exhaustion (--memory 512m)   │
│ 6. Drop Capabilities     ─► Drop Linux capabilities (--cap-drop=ALL)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 📄 Production Hardened Dockerfile Example

```dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# 1. Create specific non-root user & group with explicit UID/GID
RUN addgroup -S appgroup -g 10001 && \
    adduser -S appuser -u 10001 -G appgroup

# 2. Assign ownership of app working directory
COPY --chown=appuser:appgroup target/app.jar app.jar

# 3. Switch security execution context away from root!
USER 10001:10001

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 4. 💻 Practical Security Commands & Image Scanning

```bash
# 1. Scan image for CVE vulnerabilities using Docker Scout / Trivy
docker scout cves eclipse-temurin:21-jre-alpine

# 2. Run container with Read-Only root filesystem
docker run -d \
  --name secure-app \
  --read-only \
  --tmpfs /tmp \
  -p 8080:8080 \
  my-secured-image:1.0

# 3. Drop all Linux Kernel Capabilities & add back only what's required
docker run -d \
  --name hardened-nginx \
  --cap-drop=ALL \
  --cap-add=NET_BIND_SERVICE \
  -p 80:80 \
  nginx:alpine

# 4. Verify non-root execution inside running container
docker exec secure-app whoami
# Output: appuser (NOT root)
```

---

## 5. 🔑 Handling Docker Secrets vs Environment Variables

| Method | Security Level | Risk Factor | Best Use Case |
| :--- | :--- | :--- | :--- |
| **Hardcoded in Dockerfile** | ❌ **Dangerous** | Passwords baked into immutable image layers viewable by `docker history` | Never |
| **Container ENV (`-e`)** | ⚠️ **Medium** | Visible via `docker inspect` and host process lists (`ps aux`) | Non-sensitive configs |
| **Docker Secrets / Mounts** | 🟢 **High** | Injected in RAM at runtime (`/run/secrets/db_password`) | API keys, DB passwords, SSL certs |

---

## 6. 💥 Break It (Troubleshooting)

### Scenario: Hardcoded Passwords inside Dockerfile

```dockerfile
# DANGEROUS SECURITY BUG
ENV DB_PASSWORD="SuperSecretPassword123!"
```

**Why it's a critical vulnerability**:
Even if you overwrite `DB_PASSWORD` at runtime using `-e`, anyone with pull access to the image can run:

```bash
docker history --no-trunc my-vulnerable-image
```

And immediately view `SuperSecretPassword123!` in plain text from the image layer metadata history!

---

## 7. ❓ Interview Questions

### Q1: Why is running containers as root a major security risk?
> **Answer**: If a container runs as root inside the container namespace, its `UID` is 0 (root) on the host Linux kernel. If an attacker exploits a vulnerability to escape the container boundary (container breakout), they instantly acquire full `root` administrative access to the host machine.

### Q2: What is `--read-only` flag in `docker run`?
> **Answer**: It mounts the container's root filesystem as read-only. If an attacker successfully executes arbitrary code, they cannot write malicious scripts, modify binaries, or install rootkits into `/usr/bin` or `/app`.

---

## 8. 🏋️ Mini Challenge

1. Run an `alpine` container as non-root user `1000` with read-only root filesystem, mounting a writable `tmpfs` volume on `/tmp`.
2. Verify user ID with `whoami` and verify `/tmp` is writeable while `/` is read-only.

<details>
<summary>🔍 Show Solution</summary>

```bash
docker run --rm -u 1000:1000 --read-only --tmpfs /tmp alpine sh -c 'whoami && touch /tmp/test.txt && echo "Success"'
# Output:
# 1000
# Success
```
</details>

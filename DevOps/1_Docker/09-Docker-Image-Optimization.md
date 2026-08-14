# Level 9 — Docker Image Optimization

---

## 1. 💡 Concept: The 8 Golden Rules of Image Size & Speed

Optimizing Docker images improves deployment speeds, reduces bandwidth usage across CI/CD registries, and minimizes vulnerability exposure.

```
          ┌────────────────────────────────────────────────────────┐
          │               Docker Image Layers                      │
          │                                                        │
          │  Layer 4: COPY app.jar app.jar          (50 MB)        │
          │  Layer 3: RUN apk add --no-cache ...     (10 MB)        │
          │  Layer 2: WORKDIR /app                   (0 MB)        │
          │  Layer 1: FROM alpine:3.19               (7 MB)        │
          └────────────────────────────────────────────────────────┘
```

---

## 2. 🚀 The 8 Optimization Strategies

### 1. Choose Minimal Base Images
* ❌ `ubuntu:latest` (~80MB) or `debian` (~120MB)
* ✅ `alpine:3.19` (~7MB) or `distroless` (~20MB)

### 2. Leverage `.dockerignore`
Exclude unneeded files from being sent to Docker build context:
```gitignore
# .dockerignore
.git
.gitignore
target/
build/
node_modules/
*.md
Dockerfile*
docker-compose*
.env
```

### 3. Chain `RUN` Instructions to Minimize Layers
* **Bad (Multiple Layers)**:
  ```dockerfile
  RUN apt-get update
  RUN apt-get install -y curl
  RUN rm -rf /var/lib/apt/lists/*
  ```
* **Good (Single Combined Layer)**:
  ```dockerfile
  RUN apt-get update && \
      apt-get install -y --no-install-recommends curl && \
      rm -rf /var/lib/apt/lists/*
  ```

### 4. Optimize Layer Order for Caching
Put files that change least frequently at top of Dockerfile; put volatile application code at bottom.

### 5. Use Multi-Stage Builds
Separate build dependencies (compilers) from runtime artifacts.

### 6. Avoid Package Manager Caches
* Alpine: `apk add --no-cache <package>`
* Debian/Ubuntu: `apt-get install -y --no-install-recommends <package> && rm -rf /var/lib/apt/lists/*`
* Python: `pip install --no-cache-dir -r requirements.txt`

### 7. Consider Distroless Base Images
Distroless images (by Google) contain only application binary and runtime dependencies — no package managers, shell (`/bin/sh`), or standard Linux utilities.

### 8. Use Compression & Build Cache Features
Use Docker BuildKit (`DOCKER_BUILDKIT=1 docker build`).

---

## 3. 💻 Practical Hands-On: Measuring Image Layers

```bash
# Build image using BuildKit
DOCKER_BUILDKIT=1 docker build -t optimized-app:1.0 .

# Inspect layer history & size breakdown per layer
docker history optimized-app:1.0

# Compare sizes across images
docker images | grep optimized-app
```

---

## 4. 💥 Break It (Troubleshooting)

### Scenario: Unintentional Build Context Bloat

When running `docker build -t myapp .` in a repository containing large `.git` histories, node modules, or build targets without a `.dockerignore`:

```text
Sending build context to Docker daemon  1.45GB
```

**Result**: Build takes 2 minutes just transferring context to Docker daemon before building a single line!

**Fix**: Create a `.dockerignore` file containing `target/`, `.git/`, `node_modules/`. Build context instantly drops from 1.45GB to 500KB!

---

## 5. ❓ Interview Questions

### Q1: How would you reduce a Docker image size from 1GB to under 150MB?
> **Answer**: 
> 1. Switch base image from standard distribution (`ubuntu`/`debian`) to `alpine` or `distroless`.
> 2. Implement Multi-Stage build to strip compiler tools.
> 3. Use `.dockerignore` to exclude local build artifacts and `.git`.
> 4. Combine `RUN` commands and clean package manager caches in the same layer (`--no-cache`).

### Q2: What is the purpose of `.dockerignore`?
> **Answer**: It prevents unnecessary files/directories from being sent to Docker Daemon during build context transfer, speeding up build initiation and preventing accidental inclusion of sensitive files (`.env`, private keys) into image layers.

---

## 6. 🏋️ Mini Challenge

Audit this bad Dockerfile chunk and rewrite it into an optimized version:

```dockerfile
# BAD DOCKERFILE
FROM ubuntu:latest
RUN apt-get update
RUN apt-get install -y python3
RUN apt-get install -y python3-pip
COPY . /app
WORKDIR /app
RUN pip3 install -r requirements.txt
```

<details>
<summary>🔍 Show Solution</summary>

```dockerfile
# OPTIMIZED DOCKERFILE
FROM python:3.11-slim-alpine
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
```
</details>

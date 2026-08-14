# Level 15 — Advanced & Production Docker

---

## 1. 💡 Concept: Production Container Management

Moving containers to production requires mastering container orchestration (Kubernetes / Docker Swarm), automated CI/CD pipelines, container restart policies, and zero-downtime deployment strategies.

```
                            Production Container Pipeline
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   Git Commit ──► GitHub Actions / Jenkins CI                                │
│                       │                                                     │
│                       ▼ Docker Build & Scan (Trivy)                         │
│                  Docker Registry (AWS ECR / Docker Hub)                     │
│                       │                                                     │
│                       ▼ Helm / K8s Deployment Manifests                     │
│                  Kubernetes Cluster (Pods & Services)                       │
│                       │                                                     │
│                       ▼ Prometheus + Grafana                                │
│                  Monitoring & Alerting                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🆚 Production Interview Comparisons

### 1. Docker vs Virtual Machines (VM)
* **VM**: Hardware-level virtualization (hypervisor), boots full Guest OS, high RAM/CPU overhead (GBs), minutes boot time.
* **Docker**: OS-level virtualization (kernel sharing via namespaces/cgroups), zero guest OS overhead, MBs memory footprint, millisecond boot time.

### 2. Docker vs Kubernetes (K8s)
* **Docker**: Containerization tool to package, build, and run individual containers on a single host.
* **Kubernetes**: Container Orchestrator that manages thousands of containers across clusters of machines (auto-scaling, self-healing, rolling updates, ingress routing).

### 3. Docker Compose vs Kubernetes
* **Docker Compose**: Single-host multi-container tool used primarily for local developer environment setups.
* **Kubernetes**: Distributed multi-node cluster orchestrator designed for mission-critical enterprise production resilience.

### 4. Container vs Pod
* **Container**: A single isolated Linux process running an image (Docker/OCI runtime unit).
* **Pod**: The smallest deployable object in Kubernetes. A Pod contains one or more tightly coupled containers that share network namespaces (`localhost`) and volumes.

---

## 3. 🔄 Container Restart Policies Reference

| Policy | Behavior | Production Use Case |
| :--- | :--- | :--- |
| `no` | Never restart container if it exits or crashes | One-off batch jobs / migration scripts |
| `always` | Always restart container regardless of exit code | Infrastructure daemons |
| `on-failure[:max-retries]` | Restart ONLY if process exits with non-zero error code | Applications & web APIs |
| `unless-stopped` | Always restart unless container was explicitly stopped by operator | Databases & background workers |

---

## 4. 📄 GitHub Actions CI/CD Production Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Production Docker Build & Push

on:
  push:
    branches: [ "main" ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up QEMU & Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Scan Image for Vulnerabilities (Trivy)
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myuser/myapp:${{ github.sha }}'
          format: 'table'
          exit-code: '1'
          ignore-unfixed: true
          severity: 'CRITICAL,HIGH'

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            myuser/myapp:latest
            myuser/myapp:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## 5. 💥 Break It (Troubleshooting)

### Scenario: `latest` Tag Pollution in Production

**Mistake**: Deploying using `image: myapp:latest`.

**Why it's dangerous**:
1. `latest` is not an immutable version — it is a moving pointer.
2. If a node restarts, it may pull a different `latest` build than sibling nodes in the cluster!
3. Prevents instant rollback (`kubectl rollout undo`) because previous deployment spec also used tag `latest`.

**Fix**: Always tag production images with immutable Git Commit SHAs or Semantic Versions (`myapp:v1.4.2` or `myapp:sha-7f3b12a`).

---

## 6. ❓ Senior Interview Cheat Sheet

| Question | Short Answer |
| :--- | :--- |
| **COPY vs ADD** | `COPY` only copies local files. `ADD` automatically extracts `.tar.gz` and downloads remote URLs. Use `COPY`. |
| **CMD vs ENTRYPOINT** | `ENTRYPOINT` sets main command. `CMD` sets default arguments overridable at runtime. |
| **RUN vs CMD** | `RUN` executes at **build time** to create layers. `CMD` executes at **runtime** when container boots. |
| **ARG vs ENV** | `ARG` available only during `docker build`. `ENV` persists inside container runtime environment. |
| **Volume vs Bind Mount** | Volume is managed by Docker in `/var/lib/docker`. Bind mount maps arbitrary host path. |
| **EXPOSE vs -p** | `EXPOSE` is internal metadata documentation. `-p` creates actual host firewall port forwarding rule. |

---

## 7. 🏋️ Master Graduation Challenge

Congratulations on completing all 15 levels of Docker Mastery!

1. Test your local Docker environment:
   ```bash
   docker run --rm -d -p 80:80 --name graduation-check nginx:alpine && curl http://localhost && docker stop graduation-check
   ```
2. You are now equipped with senior-level Docker skills for backend engineering, microservices deployment, system architecture, and technical interviews!

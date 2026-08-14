# 🚀 Docker & DevOps Mastery Roadmap

Welcome to the **DevOps & Containerization Track**. This master guide takes you step-by-step from zero container knowledge to senior-level Docker & production container engineering.

---

## 🎯 Course Learning Pattern
For every topic, we follow a strict **7-step learning structure**:
1. 💡 **Concept**: Core principles explained simply without jargon.
2. 📐 **Visual Architecture**: Flowcharts, ASCII diagrams, and Mermaid diagrams.
3. 💻 **Real Commands**: Production-ready terminal commands to run on your machine.
4. 🔍 **Verification**: Commands to inspect and validate execution (`docker ps`, `curl`, `inspect`).
5. 💥 **Break It**: Intentionally breaking setups (e.g. `localhost` container networking bugs) to master real-world troubleshooting.
6. ❓ **Interview Q&A**: Real-world interview questions (Beginner → Intermediate → Senior).
7. 🏋️ **Mini Challenge**: Practical exercise to solidify hands-on skills.

---

## 🗺️ Roadmap Overview

| Level | Topic | Key Focus |
| :---: | :--- | :--- |
| **01** | [Level 1 — Docker Fundamentals](1_Docker/01-Docker-Fundamentals.md) | VMs vs Docker, Engine, Architecture, Registry, CLI |
| **02** | [Level 2 — Essential Docker Commands](1_Docker/02-Essential-Docker-Commands.md) | Lifecycle: `pull`, `run`, `ps`, `exec`, `stop`, `rm`, `rmi` |
| **03** | [Level 3 — Dockerfile Deep Dive](1_Docker/03-Dockerfile-Deep-Dive.md) | Spring Boot packaging, `CMD` vs `ENTRYPOINT`, Directives |
| **04** | [Level 4 — Docker Networking](1_Docker/04-Docker-Networking.md) | Bridge, Host, DNS resolution, Spring Boot to PostgreSQL connection |
| **05** | [Level 5 — Docker Volumes & Storage](1_Docker/05-Docker-Volumes-Storage.md) | Persistent storage, Volume vs Bind Mount, Data retention |
| **06** | [Level 6 — Docker Compose](1_Docker/06-Docker-Compose.md) | Multi-container orchestration (App + Postgres + Kafka) |
| **07** | [Level 7 — Docker + Spring Boot](1_Docker/07-Docker-SpringBoot.md) | End-to-end CRUD REST API containerization |
| **08** | [Level 8 — Multi-stage Builds](1_Docker/08-MultiStage-Builds.md) | JDK build stage → JRE runtime stage image shrink |
| **09** | [Level 9 — Docker Image Optimization](1_Docker/09-Docker-Image-Optimization.md) | Layer caching, Distroless, `.dockerignore`, size reduction |
| **10** | [Level 10 — Docker Security](1_Docker/10-Docker-Security.md) | Non-root users, secret management, image scanning, read-only FS |
| **11** | [Level 11 — Docker Internals ⭐](1_Docker/11-Docker-Internals.md) | Namespaces, cgroups, OverlayFS, `runc`, `containerd`, Linux kernel |
| **12** | [Level 12 — Docker Resource Management](1_Docker/12-Docker-Resource-Management.md) | CPU & Memory limits, OOM killer, `docker stats` |
| **13** | [Level 13 — Docker Health Checks](1_Docker/13-Docker-HealthChecks.md) | `HEALTHCHECK`, Process alive vs App healthy, Actuator integration |
| **14** | [Level 14 — Docker + Kafka ⭐](1_Docker/14-Docker-Kafka-Outbox.md) | Microservices, Kafka Producer/Consumer & Transactional Outbox |
| **15** | [Level 15 — Advanced & Production Docker](1_Docker/15-Advanced-Production-Docker.md) | Kubernetes relation, CI/CD pipelines, zero-downtime, restart policies |

---

## 🧪 Quick Hands-On Check

Run the following commands in your terminal right now to start Level 1:

```bash
# 1. Check Docker Version
docker --version

# 2. Inspect Docker Engine Info
docker info

# 3. Run your first container
docker run hello-world
```

### Mental Model: Image vs Container

```
    Dockerfile
        │ (docker build)
        ▼
   Docker Image  ────────► Class (Blueprint / Immutable Template)
        │ (docker run)
        ▼
 Docker Container ────────► Object (Running Instance / State)
```

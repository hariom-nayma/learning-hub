# Level 5 — Docker Volumes & Storage

---

## 1. 💡 Concept: Ephemeral vs Persistent Storage

By default, all files created inside a container are stored in a thin **ephemeral read-write container layer**. When the container is destroyed (`docker rm`), **all data inside that layer is deleted forever!**

To persist state (databases, file uploads, logs), Docker provides 3 storage mechanisms:

```
┌──────────────────────────────────────────────────────────────────┐
│                            Host Disk                             │
│                                                                  │
│  1. Docker Volume (/var/lib/docker/volumes/mydata/_data)          │
│     Managed by Docker Engine. Fully portable across OS.           │
│                                                                  │
│  2. Bind Mount (/Users/username/project/logs)                    │
│     Direct path on Host OS. Ideal for live dev code reloading.   │
│                                                                  │
│  3. tmpfs Mount (RAM / Memory)                                   │
│     Stored in host system memory only (never written to disk).   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. 📐 Storage Types Comparison Table

| Storage Type | Location | Managed By | Use Case |
| :--- | :--- | :--- | :--- |
| **Named Volume** | `/var/lib/docker/volumes/` | Docker CLI & Daemon | Databases (Postgres, MySQL), persistent production data |
| **Bind Mount** | Any absolute host path | User / Host filesystem | Source code live reload, host configs (`nginx.conf`) |
| **tmpfs Mount** | Host RAM | Operating System Kernel | High-security passwords, transient caches |

---

## 3. 💻 Practical Hands-On: Managing Volumes & Data Retention

```bash
# 1. Create a named Docker volume
docker volume create postgres-data

# 2. List & Inspect volumes
docker volume ls
docker volume inspect postgres-data

# 3. Run PostgreSQL container mounted to the named volume
docker run -d \
  --name db-persisted \
  -v postgres-data:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine

# 4. Connect to database and insert persistent record
docker exec -it db-persisted psql -U postgres -c "CREATE TABLE users(id INT, name TEXT); INSERT INTO users VALUES (1, 'Gaurav');"

# 5. Destroy the container completely!
docker stop db-persisted
docker rm db-persisted

# 6. Launch a BRAND NEW container using the EXACT SAME volume!
docker run -d \
  --name db-restored \
  -v postgres-data:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine

# 7. Verify data survived container destruction!
docker exec -it db-restored psql -U postgres -c "SELECT * FROM users;"
```

---

## 4. 💥 Break It (Troubleshooting)

### Scenario: Anonymous Volume Leaks

What happens when you run a database container without specifying volume volume name:
```bash
docker run -d postgres:16-alpine
```
Each time this command executes, Docker auto-generates an **Anonymous Volume** with a random 64-character hash (e.g. `c7b2a...`). When you delete the container, the anonymous volume remains orphaned on disk!

**Fix**: Always assign explicit Named Volumes (`-v my-db-data:/var/lib/postgresql/data`) or periodically clean orphaned volumes:
```bash
docker volume prune
```

---

## 5. ❓ Interview Questions

### Q1: What happens to data when a container is deleted?
> **Answer**: 
> * Any data written to the container's default writable layer is **permanently destroyed**.
> * Any data written to a **Named Volume** or **Bind Mount** remains intact on host disk and can be reattached to new containers.

### Q2: What is the difference between `-v` volume syntax and `--mount` syntax?
> **Answer**: `-v` (or `--volume`) is concise standalone syntax; if the host path or volume does not exist, `-v` silently creates it as a directory. `--mount` is explicit key-value syntax (`--mount type=volume,source=myvol,target=/app`); if source does not exist, `--mount` produces an explicit error, making it safer in production CI/CD scripts.

---

## 6. 🏋️ Mini Challenge

1. Create a host bind mount directory on your system: `/tmp/app-logs`.
2. Run an alpine container that appends timestamp logs every second to `/tmp/app-logs/out.log`.
3. Verify file contents directly from Host terminal using `cat /tmp/app-logs/out.log`.

<details>
<summary>🔍 Show Solution</summary>

```bash
# 1. Create directory
mkdir -p /tmp/app-logs

# 2. Run container mounting host directory
docker run -d --name log-producer \
  -v /tmp/app-logs:/logs \
  alpine sh -c 'while true; do date >> /logs/out.log; sleep 1; done'

# 3. Read host file directly
sleep 3
cat /tmp/app-logs/out.log

# Cleanup
docker stop log-producer && docker rm log-producer
```
</details>

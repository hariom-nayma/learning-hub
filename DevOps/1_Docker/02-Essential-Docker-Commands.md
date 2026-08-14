# Level 2 — Essential Docker Commands

---

## 1. 💡 Concept & Container Lifecycle

Managing Docker containers requires mastering commands across the 4 key stages of a container lifecycle:

```
  Registry (Docker Hub)
     │
     │ docker pull
     ▼
Image Store (Host Disk)
     │
     │ docker run / docker create
     ▼
Container Created (Stopped)
     │
     │ docker start
     ▼
Container Running (Active Process)
     │
     │ docker stop / docker kill
     ▼
Container Stopped
     │
     │ docker rm
     ▼
Container Destroyed
```

---

## 2. 📐 Comprehensive Command Reference Table

| Category | Command | Description |
| :--- | :--- | :--- |
| **Image Management** | `docker pull <image>` | Downloads an image from Docker Hub |
| | `docker images` | Lists all downloaded images on host |
| | `docker rmi <image_id>` | Deletes an image from local store |
| **Execution** | `docker run -d -p <host>:<container> --name <name> <image>` | Creates and starts a container detached |
| | `docker ps` | Lists currently running containers |
| | `docker ps -a` | Lists all containers (running & stopped) |
| **Lifecycle** | `docker stop <container>` | Sends `SIGTERM` gracefully, followed by `SIGKILL` if timeout |
| | `docker start <container>` | Starts a stopped container |
| | `docker restart <container>` | Stops and restarts container |
| | `docker rm <container>` | Deletes a stopped container |
| | `docker rm -f <container>` | Force removes a running container (`SIGKILL`) |
| **Inspection & Debug**| `docker logs -f <container>` | Streams live console stdout/stderr logs |
| | `docker exec -it <container> bash` | Opens an interactive terminal inside container |
| | `docker inspect <container>` | Returns detailed JSON metadata (IP, mounts, envs) |

---

## 3. 💻 Practical Hands-On Walkthrough

```bash
# 1. Pull PostgreSQL image
docker pull postgres:16-alpine

# 2. Run PostgreSQL container in background with environment variables
docker run -d \
  --name dev-postgres \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=testdb \
  -p 5432:5432 \
  postgres:16-alpine

# 3. Verify running container
docker ps

# 4. Stream container logs
docker logs dev-postgres

# 5. Execute psql interactive CLI inside the container
docker exec -it dev-postgres psql -U postgres -d testdb -c "SELECT version();"

# 6. Inspect IP address assigned to container
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' dev-postgres

# 7. Stop and clean up container
docker stop dev-postgres
docker rm dev-postgres
```

---

## 4. 💥 Break It (Troubleshooting)

### Scenario: Attempting to remove a running container (`docker rm`)

```bash
docker run -d --name busy-test alpine sleep 300
docker rm busy-test
```

**Expected Error Output**:
```text
Error response from daemon: You cannot remove a running container /busy-test. Stop the container before attempting removal or force remove
```

**Why it happens**: Docker safety check prevents accidental data/state destruction while process is active.

**Fix**:
Either stop then remove:
```bash
docker stop busy-test && docker rm busy-test
```
Or force remove (`SIGKILL`):
```bash
docker rm -f busy-test
```

---

## 5. ❓ Interview Questions

### Q1: What is the exact difference between `docker stop` and `docker kill`?
> **Answer**: 
> * `docker stop` sends `SIGTERM` signal to the main process inside the container (PID 1), giving the app grace period (default 10s) to close database connections and finish tasks. If process hasn't exited, it sends `SIGKILL`.
> * `docker kill` sends `SIGKILL` immediately, terminating process abruptly without cleanup.

### Q2: What is the difference between `docker rm` and `docker rmi`?
> **Answer**: 
> * `docker rm` removes **containers** (running or stopped instances).
> * `docker rmi` removes **images** (read-only blueprints stored on disk).

### Q3: What happens internally when `docker run` executes?
> **Answer**: 
> 1. Docker CLI contacts Docker Daemon API.
> 2. Daemon checks if image exists locally. If missing, calls `docker pull` from Registry.
> 3. Daemon creates isolated container filesystem (read-write layer over image layers).
> 4. Allocates network bridge IP interface and port mapping.
> 5. Launches process using `runc` and Linux `namespaces` + `cgroups`.

---

## 6. 🏋️ Mini Challenge

1. Run an interactive Ubuntu container: `docker run -it --name test-ubuntu ubuntu:latest bash`.
2. Inside container shell, create a file: `echo "Hello Docker" > /tmp/test.txt`.
3. Exit container shell (`exit`).
4. Start container again and verify file contents using `docker exec`.

<details>
<summary>🔍 Show Solution</summary>

```bash
# 1 & 2. Create container and write file
docker run -it --name test-ubuntu ubuntu:latest bash
# inside shell: echo "Hello Docker" > /tmp/test.txt && exit

# 4. Start container and read file
docker start test-ubuntu
docker exec test-ubuntu cat /tmp/test.txt
# Output: Hello Docker

# Cleanup
docker stop test-ubuntu && docker rm test-ubuntu
```
</details>

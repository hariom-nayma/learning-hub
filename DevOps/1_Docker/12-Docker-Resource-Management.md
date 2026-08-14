# Level 12 — Docker Resource Management

---

## 1. 💡 Concept: Resource Limits & OOM Killer

Without explicit resource boundaries, an unconstrained container can consume 100% of host CPU and RAM. When RAM is exhausted, the Linux Host Kernel triggers the **OOM (Out-Of-Memory) Killer**, which randomly terminates host processes to protect system stability!

Docker allows engineers to restrict CPU, Memory, and Swap allocations per container via cgroups.

---

## 2. 📐 Memory & CPU Limits Matrix

| CLI Flag | Resource | Description | Example |
| :--- | :--- | :--- | :--- |
| `--memory=` (or `-m`) | RAM Limit | Hard cap on RAM usage. Exceeding triggers OOM kill inside container. | `--memory=512m` |
| `--memory-swap=` | Total Memory + Swap | Total combined RAM + Disk Swap space. | `--memory-swap=1g` |
| `--cpus=` | CPU Cores | Number of fractional CPU cores container can use. | `--cpus=1.5` |
| `--cpu-shares` | Relative CPU Priority | Weight relative to other containers (Default: 1024). | `--cpu-shares=512` |

---

## 3. 💻 Practical Hands-On: Resource Monitoring & Testing

```bash
# 1. Monitor live real-time CPU/Memory stats across running containers
docker stats

# 2. Run container with 256MB RAM limit and 0.5 CPU core limit
docker run -d \
  --name memory-capped \
  --memory="256m" \
  --cpus="0.5" \
  nginx:alpine

# 3. Inspect cgroup resource allocation applied to container
docker inspect -f '{{.HostConfig.Memory}} | {{.HostConfig.NanoCpus}}' memory-capped
# Output: 268435456 | 500000000
```

---

## 4. 💥 Break It (Troubleshooting)

### Scenario: Triggering Container OOM Kill

Run a container capped at 64MB RAM and force it to allocate 128MB RAM:

```bash
docker run --rm -m 64m python:3.11-alpine python3 -c 'a = "A" * (128 * 1024 * 1024)'
```

**Expected Exit Code**: `137` (Fatal Error: Killed by OOM Killer).

```text
Command exited with status 137
```

**Exit Code 137 Explanation**:
Exit code `137` = `128 + 9` (`SIGKILL` signal 9 sent by Linux OS OOM killer due to exceeding cgroup memory boundary).

---

## 5. ❓ Interview Questions

### Q1: What does exit code 137 mean in Docker?
> **Answer**: Exit code 137 indicates the container process was forcibly killed by `SIGKILL` (signal 9). The most common cause is the Linux Kernel **Out-Of-Memory (OOM) Killer** terminating the container for exceeding its configured `--memory` limit.

### Q2: How do JVM options (`-Xmx`) interact with Docker memory limits?
> **Answer**: Prior to Java 10, JVM was unaware of cgroups limits and allocated heap based on host physical RAM, causing OOM kills. Modern Java (JDK 11+) automatically respects cgroup limits via `-XX:+UseContainerSupport` (enabled by default). Set `-XX:MaxRAMPercentage=75.0` to reserve 25% non-heap RAM for OS/metaspace.

---

## 6. 🏋️ Mini Challenge

Configure Docker Compose service `app` to:
1. Limit RAM to `512M` and reserve `256M`.
2. Limit CPU usage to `1.5` cores.

<details>
<summary>🔍 Show Solution</summary>

```yaml
services:
  app:
    image: myapp:1.0
    deploy:
      resources:
        limits:
          cpus: '1.5'
          memory: 512M
        reservations:
          memory: 256M
```
</details>

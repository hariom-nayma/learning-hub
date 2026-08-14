# Level 4 — Docker Networking

---

## 1. 💡 Concept & Network Drivers

By default, Docker isolates containers from each other and host network interfaces. Docker provides 4 built-in network drivers:

1. **Bridge (Default)**: Private virtual network switch (`docker0`) created inside Host OS. Containers get private IPs (e.g. `172.17.0.x`) and connect via NAT port mapping.
2. **Host**: Removes network isolation. Container shares host IP address directly (no `-p` port mapping needed).
3. **None**: Disables networking entirely (Loopback interface only).
4. **Overlay**: Connects multiple Docker daemons across cluster nodes (Docker Swarm / Multi-host).

---

## 2. 📐 Visual Architecture: Container Communication

```
                   Host Machine (e.g., IP: 192.168.1.50)
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                   Port Mapping (-p 8080:8080)                               │
│  Host Port 8080 ◄─────────────────────────────────────┐                     │
│                                                       │                     │
│               Custom Docker Bridge Network (app-net)  │                     │
│  ┌────────────────────────────────────────────────────┼──────────────────┐  │
│  │                                                    │                  │  │
│  │   ┌───────────────────────────┐        ┌───────────┴──────────────┐   │  │
│  │   │ Container: postgres       │        │ Container: springboot    │   │  │
│  │   │ IP: 172.18.0.2            │◄───────┤ IP: 172.18.0.3            │   │  │
│  │   │ DNS Alias: "postgres"     │  DNS   │ Target: "postgres:5432"  │   │  │
│  │   └───────────────────────────┘        └──────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 💥 The `localhost` Confusion (Crucial Concept!)

Why does connecting Spring Boot container to PostgreSQL using `jdbc:postgresql://localhost:5432/db` fail?

```
Spring Boot Container (Loopback = 127.0.0.1 inside ITS OWN container namespace)
        │
        ▼  jdbc://localhost:5432
      [X] Fails! (Looks for Postgres inside Spring Boot Container's loopback, not Postgres container!)
```

### The Fix: Custom Docker Network & DNS Resolution

In a user-defined custom bridge network, Docker automatically provides **Embedded DNS Resolution by Container Name**:

```
Spring Boot Container
        │
        ▼  jdbc://postgres-db:5432
[✅] Success! Docker DNS resolves "postgres-db" -> Container IP (172.18.0.2)
```

---

## 4. 💻 Practical Hands-On: Container-to-Container Connection

```bash
# 1. Create custom bridge network
docker network create backend-net

# 2. Start PostgreSQL container attached to custom network
docker run -d \
  --name postgres-db \
  --network backend-net \
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine

# 3. Start a client test container on the SAME network and ping by container name
docker run --rm \
  --network backend-net \
  alpine ping -c 3 postgres-db

# 4. Verify resolution using nslookup inside container
docker run --rm \
  --network backend-net \
  alpine nslookup postgres-db
```

---

## 5. 💥 Break It (Troubleshooting)

### Scenario: Inter-container DNS Failure on Default Bridge

Try running two containers on the **default bridge network** (without specifying `--network`):

```bash
docker run -d --name c1 alpine sleep 300
docker run -d --name c2 alpine sleep 300
docker exec c1 ping c2
```

**Expected Output**:
```text
ping: bad address 'c2'
```

**Why it fails**: Docker's **default bridge network** DOES NOT support automatic DNS resolution by container name (legacy default behavior). Only **User-Defined Networks** (`docker network create`) enable container name DNS!

---

## 6. ❓ Interview Questions

### Q1: What is the difference between default bridge network and user-defined bridge network?
> **Answer**: User-defined bridge networks provide:
> 1. Automatic DNS resolution between containers by container name.
> 2. Better isolation (containers outside the custom network cannot communicate).
> 3. Dynamic attach/detach of containers while running.

### Q2: When would you use `--net=host` driver?
> **Answer**: When application requires ultra-high network performance (zero NAT translation overhead) or needs to bind to a vast array of host ports dynamically (e.g. Media streaming/RTP protocols). Note: Host mode only works natively on Linux (not MacOS/Windows VM wrappers).

---

## 7. 🏋️ Mini Challenge

1. Create a custom network named `dev-net`.
2. Launch a Redis container named `my-redis` on `dev-net`.
3. Use `redis-cli` from an ephemeral alpine container to test connection to `my-redis`.

<details>
<summary>🔍 Show Solution</summary>

```bash
# 1. Create network
docker network create dev-net

# 2. Launch Redis container
docker run -d --name my-redis --network dev-net redis:alpine

# 3. Test CLI connection
docker run --rm -it --network dev-net redis:alpine redis-cli -h my-redis ping
# Output: PONG

# Cleanup
docker stop my-redis && docker rm my-redis && docker network rm dev-net
```
</details>

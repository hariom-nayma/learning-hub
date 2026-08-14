# Level 11 — Docker Internals ⭐ (Linux Kernel Magic)

---

## 1. 💡 Concept: Going from Docker User → Docker Engineer

Docker is not a hypervisor or virtualizer — **containers do not exist in the Linux kernel!**

A "container" is simply a standard Linux process isolated using 3 low-level Linux Kernel building blocks:
1. **Linux Namespaces**: Provides **isolation** (What the process can see).
2. **Control Groups (cgroups)**: Provides **resource limits** (What the process can use).
3. **Union Filesystems (OverlayFS)**: Provides **copy-on-write image layering**.

---

## 2. 📐 Visual Architecture: Low-Level Engine Architecture

```
                                    Docker CLI (`docker run`)
                                                │ REST API
                                    Docker Daemon (`dockerd`)
                                                │ gRPC
                                           containerd
                                                │
                                              runc (OCI Runtime)
                                                │
┌───────────────────────────────────────────────▼───────────────────────────────────────────────┐
│                                     Linux Kernel Features                                     │
│                                                                                               │
│    Namespaces (Isolation)           cgroups (Resource Limits)          OverlayFS (Storage)    │
│    ├── PID (Process IDs)            ├── CPU shares / quotas            ├── LowerDir (Image)   │
│    ├── NET (Interfaces/Ports)       ├── Memory limit / OOM             ├── UpperDir (Write)   │
│    ├── MNT (Mount points)           ├── Block I/O bandwidth            └── WorkDir / Merged   │
│    ├── IPC (Inter-process)          └── PID limits                                            │
│    └── UTS (Hostname)                                                                         │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 🔬 Deep Dive into the 3 Pillars

### Pillar 1: Linux Namespaces (Isolation)

Namespaces restrict what system resources a process can see:

| Namespace | Isolated Resource | Effect inside Container |
| :--- | :--- | :--- |
| **PID** | Process Trees | Container process thinks it is PID 1 on the system |
| **NET** | Network Devices & Ports | Has its own loopback (`127.0.0.1`), virtual interface, and routing table |
| **MNT** | File System Mount Points | Sees its own root filesystem (`/`) decoupled from Host filesystem |
| **IPC** | Shared Memory & Semaphores | Prevents inter-process memory snooping across containers |
| **UTS** | Hostname & NIS Domain | Container has isolated hostname (e.g. container short ID) |
| **USER**| User & Group IDs | Maps container root (`UID 0`) to unprivileged host user (`UID 10001`) |

---

### Pillar 2: Control Groups (cgroups v1 / v2)

`cgroups` control and restrict hardware resource allocations for processes:
* Prevents a rogue container from consuming 100% CPU or leaking RAM and crashing host OS (Out-Of-Memory Killer).
* Enforces hard limits: `memory.max`, `cpu.max`, `pids.max`.

---

### Pillar 3: OverlayFS (Union Filesystem)

OverlayFS combines multiple directories into a single unified filesystem view:

```
Merged View (/var/lib/docker/overlay2/merged) ◄── What Container Sees
      │
      ├── UpperDir (Read-Write Layer)         ◄── Container changes / additions
      │
      └── LowerDir (Read-Only Image Layers)   ◄── Base Image (Ubuntu/Alpine/JDK)
```

* **Copy-on-Write (CoW)**: When a container modifies an image file, OverlayFS copies the file from `LowerDir` (Read-Only) up to `UpperDir` (Read-Write) before editing it.

---

## 4. 💻 Practical Hands-On: Inspecting Linux Namespaces & cgroups

```bash
# 1. Start a background container
docker run -d --name kernel-demo alpine sleep 1000

# 2. Get the real Host PID of the container process
HOST_PID=$(docker inspect --format '{{.State.Pid}}' kernel-demo)
echo "Real Host PID of container: $HOST_PID"

# 3. View host process list (On host system, it is just a normal Linux process!)
ps aux | grep $HOST_PID

# 4. Inspect Linux Namespaces assigned to process (Linux Host)
ls -l /proc/$HOST_PID/ns

# 5. Inspect cgroup memory limits assigned by kernel
cat /sys/fs/cgroup/system.slice/docker-$HOST_PID.scope/memory.max 2>/dev/null || true
```

---

## 5. ❓ Interview Questions

### Q1: Explain how Docker containers achieve isolation without a Hypervisor.
> **Answer**: Docker relies on Linux Kernel **Namespaces** to isolate system resources (PID, NET, MNT, IPC, UTS, USER) so each process sees its own isolated view of the system, and **cgroups** to cap CPU, Memory, and I/O consumption.

### Q2: What is `runc` and `containerd`?
> **Answer**: 
> * **`containerd`**: A high-level container runtime daemon that manages image transfer, container lifecycle, network interfaces, and storage snapshotters.
> * **`runc`**: A low-level OCI-compliant CLI tool that directly interacts with Linux kernel syscalls (`clone`, `unshare`, `cgroups`) to spawn isolated processes.

### Q3: What is Copy-on-Write (CoW) in OverlayFS?
> **Answer**: Image layers are read-only (`LowerDir`). When a container writes or modifies a file belonging to an underlying image layer, OverlayFS copies that file into the container's writable layer (`UpperDir`) before applying edits, leaving the original base image untouched.

---

## 6. 🏋️ Mini Challenge

1. Run an alpine container that tries to fork infinite processes (`sh -c 'colon(){ colon|colon& };colon'`).
2. Limit the container's PID count using `--pids-limit=20` to prevent fork bomb from crashing host.

<details>
<summary>🔍 Show Solution</summary>

```bash
# Protected run with cgroup PID cap
docker run --rm --pids-limit=20 alpine sh -c 'while true; do sleep 100 & done'
# Kernel cgroups will block process creation once 20 PIDs are reached!
```
</details>

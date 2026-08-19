# 🗄️ Databases & Storage Systems (2+ YOE Technical Prep)

Backend and full-stack technical rounds for **2+ years experienced engineers** evaluate database storage engine internals, transactional isolation levels, lock contention, query optimization, sharding, and connection pool behavior under heavy concurrency.

---

## 🌳 Storage Engine Internals: B+ Tree vs LSM Tree

```mermaid
flowchart TD
    subgraph BTree ["B+ Tree (Read Optimized / Relational DBs - MySQL InnoDB, PostgreSQL)"]
        Root["Root Node (In RAM Page Cache)"] --> I1["Internal Node (B-Tree Index Block)"]
        Root --> I2["Internal Node (B-Tree Index Block)"]
        I1 --> L1["Leaf Page (Disk Block / Paged Data)"]
        I1 --> L2["Leaf Page (Disk Block / Paged Data)"]
        L1 <-->|Doubly Linked List for Range Scans| L2
    end
    
    subgraph LSM ["LSM Tree (Write Optimized / NoSQL DBs - Cassandra, RocksDB, ScyllaDB)"]
        W["Incoming Write Request"] --> WAL["Write-Ahead Log (Disk - Crash Recovery)"]
        W --> MT["MemTable (RAM - SkipList / Red-Black Tree)"]
        MT -->|Flushed when full| SST0["SSTable L0 (Sorted String Table - Disk)"]
        SST0 -->|Background Compaction| SST1["SSTable L1 (Disk)"]
    end
    
    style BTree fill:#181a24,stroke:#89b4fa,stroke-width:1px;
    style LSM fill:#181a24,stroke:#a6e3a1,stroke-width:1px;
```

### Architectural Comparison Matrix

| Dimension | B+ Tree (MySQL InnoDB, PostgreSQL) | LSM Tree (Cassandra, RocksDB, LevelDB) |
| :--- | :--- | :--- |
| **Write Strategy** | In-place random page updates (high write amplification, random I/O) | Sequential append-only writes to MemTable + WAL (low write latency) |
| **Read Latency** | Ultra-fast ($O(\log N)$ deterministic page lookup via index tree) | Slower (requires checking Bloom filters, MemTable, & multiple SSTable levels) |
| **Space Fragmentation**| Fragmented over time due to random page splits (~60-70% storage efficiency) | High density via background Tiered/Leveled Compaction |
| **Best Used For** | OLTP transactional systems with frequent mixed Read/Write workloads | Write-heavy telemetry, time-series, event logging, sensor data streams |

---

## 🔒 SQL Transaction Isolation Levels, MVCC & Lock Internals

### ANSI SQL Isolation Levels vs Concurrency Phenomena

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read | Engine Mechanism & Lock Overhead |
| :--- | :---: | :---: | :---: | :--- |
| **Read Uncommitted** | ❌ Allowed | ❌ Allowed | ❌ Allowed | No read locks; reads raw uncommitted dirty data |
| **Read Committed** *(Default in Postgres)* | 🛡️ Prevented | ❌ Allowed | ❌ Allowed | MVCC Read View generated **per SQL query** inside transaction |
| **Repeatable Read** *(Default in MySQL)* | 🛡️ Prevented | 🛡️ Prevented | 🛡️ Prevented *(In MySQL)* | MVCC Read View generated **at start of transaction** + Next-Key Locks |
| **Serializable** | 🛡️ Prevented | 🛡️ Prevented | 🛡️ Prevented | Strict Two-Phase Locking (2PL) or Serializable Snapshot Isolation (SSI) |

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ InnoDB MVCC Mechanisms                                                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ Every row in InnoDB has 3 hidden system fields:                                        │
│  1. DB_TRX_ID  : 6-byte transaction ID of the last transaction that inserted/updated it │
│  2. DB_ROLL_PTR: 7-byte pointer to the Undo Log record (for rolling back/historical read)│
│  3. DB_ROW_ID  : 6-byte auto-increment row ID (if no explicit primary key exists)      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### InnoDB Lock Types
1. **Record Lock**: Locks a specific index record (e.g. `SELECT * FROM users WHERE id = 10 FOR UPDATE;`).
2. **Gap Lock**: Locks the gap between index records (prevents insertions between values, mitigating phantom reads).
3. **Next-Key Lock**: Combination of Record Lock + Gap Lock on the index range `(prev_key, current_key]`.

---

## 🏗️ Distributed Storage, Sharding & Connection Pool Architecture

```
                               ┌─────────────────────────┐
                               │ Application Tier (Java) │
                               └────────────┬────────────┘
                                            │ HikariCP Connection Pool
                       ┌────────────────────┴────────────────────┐
                       ▼                                         ▼
            ┌────────────────────┐                    ┌────────────────────┐
            │   Database Node 0  │                    │   Database Node 1  │
            │  (Shards: 0 - 500) │                    │ (Shards: 501 - 1000)│
            └──────────┬─────────┘                    └──────────┬─────────┘
                       │ Async Replication                       │ Async Replication
                       ▼                                         ▼
            ┌────────────────────┐                    ┌────────────────────┐
            │ Read Replica Node  │                    │ Read Replica Node  │
            └────────────────────┘                    └────────────────────┘
```

### Key Production Parameters for HikariCP (Java)
- `maximumPoolSize`: Maximum connections in pool. Formula: `Connections = (CPU_cores * 2) + effective_spindle_count`.
- `minimumIdle`: Keep equal to `maximumPoolSize` in production to prevent connection allocation churn.
- `connectionTimeout`: Max ms client waits for a connection before throwing `SQLException` (e.g., `3000ms`).
- `leakDetectionThreshold`: Emits warning if a connection is held outside pool longer than threshold (e.g., `2000ms`).

---

## ❓ 2+ YOE Top Database Interview Questions & Gold-Standard Answers

### Question 1: How does MySQL InnoDB implement Multi-Version Concurrency Control (MVCC) and Undo Logs to achieve non-blocking reads?

> **Best Possible Answer**:
> *"InnoDB implements MVCC to allow readers and writers to operate concurrently without blocking each other. Each table row contains two hidden metadata fields: `DB_TRX_ID` (the transaction ID that last modified the row) and `DB_ROLL_PTR` (a pointer to the Undo Log entry containing the prior state of the row).*
>
> *When a transaction executes a `SELECT` query under `REPEATABLE READ` or `READ COMMITTED`, InnoDB builds a **Read View** consisting of:*
> *1. An array of transaction IDs active at the moment the Read View was created (`m_ids`).*
> *2. The minimum active transaction ID (`min_trx_id`).*
> *3. The next transaction ID to be assigned (`max_trx_id`).*
>
> *When reading a row, InnoDB compares the row's `DB_TRX_ID` against the Read View. If `DB_TRX_ID >= max_trx_id` or is present in `m_ids`, the row was modified by an uncommitted or newer transaction. InnoDB then traverses the `DB_ROLL_PTR` undo chain backward until it finds a snapshot version committed before the Read View's creation.*
>
> *The difference between isolation levels lies in Read View timing: `READ COMMITTED` creates a new Read View **before every statement**, whereas `REPEATABLE READ` creates a single Read View **at the start of the transaction** and reuses it throughout."*

#### 💡 Interviewer Follow-Up Question:
*"What happens if undo logs grow uncontrollably under long-running transactions?"*
> **Follow-Up Answer**: *"Long-running read transactions keep old Read Views active, preventing the InnoDB Purge Thread from reclaiming old undo log segments. This leads to **undo log bloat**, disk space exhaustion, increased buffer pool churn, and degraded performance as read queries traverse long undo chains. The mitigation is to enforce short transactions, configure `innodb_undo_log_truncate = ON`, and alert on long-running transactions."*

---

### Question 2: How do Next-Key Locks prevent Phantom Reads in MySQL `REPEATABLE READ` isolation level?

> **Best Possible Answer**:
> *"A **Phantom Read** occurs when Transaction A reads a set of rows matching a predicate, Transaction B inserts a new row matching that predicate and commits, and Transaction A re-executes the query, seeing 'phantom' rows that were not previously present.*
>
> *MySQL InnoDB prevents phantom reads under `REPEATABLE READ` using two complementary mechanisms:*
> *1. **Consistent Snapshot Reads (MVCC)**: For normal `SELECT` queries, the Read View ensures newly inserted rows committed by other transactions are invisible.*
> *2. **Next-Key Locking for Locking Reads**: For locking queries (`SELECT ... FOR UPDATE` or `SELECT ... LOCK IN SHARE MODE`), InnoDB uses Next-Key Locks, which combine a Record Lock on existing matching records with a **Gap Lock** on the range before and between records.*
>
> *For example, if an index has values `10` and `20`, executing `SELECT * FROM table WHERE id >= 10 FOR UPDATE;` locks record `10`, record `20`, AND the gaps `(-\infty, 10)`, `(10, 20)`, and `(20, +\infty)`. Any concurrent attempt by another transaction to `INSERT` a value like `15` will block on the gap lock until Transaction A commits, completely eliminating phantom reads."*

#### 💡 Interviewer Follow-Up Question:
*"Why do Gap Locks frequently cause Deadlocks under high concurrency?"*
> **Follow-Up Answer**: *"Gap locks are purely defensive—multiple transactions can hold overlapping Gap Locks on the same gap simultaneously. However, if Transaction A and Transaction B both hold a Gap Lock on `(10, 20)`, and then Transaction A tries to `INSERT` value `15`, it blocks waiting for Transaction B's Gap Lock to release. If Transaction B simultaneously tries to `INSERT` value `16`, it blocks waiting for Transaction A's Gap Lock. This creates a circular wait deadlock. In production, we resolve this by keeping transactions short, ordering updates consistently, or using `READ COMMITTED` isolation where Gap Locks are disabled except for foreign key and unique key checks."*

---

### Question 3: You observe intermittent `SQLTransientConnectionException: HikariPool-1 - Connection is not available, request timed out after 3000ms` in a Spring Boot application under peak traffic. How do you troubleshoot and resolve this?

> **Best Possible Answer**:
> *"This error indicates **Connection Pool Exhaustion**—all connections in HikariCP are checked out by active worker threads, and waiting threads timed out after 3000ms.*
>
> *My systematic troubleshooting process:*
> *1. **Differentiate Traffic Spike vs Leak**: Check HikariCP JMX/Micrometer metrics (`hikaricp.connections.active`, `hikaricp.connections.pending`). If active connections stay maxed out even after traffic drops, there is a connection leak.*
> *2. **Enable Hikari Leak Detection**: Set `spring.datasource.hikari.leak-detection-threshold=2000` (2 seconds). Hikari will log a stack trace pointing directly to the code holding a connection longer than 2 seconds.*
> *3. **Identify Blocking Operations inside Transactions**: A common antipattern in Java is wrapping external HTTP API calls, slow file I/O, or heavy CPU processing inside an `@Transactional` method. This holds the database connection open for the entire duration of the remote network call.*
> *4. **Tune Connection Pool & Sizing**: Ensure `maximumPoolSize` is calculated correctly. Increasing pool size arbitrarily often makes performance worse due to CPU context switching and disk spindle contention. Instead, separate long-running background tasks from OLTP web requests into dedicated thread pools and connection pools."*

#### 💡 Interviewer Follow-Up Question:
*"Should you set `minimumIdle` equal to `maximumPoolSize` in production HikariCP configurations?"*
> **Follow-Up Answer**: *"Yes, in production enterprise applications, `minimumIdle` should be equal to `maximumPoolSize` (Fixed-Size Pool). If `minimumIdle` is smaller, HikariCP dynamically creates and destroys physical TCP connections to the database under fluctuating load. Establishing a database TCP connection (including handshake, authentication, and backend session initialization) is expensive ($10\text{--}50\text{ms}$). A fixed-size pool eliminates connection establishment overhead during traffic spikes."*

---

### Question 4: How do you achieve Zero-Downtime Migration when sharding an existing monolithic SQL table into multiple database nodes?

> **Best Possible Answer**:
> *"To shard a monolithic table with zero downtime, I follow the **4-Phase Expand-Contract Migration Pattern** powered by Dual Writing and Change Data Capture (CDC):*
>
> *1. **Phase 1: Deploy Dual-Write Abstraction (Shadow Write)**:*
>    - *Update application logic to write primary data to the monolithic legacy database AND asynchronously write to the new sharded database cluster (via Kafka or background executor).*
>    - *All reads continue to hit the legacy monolithic database.*
>
> *2. **Phase 2: Historical Data Backfill (CDC / Batch ETL)**:*
>    - *Run a background migration script or Debezium CDC pipeline to copy historical records from legacy DB to sharded cluster.*
>    - *Use idempotent upserts (`ON DUPLICATE KEY UPDATE` / `UPSERT`) so backfill does not overwrite newer dual-written records.*
>
> *3. **Phase 3: Verification & Shadow Reads (Validation Phase)**:*
>    - *Execute shadow reads in the application: query both legacy DB and sharded cluster, asynchronously compare result sets for mismatch metrics without blocking response, and log discrepancies.*
>
> *4. **Phase 4: Cutover & Deprecate (Dark Launch)**:*
>    - *Flip feature flag to route primary reads to the new sharded cluster.*
>    - *Maintain back-writes to legacy DB for 48 hours for instant rollback safety.*
>    - *Once verified stable, remove legacy writes and decommission legacy table."*

#### 💡 Interviewer Follow-Up Question:
*"How do you handle cross-shard queries and transactions after sharding?"*
> **Follow-Up Answer**: *"Cross-shard queries are expensive because they require scatter-gather logic across all shard nodes. We mitigate this by carefully choosing a **Shard Key** aligned with access patterns (e.g. `tenant_id` or `user_id`) so 95%+ of queries map to a single shard. For cross-shard transactions, we avoid Distributed 2-Phase Commit (2PC) due to high lock latency and instead use **Saga Pattern** or **Transactional Outbox Pattern** with eventual consistency."*

# Level 8 — Multi-Stage Builds

---

## 1. 💡 Concept: Why Multi-Stage Builds Matter

Single-stage Dockerfiles bundle full SDK compilers (Maven, JDK, gcc, npm) into final production images, causing massive image size bloat (**800MB–1.5GB**) and introducing unnecessary security vulnerability surfaces.

**Multi-Stage Builds** allow you to use multiple `FROM` instructions in a single Dockerfile. You can compile artifacts in an early stage (Build Stage) and copy ONLY the compiled binary (`.jar`, compiled JS) into a tiny, secure runtime image (Runtime Stage).

---

## 2. 📐 Visual Architecture Comparison

```
Single-Stage Build (Bloated Image ~900MB)
┌───────────────────────────────────────────────────────────┐
│ Maven SDK + JDK + Source Code + Tests + Target .jar        │
└───────────────────────────────────────────────────────────┘

Multi-Stage Build (Minimal Runtime Image ~150MB)
┌───────────────────────────────────────────┐
│ Stage 1: Build (maven:3.9-eclipse-temurin)│ ──► Compiles app.jar
└─────────────────────┬─────────────────────┘
                      │ COPY --from=builder /app/target/app.jar .
┌─────────────────────▼─────────────────────┐
│ Stage 2: Runtime (eclipse-temurin:21-jre) │ ──► Final Production Image
└───────────────────────────────────────────┘
```

---

## 3. 💻 Dockerfile Comparison

### Bad: Single-Stage Dockerfile (Heavy Image)
```dockerfile
FROM maven:3.9-eclipse-temurin-21

WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "target/app.jar"]
```

---

### Better: Production Multi-Stage Dockerfile
```dockerfile
# ==========================================
# Stage 1: Compile & Build Application JAR
# ==========================================
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copy dependency definition first (reuses layer cache!)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# Stage 2: Lightweight Runtime JRE Image
# ==========================================
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Security: Create non-root system user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy ONLY compiled JAR artifact from Stage 1
COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 4. 📊 Size Comparison Results

| Image Type | Base SDK | Final Image Size | Vulnerability Count |
| :--- | :--- | :--- | :--- |
| **Single-Stage** | `maven:3.9-eclipse-temurin-21` | **890 MB** | High (Compiler, bash, dev tools) |
| **Multi-Stage** | `eclipse-temurin:21-jre-alpine` | **165 MB** | Extremely Low (Minimal JRE) |
| **Distroless Multi-Stage** | `gcr.io/distroless/java21` | **120 MB** | Near Zero (No shell) |

---

## 5. 💥 Break It (Troubleshooting)

### Scenario: Forgetting layer cache optimization in build stage

```dockerfile
# Flawed Layer Ordering
FROM maven:3.9-alpine AS builder
WORKDIR /app
COPY . .  # Copying entire source BEFORE dependency download!
RUN mvn package
```

**Why it fails**: Every minor source code edit invalidates `COPY . .` layer. Docker is forced to re-download all 300MB Maven dependencies from central repo on EVERY build, wasting build time!

**Fix**: Copy `pom.xml` first and run `mvn dependency:go-offline` before copying `src/`.

---

## 6. ❓ Interview Questions

### Q1: What is the main advantage of Multi-stage Docker builds?
> **Answer**: 
> 1. **Dramatically smaller image size**: Keeps heavy compilers out of final image.
> 2. **Enhanced Security**: Decreases attack surface by excluding build tools, package managers, and shell utilities.
> 3. **Simplified CI/CD**: Build and packaging executed entirely inside Docker without requiring Maven/Gradle installed on host CI agent.

### Q2: How do you copy files from a specific stage in a Multi-stage build?
> **Answer**: By using `COPY --from=<stage_name_or_index> <source_path> <dest_path>`.

---

## 7. 🏋️ Mini Challenge

Write a Multi-Stage Dockerfile for a React / Vue frontend app:
1. Stage 1 (`build`): Use `node:20-alpine`, copy `package.json`, install deps, run `npm run build`.
2. Stage 2 (`runtime`): Use `nginx:alpine`, copy built dist files from stage 1 (`/app/dist`) into Nginx public directory (`/usr/share/nginx/html`).

<details>
<summary>🔍 Show Solution</summary>

```dockerfile
# Stage 1
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
</details>

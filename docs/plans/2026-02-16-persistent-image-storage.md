# Persistent Property Image Storage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make property images persist on the host filesystem so they survive Docker container deletion in both local and production environments.

**Architecture:** Replace Docker named volumes with bind mounts to `./data/uploads/` directory. Both local and production docker-compose files will mount the same relative path, ensuring consistent behavior across environments.

**Tech Stack:** Docker Compose, Git

---

## Task 1: Create Host Directory Structure

**Files:**
- Create: `data/uploads/properties/.gitkeep`

**Step 1: Create the directory structure**

```bash
mkdir -p data/uploads/properties
```

**Step 2: Add .gitkeep to track empty directory**

Create file `data/uploads/properties/.gitkeep` with empty content (this ensures Git tracks the directory structure).

**Step 3: Verify structure exists**

Run: `ls -la data/uploads/properties/`
Expected: Shows `.gitkeep` file

**Step 4: Commit**

```bash
git add data/uploads/properties/.gitkeep
git commit -m "chore: add persistent uploads directory structure"
```

---

## Task 2: Update .gitignore

**Files:**
- Modify: `.gitignore`

**Step 1: Read current .gitignore**

Check the current contents to find the right place to add the new entry.

**Step 2: Add data directory exclusion**

Add these lines to `.gitignore`:

```
# Persistent data (uploads, etc.) - keep structure, ignore contents
data/**
!data/
!data/uploads/
!data/uploads/properties/
!data/uploads/properties/.gitkeep
```

This pattern:
- Ignores everything in `data/`
- But keeps the directory structure
- And keeps the `.gitkeep` file

**Step 3: Verify gitignore works**

Run: `git status`
Expected: Only `.gitignore` shows as modified, no `data/` files except the `.gitkeep`

**Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: add data directory to gitignore with structure preservation"
```

---

## Task 3: Update Local Docker Compose

**Files:**
- Modify: `docker-compose.yml`

**Step 1: Read current docker-compose.yml**

Verify current backend volumes configuration.

**Step 2: Add uploads bind mount to backend service**

Add this line to the `backend.volumes` section:

```yaml
- ./data/uploads:/app/uploads
```

The full volumes section should be:

```yaml
volumes:
  - ./backend/src:/app/src
  - ./backend/test:/app/test
  - ./backend/package.json:/app/package.json
  - ./backend/tsconfig.json:/app/tsconfig.json
  - ./backend/.env:/app/.env
  - ./data/uploads:/app/uploads
```

**Step 3: Verify syntax**

Run: `docker-compose config`
Expected: Valid YAML output with no errors

**Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add persistent uploads volume to local docker-compose"
```

---

## Task 4: Update Production Docker Compose

**Files:**
- Modify: `docker-compose.prod.yml`

**Step 1: Read current docker-compose.prod.yml**

Verify current backend and nginx volumes, and the named volumes declaration.

**Step 2: Change backend volume from named to bind mount**

Change in `backend.volumes`:

From:
```yaml
volumes:
  - uploads:/app/uploads
```

To:
```yaml
volumes:
  - ./data/uploads:/app/uploads
```

**Step 3: Change nginx volume from named to bind mount**

Change in `nginx.volumes`:

From:
```yaml
volumes:
  - uploads:/app/uploads:ro
  - certbot-conf:/etc/letsencrypt
  - certbot-www:/var/www/certbot
```

To:
```yaml
volumes:
  - ./data/uploads:/app/uploads:ro
  - certbot-conf:/etc/letsencrypt
  - certbot-www:/var/www/certbot
```

**Step 4: Remove uploads from named volumes declaration**

Change the `volumes:` section at the bottom:

From:
```yaml
volumes:
  postgres-data:
  uploads:
  certbot-conf:
  certbot-www:
```

To:
```yaml
volumes:
  postgres-data:
  certbot-conf:
  certbot-www:
```

**Step 5: Verify syntax**

Run: `docker-compose -f docker-compose.prod.yml config`
Expected: Valid YAML output with no errors, no `uploads:` named volume

**Step 6: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat: switch production uploads to persistent bind mount"
```

---

## Task 5: Update Documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Read current CLAUDE.md**

Find appropriate section to add storage documentation.

**Step 2: Add Persistent Storage section**

Add this section after the "Assets" section:

```markdown
### Persistent Storage
User-uploaded files (property images) are stored in `data/uploads/` which is bind-mounted into Docker containers. This directory:
- Persists across container restarts and deletions
- Survives `docker-compose down -v` and `docker volume prune`
- Should be backed up regularly in production

**Directory structure:**
- `data/uploads/properties/` - Property images

**Migration:** If upgrading from named Docker volumes, copy existing images:
```bash
docker cp alisa-backend:/app/uploads ./data/
```
```

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add persistent storage documentation to CLAUDE.md"
```

---

## Task 6: Test Local Environment

**Step 1: Rebuild and start containers**

Run: `docker-compose down && docker-compose up -d`

**Step 2: Verify mount is active**

Run: `docker exec alisa-backend ls -la /app/uploads/properties/`
Expected: Shows the directory (may be empty or have `.gitkeep`)

**Step 3: Create a test file inside container**

Run: `docker exec alisa-backend touch /app/uploads/properties/test-persistence.txt`

**Step 4: Verify file appears on host**

Run: `ls -la data/uploads/properties/`
Expected: Shows `test-persistence.txt`

**Step 5: Delete container and verify persistence**

Run: `docker-compose down -v`
Run: `ls -la data/uploads/properties/`
Expected: `test-persistence.txt` still exists

**Step 6: Clean up test file**

Run: `rm data/uploads/properties/test-persistence.txt`

**Step 7: Restart containers**

Run: `docker-compose up -d`

---

## Summary of Changes

| File | Change |
|------|--------|
| `data/uploads/properties/.gitkeep` | Created - directory structure |
| `.gitignore` | Added - ignore uploads content, keep structure |
| `docker-compose.yml` | Added - bind mount for uploads |
| `docker-compose.prod.yml` | Changed - bind mount instead of named volume |
| `CLAUDE.md` | Added - persistent storage documentation |

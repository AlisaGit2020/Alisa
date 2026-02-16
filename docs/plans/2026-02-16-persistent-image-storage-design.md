# Persistent Property Image Storage

**Date:** 2026-02-16
**Status:** Approved

## Problem

Property images are lost when Docker containers are deeply deleted:
- **Local development:** No volume mapping exists; images stored inside container filesystem
- **Production:** Named Docker volume can be deleted with `docker-compose down -v` or `docker volume prune`

## Solution

Use bind mounts to a host directory (`./data/uploads/`) that persists independently of Docker volume management.

## Design

### Directory Structure

```
Alisa/
├── data/
│   └── uploads/
│       └── properties/    # Property images
├── backend/
├── frontend/
├── docker-compose.yml
└── docker-compose.prod.yml
```

### Changes Required

#### 1. Docker Compose - Local (`docker-compose.yml`)

Add bind mount to backend service:

```yaml
backend:
  volumes:
    - ./backend/src:/app/src
    - ./backend/test:/app/test
    - ./backend/package.json:/app/package.json
    - ./backend/tsconfig.json:/app/tsconfig.json
    - ./backend/.env:/app/.env
    - ./data/uploads:/app/uploads  # NEW: Persistent uploads
```

#### 2. Docker Compose - Production (`docker-compose.prod.yml`)

Change from named volume to bind mount:

```yaml
backend:
  volumes:
    - ./data/uploads:/app/uploads  # Changed from named volume

nginx:
  volumes:
    - ./data/uploads:/app/uploads:ro  # Changed from named volume
    - certbot-conf:/etc/letsencrypt
    - certbot-www:/var/www/certbot

volumes:
  postgres-data:
  certbot-conf:
  certbot-www:
  # uploads: REMOVED
```

#### 3. Git Configuration

Add to `.gitignore`:
```
data/
```

#### 4. Directory Structure

Create directory with `.gitkeep`:
```
data/uploads/properties/.gitkeep
```

### Benefits

| Aspect | Benefit |
|--------|---------|
| Persistence | Survives `docker-compose down -v` and `docker volume prune` |
| Consistency | Same relative path for both environments |
| Backup | Easy to backup `./data/` folder |
| Platform | Works on macOS (local) and Linux (production) |

### Migration (Production)

If images exist in the current named volume, copy them before switching:

```bash
# On production server, before deploying new docker-compose
docker cp alisa-backend:/app/uploads ./data/
```

### Data Flow

```
Upload Request
    ↓
Backend writes to /app/uploads/properties/
    ↓
Bind mount syncs to host ./data/uploads/properties/
    ↓
Host filesystem (persistent)
```

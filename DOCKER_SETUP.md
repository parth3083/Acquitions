# Docker Setup Guide for Acquisitions Application

This guide explains how to run the Acquisitions application with Docker, supporting both **development** (with Neon Local) and **production** (with Neon Cloud Database) environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Development Setup (Neon Local)](#development-setup-neon-local)
4. [Production Setup (Neon Cloud)](#production-setup-neon-cloud)
5. [Database Migrations](#database-migrations)
6. [Troubleshooting](#troubleshooting)
7. [Environment Variables Reference](#environment-variables-reference)

---

## Prerequisites

### Required Software
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Node.js**: Version 20 or higher (for local development without Docker)

### Neon Account Setup
1. Create a [Neon account](https://console.neon.tech)
2. Create a new project
3. Get your credentials from the Neon Console:
   - **NEON_API_KEY**: Navigate to Account Settings → API Keys
   - **NEON_PROJECT_ID**: Found under Project Settings → General
   - **PARENT_BRANCH_ID**: Your main branch ID (usually `main` or `br-xxx`)

---

## Architecture Overview

### Development Environment
```
┌─────────────────────────────────────────┐
│         Docker Network                   │
│                                          │
│  ┌──────────────┐    ┌───────────────┐ │
│  │              │    │               │ │
│  │   App        │───▶│  Neon Local   │ │
│  │  Container   │    │    Proxy      │ │
│  │              │    │               │ │
│  └──────────────┘    └───────┬───────┘ │
│                              │          │
└──────────────────────────────┼──────────┘
                               │
                               ▼
                    Neon Cloud (Ephemeral Branch)
```

**Key Features:**
- Neon Local creates ephemeral branches for each container lifecycle
- Fresh database state on every restart
- Automatic cleanup when container stops
- Perfect for development and testing

### Production Environment
```
┌─────────────────┐
│                 │
│   App           │
│  Container      │
│                 │
└────────┬────────┘
         │
         ▼
  Neon Cloud Database
  (Production Branch)
```

**Key Features:**
- Direct connection to Neon Cloud
- Persistent production database
- No local proxy overhead
- Secure connection with SSL

---

## Development Setup (Neon Local)

### Step 1: Configure Environment Variables

1. Copy the development environment template:
   ```bash
   cp .env.development .env.development.local
   ```

2. Edit `.env.development` and add your Neon credentials:
   ```bash
   NEON_API_KEY=your_actual_neon_api_key
   NEON_PROJECT_ID=your_actual_project_id
   PARENT_BRANCH_ID=main
   
   # Update other secrets
   JWT_SECRET=your_random_secret_here
   COOKIE_SECRET=your_random_cookie_secret
   ARCJET_KEY=your_arcjet_key
   ```

### Step 2: Start Development Environment

Run the application with Neon Local:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

**What happens:**
1. Docker builds your application image
2. Neon Local container starts and creates an ephemeral branch
3. Application connects to the local proxy at `postgres://neon:npg@neon-local:5432/neondb`
4. Neon Local routes queries to your ephemeral Neon branch

### Step 3: Access the Application

- **Application**: http://localhost:3000
- **Neon Local Proxy**: localhost:5432
- **Logs**: Check `./logs` directory

### Step 4: Run Database Migrations

If you need to run migrations in development:

```bash
# Enter the app container
docker-compose -f docker-compose.dev.yml exec app sh

# Run migrations
npm run db:generate
npm run db:migrate

# Or open Drizzle Studio
npm run db:studio
```

### Step 5: Stop Development Environment

```bash
docker-compose -f docker-compose.dev.yml down
```

**Note:** The ephemeral branch is automatically deleted when containers stop.

---

## Production Setup (Neon Cloud)

### Step 1: Get Production Database URL

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Choose your **production branch** (e.g., `main`)
4. Copy the connection string (Postgres format)
   - Format: `postgres://[user]:[password]@[host]/[db]?sslmode=require`

### Step 2: Configure Production Environment

1. Create `.env.production`:
   ```bash
   NODE_ENV=production
   PORT=3000
   
   # Your actual Neon production database URL
   DATABASE_URL=postgres://user:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
   
   # Strong production secrets (use random generators)
   JWT_SECRET=use_a_strong_random_secret_minimum_32_chars
   JWT_EXPIRES_IN=7d
   COOKIE_SECRET=use_a_strong_random_cookie_secret
   ARCJET_KEY=your_production_arcjet_key
   
   LOG_LEVEL=info
   ```

2. **Security Best Practices:**
   - Never commit `.env.production` to version control
   - Use different secrets for production vs. development
   - Use strong, randomly generated secrets (min. 32 characters)
   - Rotate secrets regularly

### Step 3: Run Migrations (One-time)

Before starting the production container, run migrations:

```bash
# Build the image
docker-compose -f docker-compose.prod.yml build

# Run migrations in a temporary container
docker-compose -f docker-compose.prod.yml run --rm app npm run db:migrate
```

### Step 4: Start Production Environment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

The application will:
1. Start in production mode
2. Connect directly to your Neon Cloud database
3. Run with optimized settings for production
4. Restart automatically if it crashes

### Step 5: Monitor Production

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Check container status
docker-compose -f docker-compose.prod.yml ps

# View health status
docker inspect acquitions-app-prod --format='{{.State.Health.Status}}'
```

### Step 6: Stop Production

```bash
docker-compose -f docker-compose.prod.yml down
```

---

## Database Migrations

### Development (with Neon Local)

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Generate migration from schema changes
docker-compose -f docker-compose.dev.yml exec app npm run db:generate

# Apply migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open Drizzle Studio to view data
docker-compose -f docker-compose.dev.yml exec app npm run db:studio
```

### Production

```bash
# Generate migrations locally (after schema changes)
npm run db:generate

# Test migrations in development first
docker-compose -f docker-compose.dev.yml run --rm app npm run db:migrate

# Apply to production
docker-compose -f docker-compose.prod.yml run --rm app npm run db:migrate
```

---

## Troubleshooting

### Issue: Cannot connect to Neon Local

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
1. Check if Neon Local container is running:
   ```bash
   docker-compose -f docker-compose.dev.yml ps
   ```

2. Verify Neon credentials are correct in `.env.development`

3. Check Neon Local logs:
   ```bash
   docker-compose -f docker-compose.dev.yml logs neon-local
   ```

### Issue: Self-signed certificate error (Neon Local)

**Symptoms:**
```
Error: self signed certificate in certificate chain
```

**Solution:**
Update your database configuration to accept self-signed certificates. Edit `src/config/database.js`:

```javascript
import 'dotenv/config';
import {neon} from '@neondatabase/serverless';
import {drizzle} from 'drizzle-orm/neon-http';

// Configure for Neon Local (development)
const neonConfig = {
  fetchEndpoint: process.env.NODE_ENV === 'development' 
    ? 'http://neon-local:5432/sql' 
    : undefined,
  useSecureWebSocket: process.env.NODE_ENV !== 'development',
  poolQueryViaFetch: true
};

const sql = neon(process.env.DATABASE_URL, neonConfig);
const db = drizzle(sql);

export {db, sql};
```

### Issue: Port 5432 already in use

**Symptoms:**
```
Error: bind: address already in use
```

**Solution:**
1. Stop local PostgreSQL:
   ```bash
   # Windows
   net stop postgresql-x64-XX
   
   # Or change the port in docker-compose.dev.yml
   ports:
     - "5433:5432"  # Use 5433 on host
   ```

2. Update DATABASE_URL if you changed the port

### Issue: App cannot connect in Docker network

**Solution:**
- Use service name instead of `localhost`: `neon-local` not `localhost`
- Ensure both services are on the same network
- Check `docker-compose` network configuration

### Issue: Production database connection timeout

**Solutions:**
1. Verify DATABASE_URL format includes `?sslmode=require`
2. Check Neon Console for database status
3. Ensure firewall allows outbound connections to Neon (TCP 5432)
4. Verify credentials haven't expired

---

## Environment Variables Reference

### Common Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Application port | `3000` |
| `DATABASE_URL` | Database connection string | See below |
| `JWT_SECRET` | JWT signing secret | Random 32+ char string |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `COOKIE_SECRET` | Cookie encryption secret | Random 32+ char string |
| `ARCJET_KEY` | ArcJet security key | From ArcJet dashboard |

### Development Only (Neon Local)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEON_API_KEY` | Neon API key | Yes | N/A |
| `NEON_PROJECT_ID` | Neon project ID | Yes | N/A |
| `PARENT_BRANCH_ID` | Branch to fork from | No | `main` |

### DATABASE_URL Format

**Development (Neon Local):**
```
postgres://neon:npg@neon-local:5432/neondb?sslmode=require
```

**Production (Neon Cloud):**
```
postgres://[user]:[password]@ep-xxxxx.region.aws.neon.tech/[dbname]?sslmode=require
```

---

## Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Neon Local GitHub](https://github.com/neondatabase-labs/neon_local)
- [Docker Documentation](https://docs.docker.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

---

## Quick Reference Commands

### Development
```bash
# Start
docker-compose -f docker-compose.dev.yml up --build

# Stop
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Run migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open shell
docker-compose -f docker-compose.dev.yml exec app sh
```

### Production
```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# Stop
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Run migrations
docker-compose -f docker-compose.prod.yml run --rm app npm run db:migrate
```

---

## License

See project LICENSE file.

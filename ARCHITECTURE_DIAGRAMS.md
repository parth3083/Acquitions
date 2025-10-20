# 📊 Docker Architecture Diagrams

## Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT MODE                             │
│                                                                      │
│  Developer Machine                                                   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    Docker Network                           │   │
│  │                                                             │   │
│  │  ┌──────────────────────┐      ┌─────────────────────┐   │   │
│  │  │   App Container      │      │   Neon Local        │   │   │
│  │  │                      │      │   Proxy             │   │   │
│  │  │  - Node.js App       │─────▶│                     │   │   │
│  │  │  - Port 3000         │      │   - Port 5432       │   │   │
│  │  │  - Hot Reload        │      │   - Ephemeral       │   │   │
│  │  │                      │      │     Branching       │   │   │
│  │  │  ENV:                │      │                     │   │   │
│  │  │  - NODE_ENV=dev      │      │   ENV:              │   │   │
│  │  │  - DATABASE_URL      │      │   - NEON_API_KEY    │   │   │
│  │  │    =neon-local:5432  │      │   - PROJECT_ID      │   │   │
│  │  └──────────────────────┘      │   - PARENT_BRANCH   │   │   │
│  │                                 └──────────┬──────────┘   │   │
│  │                                            │              │   │
│  └────────────────────────────────────────────┼──────────────┘   │
│                                               │                  │
└───────────────────────────────────────────────┼──────────────────┘
                                                │
                                                │ HTTPS
                                                │
                    ┌───────────────────────────▼────────────────┐
                    │         Neon Cloud                         │
                    │                                            │
                    │  ┌─────────────────────────────────────┐  │
                    │  │  Ephemeral Branch (auto-created)    │  │
                    │  │  - Fresh on container start         │  │
                    │  │  - Auto-deleted on stop             │  │
                    │  │  - Isolated for testing             │  │
                    │  └─────────────────────────────────────┘  │
                    │                                            │
                    └────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION MODE                               │
│                                                                      │
│  Cloud Platform (AWS/GCP/Azure/etc.)                                │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  ┌──────────────────────┐                                 │   │
│  │  │   App Container      │                                 │   │
│  │  │                      │                                 │   │
│  │  │  - Node.js App       │                                 │   │
│  │  │  - Port 3000         │                                 │   │
│  │  │  - Production Build  │                                 │   │
│  │  │                      │                                 │   │
│  │  │  ENV (from secrets): │                                 │   │
│  │  │  - NODE_ENV=prod     │                                 │   │
│  │  │  - DATABASE_URL      │                                 │   │
│  │  │    =ep-xxx.neon.tech │                                 │   │
│  │  │  - JWT_SECRET        │                                 │   │
│  │  │  - COOKIE_SECRET     │                                 │   │
│  │  └──────────┬───────────┘                                 │   │
│  │             │                                             │   │
│  └─────────────┼─────────────────────────────────────────────┘   │
│                │                                                  │
└────────────────┼──────────────────────────────────────────────────┘
                 │
                 │ HTTPS/SSL
                 │
    ┌────────────▼────────────────────────────────────┐
    │         Neon Cloud Database                     │
    │                                                  │
    │  ┌───────────────────────────────────────────┐  │
    │  │  Production Branch (main)                 │  │
    │  │  - Persistent data                        │  │
    │  │  - Auto-scaling                           │  │
    │  │  - High availability                      │  │
    │  │  - Automatic backups                      │  │
    │  └───────────────────────────────────────────┘  │
    │                                                  │
    └──────────────────────────────────────────────────┘
```

---

## Environment Configuration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Configuration Flow                           │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  .env.example    │  ← Template file (committed to git)
└────────┬─────────┘
         │
         │ Copy and configure
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│ .env.development │ │ .env.staging │ │ .env.production│
│                  │ │              │ │                │
│ - Neon Local     │ │ - Neon Cloud │ │ - Neon Cloud   │
│ - Dev secrets    │ │ - Test data  │ │ - Prod secrets │
└────────┬─────────┘ └──────┬───────┘ └──────┬─────────┘
         │                  │                 │
         │                  │                 │
         ▼                  ▼                 ▼
┌──────────────────────────────────────────────────────┐
│         docker-compose.{env}.yml                     │
│                                                      │
│  Loads appropriate .env file                        │
│  Configures services                                │
│  Sets up networking                                 │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│         src/config/database.js                       │
│                                                      │
│  if (NODE_ENV === 'development') {                  │
│    // Configure Neon Local proxy                    │
│    neonConfig.fetchEndpoint =                       │
│      'http://neon-local:5432/sql'                   │
│  } else {                                            │
│    // Use Neon Cloud directly                       │
│  }                                                   │
└──────────────────────────────────────────────────────┘
```

---

## Docker Compose Services

### Development (`docker-compose.dev.yml`)

```
┌────────────────────────────────────────────────┐
│           Development Services                  │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │  Service: neon-local                 │     │
│  │  Image: neondatabase/neon_local      │     │
│  │  Port: 5432                          │     │
│  │  Volumes:                            │     │
│  │    - .neon_local (metadata)          │     │
│  │    - .git/HEAD (git integration)     │     │
│  │  Health Check: pg_isready           │     │
│  └──────────────────────────────────────┘     │
│                    ▲                           │
│                    │ depends_on                │
│                    │ (waits for healthy)       │
│  ┌──────────────────────────────────────┐     │
│  │  Service: app                        │     │
│  │  Build: Dockerfile                   │     │
│  │  Port: 3000                          │     │
│  │  Volumes:                            │     │
│  │    - ./src:/app/src (hot-reload)    │     │
│  │    - ./logs:/app/logs               │     │
│  │  Command: node --watch src/index.js │     │
│  │  Env: .env.development              │     │
│  └──────────────────────────────────────┘     │
│                                                │
└────────────────────────────────────────────────┘
```

### Production (`docker-compose.prod.yml`)

```
┌────────────────────────────────────────────────┐
│           Production Services                   │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │  Service: app                        │     │
│  │  Build: Dockerfile                   │     │
│  │  Port: 3000                          │     │
│  │  Volumes:                            │     │
│  │    - ./logs:/app/logs (only logs)   │     │
│  │  Command: node src/index.js         │     │
│  │  Env: .env.production               │     │
│  │  Restart: always                    │     │
│  │  Health Check: /health endpoint     │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  No neon-local service (connects directly     │
│  to Neon Cloud production database)           │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Request Flow

### Development

```
1. Developer → http://localhost:3000/api/...
                    │
                    ▼
2. App Container (port 3000)
   - Express app receives request
   - Needs database query
                    │
                    ▼
3. src/config/database.js
   - Detects NODE_ENV=development
   - Configures for Neon Local proxy
   - Connection: neon-local:5432
                    │
                    ▼
4. Neon Local Container (port 5432)
   - Receives query via local network
   - Authenticates with Neon Cloud
   - Routes to ephemeral branch
                    │
                    ▼
5. Neon Cloud (Ephemeral Branch)
   - Executes query
   - Returns results
                    │
                    ▼
6. Response flows back:
   Neon → Neon Local → App → Developer
```

### Production

```
1. Client → https://your-app.com/api/...
                    │
                    ▼
2. Load Balancer / Reverse Proxy
   - SSL termination
   - Request routing
                    │
                    ▼
3. App Container (port 3000)
   - Express app receives request
   - Needs database query
                    │
                    ▼
4. src/config/database.js
   - Detects NODE_ENV=production
   - Uses default Neon serverless config
   - Connection: ep-xxx.neon.tech
                    │
                    ▼
5. Neon Cloud (Production Branch)
   - Direct HTTPS connection
   - Executes query via HTTP API
   - Returns results
                    │
                    ▼
6. Response flows back:
   Neon → App → Proxy → Client
```

---

## Database Connection Configurations

### Development (Neon Local)

```javascript
// Neon serverless driver with local proxy
import { neon, neonConfig } from '@neondatabase/serverless';

// Configure for Neon Local
neonConfig.fetchEndpoint = 'http://neon-local:5432/sql';
neonConfig.useSecureWebSocket = false;
neonConfig.poolQueryViaFetch = true;

const sql = neon('postgres://neon:npg@neon-local:5432/neondb?sslmode=require');

┌─────────────────────────────────────────┐
│  App makes HTTP request to local proxy  │
│  http://neon-local:5432/sql            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Neon Local forwards to cloud           │
│  (with authentication)                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Neon Cloud executes on                 │
│  ephemeral branch                       │
└─────────────────────────────────────────┘
```

### Production (Neon Cloud)

```javascript
// Neon serverless driver with default config
import { neon } from '@neondatabase/serverless';

const sql = neon('postgres://user:pass@ep-xxx.aws.neon.tech/db?sslmode=require');

┌─────────────────────────────────────────┐
│  App makes HTTPS request directly      │
│  https://ep-xxx.aws.neon.tech          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Neon Cloud receives and executes      │
│  on production branch                  │
└─────────────────────────────────────────┘
```

---

## File Structure

```
Acquisitions/
│
├── Docker Configuration
│   ├── Dockerfile              ← App container definition
│   ├── docker-compose.dev.yml  ← Dev: App + Neon Local
│   ├── docker-compose.prod.yml ← Prod: App only
│   └── .dockerignore           ← Build optimization
│
├── Environment Configuration
│   ├── .env.example            ← Template (committed)
│   ├── .env.development        ← Dev config (gitignored)
│   └── .env.production         ← Prod config (gitignored)
│
├── Documentation
│   ├── QUICKSTART.md           ← Fast start guide
│   ├── DOCKER_SETUP.md         ← Comprehensive guide
│   ├── DOCKER_SUMMARY.md       ← This summary
│   ├── CLOUD_DEPLOYMENT.md     ← Cloud platform guides
│   └── ARCHITECTURE_DIAGRAMS.md← This file
│
├── Application Code
│   └── src/
│       ├── index.js            ← Entry point
│       ├── app.js              ← Express app
│       ├── config/
│       │   └── database.js     ← Auto-switching DB config
│       ├── controllers/
│       ├── routes/
│       └── models/
│
└── Database
    ├── drizzle/                ← Migrations
    └── drizzle.config.js       ← Drizzle ORM config
```

---

## Security Layers

```
┌────────────────────────────────────────────────────────┐
│                  Security Stack                         │
└────────────────────────────────────────────────────────┘

Layer 7: Application Security
┌────────────────────────────────────────────┐
│ - Helmet.js (security headers)             │
│ - CORS configuration                       │
│ - ArcJet (rate limiting, bot protection)   │
│ - Input validation (Zod)                   │
└──────────────────┬─────────────────────────┘
                   │
Layer 6: Authentication & Authorization
┌────────────────────────────────────────────┐
│ - JWT tokens (httpOnly cookies)            │
│ - Bcrypt password hashing                  │
│ - Session management                       │
└──────────────────┬─────────────────────────┘
                   │
Layer 5: Environment Isolation
┌────────────────────────────────────────────┐
│ - Separate secrets per environment         │
│ - No hardcoded credentials                 │
│ - Secret managers in cloud                 │
└──────────────────┬─────────────────────────┘
                   │
Layer 4: Container Security
┌────────────────────────────────────────────┐
│ - Non-root user in container               │
│ - Minimal base image (alpine)              │
│ - No unnecessary packages                  │
└──────────────────┬─────────────────────────┘
                   │
Layer 3: Network Security
┌────────────────────────────────────────────┐
│ - SSL/TLS for all connections              │
│ - Private Docker networks                  │
│ - Firewall rules                           │
└──────────────────┬─────────────────────────┘
                   │
Layer 2: Database Security
┌────────────────────────────────────────────┐
│ - SSL required for Neon connections        │
│ - Database access controls                 │
│ - Query parameterization (SQL injection)   │
└──────────────────┬─────────────────────────┘
                   │
Layer 1: Infrastructure Security
┌────────────────────────────────────────────┐
│ - Cloud platform security groups           │
│ - VPC isolation (if applicable)            │
│ - DDoS protection                          │
└────────────────────────────────────────────┘
```

---

## Deployment Workflow

```
┌─────────────────────────────────────────────────────────┐
│                  Development Workflow                    │
└─────────────────────────────────────────────────────────┘

1. Code Changes
   └─▶ src/models/*.js (schema changes)
   └─▶ src/controllers/*.js (business logic)
   └─▶ src/routes/*.js (API routes)
       │
       ▼
2. Local Testing (Neon Local)
   └─▶ docker-compose -f docker-compose.dev.yml up
   └─▶ Test with ephemeral database branch
   └─▶ Database resets on restart (clean state)
       │
       ▼
3. Database Migrations
   └─▶ npm run db:generate (create migration)
   └─▶ npm run db:migrate (apply to dev DB)
   └─▶ Commit migration files to git
       │
       ▼
4. Git Workflow
   └─▶ git add .
   └─▶ git commit -m "feature: ..."
   └─▶ git push origin feature-branch
       │
       ▼
5. Code Review & Merge
   └─▶ Pull request
   └─▶ Review & approval
   └─▶ Merge to main
       │
       ▼
6. Production Deployment
   └─▶ Run migrations on production DB
   └─▶ docker-compose -f docker-compose.prod.yml up -d
   └─▶ Monitor logs and health endpoint
```

---

## Monitoring Points

```
┌────────────────────────────────────────────────────┐
│              Monitoring Strategy                    │
└────────────────────────────────────────────────────┘

Application Layer
┌──────────────────────────────────────┐
│ ✓ Health endpoint: /health           │
│   - Uptime                            │
│   - Timestamp                         │
│   - Status                            │
│                                       │
│ ✓ Application logs                   │
│   - Error logs (./logs/error.log)    │
│   - Combined logs (./logs/combined)  │
│   - Morgan HTTP logs                 │
└───────────────┬──────────────────────┘
                │
Container Layer
┌──────────────────────────────────────┐
│ ✓ Docker health checks               │
│ ✓ Container restart counts           │
│ ✓ Resource usage (CPU/Memory)        │
└───────────────┬──────────────────────┘
                │
Database Layer
┌──────────────────────────────────────┐
│ ✓ Neon Console Dashboard             │
│   - Query performance                │
│   - Connection counts                │
│   - Storage usage                    │
│   - Branch activity                  │
└───────────────┬──────────────────────┘
                │
Platform Layer
┌──────────────────────────────────────┐
│ ✓ Cloud platform metrics             │
│   - Request count                    │
│   - Response times                   │
│   - Error rates                      │
│   - Network traffic                  │
└──────────────────────────────────────┘
```

---

This architecture provides a robust, scalable, and developer-friendly setup for your application!

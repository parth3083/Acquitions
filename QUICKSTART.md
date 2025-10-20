# 🚀 Quick Start Guide

This guide will help you get the Acquisitions application up and running quickly.

## For Developers (Local Development with Neon Local)

### 1. Prerequisites
- Docker Desktop installed and running
- Neon account with API credentials

### 2. Get Your Neon Credentials

1. Go to [Neon Console](https://console.neon.tech)
2. Get your **API Key**: Account Settings → API Keys
3. Get your **Project ID**: Project Settings → General
4. Note your **main branch ID** (usually visible in project dashboard)

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env.development

# Edit .env.development with your actual Neon credentials
# Update: NEON_API_KEY, NEON_PROJECT_ID, and generate secure secrets
```

### 4. Start the Application

```bash
# Start both app and Neon Local
docker-compose -f docker-compose.dev.yml up --build

# Or run in detached mode
docker-compose -f docker-compose.dev.yml up -d --build
```

**What's happening:**
- 🐳 Neon Local creates an ephemeral database branch
- 📦 Your app connects to this local proxy
- 🔄 Database resets on every restart (perfect for testing!)

### 5. Access Your App

- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API**: http://localhost:3000/api

### 6. Run Database Migrations

```bash
# Generate migration from schema
docker-compose -f docker-compose.dev.yml exec app npm run db:generate

# Apply migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open Drizzle Studio (database GUI)
docker-compose -f docker-compose.dev.yml exec app npm run db:studio
```

### 7. View Logs

```bash
# Follow all logs
docker-compose -f docker-compose.dev.yml logs -f

# Just app logs
docker-compose -f docker-compose.dev.yml logs -f app

# Just Neon Local logs
docker-compose -f docker-compose.dev.yml logs -f neon-local
```

### 8. Stop Everything

```bash
docker-compose -f docker-compose.dev.yml down
```

The ephemeral database branch is automatically deleted! ✨

---

## For Production Deployment

### 1. Get Production Database URL

1. Go to [Neon Console](https://console.neon.tech)
2. Select your **production branch**
3. Copy the **Postgres connection string**
4. Format: `postgres://[user]:[password]@ep-xxxxx.aws.neon.tech/[db]?sslmode=require`

### 2. Configure Production Environment

```bash
# Create production environment file
cp .env.example .env.production

# Edit .env.production
# Set DATABASE_URL to your actual Neon production URL
# Generate STRONG, UNIQUE secrets for JWT_SECRET and COOKIE_SECRET
```

**⚠️ Security Checklist:**
- ✅ Use different secrets than development
- ✅ Minimum 32 characters for secrets
- ✅ Never commit `.env.production` to git
- ✅ Use environment variables in CI/CD or cloud platforms

### 3. Run Database Migrations

```bash
# Build production image
docker-compose -f docker-compose.prod.yml build

# Run migrations (one-time)
docker-compose -f docker-compose.prod.yml run --rm app npm run db:migrate
```

### 4. Start Production

```bash
# Start in detached mode
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### 5. Health Monitoring

```bash
# Check health status
curl http://localhost:3000/health

# Expected response:
# {"status":"OK","timestamp":"2025-10-05T...","uptime":123.456}
```

### 6. Stop Production

```bash
docker-compose -f docker-compose.prod.yml down
```

---

## Alternative: Running Without Docker

### Development (Local)

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.development

# Start Neon Local separately
docker run --name neon-local -p 5432:5432 \
  -e NEON_API_KEY=your_key \
  -e NEON_PROJECT_ID=your_project \
  -e PARENT_BRANCH_ID=main \
  neondatabase/neon_local:latest

# In another terminal, start the app
npm run dev
```

### Production (Without Docker)

```bash
# Install dependencies
npm install --production

# Setup environment
cp .env.example .env.production
# Edit .env.production with production DATABASE_URL

# Run migrations
npm run db:migrate

# Start the app
NODE_ENV=production node src/index.js
```

---

## Troubleshooting

### "Cannot connect to database"

**Development:**
1. Verify Neon Local is running: `docker ps`
2. Check credentials in `.env.development`
3. View Neon Local logs: `docker-compose -f docker-compose.dev.yml logs neon-local`

**Production:**
1. Test connection string manually
2. Verify SSL mode is included: `?sslmode=require`
3. Check network/firewall allows outbound connections

### "Port 5432 already in use"

Stop local PostgreSQL or change the port:

```yaml
# In docker-compose.dev.yml
ports:
  - "5433:5432"  # Use 5433 on host
```

### "Self-signed certificate error"

This is normal with Neon Local. The app is already configured to handle it.

### Need more help?

See the comprehensive [DOCKER_SETUP.md](./DOCKER_SETUP.md) guide.

---

## Project Structure

```
Acquisitions/
├── docker-compose.dev.yml    # Development with Neon Local
├── docker-compose.prod.yml   # Production with Neon Cloud
├── Dockerfile                # Application container
├── .env.example              # Environment template
├── .env.development          # Dev config (gitignored)
├── .env.production           # Prod config (gitignored)
├── src/
│   ├── index.js             # Entry point
│   ├── app.js               # Express app
│   ├── config/
│   │   └── database.js      # Database connection (auto-switches dev/prod)
│   ├── controllers/
│   ├── routes/
│   └── models/
└── drizzle/                 # Database migrations
```

---

## Common Commands Reference

### Development
```bash
# Start
docker-compose -f docker-compose.dev.yml up

# Stop
docker-compose -f docker-compose.dev.yml down

# Rebuild
docker-compose -f docker-compose.dev.yml up --build

# Shell access
docker-compose -f docker-compose.dev.yml exec app sh

# Database migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate
```

### Production
```bash
# Start
docker-compose -f docker-compose.prod.yml up -d

# Stop
docker-compose -f docker-compose.prod.yml down

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Health check
docker-compose -f docker-compose.prod.yml exec app wget -qO- http://localhost:3000/health
```

---

## Need More Details?

- **Detailed Setup**: See [DOCKER_SETUP.md](./DOCKER_SETUP.md)
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Neon Documentation**: https://neon.tech/docs
- **Neon Local**: https://neon.tech/docs/local/neon-local

---

## License

See LICENSE file.

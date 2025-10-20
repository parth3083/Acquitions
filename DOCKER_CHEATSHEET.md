# 🎯 Docker Commands Cheat Sheet

Quick reference for Docker commands used with this project.

## 🚀 Development Commands

### Start Development Environment
```bash
# With logs (foreground)
docker-compose -f docker-compose.dev.yml up

# With build
docker-compose -f docker-compose.dev.yml up --build

# In background (detached)
docker-compose -f docker-compose.dev.yml up -d

# With npm script
npm run docker:dev
```

### Stop Development Environment
```bash
# Stop containers
docker-compose -f docker-compose.dev.yml stop

# Stop and remove containers
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes
docker-compose -f docker-compose.dev.yml down -v

# With npm script
npm run docker:dev:down
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.dev.yml logs

# Follow logs (live)
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs app
docker-compose -f docker-compose.dev.yml logs neon-local

# Last 100 lines
docker-compose -f docker-compose.dev.yml logs --tail=100 -f
```

### Execute Commands in Container
```bash
# Open shell
docker-compose -f docker-compose.dev.yml exec app sh

# Run npm command
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Run Node.js command
docker-compose -f docker-compose.dev.yml exec app node --version
```

### Restart Services
```bash
# Restart all services
docker-compose -f docker-compose.dev.yml restart

# Restart specific service
docker-compose -f docker-compose.dev.yml restart app
```

---

## 🏭 Production Commands

### Start Production Environment
```bash
# Build and start in background
docker-compose -f docker-compose.prod.yml up -d --build

# Just start
docker-compose -f docker-compose.prod.yml up -d

# With npm script
npm run docker:prod
```

### Stop Production Environment
```bash
# Stop
docker-compose -f docker-compose.prod.yml stop

# Stop and remove
docker-compose -f docker-compose.prod.yml down

# With npm script
npm run docker:prod:down
```

### View Production Logs
```bash
# All logs
docker-compose -f docker-compose.prod.yml logs -f

# App logs only
docker-compose -f docker-compose.prod.yml logs -f app

# Last 50 lines
docker-compose -f docker-compose.prod.yml logs --tail=50 -f app
```

### Production Migrations
```bash
# Run migrations
docker-compose -f docker-compose.prod.yml run --rm app npm run db:migrate

# Generate migrations
docker-compose -f docker-compose.prod.yml run --rm app npm run db:generate
```

### Production Shell Access
```bash
# Open shell
docker-compose -f docker-compose.prod.yml exec app sh

# Run one-off command
docker-compose -f docker-compose.prod.yml exec app node src/some-script.js
```

---

## 🗄️ Database Commands

### Migrations
```bash
# Generate migration from schema changes
docker-compose -f docker-compose.dev.yml exec app npm run db:generate

# Apply migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open Drizzle Studio
docker-compose -f docker-compose.dev.yml exec app npm run db:studio
```

### Database Connection
```bash
# Connect to Neon Local (development)
docker-compose -f docker-compose.dev.yml exec neon-local psql -U neon -d neondb

# Check connection
docker-compose -f docker-compose.dev.yml exec app node -e "require('./src/config/database.js')"
```

---

## 🔍 Inspection Commands

### Container Status
```bash
# List running containers
docker-compose -f docker-compose.dev.yml ps

# Detailed container info
docker inspect acquitions-app-dev
docker inspect acquitions-neon-local

# Container stats (CPU, memory)
docker stats acquitions-app-dev
```

### Health Checks
```bash
# Check health status
docker inspect acquitions-app-dev --format='{{.State.Health.Status}}'

# Health check from inside container
docker-compose -f docker-compose.dev.yml exec app wget -qO- http://localhost:3000/health

# Or using curl
docker-compose -f docker-compose.dev.yml exec app curl http://localhost:3000/health
```

### Network Inspection
```bash
# List networks
docker network ls

# Inspect network
docker network inspect acquitions-network

# Check connectivity
docker-compose -f docker-compose.dev.yml exec app ping neon-local
```

---

## 🔨 Build Commands

### Build Images
```bash
# Build all services
docker-compose -f docker-compose.dev.yml build

# Build with no cache
docker-compose -f docker-compose.dev.yml build --no-cache

# Build specific service
docker-compose -f docker-compose.dev.yml build app

# Build for production
docker-compose -f docker-compose.prod.yml build
```

### Build Standalone Image
```bash
# Build image directly
docker build -t acquisitions:latest .

# Build with tag
docker build -t acquisitions:v1.0.0 .

# Build for specific platform
docker build --platform linux/amd64 -t acquisitions:latest .
```

---

## 🧹 Cleanup Commands

### Remove Containers
```bash
# Stop and remove containers
docker-compose -f docker-compose.dev.yml down

# Remove containers and volumes
docker-compose -f docker-compose.dev.yml down -v

# Remove containers, volumes, and networks
docker-compose -f docker-compose.dev.yml down -v --remove-orphans
```

### Clean Docker System
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove all unused data (CAREFUL!)
docker system prune -a

# Remove all with volumes (VERY CAREFUL!)
docker system prune -a --volumes
```

### Remove Specific Images
```bash
# List images
docker images

# Remove specific image
docker rmi acquisitions:latest

# Force remove
docker rmi -f acquisitions:latest
```

---

## 📦 Volume Commands

### List Volumes
```bash
# List all volumes
docker volume ls

# List project volumes
docker volume ls | grep acquisitions
```

### Inspect Volumes
```bash
# Inspect volume
docker volume inspect acquisitions_logs

# Show volume location
docker volume inspect acquisitions_logs --format '{{ .Mountpoint }}'
```

### Backup Volumes
```bash
# Backup logs volume
docker run --rm -v acquisitions_logs:/data -v $(pwd):/backup alpine tar czf /backup/logs-backup.tar.gz -C /data .

# Restore logs volume
docker run --rm -v acquisitions_logs:/data -v $(pwd):/backup alpine tar xzf /backup/logs-backup.tar.gz -C /data
```

---

## 🔐 Environment & Secrets

### Pass Environment Variables
```bash
# Via .env file
docker-compose -f docker-compose.dev.yml --env-file .env.development up

# Via command line
docker-compose -f docker-compose.dev.yml run -e NODE_ENV=test app npm test

# Multiple variables
docker-compose -f docker-compose.dev.yml run \
  -e NODE_ENV=test \
  -e LOG_LEVEL=debug \
  app npm test
```

### View Environment Variables
```bash
# View all env vars
docker-compose -f docker-compose.dev.yml exec app env

# View specific var
docker-compose -f docker-compose.dev.yml exec app env | grep DATABASE_URL

# From Node.js
docker-compose -f docker-compose.dev.yml exec app node -e "console.log(process.env.DATABASE_URL)"
```

---

## 🐛 Debugging Commands

### Interactive Debugging
```bash
# Start container and open shell
docker-compose -f docker-compose.dev.yml run --rm app sh

# Run with debugging output
docker-compose -f docker-compose.dev.yml up --verbose

# Override command
docker-compose -f docker-compose.dev.yml run --rm app node --inspect src/index.js
```

### Check Container Processes
```bash
# List processes in container
docker-compose -f docker-compose.dev.yml exec app ps aux

# Top processes
docker-compose -f docker-compose.dev.yml top
```

### Network Debugging
```bash
# Test connectivity to Neon Local
docker-compose -f docker-compose.dev.yml exec app nc -zv neon-local 5432

# Check DNS resolution
docker-compose -f docker-compose.dev.yml exec app nslookup neon-local

# Test HTTP endpoint
docker-compose -f docker-compose.dev.yml exec app wget -O- http://neon-local:5432
```

---

## 📊 Monitoring Commands

### Real-time Monitoring
```bash
# Container stats
docker stats

# Specific containers
docker stats acquitions-app-dev acquitions-neon-local

# Events stream
docker events
docker events --filter 'container=acquitions-app-dev'
```

### Log Analysis
```bash
# Count error logs
docker-compose -f docker-compose.dev.yml logs app | grep -i error | wc -l

# Show only errors
docker-compose -f docker-compose.dev.yml logs app 2>&1 | grep -i error

# Logs between timestamps
docker-compose -f docker-compose.dev.yml logs --since="2025-10-05T10:00:00" app
```

---

## 🚢 Push/Pull Images

### Push to Registry
```bash
# Tag image
docker tag acquisitions:latest yourusername/acquisitions:latest

# Login to Docker Hub
docker login

# Push
docker push yourusername/acquisitions:latest

# Push specific version
docker push yourusername/acquisitions:v1.0.0
```

### Pull from Registry
```bash
# Pull latest
docker pull yourusername/acquisitions:latest

# Pull specific version
docker pull yourusername/acquisitions:v1.0.0

# Update compose services
docker-compose -f docker-compose.prod.yml pull
```

---

## 🔄 Update & Recreate

### Update Running Services
```bash
# Pull and recreate
docker-compose -f docker-compose.prod.yml up -d --pull always

# Recreate without rebuilding
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# Rebuild and recreate
docker-compose -f docker-compose.prod.yml up -d --build
```

### Rolling Updates
```bash
# Scale down
docker-compose -f docker-compose.prod.yml scale app=0

# Pull new image
docker-compose -f docker-compose.prod.yml pull app

# Scale up
docker-compose -f docker-compose.prod.yml scale app=1
```

---

## 📝 Useful Aliases (Optional)

Add these to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
# Development
alias dcdev="docker-compose -f docker-compose.dev.yml"
alias dcprod="docker-compose -f docker-compose.prod.yml"

# Quick commands
alias dcup="docker-compose -f docker-compose.dev.yml up"
alias dcdown="docker-compose -f docker-compose.dev.yml down"
alias dclogs="docker-compose -f docker-compose.dev.yml logs -f"
alias dcshell="docker-compose -f docker-compose.dev.yml exec app sh"

# Usage after setting aliases:
# dcup
# dclogs
# dcshell
```

For PowerShell (Windows):

```powershell
# Add to $PROFILE
function dcdev { docker-compose -f docker-compose.dev.yml @args }
function dcprod { docker-compose -f docker-compose.prod.yml @args }
function dcup { docker-compose -f docker-compose.dev.yml up @args }
function dcdown { docker-compose -f docker-compose.dev.yml down @args }
function dclogs { docker-compose -f docker-compose.dev.yml logs -f @args }
function dcshell { docker-compose -f docker-compose.dev.yml exec app sh }
```

---

## 🆘 Emergency Commands

### Force Stop Everything
```bash
# Stop all running containers
docker stop $(docker ps -q)

# Kill all containers
docker kill $(docker ps -q)

# Nuclear option (removes everything)
docker-compose -f docker-compose.dev.yml down -v --remove-orphans
docker system prune -a --volumes -f
```

### Recover from Issues
```bash
# Reset development environment
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up

# Fix permission issues
docker-compose -f docker-compose.dev.yml exec app chown -R node:node /app

# Clear Neon Local metadata
rm -rf .neon_local/
docker-compose -f docker-compose.dev.yml restart neon-local
```

---

## 💡 Pro Tips

1. **Use `-d` for background**: Start services in detached mode for cleaner terminal
2. **Follow logs with `-f`**: Always use `-f` to follow logs in real-time
3. **Use `--no-cache` sparingly**: Only when you suspect build cache issues
4. **Keep containers running**: Use `exec` instead of `run` for commands in running containers
5. **Check compose version**: Ensure you're using Compose V2 (`docker compose` not `docker-compose`)

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Neon Docker Guide](https://neon.tech/docs/local/neon-local)
- [Project Documentation](./README.md)

---

**Keep this cheat sheet handy for quick reference! 📋**

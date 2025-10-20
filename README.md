# 🚀 Acquisitions - Full Stack Application

A modern, secure full-stack application built with Node.js, Express, and Neon Database, fully dockerized for both development and production environments.

## ✨ Features

- 🔐 **Secure Authentication**: JWT-based auth with httpOnly cookies
- 🛡️ **Security First**: ArcJet rate limiting, Helmet.js, CORS protection
- 🗄️ **Modern Database**: Neon Serverless Postgres with Drizzle ORM
- 🐳 **Docker Ready**: Complete Docker setup for dev and prod
- 🔄 **Hot Reload**: Watch mode for development
- 📊 **Logging**: Winston + Morgan for comprehensive logs
- ✅ **Type Safety**: Zod validation for API requests
- 🌐 **Cloud Ready**: Deploy to AWS, GCP, Azure, Heroku, and more

## 🏗️ Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 5
- **Database**: Neon Serverless Postgres
- **ORM**: Drizzle ORM
- **Authentication**: JWT + Bcrypt
- **Security**: ArcJet, Helmet.js, CORS
- **Validation**: Zod
- **Logging**: Winston, Morgan
- **Containerization**: Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- [Neon account](https://console.neon.tech) with API credentials

### 1. Clone the Repository

```bash
git clone https://github.com/parth3083/Acquitions.git
cd Acquitions
```

### 2. Get Neon Credentials

1. Sign up at [Neon Console](https://console.neon.tech)
2. Create a new project
3. Get your credentials:
   - **API Key**: Account Settings → API Keys → Create new API key
   - **Project ID**: Project Settings → General
   - **Branch ID**: Usually `main` (visible in project dashboard)

### 3. Configure Environment

```bash
# Copy the example file
cp .env.example .env.development

# Edit .env.development with your Neon credentials
# Update: NEON_API_KEY, NEON_PROJECT_ID, PARENT_BRANCH_ID
```

Or use the interactive setup:

```bash
npm run setup
```

### 4. Start Development Environment

```bash
# Start both app and Neon Local
docker-compose -f docker-compose.dev.yml up --build

# Or use the npm script
npm run docker:dev
```

**What's happening:**
- 🔄 Neon Local creates an ephemeral database branch
- 📦 Your app connects to the local proxy
- 🎯 Fresh database on every restart
- 🔥 Hot reload enabled for code changes

### 5. Access Your Application

- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Endpoint**: http://localhost:3000/api

### 6. Run Database Migrations

```bash
# Generate migration from schema changes
docker-compose -f docker-compose.dev.yml exec app npm run db:generate

# Apply migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open Drizzle Studio (Database GUI)
docker-compose -f docker-compose.dev.yml exec app npm run db:studio
```

## 🏭 Production Deployment

### 1. Configure Production Environment

```bash
# Copy template
cp .env.example .env.production

# Edit .env.production with:
# - Your Neon production DATABASE_URL
# - Strong, unique secrets for JWT_SECRET and COOKIE_SECRET
# - Other production configurations
```

### 2. Run Database Migrations

```bash
# Build production image
docker-compose -f docker-compose.prod.yml build

# Run migrations (one-time)
docker-compose -f docker-compose.prod.yml run --rm app npm run db:migrate
```

### 3. Start Production

```bash
# Start in detached mode
docker-compose -f docker-compose.prod.yml up -d

# Or use npm script
npm run docker:prod
```

### 4. Monitor

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Check health
curl http://localhost:3000/health
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](./QUICKSTART.md) | Fast-track guide to get started |
| [DOCKER_SETUP.md](./DOCKER_SETUP.md) | Comprehensive Docker setup guide |
| [DOCKER_SUMMARY.md](./DOCKER_SUMMARY.md) | Overview of Docker configuration |
| [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) | Visual architecture diagrams |
| [CLOUD_DEPLOYMENT.md](./CLOUD_DEPLOYMENT.md) | Deploy to AWS, GCP, Azure, etc. |

## 🏛️ Architecture

### Development Environment

```
┌──────────────────────────────────────┐
│        Docker Network                │
│                                      │
│  ┌───────────┐    ┌──────────────┐ │
│  │   App     │───▶│  Neon Local  │ │
│  │ Container │    │    Proxy     │ │
│  └───────────┘    └──────┬───────┘ │
└────────────────────────────┼─────────┘
                             │
                             ▼
                    Neon Cloud (Ephemeral)
```

### Production Environment

```
┌──────────────┐
│     App      │
│  Container   │
└──────┬───────┘
       │
       ▼
Neon Cloud (Production)
```

## 📁 Project Structure

```
Acquisitions/
├── src/
│   ├── index.js              # Entry point
│   ├── app.js                # Express app setup
│   ├── server.js             # Server configuration
│   ├── config/
│   │   ├── database.js       # Database connection (auto-switches)
│   │   ├── logger.js         # Winston logger
│   │   └── arcjet.js         # Security configuration
│   ├── controllers/          # Request handlers
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   ├── models/               # Database schemas (Drizzle)
│   ├── middleware/           # Custom middleware
│   ├── utils/                # Utility functions
│   └── validations/          # Zod schemas
├── drizzle/                  # Database migrations
├── logs/                     # Application logs
├── Dockerfile                # Production container
├── docker-compose.dev.yml    # Dev environment
├── docker-compose.prod.yml   # Prod environment
├── .env.example              # Environment template
└── package.json              # Dependencies & scripts
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run docker:dev       # Start Docker dev environment
npm run docker:dev:down  # Stop Docker dev environment

# Production
npm start                # Start production server
npm run docker:prod      # Start Docker prod environment
npm run docker:prod:down # Stop Docker prod environment

# Setup
npm run setup            # Interactive environment setup

# Database
npm run db:generate      # Generate migrations
npm run db:migrate       # Apply migrations
npm run db:studio        # Open Drizzle Studio

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
```

## 🔐 Environment Variables

### Required for Development

```env
NODE_ENV=development
NEON_API_KEY=your_neon_api_key
NEON_PROJECT_ID=your_neon_project_id
PARENT_BRANCH_ID=main
DATABASE_URL=postgres://neon:npg@localhost:5432/neondb?sslmode=require
JWT_SECRET=your_jwt_secret
COOKIE_SECRET=your_cookie_secret
ARCJET_KEY=your_arcjet_key
```

### Required for Production

```env
NODE_ENV=production
DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/db?sslmode=require
JWT_SECRET=strong_random_secret_32_chars_minimum
COOKIE_SECRET=strong_random_secret_32_chars_minimum
ARCJET_KEY=your_production_arcjet_key
```

## 🌐 API Endpoints

### Health Check
```
GET /health
Response: { "status": "OK", "timestamp": "...", "uptime": 123 }
```

### Authentication
```
POST /api/auth/register  # Register new user
POST /api/auth/login     # Login user
POST /api/auth/logout    # Logout user
GET  /api/auth/me        # Get current user
```

## 🛡️ Security Features

- ✅ **JWT Authentication** with httpOnly cookies
- ✅ **Password Hashing** with Bcrypt
- ✅ **Rate Limiting** via ArcJet
- ✅ **Security Headers** via Helmet.js
- ✅ **CORS Protection** configured
- ✅ **Input Validation** with Zod
- ✅ **SQL Injection Prevention** via Drizzle ORM
- ✅ **SSL/TLS** for database connections

## 🐳 Docker Features

### Development
- ✅ Neon Local proxy for ephemeral branches
- ✅ Hot reload for code changes
- ✅ Fresh database on every restart
- ✅ Automatic cleanup on shutdown
- ✅ Git branch integration (optional)

### Production
- ✅ Optimized production image
- ✅ Direct Neon Cloud connection
- ✅ Health checks configured
- ✅ Auto-restart on failure
- ✅ Logging to volumes

## 🌍 Cloud Deployment

This application is ready to deploy to:

- ✅ **AWS** (ECS, Fargate, EC2)
- ✅ **Google Cloud** (Cloud Run, GKE, Compute Engine)
- ✅ **Azure** (Container Instances, App Service, AKS)
- ✅ **Heroku**
- ✅ **DigitalOcean** (App Platform)
- ✅ **Any Docker-compatible platform**

See [CLOUD_DEPLOYMENT.md](./CLOUD_DEPLOYMENT.md) for detailed guides.

## 🧪 Testing

```bash
# Start test environment
docker-compose -f docker-compose.dev.yml up -d

# Run tests (when implemented)
npm test

# Stop test environment
docker-compose -f docker-compose.dev.yml down
```

## 📊 Monitoring

### Health Check Endpoint
```bash
curl http://localhost:3000/health
```

### View Logs
```bash
# Application logs
tail -f logs/combined.log
tail -f logs/error.log

# Docker logs
docker-compose -f docker-compose.dev.yml logs -f
docker-compose -f docker-compose.prod.yml logs -f app
```

### Database Monitoring
Access [Neon Console](https://console.neon.tech) for:
- Query performance metrics
- Connection monitoring
- Storage usage
- Branch activity

## 🔧 Troubleshooting

### Cannot connect to database

**Development:**
```bash
# Check if Neon Local is running
docker ps | grep neon-local

# View Neon Local logs
docker-compose -f docker-compose.dev.yml logs neon-local

# Verify credentials in .env.development
```

**Production:**
```bash
# Test DATABASE_URL connection
# Check Neon Console for database status
# Verify SSL is enabled (?sslmode=require)
```

### Port already in use

```bash
# Check what's using the port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux

# Change port in .env file or docker-compose.yml
```

### Docker issues

```bash
# Clean up Docker
docker system prune -a

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```

For more troubleshooting, see [DOCKER_SETUP.md](./DOCKER_SETUP.md#troubleshooting).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Neon](https://neon.tech) - Serverless Postgres
- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM
- [ArcJet](https://arcjet.com) - Security platform
- [Express.js](https://expressjs.com) - Web framework

## 📞 Support

- **Documentation**: See docs in this repository
- **Neon Support**: https://neon.tech/docs/introduction/support
- **Issues**: [GitHub Issues](https://github.com/parth3083/Acquitions/issues)

## 🗺️ Roadmap

- [ ] Unit and integration tests
- [ ] CI/CD pipeline
- [ ] API documentation (Swagger/OpenAPI)
- [ ] GraphQL API option
- [ ] WebSocket support
- [ ] Caching layer (Redis)
- [ ] Background job processing

---

**Made with ❤️ by [Parth](https://github.com/parth3083)**

**Star ⭐ this repo if you find it helpful!**

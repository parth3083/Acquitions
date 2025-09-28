# Acquisitions Platform - Architecture Documentation

## 1. **The Big Picture**

### What is this project?
This is a **RESTful API backend service** for an acquisitions platform - a system designed to manage business acquisition processes. It's built as a modern Node.js web API that provides authentication and user management capabilities as its foundation.

### What problem does it solve?
The platform appears to be designed to handle acquisition-related workflows, starting with secure user authentication and role-based access control (with 'user' and 'admin' roles), laying the groundwork for managing acquisition deals, participants, and related business processes.

## 2. **Core Architecture**

The application follows a **Layered Architecture** pattern (also known as N-tier architecture), which is a monolithic design with clear separation of concerns. Here's the high-level structure:

```
┌─────────────────────────────────────────────────┐
│                   CLIENT                        │
└────────────────────┬────────────────────────────┘
                     │ HTTP Request
                     ▼
┌─────────────────────────────────────────────────┐
│              EXPRESS SERVER                      │
│  (Middleware: Helmet, CORS, Morgan, Cookies)    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│                 ROUTES LAYER                     │
│           (API Endpoint Definitions)             │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              CONTROLLERS LAYER                   │
│     (Request Handling & Orchestration)           │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              VALIDATION LAYER                    │
│           (Zod Schema Validation)                │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│               SERVICES LAYER                     │
│          (Business Logic & Rules)                │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│                MODELS LAYER                      │
│         (Drizzle ORM Schema Definitions)         │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              DATABASE LAYER                      │
│        (Neon Serverless PostgreSQL)              │
└──────────────────────────────────────────────────┘
```

### Folder Organization:
```
Acquitions/
├── src/
│   ├── index.js           # Entry point
│   ├── server.js          # Server initialization
│   ├── app.js             # Express app configuration
│   ├── config/            # Configuration modules
│   │   ├── database.js    # Database connection
│   │   └── logger.js      # Winston logger setup
│   ├── routes/            # API route definitions
│   │   └── auth.route.js  
│   ├── controllers/       # Request handlers
│   │   └── auth.controller.js
│   ├── services/          # Business logic
│   │   └── auth.service.js
│   ├── models/            # Database schemas
│   │   └── user.model.js
│   ├── utils/             # Helper utilities
│   │   ├── jwt.js         # JWT token handling
│   │   ├── cookies.js     # Cookie management
│   │   └── format.js      # Data formatting
│   └── validations/       # Request validation schemas
│       └── auth.js
├── drizzle/               # Database migrations
├── logs/                  # Application logs
└── package.json           # Dependencies & scripts
```

## 3. **Key Components Breakdown**

### Entry & Bootstrap Components

**`index.js`** → The absolute entry point. Loads environment variables and starts the server.

**`server.js`** → Creates HTTP server instance, binds to port (default 3000).

**`app.js`** → The Express application factory that:
- Configures all middleware (security, logging, parsing)
- Sets up health check endpoints
- Mounts all route modules under `/api/*`

### Security & Infrastructure Layer

**Middleware Stack:**
- **Helmet**: Sets security headers (CSP, XSS protection, etc.)
- **CORS**: Handles cross-origin requests
- **Morgan**: HTTP request logging integrated with Winston
- **Cookie-Parser**: Parses and manages HTTP cookies
- **Body Parsers**: JSON and URL-encoded request parsing

**Logger (`config/logger.js`)**: 
- Winston-based centralized logging
- File transports for errors and combined logs
- Console output in development mode
- Structured JSON logging with timestamps

### Authentication System

**Routes (`routes/auth.route.js`)**:
- `/api/auth/sign-up` - User registration (implemented)
- `/api/auth/sign-in` - User login (placeholder)
- `/api/auth/sign-out` - User logout (placeholder)

**Controller (`controllers/auth.controller.js`)**:
- Validates incoming requests using Zod schemas
- Orchestrates service calls
- Generates JWT tokens
- Sets secure HTTP-only cookies
- Handles error responses with proper status codes

**Service (`services/auth.service.js`)**:
- Contains business logic for user creation
- Password hashing with bcrypt (10 salt rounds)
- Duplicate email detection
- Database transaction handling

**Validation (`validations/auth.js`)**:
- Zod schemas for type-safe validation
- Sign-up: name, email, password, role
- Sign-in: email, password
- Automatic data transformation (trim, lowercase)

### Data Layer

**Models (`models/user.model.js`)**:
- Drizzle ORM schema definitions
- User table with: id, name, email, password, role, timestamps
- PostgreSQL-specific column types

**Database Configuration (`config/database.js`)**:
- Neon serverless PostgreSQL connection
- Drizzle ORM instance creation
- Connection URL from environment variable

### Utilities

**JWT Handler (`utils/jwt.js`)**:
- Token generation with 1-day expiration
- Token verification for protected routes
- Centralized secret management

**Cookie Manager (`utils/cookies.js`)**:
- Secure cookie configuration (httpOnly, sameSite)
- 15-minute default expiration
- Environment-aware security settings

**Formatter (`utils/format.js`)**:
- Validation error formatting for client responses

## 4. **Data Flow & Communication**

### Complete Request Lifecycle - User Registration Example:

```
1. CLIENT sends POST request to /api/auth/sign-up
   └─ Body: { name: "John", email: "john@example.com", password: "secret123", role: "user" }

2. EXPRESS MIDDLEWARE processes request
   ├─ Helmet adds security headers
   ├─ CORS validates origin
   ├─ Body parser converts JSON to JS object
   ├─ Morgan logs request details
   └─ Cookie parser reads existing cookies

3. ROUTER matches /api/auth/sign-up
   └─ Delegates to signUp controller

4. CONTROLLER (auth.controller.js)
   ├─ Validates request body with Zod schema
   ├─ If validation fails → Return 400 error
   └─ If valid → Extract validated data

5. SERVICE (auth.service.js)
   ├─ Check if email already exists in database
   ├─ If exists → Throw "User already exists" error
   ├─ Hash password with bcrypt (10 rounds)
   └─ Insert new user into database

6. DATABASE (Neon PostgreSQL)
   ├─ Execute INSERT query via Drizzle ORM
   └─ Return created user (without password)

7. CONTROLLER generates response
   ├─ Create JWT token with user data
   ├─ Set token in HTTP-only cookie
   └─ Log successful registration

8. RESPONSE sent to client
   └─ Status: 200
   └─ Body: { message: "User registered", user: { id, name, email, role } }
   └─ Cookie: token=<JWT>
```

### Inter-component Communication:
- All components use ES6 module imports
- Path aliases (`#src/*`, `#config/*`, etc.) for clean imports
- Async/await pattern for asynchronous operations
- Error propagation through Promise chains
- Centralized logging for all layers

## 5. **Tech Stack & Dependencies**

### Core Framework
- **Express 5.x**: Modern web framework with async error handling
- **Node.js**: JavaScript runtime (ES modules enabled)

### Database & ORM
- **Neon**: Serverless PostgreSQL for scalability
- **Drizzle ORM**: Type-safe SQL query builder
- **Drizzle Kit**: Migration and schema management tools

### Security & Authentication
- **Helmet**: Security headers middleware
- **bcrypt**: Industry-standard password hashing
- **jsonwebtoken**: JWT token generation/verification
- **CORS**: Cross-origin resource sharing

### Validation & Utilities
- **Zod**: Runtime type validation with TypeScript-like schemas
- **Winston**: Enterprise-grade logging
- **Morgan**: HTTP request logger
- **dotenv**: Environment variable management

### Development Tools
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **node --watch**: Built-in file watcher for development

### Why These Choices Matter:
- **Neon + Drizzle**: Provides serverless scalability with type-safe queries
- **Zod**: Ensures data integrity at runtime without TypeScript overhead
- **Winston + Morgan**: Production-ready logging and monitoring
- **Layered Architecture**: Makes the codebase maintainable and testable

## 6. **Execution Flow Examples**

### Startup Sequence:
```
1. npm run dev
2. Node loads src/index.js
3. dotenv loads .env file
4. Import src/server.js
5. Import src/app.js (creates Express app)
6. Configure all middleware
7. Mount routes
8. Server listens on PORT (default 3000)
9. Log: "Server started working at http://localhost:3000"
```

### Health Check Flow:
```
GET /health
  → No authentication required
  → Direct response from app.js
  → Returns: { status: "OK", timestamp: "...", uptime: 123 }
```

### Database Migration Flow:
```
npm run db:generate
  → Drizzle reads schema files from src/models/
  → Compares with current state
  → Generates SQL migration in drizzle/
  
npm run db:migrate
  → Applies pending migrations to database
  → Updates migration history
```

## 7. **Strengths & Tradeoffs**

### Strengths ✅
1. **Clear Separation of Concerns**: Each layer has a single responsibility
2. **Security-First Design**: Helmet, secure cookies, password hashing, JWT
3. **Modern JavaScript**: ES6 modules, async/await, path aliases
4. **Type Safety**: Zod validation ensures data integrity
5. **Scalable Database**: Serverless PostgreSQL can handle growth
6. **Developer Experience**: Hot reload, structured logging, code formatting
7. **Production-Ready Logging**: Centralized logging with Winston
8. **Clean Error Handling**: Consistent error responses and status codes

### Tradeoffs & Limitations ⚠️
1. **Monolithic Design**: All code in single service (harder to scale individual features)
2. **No Tests**: Currently missing test infrastructure
3. **Limited Auth**: Only sign-up implemented, missing sign-in/sign-out
4. **No Rate Limiting**: Vulnerable to brute force attacks
5. **No API Documentation**: Missing OpenAPI/Swagger docs
6. **Single Database**: No read replicas or caching layer
7. **Cookie-Based Auth**: Limits usage to browser-based clients
8. **No WebSocket Support**: Real-time features would need refactoring

### Things to Watch Out For 🔍
- JWT secret must be kept secure and rotated regularly
- Database connection string contains credentials (secure in production)
- Logs may contain sensitive data (review before production)
- Cookie expiration is only 15 minutes (may need adjustment)
- No request validation on sign-in/sign-out endpoints yet
- Error messages might leak information (e.g., "email already exists")

## 8. **Final Summary**

**In 2-3 sentences for a teammate:**

"This is a Node.js/Express REST API for an acquisitions platform that uses a clean layered architecture with PostgreSQL (via Neon) as the database. The codebase separates concerns into routes → controllers → services → models, with Zod for validation, JWT for auth, and Winston for logging. Currently, it has user registration working with secure password hashing and cookie-based authentication, laying the foundation for a larger acquisition management system."

## Quick Start Commands:
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env  # Then edit DATABASE_URL and JWT_SECRET

# Run database migrations
npm run db:migrate

# Start development server
npm run dev

# Test the API
curl http://localhost:3000/health
```

---

*This architecture provides a solid foundation for building out acquisition-specific features like deal tracking, document management, stakeholder communication, and workflow automation. The layered design makes it easy to add new features without disrupting existing functionality.*
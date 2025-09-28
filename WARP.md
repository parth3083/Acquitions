# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an Express.js-based REST API for an acquisitions platform, using modern JavaScript (ES modules) with PostgreSQL (via Neon) and Drizzle ORM for database operations.

## Development Commands

### Core Development
```bash
# Start development server with hot reload
npm run dev

# Run linting
npm run lint
npm run lint:fix

# Format code
npm run format
npm run format:check
```

### Database Operations
```bash
# Generate database migrations from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Open Drizzle Studio for database inspection
npm run db:studio
```

### Testing
Currently no test runner is configured. To run tests when implemented:
```bash
npm test
```

## Architecture & Code Structure

### Application Bootstrap Flow
1. **Entry Point**: `src/index.js` loads environment variables and imports the server
2. **Server Setup**: `src/server.js` starts the Express server on configured port
3. **App Configuration**: `src/app.js` sets up:
   - Express middleware (helmet, cors, morgan, cookie-parser)
   - Logging integration with Winston
   - Route mounting at `/api/*` endpoints
   - Health check endpoints

### Core Architecture Patterns

#### Layered Architecture
The codebase follows a clean layered architecture with clear separation of concerns:

1. **Routes Layer** (`src/routes/`): HTTP route definitions and request delegation
2. **Controllers Layer** (`src/controllers/`): Request handling, validation orchestration, and response formatting
3. **Services Layer** (`src/services/`): Business logic and database operations
4. **Models Layer** (`src/models/`): Drizzle ORM schema definitions
5. **Utils Layer** (`src/utils/`): Reusable utilities (JWT, cookies, formatting)
6. **Validations Layer** (`src/validations/`): Zod schemas for request validation

#### Database Configuration
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Neon serverless PostgreSQL
- **Schema Location**: `src/models/*.js` files define database tables
- **Migrations**: Stored in `drizzle/` directory
- **Connection**: Configured via `DATABASE_URL` environment variable in `src/config/database.js`

#### Authentication Flow
The authentication system demonstrates the typical request flow:
1. Request arrives at route handler (`/api/auth/sign-up`)
2. Controller validates input using Zod schemas
3. Service layer handles business logic (password hashing, user creation)
4. JWT token generation and cookie setting
5. Response with user data

#### Import Aliases
The project uses Node.js import aliases for cleaner imports:
- `#src/*` - Main source directory
- `#config/*` - Configuration files
- `#controllers/*` - Controller modules
- `#models/*` - Database models
- `#routes/*` - Route definitions
- `#services/*` - Business logic services
- `#utils/*` - Utility functions
- `#validations/*` - Validation schemas

### Environment Variables Required
```env
DATABASE_URL=          # Neon PostgreSQL connection string
JWT_SECRET=            # Secret for JWT token signing
PORT=                  # Server port (defaults to 3000)
NODE_ENV=              # Environment (development/production)
LOG_LEVEL=             # Winston log level (defaults to 'info')
```

### Key Technical Decisions

1. **ES Modules**: Project uses ES6 modules (`type: "module"` in package.json)
2. **Security**: Helmet.js for security headers, bcrypt for password hashing
3. **Validation**: Zod for runtime type checking and validation
4. **Logging**: Winston with file and console transports
5. **Database**: Serverless PostgreSQL via Neon for scalability
6. **Code Style**: Enforced via ESLint and Prettier with specific rules:
   - 2-space indentation
   - Single quotes
   - Semicolons required
   - Unix line endings

### API Endpoints Structure

Currently implemented:
- `GET /` - Base endpoint
- `GET /health` - Health check with uptime
- `GET /api` - API status check
- `POST /api/auth/sign-up` - User registration (fully implemented)
- `POST /api/auth/sign-in` - User login (placeholder)
- `POST /api/auth/sign-out` - User logout (placeholder)

### Error Handling Pattern

The codebase uses a consistent error handling approach:
- Controllers use try-catch blocks
- Validation errors return 400 with formatted error details
- Business logic errors (e.g., duplicate email) return appropriate status codes
- All errors are logged via Winston
- Errors are passed to Express error middleware via `next(error)`

## Development Workflow

When adding new features:
1. Define database schema in `src/models/`
2. Generate and run migrations
3. Create validation schemas in `src/validations/`
4. Implement service layer logic in `src/services/`
5. Create controller in `src/controllers/`
6. Define routes in `src/routes/`
7. Mount routes in `src/app.js`
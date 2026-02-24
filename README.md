# Knowledge Base (KB) System

A modern, full-stack knowledge base application built with Clean Architecture, DDD, and CQRS principles.

## Tech Stack

### Backend
- **ASP.NET Core 10** - Web API framework
- **EF Core 10** - ORM with PostgreSQL provider
- **ASP.NET Core Identity** - Authentication & authorization
- **Dapper** - High-performance data access
- **MediatR/CQRS** - Command/Query separation
- **PostgreSQL** - Primary database

### Frontend
- **React + Vite** - Modern SPA framework
- **TypeScript** - Type-safe JavaScript

## Getting Started

### Prerequisites

- .NET 10 SDK
- PostgreSQL 17+
- Node.js 18+ (for frontend)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Valgrind-KB-v2
   ```

2. **Configure database**
   ```bash
   # Update connection string in KB.Server/appsettings.Development.json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Database=KnowledgeBase;Username=postgres;Password=your-password"
     }
   }
   ```

3. **Set up JWT secret**
   ```bash
   cd KB.Server
   dotnet user-secrets set "JwtSettings:SecretKey" "your-super-secret-key-at-least-32-characters-long"
   ```

4. **Run migrations**
   ```bash
   dotnet ef database update --project KB.Infrastructure --startup-project KB.Server
   ```

5. **Seed data**
   ```bash
   cd KB.Operations
   dotnet run
   ```

6. **Run the API**
   ```bash
   cd KB.Server
   dotnet run
   ```

   API will be available at `http://localhost:5237`

7. **Run the frontend** (optional)
   ```bash
   cd kb.client
   npm install
   npm run dev
   ```

## Project Structure

```
├── KB.Domain/          # Domain entities, interfaces, enums (no dependencies)
├── KB.Core/            # Business logic, CQRS handlers, use cases
├── KB.Infrastructure/  # Data access, EF Core, external services
├── KB.Operations/      # Data seeding, migration utilities
├── KB.Server/          # ASP.NET Core Web API, endpoints
├── kb.client/          # React frontend application
└── docs/               # Documentation
```

## Authentication

The system includes a complete authentication solution:

- **Email + Password** authentication
- **Dual mode**: Cookie-based (web) and JWT (mobile/API)
- **MFA support**: Email OTP and Authenticator App
- **Role-based authorization**: Admin and User roles

### Default Users

After running the seeder:
- **Admin**: `admin@kb.local` / `Admin@123`
- **User**: `user@kb.local` / `User@123`

### API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT for mobile or sets cookie for web)
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/enable-mfa` - Enable MFA
- `POST /api/auth/verify-mfa` - Verify MFA code
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

See [Authentication Quick Start](./docs/authentication-quick-start.md) for detailed usage.

## Architecture

This project follows **Clean Architecture** principles:

### Domain Layer (KB.Domain)
- Entities with business logic
- Interfaces and contracts
- No external dependencies
- Domain events

### Core Layer (KB.Core)
- Use cases and business rules
- CQRS command/query handlers
- Result pattern for error handling
- Validation logic

### Infrastructure Layer (KB.Infrastructure)
- EF Core DbContext and configurations
- Repository implementations
- External service integrations
- Data access with Dapper

### Server Layer (KB.Server)
- Minimal API endpoints
- HTTP request/response handling
- Authentication/authorization middleware
- Dependency injection setup

### Key Patterns

- **CQRS**: Command/Query Responsibility Segregation
- **DDD**: Domain-Driven Design with aggregates
- **Repository Pattern**: Data access abstraction
- **Result Pattern**: Type-safe error handling (no exceptions for flow control)
- **Factory Pattern**: Entity creation (e.g., `RefreshToken.Create()`)

## Development

### Code Style

- File-scoped namespaces
- Primary constructors for handlers and services
- `protected set` for entity properties
- `sealed` classes for commands/queries/handlers
- Collection expressions `[]` instead of `new List<>()`

### Running Migrations

```bash
# Add migration
dotnet ef migrations add MigrationName \
  --project KB.Infrastructure \
  --startup-project KB.Server

# Update database
dotnet ef database update \
  --project KB.Infrastructure \
  --startup-project KB.Server

# Remove last migration
dotnet ef migrations remove \
  --project KB.Infrastructure \
  --startup-project KB.Server
```

### Building

```bash
# Build all projects
dotnet build

# Build specific project
dotnet build KB.Server/KB.Server.csproj

# Run tests (when added)
dotnet test
```

## Documentation

- [Authentication Quick Start](./docs/authentication-quick-start.md) - Get started with auth
- [Authorization Guide](./docs/authorization-guide.md) - How to protect endpoints
- [Authentication Implementation Plan](./docs/authentication-implementation-plan.md) - Technical details

## Contributing

1. Follow Clean Architecture principles
2. Use CQRS for all business operations
3. Never throw exceptions for flow control (use Result pattern)
4. Keep domain layer free of dependencies
5. Write unit tests for handlers

## License

[Your License Here]

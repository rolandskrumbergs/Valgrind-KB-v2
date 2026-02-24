# Authentication System - Quick Start Guide

## Overview

The KB application now includes a comprehensive authentication system supporting both web and mobile clients.

## Features

- ✅ **Dual Authentication**: Cookie-based for web, JWT with refresh tokens for mobile
- ✅ **ASP.NET Core Identity**: Industry-standard authentication framework
- ✅ **Email + Password**: Simple credential-based authentication
- ✅ **MFA Support**: Email OTP and Authenticator App (TOTP)
- ✅ **Role-Based Authorization**: Admin and User roles
- ✅ **Clean Architecture**: Domain-driven design with CQRS

## Quick Start

### 1. Database Setup

The database is already migrated with Identity tables. Default users are seeded:

- **Admin**: admin@kb.local / Admin@123
- **User**: user@kb.local / User@123

### 2. API Endpoints

All authentication endpoints are under `/api/auth`:

#### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@kb.local",
  "password": "Password@123",
  "confirmPassword": "Password@123"
}
```

#### Login (Mobile - JWT)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "demo@kb.local",
  "password": "Demo@123",
  "isMobileApp": true
}
```

Response:
```json
{
  "requiresMfa": false,
  "accessToken": "eyJhbGci...",
  "refreshToken": "abc123...",
  "userId": "169b0d96-..."
}
```

#### Login (Web - Cookies)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "demo@kb.local",
  "password": "Demo@123",
  "isMobileApp": false
}
```

Sets `.AspNetCore.Identity.Application` cookie automatically.

#### Refresh Access Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token-here"
}
```

#### Other Endpoints
- `POST /api/auth/enable-mfa` - Enable MFA
- `POST /api/auth/verify-mfa` - Verify MFA code
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/revoke-token` - Revoke refresh token
- `POST /api/auth/logout` - Logout (cookies)

## Authorization

### Protect Endpoints

```csharp
// Require any authenticated user
app.MapGet("/api/protected", () => "Secret data")
    .RequireAuthorization();

// Require specific role
app.MapGet("/api/admin", () => "Admin only")
    .RequireAuthorization(policy => policy.RequireRole("Admin"));

// Custom policy
app.MapGet("/api/custom", () => "Custom")
    .RequireAuthorization("CustomPolicy");
```

### Access User Info

```csharp
public class MyHandler(IUserContext userContext)
{
    public Task Handle()
    {
        var userId = userContext.AccountObjectId;
        var isAdmin = userContext.IsAdministrator;
        // ...
    }
}
```

## Configuration

### JWT Settings (appsettings.json)

```json
{
  "JwtSettings": {
    "SecretKey": "stored-in-user-secrets",
    "Issuer": "KB.API",
    "Audience": "KB.Client",
    "AccessTokenExpirationMinutes": "30",
    "RefreshTokenExpirationDays": "30"
  }
}
```

### User Secrets (Development)

```bash
dotnet user-secrets set "JwtSettings:SecretKey" "your-super-secret-key-min-32-characters-long"
```

## Database

### Connection String

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=KnowledgeBase;Username=postgres;Password=admin"
  }
}
```

### Run Migrations

```bash
cd KB.Infrastructure
dotnet ef migrations add MigrationName --startup-project ../KB.Server
dotnet ef database update --startup-project ../KB.Server
```

### Seed Users

```bash
cd KB.Operations
dotnet run
```

## Testing

### Manual Testing with curl

```bash
# Register
curl -X POST http://localhost:5237/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@kb.local","password":"Test@123","confirmPassword":"Test@123"}'

# Login (Mobile)
curl -X POST http://localhost:5237/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@kb.local","password":"Test@123","isMobileApp":true}'

# Use access token
curl http://localhost:5237/api/protected \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Architecture

### Layers

1. **KB.Domain** - User entity, enums (UserRole, MfaMethod)
2. **KB.Infrastructure** - ASP.NET Core Identity, repositories, services
3. **KB.Core** - CQRS handlers (RegisterCommand, LoginCommand, etc.)
4. **KB.Server** - API endpoints, authentication middleware

### Key Components

- **ApplicationUser**: Bridge between Identity and domain User
- **User (Domain)**: Business entity with MFA, roles, refresh tokens
- **AuthenticationService**: Handles Identity operations
- **TokenService**: Generates/validates JWT tokens
- **TotpService**: TOTP for authenticator apps
- **EmailService**: Sends MFA codes (stub implementation)

## Security Notes

- ✅ Passwords hashed with ASP.NET Core Identity defaults
- ✅ 5 failed attempts → 15-minute lockout
- ✅ Refresh tokens stored in database, revocable
- ✅ JWT tokens short-lived (30 minutes)
- ⚠️ Email confirmation disabled for testing (enable in production)
- ⚠️ EmailService is a stub - implement real email sending
- ⚠️ HTTPS required in production

## Troubleshooting

### "Invalid email or password"
- Check user exists in both `AspNetUsers` AND `Users` tables
- Run seeder to sync: `cd KB.Operations && dotnet run`

### Concurrency exceptions
- Fixed in latest version by removing Id from RefreshToken.Create()

### "Failed to determine https port"
- Normal in development, can be ignored or configure HTTPS

## Next Steps

1. ✅ Implement real email service for MFA
2. ✅ Add email confirmation workflow
3. ✅ Configure HTTPS for production
4. ✅ Add password reset functionality
5. ✅ Implement external auth providers (Google, Microsoft, etc.)

## Support

For detailed implementation, see:
- `/docs/authentication-implementation-plan.md` - Full technical plan
- `/docs/authorization-guide.md` - Authorization usage guide

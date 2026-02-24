# Authentication Implementation Plan

**Status**: Planning  
**Created**: 2026-02-24  
**Last Updated**: 2026-02-24

## Overview

This document outlines the implementation plan for adding comprehensive authentication and authorization to the Knowledge Base application. The current system relies on Azure AD claims, which will be replaced with ASP.NET Core Identity to support both web administration and mobile app access.

## Goals

- Implement ASP.NET Core Identity for user management
- Support dual authentication schemes:
  - Cookie-based authentication for web administration app
  - JWT token-based authentication for mobile app
- Enable Multi-Factor Authentication (MFA) with Email OTP and Authenticator app options
- Implement role-based authorization (Admin and User roles)
- Support refresh tokens for long-lived mobile sessions
- Maintain Clean Architecture and DDD principles throughout

## Current State

### Existing Infrastructure
- **User Context**: Minimal `IUserContext` interface with `AccountObjectId` (Guid) and `IsAdministrator` (bool)
- **Claims**: Expects Azure AD claims (`oid` for user ID, `roles` for authorization)
- **Authorization**: Basic `UseAuthorization()` middleware with no authentication configured
- **Domain Model**: No User entity exists; only placeholder `WeatherForecast` entity

### Client Applications
- **kb.client**: React 19 + Vite SPA (active administration app)
- **old_system/kb-app**: Archived React Native/Expo mobile app (reference only)

## Target Architecture

### Authentication Flow

#### Web Administration App (Cookie-based)
1. User enters email + password
2. Server validates credentials via ASP.NET Core Identity
3. If MFA enabled, user provides OTP/TOTP code
4. Server issues authentication cookie
5. Subsequent requests include cookie for authentication

#### Mobile App (JWT-based)
1. User enters email + password
2. Server validates credentials via ASP.NET Core Identity
3. If MFA enabled, user provides OTP/TOTP code
4. Server issues JWT access token + refresh token
5. Mobile app stores tokens securely
6. Access token used for API requests (short-lived: 15-30 min)
7. Refresh token used to obtain new access token (long-lived: 7-30 days)

### Security Features

- **Password Security**: ASP.NET Core Identity password hashing (PBKDF2)
- **Account Lockout**: Configurable failed login attempts and lockout duration
- **MFA Options**: 
  - Email OTP (6-digit code sent via email)
  - Authenticator App (TOTP using standard authenticator apps like Google Authenticator, Microsoft Authenticator)
- **Token Security**: 
  - JWT access tokens signed with secret key
  - Refresh tokens stored in database, can be revoked
  - Refresh token rotation on use

## Implementation Phases

### Phase 1: Domain Layer - User Entity & Interfaces

#### 1.1 Create User Aggregate Root
**File**: `KB.Domain/Entities/User.cs`

```csharp
public class User : DomainEntity<Guid>, IAggregateRoot, ISoftDeletable, IAuditable
{
    // Properties
    public string Email { get; protected set; } = default!;
    public string PasswordHash { get; protected set; } = default!;
    public bool EmailConfirmed { get; protected set; }
    public bool TwoFactorEnabled { get; protected set; }
    public UserRole Role { get; protected set; }
    public MfaMethod MfaMethod { get; protected set; }
    public string? AuthenticatorKey { get; protected set; }
    public DateTimeOffset? LockoutEnd { get; protected set; }
    public int AccessFailedCount { get; protected set; }
    
    // Collections
    public ICollection<RefreshToken> RefreshTokens { get; } = [];
    
    // Query Methods
    public bool CanLogin() => !IsDeleted && EmailConfirmed && !IsLockedOut();
    public bool IsLockedOut() => LockoutEnd.HasValue && LockoutEnd > DateTimeOffset.UtcNow;
    public void IncrementAccessFailedCount() { /* implementation */ }
    public void ResetAccessFailedCount() { /* implementation */ }
}
```

**Enums**:
- `UserRole`: Admin, User
- `MfaMethod`: None, EmailOtp, AuthenticatorApp

#### 1.2 Create RefreshToken Child Entity
**File**: `KB.Domain/Entities/RefreshToken.cs`

```csharp
public class RefreshToken : DomainEntity<Guid>
{
    public string Token { get; protected set; } = default!;
    public Guid UserId { get; protected set; }
    public DateTimeOffset ExpiresAt { get; protected set; }
    public DateTimeOffset CreatedAt { get; protected set; }
    public DateTimeOffset? RevokedAt { get; protected set; }
    
    // Navigation
    public User User { get; protected set; } = default!;
    
    // Query Methods
    public bool IsExpired() => DateTimeOffset.UtcNow >= ExpiresAt;
    public bool IsRevoked() => RevokedAt.HasValue;
    public bool IsValid() => !IsExpired() && !IsRevoked();
}
```

#### 1.3 Create Repository Interface
**File**: `KB.Domain/Interfaces/Repositories/IUserRepository.cs`

```csharp
public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> GetByIdWithRefreshTokensAsync(Guid id, CancellationToken cancellationToken = default);
}
```

### Phase 2: Infrastructure Layer - Identity & Data

#### 2.1 Install NuGet Packages
**Project**: KB.Infrastructure

```bash
dotnet add KB.Infrastructure package Microsoft.AspNetCore.Identity.EntityFrameworkCore
dotnet add KB.Infrastructure package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add KB.Infrastructure package System.IdentityModel.Tokens.Jwt
```

#### 2.2 Create ApplicationUser Bridge Class
**File**: `KB.Infrastructure/Identity/ApplicationUser.cs`

```csharp
public class ApplicationUser : IdentityUser<Guid>
{
    // Maps to domain User entity
    // Bridges ASP.NET Core Identity with domain model
}
```

#### 2.3 Update ApplicationDbContext
**File**: `KB.Infrastructure/Data/ApplicationDbContext.cs`

```csharp
public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    
    // Configure Identity tables with custom schema
}
```

#### 2.4 Create EF Core Configuration
**File**: `KB.Infrastructure/Data/Configurations/UserConfiguration.cs`

- Configure User entity mappings
- Configure RefreshToken as child entity
- Add soft-delete query filter: `.HasQueryFilter(e => !e.IsDeleted)`
- Convert enums to strings: `.HasConversion<string>()`
- Set max lengths for string properties

#### 2.5 Implement UserRepository
**File**: `KB.Infrastructure/Data/Repositories/UserRepository.cs`

- Implement `IUserRepository`
- Use EF Core for data access
- Include refresh tokens when needed

#### 2.6 Create Identity Services
**Files**: `KB.Infrastructure/Services/`

1. **TokenService**: 
   - Generate JWT access tokens
   - Generate refresh tokens
   - Validate tokens
   - Extract claims from tokens

2. **EmailService** (stub):
   - Send MFA codes via email
   - Interface for future SMTP/SendGrid implementation

3. **TotpService**:
   - Generate TOTP secrets for authenticator apps
   - Generate QR code data for setup
   - Validate TOTP codes

#### 2.7 Update Infrastructure Setup
**File**: `KB.Infrastructure/Setup.cs`

```csharp
public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
{
    // Existing setup...
    
    // Add Identity
    services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
    {
        // Password requirements
        options.Password.RequireDigit = true;
        options.Password.RequiredLength = 8;
        options.Password.RequireNonAlphanumeric = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireLowercase = true;
        
        // Lockout settings
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.AllowedForNewUsers = true;
        
        // User settings
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();
    
    // Register services
    services.AddScoped<IUserRepository, UserRepository>();
    services.AddScoped<ITokenService, TokenService>();
    services.AddScoped<IEmailService, EmailService>();
    services.AddScoped<ITotpService, TotpService>();
    
    return services;
}
```

### Phase 3: Core Layer - Authentication Commands & Queries

All commands/queries implement `IValidatableObject` for validation.  
All handlers are `sealed class` with primary constructors, return `Result<T>` or `Result`.

#### 3.1 RegisterCommand
**File**: `KB.Core/Features/Authentication/Register/RegisterCommand.cs`

```csharp
public sealed class RegisterCommand : IValidatableObject
{
    public required string Email { get; init; }
    public required string Password { get; init; }
    public required string ConfirmPassword { get; init; }
}

// Handler creates User entity, hashes password via Identity UserManager
// Returns Result<Guid> with new user ID
```

#### 3.2 LoginCommand
**File**: `KB.Core/Features/Authentication/Login/LoginCommand.cs`

```csharp
public sealed class LoginCommand : IValidatableObject
{
    public required string Email { get; init; }
    public required string Password { get; init; }
    public bool IsMobileApp { get; init; }
}

// Handler validates credentials, checks MFA requirement
// Returns Result<LoginResponse> with tokens or cookie flag
```

#### 3.3 EnableMfaCommand
**File**: `KB.Core/Features/Authentication/EnableMfa/EnableMfaCommand.cs`

```csharp
public sealed class EnableMfaCommand : IValidatableObject
{
    public Guid UserId { get; init; }
    public MfaMethod MfaMethod { get; init; }
}

// For Email: Send test OTP
// For Authenticator: Generate secret, return QR code data
// Returns Result<EnableMfaResponse>
```

#### 3.4 VerifyMfaCommand
**File**: `KB.Core/Features/Authentication/VerifyMfa/VerifyMfaCommand.cs`

```csharp
public sealed class VerifyMfaCommand : IValidatableObject
{
    public Guid UserId { get; init; }
    public required string Code { get; init; }
    public MfaMethod MfaMethod { get; init; }
}

// Validates OTP or TOTP code
// Returns Result<bool>
```

#### 3.5 RefreshTokenCommand
**File**: `KB.Core/Features/Authentication/RefreshToken/RefreshTokenCommand.cs`

```csharp
public sealed class RefreshTokenCommand : IValidatableObject
{
    public required string RefreshToken { get; init; }
}

// Validates refresh token, generates new access token
// Returns Result<RefreshTokenResponse>
```

#### 3.6 RevokeRefreshTokenCommand
**File**: `KB.Core/Features/Authentication/RevokeToken/RevokeRefreshTokenCommand.cs`

```csharp
public sealed class RevokeRefreshTokenCommand : IValidatableObject
{
    public Guid UserId { get; init; }
    public string? RefreshToken { get; init; } // null = revoke all
}

// Marks refresh token(s) as revoked
// Returns Result
```

#### 3.7 ChangePasswordCommand
**File**: `KB.Core/Features/Authentication/ChangePassword/ChangePasswordCommand.cs`

```csharp
public sealed class ChangePasswordCommand : IValidatableObject
{
    public Guid UserId { get; init; }
    public required string CurrentPassword { get; init; }
    public required string NewPassword { get; init; }
}

// Validates current password, updates to new password
// Returns Result
```

### Phase 4: API Layer - Authentication Endpoints

#### 4.1 Create Authentication Endpoints
**File**: `KB.Server/Endpoints/Auth/AuthenticationEndpoints.cs`

```csharp
internal static class AuthenticationEndpoints
{
    internal static IEndpointRouteBuilder MapAuthenticationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Authentication");
        
        group.MapPost("/register", RegisterAsync);
        group.MapPost("/login", LoginAsync);
        group.MapPost("/refresh", RefreshTokenAsync);
        group.MapPost("/revoke", RevokeTokenAsync).RequireAuthorization();
        group.MapPost("/logout", LogoutAsync).RequireAuthorization();
        group.MapPost("/mfa/enable", EnableMfaAsync).RequireAuthorization();
        group.MapPost("/mfa/verify", VerifyMfaAsync);
        group.MapPost("/change-password", ChangePasswordAsync).RequireAuthorization();
        
        return app;
    }
}
```

**Request Models**: Co-located `internal sealed record` for each endpoint

#### 4.2 Configure Authentication in Program.cs
**File**: `KB.Server/Program.cs`

```csharp
// Add Authentication services
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "MultiScheme";
    options.DefaultChallengeScheme = "MultiScheme";
})
.AddPolicyScheme("MultiScheme", "Cookie or JWT", options =>
{
    options.ForwardDefaultSelector = context =>
    {
        // Use JWT for mobile, cookies for web
        return context.Request.Headers.ContainsKey("Authorization")
            ? JwtBearerDefaults.AuthenticationScheme
            : CookieAuthenticationDefaults.AuthenticationScheme;
    };
})
.AddJwtBearer(options =>
{
    var jwtSettings = builder.Configuration.GetSection("JwtSettings");
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!))
    };
})
.AddCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;
});

// Add authorization
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));

// In middleware pipeline
app.UseAuthentication();
app.UseAuthorization();

// Map endpoints
app.MapAuthenticationEndpoints();
```

#### 4.3 Add JWT Configuration
**File**: `appsettings.json` (and user secrets for development)

```json
{
  "JwtSettings": {
    "SecretKey": "** Store in user secrets **",
    "Issuer": "KB.API",
    "Audience": "KB.Client",
    "AccessTokenExpirationMinutes": 30,
    "RefreshTokenExpirationDays": 30
  }
}
```

**Development setup**:
```bash
dotnet user-secrets set "JwtSettings:SecretKey" "your-256-bit-secret-key-here"
```

### Phase 5: Update Existing Infrastructure

#### 5.1 Update HttpUserContext
**File**: `KB.Server/HttpUserContext.cs`

Remove Azure AD logic, update to:
```csharp
public Guid GetCurrentUserAccountId()
{
    if (httpContextAccessor.HttpContext is null)
        return Guid.Empty;

    var claim = httpContextAccessor.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
    
    if (claim is null || !Guid.TryParse(claim.Value, out Guid userId))
        return Guid.Empty;

    return userId;
}

private bool HasRole(string roleName)
{
    if (httpContextAccessor.HttpContext is null)
        return false;

    return httpContextAccessor.HttpContext.User.IsInRole(roleName);
}
```

#### 5.2 Authorization Helpers
Document usage patterns:
- `[Authorize]` for authenticated endpoints
- `[Authorize(Roles = "Admin")]` for admin-only endpoints
- `[Authorize(Policy = "AdminOnly")]` for policy-based authorization

### Phase 6: Database Migration

#### 6.1 Create EF Core Migration
```bash
# From solution root
dotnet ef migrations add AddIdentityAndUserEntity \
    --project KB.Infrastructure \
    --startup-project KB.Operations \
    --output-dir Data/Migrations

# Review migration files

dotnet ef database update \
    --project KB.Infrastructure \
    --startup-project KB.Operations
```

**Expected tables**:
- `Users` (domain User entity)
- `RefreshTokens` (child of User)
- `AspNetUsers` (Identity ApplicationUser)
- `AspNetRoles` (Identity roles)
- `AspNetUserRoles` (Identity user-role mapping)
- `AspNetUserClaims`, `AspNetUserLogins`, `AspNetUserTokens`, `AspNetRoleClaims`

### Phase 7: Testing & Documentation

#### 7.1 Create Seed Data
**File**: `KB.Operations/Data/SeedData.cs`

```csharp
// Seed default admin user
var adminUser = new ApplicationUser
{
    Email = "admin@kb.local",
    UserName = "admin@kb.local",
    EmailConfirmed = true
};
await userManager.CreateAsync(adminUser, "Admin@123");
await userManager.AddToRoleAsync(adminUser, "Admin");

// Seed test regular user
var testUser = new ApplicationUser
{
    Email = "user@kb.local",
    UserName = "user@kb.local",
    EmailConfirmed = true
};
await userManager.CreateAsync(testUser, "User@123");
await userManager.AddToRoleAsync(testUser, "User");
```

#### 7.2 Manual Testing Checklist

**Registration Flow**:
- [ ] Register new user with valid email/password
- [ ] Validate email format
- [ ] Validate password strength
- [ ] Prevent duplicate emails

**Login Flow**:
- [ ] Login with correct credentials (web)
- [ ] Login with correct credentials (mobile - JWT)
- [ ] Login fails with incorrect password
- [ ] Account lockout after 5 failed attempts
- [ ] MFA prompt when enabled

**MFA Flow**:
- [ ] Enable Email OTP MFA
- [ ] Receive and verify Email OTP code
- [ ] Enable Authenticator App MFA
- [ ] Scan QR code and verify TOTP code
- [ ] Login requires MFA code when enabled

**Token Management**:
- [ ] Refresh token generates new access token
- [ ] Expired refresh token rejected
- [ ] Revoked refresh token rejected
- [ ] Revoke all tokens logs out user

**Authorization**:
- [ ] Protected endpoints require authentication
- [ ] Admin endpoints require Admin role
- [ ] Regular users cannot access admin endpoints

**Password Management**:
- [ ] Change password with correct current password
- [ ] Change password fails with incorrect current password

#### 7.3 Update Documentation

**Files to update**:
- `docs/api-reference.md` - Add authentication endpoints
- `docs/system-overview.md` - Update authentication section
- `docs/technical-decisions.md` - Document auth architecture decisions

**Topics to cover**:
- Authentication architecture overview
- Dual scheme setup (cookies vs JWT)
- MFA setup and usage
- Token lifecycle and refresh flow
- Security best practices

## Technical Decisions

### Why ASP.NET Core Identity?
- Industry-standard authentication solution for .NET
- Built-in password hashing, validation, and security features
- Extensible for MFA and external providers
- Well-documented and maintained by Microsoft

### Why Dual Authentication Scheme?
- **Web SPA**: Cookie-based auth provides better security (HttpOnly, Secure, SameSite)
- **Mobile App**: JWT tokens required for stateless, cross-platform authentication
- Policy scheme automatically routes requests to appropriate handler

### Why Refresh Tokens?
- Access tokens kept short-lived (15-30 min) for security
- Refresh tokens allow mobile users to stay logged in without re-entering credentials
- Revocable refresh tokens provide logout functionality for stateless JWT auth

### Why Domain User Entity + ApplicationUser?
- Maintains Clean Architecture separation of concerns
- Domain User entity holds business logic and rules
- ApplicationUser bridges ASP.NET Core Identity framework with domain
- Allows Identity features without coupling domain to infrastructure

### Password Requirements
Following NIST guidelines and ASP.NET Core Identity defaults:
- Minimum 8 characters
- Require digit, uppercase, lowercase, non-alphanumeric
- No maximum length restriction
- Password hashing via PBKDF2 (Identity default)

### Token Configuration
- **Access Token**: 30 minutes (configurable)
- **Refresh Token**: 30 days (configurable)
- **Cookie Expiration**: 8 hours with sliding expiration
- **Lockout Duration**: 15 minutes after 5 failed attempts

## Security Considerations

1. **Secrets Management**: 
   - JWT secret key in user secrets (development)
   - Environment variables or Azure Key Vault (production)
   - Never commit secrets to source control

2. **Password Storage**: 
   - ASP.NET Core Identity uses PBKDF2 with salt
   - Never store plain-text passwords
   - Validate password strength on registration and change

3. **Token Security**:
   - Access tokens transmitted in Authorization header only
   - Refresh tokens stored in database, can be revoked
   - Implement token rotation on refresh
   - Short access token lifetime limits exposure window

4. **Cookie Security**:
   - HttpOnly prevents XSS access to cookie
   - Secure flag requires HTTPS
   - SameSite=Strict prevents CSRF
   - Sliding expiration balances security and UX

5. **Account Security**:
   - Lockout after failed login attempts
   - Email confirmation recommended for production
   - MFA strongly recommended for admin accounts
   - Rate limiting on authentication endpoints (future enhancement)

## Migration Path

### Breaking Changes
- **IUserContext.AccountObjectId**: Name unchanged, but source changes from Azure AD `oid` to standard `NameIdentifier` claim
- **HttpUserContext**: Azure AD claims removed, works with standard claims
- **Authorization**: Endpoints without `[Authorize]` will become publicly accessible

### Migration Steps
1. Apply database migrations to create Identity tables
2. Deploy new authentication endpoints
3. Update web client to use new login endpoints
4. Seed initial admin user
5. Migrate existing users (if any) to new Identity system
6. Update any hardcoded Azure AD references

### Rollback Plan
If critical issues arise:
1. Revert database migration: `dotnet ef database update PreviousMigration`
2. Revert code changes via Git
3. Restore previous Azure AD configuration
4. Redeploy

## Future Enhancements

Not included in initial implementation but worth considering:

1. **Email Confirmation**: Send confirmation email on registration
2. **Password Reset**: Forgot password flow with email token
3. **External Providers**: OAuth with Google, Microsoft, GitHub
4. **SMS MFA**: Add SMS as third MFA option
5. **Audit Logging**: Track all authentication events
6. **Rate Limiting**: Prevent brute-force attacks
7. **Session Management**: View and revoke active sessions
8. **Remember Device**: Skip MFA on trusted devices
9. **Password History**: Prevent password reuse
10. **Account Recovery**: Security questions or backup codes

## Success Criteria

Implementation is complete when:

- [ ] All 26 todos are marked as done
- [ ] Database migration applied successfully
- [ ] Default admin user can login via web app (cookies)
- [ ] Test user can login via API (JWT)
- [ ] MFA can be enabled and verified for both email and authenticator
- [ ] Refresh token flow works for mobile authentication
- [ ] Protected endpoints require authentication
- [ ] Admin endpoints require Admin role
- [ ] All manual tests pass
- [ ] Documentation updated
- [ ] No existing functionality broken

## Resources

- [ASP.NET Core Identity Documentation](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity)
- [JWT Bearer Authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/jwt-authn)
- [TOTP Authenticator Apps](https://datatracker.ietf.org/doc/html/rfc6238)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

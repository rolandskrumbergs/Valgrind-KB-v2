# Authorization Guide

## Overview

The KB application uses ASP.NET Core's built-in authorization with a dual authentication scheme:
- **Cookie Authentication**: For web administration app
- **JWT Bearer Authentication**: For mobile app

## Using Authorization in Endpoints

### Require Authentication

To require authentication for an endpoint, use `.RequireAuthorization()`:

```csharp
endpoints
    .MapPost("/api/resource", Handler)
    .RequireAuthorization()  // Requires authenticated user
    .WithName("CreateResource");
```

### Require Specific Role

To require a specific role (Admin or User):

```csharp
endpoints
    .MapPost("/api/admin/resource", Handler)
    .RequireAuthorization(policy => policy.RequireRole("Admin"))  // Admin only
    .WithName("CreateAdminResource");
```

Or use the predefined policy:

```csharp
endpoints
    .MapPost("/api/admin/resource", Handler)
    .RequireAuthorization("AdminOnly")  // Admin only policy
    .WithName("CreateAdminResource");
```

### Allow Anonymous Access

By default, endpoints without `.RequireAuthorization()` are publicly accessible. To explicitly mark an endpoint as anonymous:

```csharp
endpoints
    .MapGet("/api/public", Handler)
    .AllowAnonymous()  // Explicitly public
    .WithName("PublicEndpoint");
```

## Available Roles

- `Admin` - Administrator with full access
- `User` - Regular user

## Available Policies

- `AdminOnly` - Requires Admin role

## Getting Current User

In endpoint handlers, inject `IUserContext` to get the current user:

```csharp
private static async Task<IResult> Handler(
    IUserContext userContext,
    CancellationToken cancellationToken)
{
    var userId = userContext.AccountObjectId;  // Current user's ID
    var isAdmin = userContext.IsAdministrator;  // Is user an admin?
    
    // ... handler logic
}
```

## Authentication Flows

### Web App (Cookie)
1. User logs in via `/api/auth/login` with `IsMobileApp = false`
2. Server issues authentication cookie
3. Browser automatically includes cookie in subsequent requests
4. Cookie expires after 8 hours of inactivity (sliding expiration)

### Mobile App (JWT)
1. User logs in via `/api/auth/login` with `IsMobileApp = true`
2. Server returns JWT access token + refresh token
3. Mobile app stores tokens securely
4. Mobile app includes `Authorization: Bearer <token>` header in requests
5. Access token expires after 30 minutes
6. Mobile app uses refresh token to get new access token via `/api/auth/refresh`
7. Refresh token expires after 30 days

## Security Best Practices

1. **Always use HTTPS** in production
2. **Store refresh tokens securely** on mobile devices (e.g., Keychain, Keystore)
3. **Implement token rotation** - refresh tokens are revoked and replaced on use
4. **Enable MFA for admin accounts**
5. **Monitor failed login attempts** - accounts lock after 5 failures for 15 minutes
6. **Use short-lived access tokens** - 30 minutes is recommended
7. **Revoke tokens on logout** - call `/api/auth/revoke` to invalidate refresh tokens

## Common Scenarios

### Protecting an Endpoint
```csharp
endpoints
    .MapPost("/api/orders", CreateOrder)
    .RequireAuthorization()  // Any authenticated user
    .WithName("CreateOrder");
```

### Admin-Only Endpoint
```csharp
endpoints
    .MapDelete("/api/users/{id}", DeleteUser)
    .RequireAuthorization("AdminOnly")  // Admin role required
    .WithName("DeleteUser");
```

### Checking User Permissions in Handler
```csharp
private static async Task<IResult> UpdateResource(
    Guid id,
    IUserContext userContext,
    CancellationToken cancellationToken)
{
    // Option 1: Check if user is admin
    if (!userContext.IsAdministrator)
    {
        return Results.Forbid();
    }
    
    // Option 2: Check if user owns the resource
    var resource = await repository.GetByIdAsync(id);
    if (resource.OwnerId != userContext.AccountObjectId)
    {
        return Results.NotFound();  // Use NotFound to prevent info disclosure
    }
    
    // ... proceed with update
}
```

## Testing Authentication

Use the following endpoints for authentication testing:

- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate and get tokens/cookie
- `POST /api/auth/refresh` - Refresh access token (mobile)
- `POST /api/auth/revoke` - Revoke refresh tokens
- `POST /api/auth/logout` - Sign out (web)
- `POST /api/auth/mfa/enable` - Enable MFA
- `POST /api/auth/mfa/verify` - Verify MFA code
- `POST /api/auth/change-password` - Change user password

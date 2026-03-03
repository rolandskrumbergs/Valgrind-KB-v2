using KB.Core.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;

namespace KB.Server.Endpoints.Auth;

internal static class LogoutEndpoint
{
    public static IEndpointRouteBuilder MapLogout(this IEndpointRouteBuilder endpoints)
    {
        endpoints
            .MapPost("/api/auth/logout", LogoutAsync)
            .RequireAuthorization()
            .WithName("Logout")
            .WithTags("Authentication");

        return endpoints;
    }

    private static async Task<IResult> LogoutAsync(HttpContext context)
    {
        await context.SignOutAsync(IdentityConstants.ApplicationScheme);
        return Results.Ok(new { message = "Logged out successfully" });
    }
}

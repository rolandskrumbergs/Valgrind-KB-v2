using KB.Core.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;

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
        await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Results.Ok(new { message = "Logged out successfully" });
    }
}

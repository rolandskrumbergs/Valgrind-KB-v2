namespace KB.Server.Endpoints.Auth;

internal static class AuthenticationEndpoints
{
    public static IEndpointRouteBuilder MapAuthenticationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapRegister();
        endpoints.MapLogin();
        endpoints.MapRefreshToken();
        endpoints.MapRevokeToken();
        endpoints.MapLogout();
        endpoints.MapEnableMfa();
        endpoints.MapVerifyMfa();
        endpoints.MapChangePassword();

        return endpoints;
    }
}

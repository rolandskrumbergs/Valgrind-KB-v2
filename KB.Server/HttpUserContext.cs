using System.Security.Claims;
using KB.Domain.Interfaces;

namespace KB.Server;

public class HttpUserContext(IHttpContextAccessor httpContextAccessor) : IUserContext
{
    public Guid AccountObjectId => GetCurrentUserAccountId();

    public bool IsAdministrator => HasRole("Admin");

    public Guid GetCurrentUserAccountId()
    {
        if (httpContextAccessor.HttpContext is null)
            return Guid.Empty;

        var context = httpContextAccessor.HttpContext;

        var claim = context.User.Claims.FirstOrDefault(claim =>
            claim.Type == "oid" ||
            claim.Type == "http://schemas.microsoft.com/identity/claims/objectidentifier");

        if (claim is null)
            return Guid.Empty;

        if (!Guid.TryParse(claim.Value, out Guid userAccountId))
            throw new InvalidOperationException("Failed to parse user id to GUID");

        return userAccountId;
    }

    private bool HasRole(string roleName)
    {
        if (httpContextAccessor.HttpContext is null)
            return false;

        return httpContextAccessor.HttpContext.User.Claims
            .Any(claim => (claim.Type == "roles" || claim.Type == ClaimTypes.Role) &&
                         claim.Value.Equals(roleName, StringComparison.OrdinalIgnoreCase));
    }
}

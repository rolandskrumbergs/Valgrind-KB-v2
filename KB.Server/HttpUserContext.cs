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
}

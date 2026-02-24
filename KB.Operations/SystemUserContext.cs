using KB.Domain.Interfaces;

namespace KB.Operations;

internal sealed class SystemUserContext : IUserContext
{
    private static readonly Guid SystemUserId = Guid.Empty;

    public Guid AccountObjectId => SystemUserId;
    public bool IsAdministrator => true;
}

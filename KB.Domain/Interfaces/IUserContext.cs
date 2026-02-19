namespace KB.Domain.Interfaces;

public interface IUserContext
{
    Guid AccountObjectId { get; }
    bool IsAdministrator { get; }
}

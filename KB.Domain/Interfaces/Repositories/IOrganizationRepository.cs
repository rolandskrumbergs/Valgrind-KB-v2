using KB.Domain.Entities;

namespace KB.Domain.Interfaces.Repositories;

public interface IOrganizationRepository : IRepository<Organization>
{
    Task<Organization?> GetWithSubscriptionsAsync(Guid id, CancellationToken cancellationToken = default);
}

using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace KB.Infrastructure.Data.Repositories;

public sealed class OrganizationRepository(AppDbContext dbContext) : EfRepository<Organization>(dbContext), IOrganizationRepository
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<Organization?> GetWithSubscriptionsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Organizations
            .Include(o => o.Subscriptions)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }
}

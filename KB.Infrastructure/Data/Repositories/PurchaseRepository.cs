using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Infrastructure.Data.Repositories;

public sealed class PurchaseRepository(AppDbContext dbContext) : EfRepository<Purchase>(dbContext), IPurchaseRepository
{
}

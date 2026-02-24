using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace KB.Infrastructure.Data.Repositories;

public sealed class UsageRecordRepository(AppDbContext dbContext) : EfRepository<UsageRecord>(dbContext), IUsageRecordRepository
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<List<UsageRecord>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UsageRecords
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<int> GetUserTotalTokensAsync(Guid userId, DateTimeOffset since, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UsageRecords
            .Where(r => r.UserId == userId && r.CreatedAt >= since)
            .SumAsync(r => r.TotalTokens, cancellationToken)
            .ConfigureAwait(false);
    }
}

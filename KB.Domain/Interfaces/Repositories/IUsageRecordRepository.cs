using KB.Domain.Entities;

namespace KB.Domain.Interfaces.Repositories;

public interface IUsageRecordRepository : IRepository<UsageRecord>
{
    Task<List<UsageRecord>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> GetUserTotalTokensAsync(Guid userId, DateTimeOffset since, CancellationToken cancellationToken = default);
}

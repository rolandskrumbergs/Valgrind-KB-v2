using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace KB.Infrastructure.Data.Repositories;

public sealed class AiProfileRepository(AppDbContext dbContext) : EfRepository<AiProfile>(dbContext), IAiProfileRepository
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<AiProfile?> GetActiveProfileAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.AiProfiles
            .FirstOrDefaultAsync(p => p.IsActive, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<List<AiProfile>> GetByKnowledgeBaseIdAsync(Guid knowledgeBaseId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.AiProfiles
            .Where(p => p.KnowledgeBaseId == knowledgeBaseId)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}

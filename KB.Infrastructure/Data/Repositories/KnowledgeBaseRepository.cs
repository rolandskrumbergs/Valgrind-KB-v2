using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace KB.Infrastructure.Data.Repositories;

public sealed class KnowledgeBaseRepository(AppDbContext dbContext) : EfRepository<KnowledgeBase>(dbContext), IKnowledgeBaseRepository
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<KnowledgeBase?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        return await _dbContext.KnowledgeBases
            .FirstOrDefaultAsync(kb => kb.Slug == slug, cancellationToken)
            .ConfigureAwait(false);
    }
}

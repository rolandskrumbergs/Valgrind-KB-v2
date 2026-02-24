using KB.Domain.Entities;
using KB.Domain.Enums;
using KB.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace KB.Infrastructure.Data.Repositories;

public sealed class DocumentRepository(AppDbContext dbContext) : EfRepository<Document>(dbContext), IDocumentRepository
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<List<Document>> GetByKnowledgeBaseIdAsync(Guid knowledgeBaseId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Documents
            .Where(d => d.KnowledgeBaseId == knowledgeBaseId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<Document?> GetByContentHashAsync(Guid knowledgeBaseId, string contentHash, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Documents
            .FirstOrDefaultAsync(d => d.KnowledgeBaseId == knowledgeBaseId && d.ContentHash == contentHash, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<List<Document>> GetByStatusAsync(Guid knowledgeBaseId, ProcessingStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Documents
            .Where(d => d.KnowledgeBaseId == knowledgeBaseId && d.ProcessingStatus == status)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}

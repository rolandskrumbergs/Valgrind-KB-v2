using KB.Domain.Entities;
using KB.Domain.Enums;

namespace KB.Domain.Interfaces.Repositories;

public interface IDocumentRepository : IRepository<Document>
{
    Task<List<Document>> GetByKnowledgeBaseIdAsync(Guid knowledgeBaseId, CancellationToken cancellationToken = default);
    Task<Document?> GetByContentHashAsync(Guid knowledgeBaseId, string contentHash, CancellationToken cancellationToken = default);
    Task<List<Document>> GetByStatusAsync(Guid knowledgeBaseId, ProcessingStatus status, CancellationToken cancellationToken = default);
}

using KB.Domain.Entities;

namespace KB.Domain.Interfaces.Repositories;

public interface IAiProfileRepository : IRepository<AiProfile>
{
    Task<AiProfile?> GetActiveProfileAsync(CancellationToken cancellationToken = default);
    Task<List<AiProfile>> GetByKnowledgeBaseIdAsync(Guid knowledgeBaseId, CancellationToken cancellationToken = default);
}

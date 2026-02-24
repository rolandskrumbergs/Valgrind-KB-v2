using KB.Domain.Entities;

namespace KB.Domain.Interfaces.Repositories;

public interface IKnowledgeBaseRepository : IRepository<KnowledgeBase>
{
    Task<KnowledgeBase?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
}

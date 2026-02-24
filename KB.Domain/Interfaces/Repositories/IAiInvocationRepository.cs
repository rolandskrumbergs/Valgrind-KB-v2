using KB.Domain.Entities;

namespace KB.Domain.Interfaces.Repositories;

public interface IAiInvocationRepository : IRepository<AiInvocation>
{
    Task<List<AiInvocation>> GetByConversationIdAsync(Guid conversationId, CancellationToken cancellationToken = default);
}

using KB.Domain.Entities;

namespace KB.Domain.Interfaces.Repositories;

public interface IConversationRepository : IRepository<Conversation>
{
    Task<Conversation?> GetWithMessagesAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<Conversation>> GetUserConversationsAsync(Guid userId, CancellationToken cancellationToken = default);
}

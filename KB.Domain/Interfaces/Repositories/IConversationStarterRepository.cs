using KB.Domain.Entities;

namespace KB.Domain.Interfaces.Repositories;

public interface IConversationStarterRepository : IRepository<ConversationStarter>
{
    Task<List<ConversationStarter>> GetActiveStartersAsync(CancellationToken cancellationToken = default);
}

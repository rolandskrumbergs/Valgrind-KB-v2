using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace KB.Infrastructure.Data.Repositories;

public sealed class ConversationRepository(AppDbContext dbContext) : EfRepository<Conversation>(dbContext), IConversationRepository
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<Conversation?> GetWithMessagesAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Conversations
            .Include(c => c.Messages.OrderBy(m => m.CreatedAt))
            .Include(c => c.Feedbacks)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<List<Conversation>> GetUserConversationsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Conversations
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}

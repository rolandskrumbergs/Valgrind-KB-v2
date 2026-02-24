using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace KB.Infrastructure.Data.Repositories;

public sealed class ConversationStarterRepository(AppDbContext dbContext) : EfRepository<ConversationStarter>(dbContext), IConversationStarterRepository
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<List<ConversationStarter>> GetActiveStartersAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.ConversationStarters
            .Where(s => s.IsActive)
            .OrderBy(s => s.SortOrder)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}

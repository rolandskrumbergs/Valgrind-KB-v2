using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace KB.Infrastructure.Data.Repositories;

public sealed class AiInvocationRepository(AppDbContext dbContext) : EfRepository<AiInvocation>(dbContext), IAiInvocationRepository
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<List<AiInvocation>> GetByConversationIdAsync(Guid conversationId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.AiInvocations
            .Where(i => i.ConversationId == conversationId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}

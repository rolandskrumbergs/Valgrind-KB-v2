using KB.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace KB.Infrastructure.Data.Interceptors;

public sealed class AuditingInterceptor(IUserContext userContext) : SaveChangesInterceptor
{
    private readonly IUserContext _userContext = userContext;

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(eventData);

        if (eventData.Context is null)
        {
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        var currentUserAccountId = _userContext.AccountObjectId;

        IEnumerable<EntityEntry<IAuditable>> addedEntries =
            eventData.Context.ChangeTracker.Entries<IAuditable>()
                .Where(e => e.State == EntityState.Added);

        foreach (var entry in addedEntries)
        {
            entry.Entity.CreatedAt = DateTimeOffset.UtcNow;
            entry.Entity.CreatedBy = currentUserAccountId;
        }

        IEnumerable<EntityEntry<IAuditable>> modifiedEntries =
            eventData.Context.ChangeTracker.Entries<IAuditable>()
                .Where(e => e.State == EntityState.Modified);

        foreach (var entry in modifiedEntries)
        {
            entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
            entry.Entity.UpdatedBy = currentUserAccountId;
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}

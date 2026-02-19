using KB.Domain.Interfaces;
using KB.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace KB.Infrastructure.Data;

public class EfRepository<T>(AppDbContext dbContext) :
    IReadRepository<T>,
    IRepository<T>
    where T : class, IAggregateRoot
{
    private readonly DbContext _dbContext = dbContext;

    public async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        _dbContext.Set<T>().Add(entity);
        await SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return entity;
    }

    public async Task<IEnumerable<T>> AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
    {
        _dbContext.Set<T>().AddRange(entities);
        await SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return entities;
    }

    public async Task<int> UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        _dbContext.Set<T>().Update(entity);
        return await SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<int> UpdateRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
    {
        _dbContext.Set<T>().UpdateRange(entities);
        return await SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<int> DeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        _dbContext.Set<T>().Remove(entity);
        return await SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<int> DeleteRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
    {
        _dbContext.Set<T>().RemoveRange(entities);
        return await SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<T?> GetByIdAsync<TId>(TId id, CancellationToken cancellationToken = default) where TId : notnull
    {
        return await _dbContext.Set<T>().FindAsync([id], cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<List<T>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<T>().ToListAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<bool> AnyAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<T>().AnyAsync(cancellationToken).ConfigureAwait(false);
    }
}

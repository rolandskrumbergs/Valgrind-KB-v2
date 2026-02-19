namespace KB.Domain.Interfaces.Repositories;

public interface IRepository<T> : IReadRepository<T> where T : class, IAggregateRoot
{
    Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);
    Task<IEnumerable<T>> AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    Task<int> UpdateAsync(T entity, CancellationToken cancellationToken = default);
    Task<int> UpdateRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    Task<int> DeleteAsync(T entity, CancellationToken cancellationToken = default);
    Task<int> DeleteRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

namespace KB.Domain.Interfaces.Repositories;

public interface IReadRepository<T> where T : class, IAggregateRoot
{
    Task<T?> GetByIdAsync<TId>(TId id, CancellationToken cancellationToken = default) where TId : notnull;
    Task<List<T>> ListAsync(CancellationToken cancellationToken = default);
    Task<bool> AnyAsync(CancellationToken cancellationToken = default);
}

using System.ComponentModel.DataAnnotations.Schema;

namespace KB.Domain.Abstract;

public abstract class DomainEntity
{
    private readonly List<DomainEvent> _domainEvents = [];

    [NotMapped]
    public IEnumerable<DomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    public void RegisterDomainEvent(DomainEvent domainEvent) => _domainEvents.Add(domainEvent);

    public void ClearDomainEvents() => _domainEvents.Clear();
}

public abstract class DomainEntity<TId> : DomainEntity
{
    public TId Id { get; protected set; } = default!;
}

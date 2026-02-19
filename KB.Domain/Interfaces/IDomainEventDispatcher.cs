using KB.Domain.Abstract;

namespace KB.Domain.Interfaces;

public interface IDomainEventDispatcher
{
    Task DispatchAndClearEvents(IEnumerable<DomainEntity> entitiesWithEvents);
}

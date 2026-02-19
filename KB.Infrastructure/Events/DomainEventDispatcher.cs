using KB.Domain.Abstract;
using KB.Domain.Interfaces;

namespace KB.Infrastructure.Events;

public sealed class DomainEventDispatcher(IDomainEventChannel eventChannel) : IDomainEventDispatcher
{
    private readonly IDomainEventChannel _eventChannel = eventChannel;

    public async Task DispatchAndClearEvents(IEnumerable<DomainEntity> entitiesWithEvents)
    {
        if (!entitiesWithEvents.Any())
            return;

        foreach (var entity in entitiesWithEvents)
        {
            var events = entity.DomainEvents.ToList();

            foreach (var domainEvent in events)
            {
                await _eventChannel.PublishAsync(domainEvent);
            }

            entity.ClearDomainEvents();
        }
    }
}

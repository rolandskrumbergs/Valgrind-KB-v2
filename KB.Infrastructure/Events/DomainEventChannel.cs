using System.Threading.Channels;
using KB.Domain.Abstract;

namespace KB.Infrastructure.Events;

public interface IDomainEventChannel
{
    ValueTask PublishAsync(DomainEvent domainEvent, CancellationToken cancellationToken = default);
    IAsyncEnumerable<DomainEvent> ReadAllAsync(CancellationToken cancellationToken = default);
}

public sealed class DomainEventChannel : IDomainEventChannel
{
    private readonly Channel<DomainEvent> _channel;

    public DomainEventChannel()
    {
        _channel = Channel.CreateUnbounded<DomainEvent>(new UnboundedChannelOptions
        {
            SingleWriter = false,
            SingleReader = false
        });
    }

    public async ValueTask PublishAsync(DomainEvent domainEvent, CancellationToken cancellationToken = default)
    {
        await _channel.Writer.WriteAsync(domainEvent, cancellationToken);
    }

    public async IAsyncEnumerable<DomainEvent> ReadAllAsync(
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        await foreach (var domainEvent in _channel.Reader.ReadAllAsync(cancellationToken))
        {
            yield return domainEvent;
        }
    }
}

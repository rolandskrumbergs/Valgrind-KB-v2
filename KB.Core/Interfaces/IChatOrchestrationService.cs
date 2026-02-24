using KB.Core.Features.Conversations;

namespace KB.Core.Interfaces;

public interface IChatOrchestrationService
{
    IAsyncEnumerable<ChatStreamEvent> SendMessageAsync(
        Guid conversationId,
        string userMessage,
        Guid userId,
        CancellationToken cancellationToken = default);
}

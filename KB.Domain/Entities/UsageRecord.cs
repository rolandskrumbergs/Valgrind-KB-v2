using KB.Domain.Abstract;
using KB.Domain.Interfaces;

namespace KB.Domain.Entities;

public class UsageRecord : DomainEntity<Guid>, IAggregateRoot
{
    public Guid UserId { get; protected set; }
    public Guid? ConversationId { get; protected set; }
    public Guid? MessageId { get; protected set; }
    public int PromptTokens { get; protected set; }
    public int CompletionTokens { get; protected set; }
    public int TotalTokens { get; protected set; }
    public string Model { get; protected set; } = default!;
    public string? AiProfileSnapshot { get; protected set; }
    public DateTimeOffset CreatedAt { get; protected set; }

    public ApplicationUser User { get; protected set; } = default!;
    public Conversation? Conversation { get; protected set; }
    public ConversationMessage? Message { get; protected set; }

    public static UsageRecord Create(
        Guid userId,
        Guid? conversationId,
        Guid? messageId,
        int promptTokens,
        int completionTokens,
        string model,
        string? aiProfileSnapshot = null)
    {
        return new UsageRecord
        {
            UserId = userId,
            ConversationId = conversationId,
            MessageId = messageId,
            PromptTokens = promptTokens,
            CompletionTokens = completionTokens,
            TotalTokens = promptTokens + completionTokens,
            Model = model,
            AiProfileSnapshot = aiProfileSnapshot,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}

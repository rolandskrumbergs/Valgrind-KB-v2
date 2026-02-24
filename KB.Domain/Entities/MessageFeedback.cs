using KB.Domain.Abstract;

namespace KB.Domain.Entities;

public class MessageFeedback : DomainEntity<Guid>
{
    public Guid ConversationId { get; protected set; }
    public Guid MessageId { get; protected set; }
    public Guid UserId { get; protected set; }
    public bool IsPositive { get; protected set; }
    public DateTimeOffset CreatedAt { get; protected set; }

    public Conversation Conversation { get; protected set; } = default!;
    public ConversationMessage Message { get; protected set; } = default!;
    public ApplicationUser User { get; protected set; } = default!;

    public static MessageFeedback Create(Guid conversationId, Guid messageId, Guid userId, bool isPositive)
    {
        return new MessageFeedback
        {
            ConversationId = conversationId,
            MessageId = messageId,
            UserId = userId,
            IsPositive = isPositive,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}

using KB.Domain.Abstract;
using KB.Domain.Enums;
using KB.Domain.Interfaces;

namespace KB.Domain.Entities;

public class Conversation : DomainEntity<Guid>, IAggregateRoot, IAuditable
{
    public Guid UserId { get; protected set; }
    public string? Title { get; protected set; }
    public Guid? AiProfileId { get; protected set; }

    public ApplicationUser User { get; protected set; } = default!;
    public AiProfile? AiProfile { get; protected set; }

    public ICollection<ConversationMessage> Messages { get; } = [];
    public ICollection<MessageFeedback> Feedbacks { get; } = [];

    // IAuditable
    public DateTimeOffset CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    public void UpdateTitle(string title) => Title = title;

    public ConversationMessage AddMessage(MessageRole role, string? content, string? parts = null, string? aiProfileSnapshot = null)
    {
        var message = ConversationMessage.Create(Id, role, content, parts, aiProfileSnapshot);
        Messages.Add(message);
        return message;
    }

    public MessageFeedback AddFeedback(Guid messageId, Guid userId, bool isPositive)
    {
        var feedback = MessageFeedback.Create(Id, messageId, userId, isPositive);
        Feedbacks.Add(feedback);
        return feedback;
    }

    public static Conversation Create(Guid userId, Guid? aiProfileId, string? title = null)
    {
        return new Conversation
        {
            UserId = userId,
            AiProfileId = aiProfileId,
            Title = title
        };
    }
}

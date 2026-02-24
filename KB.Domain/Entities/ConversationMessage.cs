using KB.Domain.Abstract;
using KB.Domain.Enums;

namespace KB.Domain.Entities;

public class ConversationMessage : DomainEntity<Guid>
{
    public Guid ConversationId { get; protected set; }
    public MessageRole Role { get; protected set; }
    public string? Content { get; protected set; }
    public string? Parts { get; protected set; }
    public string? AiProfileSnapshot { get; protected set; }
    public DateTimeOffset CreatedAt { get; protected set; }

    public Conversation Conversation { get; protected set; } = default!;

    public void UpdateContent(string content) => Content = content;

    public static ConversationMessage Create(
        Guid conversationId,
        MessageRole role,
        string? content,
        string? parts = null,
        string? aiProfileSnapshot = null)
    {
        return new ConversationMessage
        {
            ConversationId = conversationId,
            Role = role,
            Content = content,
            Parts = parts,
            AiProfileSnapshot = aiProfileSnapshot,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}

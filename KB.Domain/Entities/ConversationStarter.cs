using KB.Domain.Abstract;
using KB.Domain.Interfaces;

namespace KB.Domain.Entities;

public class ConversationStarter : DomainEntity<Guid>, IAggregateRoot
{
    public string Text { get; protected set; } = default!;
    public int SortOrder { get; protected set; }
    public bool IsActive { get; protected set; }
    public DateTimeOffset CreatedAt { get; protected set; }

    public void Update(string text, int sortOrder, bool isActive)
    {
        Text = text;
        SortOrder = sortOrder;
        IsActive = isActive;
    }

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;

    public static ConversationStarter Create(string text, int sortOrder, bool isActive = true)
    {
        return new ConversationStarter
        {
            Text = text,
            SortOrder = sortOrder,
            IsActive = isActive,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}

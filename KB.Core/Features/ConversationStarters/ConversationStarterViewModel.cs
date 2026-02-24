namespace KB.Core.Features.ConversationStarters;

public sealed record ConversationStarterViewModel(
    Guid Id,
    string Text,
    int SortOrder,
    bool IsActive,
    DateTimeOffset CreatedAt);

namespace KB.Core.Features.Conversations;

public sealed record ConversationViewModel(
    Guid Id,
    Guid UserId,
    string? Title,
    Guid? AiProfileId,
    DateTimeOffset CreatedAt,
    IReadOnlyList<ConversationMessageViewModel> Messages);

public sealed record ConversationMessageViewModel(
    Guid Id,
    string Role,
    string? Content,
    DateTimeOffset CreatedAt);

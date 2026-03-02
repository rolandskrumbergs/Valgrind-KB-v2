namespace KB.Core.Features.Subscriptions;

public sealed record SubscriptionViewModel(
    Guid Id,
    Guid OrganizationId,
    Guid? UserId,
    bool IsActive,
    DateTimeOffset? ActivatedAt,
    DateTimeOffset? DeactivatedAt,
    DateTimeOffset CreatedAt);

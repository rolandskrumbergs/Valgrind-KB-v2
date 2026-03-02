using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.Subscriptions.Assign;

public sealed class AssignSubscriptionCommand : IValidatableObject
{
    public required Guid OrganizationId { get; init; }
    public required Guid SubscriptionId { get; init; }
    public required Guid UserId { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (OrganizationId == Guid.Empty)
            yield return new ValidationResult("OrganizationId is required.", [nameof(OrganizationId)]);

        if (SubscriptionId == Guid.Empty)
            yield return new ValidationResult("SubscriptionId is required.", [nameof(SubscriptionId)]);

        if (UserId == Guid.Empty)
            yield return new ValidationResult("UserId is required.", [nameof(UserId)]);
    }
}

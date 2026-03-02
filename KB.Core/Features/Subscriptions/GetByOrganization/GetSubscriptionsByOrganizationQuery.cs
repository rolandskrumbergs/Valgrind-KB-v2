using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.Subscriptions.GetByOrganization;

public sealed class GetSubscriptionsByOrganizationQuery : IValidatableObject
{
    public required Guid OrganizationId { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (OrganizationId == Guid.Empty)
            yield return new ValidationResult("OrganizationId is required.", [nameof(OrganizationId)]);
    }
}

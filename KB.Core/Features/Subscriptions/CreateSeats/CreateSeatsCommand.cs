using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.Subscriptions.CreateSeats;

public sealed class CreateSeatsCommand : IValidatableObject
{
    public required Guid OrganizationId { get; init; }
    public required int Count { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (OrganizationId == Guid.Empty)
            yield return new ValidationResult("OrganizationId is required.", [nameof(OrganizationId)]);

        if (Count <= 0)
            yield return new ValidationResult("Count must be greater than 0.", [nameof(Count)]);
    }
}

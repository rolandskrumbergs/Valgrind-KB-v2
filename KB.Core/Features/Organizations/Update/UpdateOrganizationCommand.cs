using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.Organizations.Update;

public sealed class UpdateOrganizationCommand : IValidatableObject
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required int MaxSeats { get; init; }
    public string? ContactInfo { get; init; }
    public string? InvoiceInfo { get; init; }
    public required bool IsActive { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Id == Guid.Empty)
            yield return new ValidationResult("Id is required.", [nameof(Id)]);

        if (string.IsNullOrWhiteSpace(Name))
            yield return new ValidationResult("Name is required.", [nameof(Name)]);

        if (MaxSeats <= 0)
            yield return new ValidationResult("MaxSeats must be greater than 0.", [nameof(MaxSeats)]);
    }
}

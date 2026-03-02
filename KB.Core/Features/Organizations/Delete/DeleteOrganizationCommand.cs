using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.Organizations.Delete;

public sealed class DeleteOrganizationCommand : IValidatableObject
{
    public required Guid Id { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Id == Guid.Empty)
            yield return new ValidationResult("Id is required.", [nameof(Id)]);
    }
}

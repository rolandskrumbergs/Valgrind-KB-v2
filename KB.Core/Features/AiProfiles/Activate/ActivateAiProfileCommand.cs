using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.AiProfiles.Activate;

public sealed class ActivateAiProfileCommand : IValidatableObject
{
    public required Guid Id { get; init; }
    public required bool IsActive { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Id == Guid.Empty)
        {
            yield return new ValidationResult("Id is required.", [nameof(Id)]);
        }
    }
}

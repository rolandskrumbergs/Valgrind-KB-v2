using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.AiProfiles.Delete;

public sealed class DeleteAiProfileCommand : IValidatableObject
{
    public required Guid Id { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Id == Guid.Empty)
        {
            yield return new ValidationResult("Id is required.", [nameof(Id)]);
        }
    }
}

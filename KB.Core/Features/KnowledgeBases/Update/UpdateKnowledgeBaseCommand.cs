using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.KnowledgeBases.Update;

public sealed class UpdateKnowledgeBaseCommand : IValidatableObject
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required bool IsActive { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Id == Guid.Empty)
        {
            yield return new ValidationResult("Id is required.", [nameof(Id)]);
        }

        if (string.IsNullOrWhiteSpace(Name))
        {
            yield return new ValidationResult("Name is required.", [nameof(Name)]);
        }
    }
}

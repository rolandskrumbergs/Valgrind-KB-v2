using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.KnowledgeBases.GetById;

public sealed class GetKnowledgeBaseByIdQuery : IValidatableObject
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

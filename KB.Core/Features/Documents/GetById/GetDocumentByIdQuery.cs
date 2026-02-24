using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.Documents.GetById;

public sealed class GetDocumentByIdQuery : IValidatableObject
{
    public required Guid KnowledgeBaseId { get; init; }
    public required Guid Id { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (KnowledgeBaseId == Guid.Empty)
        {
            yield return new ValidationResult("KnowledgeBaseId is required.", [nameof(KnowledgeBaseId)]);
        }

        if (Id == Guid.Empty)
        {
            yield return new ValidationResult("Id is required.", [nameof(Id)]);
        }
    }
}

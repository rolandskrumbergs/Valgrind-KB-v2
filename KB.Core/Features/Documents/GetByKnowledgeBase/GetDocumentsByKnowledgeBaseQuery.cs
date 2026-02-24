using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.Documents.GetByKnowledgeBase;

public sealed class GetDocumentsByKnowledgeBaseQuery : IValidatableObject
{
    public required Guid KnowledgeBaseId { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (KnowledgeBaseId == Guid.Empty)
        {
            yield return new ValidationResult("KnowledgeBaseId is required.", [nameof(KnowledgeBaseId)]);
        }
    }
}

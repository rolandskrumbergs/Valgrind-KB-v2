using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.AiProfiles.Update;

public sealed class UpdateAiProfileCommand : IValidatableObject
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required Guid KnowledgeBaseId { get; init; }
    public required string Model { get; init; }
    public required int TopK { get; init; }
    public required decimal MinRelevanceThreshold { get; init; }
    public required int MinRelevanceChunksRequired { get; init; }
    public required decimal HighConfidenceThreshold { get; init; }
    public required int HighConfidenceChunksRequired { get; init; }

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

        if (KnowledgeBaseId == Guid.Empty)
        {
            yield return new ValidationResult("KnowledgeBaseId is required.", [nameof(KnowledgeBaseId)]);
        }

        if (string.IsNullOrWhiteSpace(Model))
        {
            yield return new ValidationResult("Model is required.", [nameof(Model)]);
        }

        if (TopK <= 0)
        {
            yield return new ValidationResult("TopK must be greater than 0.", [nameof(TopK)]);
        }
    }
}

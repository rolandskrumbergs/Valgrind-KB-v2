using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.KnowledgeBases.Create;

public sealed class CreateKnowledgeBaseCommand : IValidatableObject
{
    public required string Name { get; init; }
    public required string Slug { get; init; }
    public string? Description { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Name))
        {
            yield return new ValidationResult("Name is required.", [nameof(Name)]);
        }

        if (string.IsNullOrWhiteSpace(Slug))
        {
            yield return new ValidationResult("Slug is required.", [nameof(Slug)]);
        }
        else if (!System.Text.RegularExpressions.Regex.IsMatch(Slug, @"^[a-z0-9]+(?:-[a-z0-9]+)*$"))
        {
            yield return new ValidationResult("Slug must be lowercase alphanumeric with hyphens.", [nameof(Slug)]);
        }
    }
}

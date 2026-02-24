using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.ConversationStarters.BulkReplace;

public sealed class BulkReplaceConversationStartersCommand : IValidatableObject
{
    public required List<StarterItem> Starters { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Starters is null || Starters.Count == 0)
        {
            yield return new ValidationResult("At least one starter is required.", [nameof(Starters)]);
        }

        if (Starters is not null)
        {
            for (var i = 0; i < Starters.Count; i++)
            {
                if (string.IsNullOrWhiteSpace(Starters[i].Text))
                {
                    yield return new ValidationResult($"Starter at index {i} must have text.", [nameof(Starters)]);
                }
            }
        }
    }
}

public sealed record StarterItem(string Text, int SortOrder, bool IsActive);

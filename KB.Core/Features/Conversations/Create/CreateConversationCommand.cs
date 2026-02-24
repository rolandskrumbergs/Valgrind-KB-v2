using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.Conversations.Create;

public sealed class CreateConversationCommand : IValidatableObject
{
    public Guid? AiProfileId { get; init; }
    public string? Title { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        // AiProfileId and Title are optional
        yield break;
    }
}

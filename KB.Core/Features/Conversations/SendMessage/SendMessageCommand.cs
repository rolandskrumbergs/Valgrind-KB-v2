using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.Conversations.SendMessage;

public sealed class SendMessageCommand : IValidatableObject
{
    public required Guid ConversationId { get; init; }
    public required string Content { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (ConversationId == Guid.Empty)
        {
            yield return new ValidationResult("ConversationId is required.", [nameof(ConversationId)]);
        }

        if (string.IsNullOrWhiteSpace(Content))
        {
            yield return new ValidationResult("Message content is required.", [nameof(Content)]);
        }
    }
}

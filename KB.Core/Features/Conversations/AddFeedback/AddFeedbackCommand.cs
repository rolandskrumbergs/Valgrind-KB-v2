using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.Conversations.AddFeedback;

public sealed class AddFeedbackCommand : IValidatableObject
{
    public required Guid ConversationId { get; init; }
    public required Guid MessageId { get; init; }
    public required bool IsPositive { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (ConversationId == Guid.Empty)
        {
            yield return new ValidationResult("ConversationId is required.", [nameof(ConversationId)]);
        }

        if (MessageId == Guid.Empty)
        {
            yield return new ValidationResult("MessageId is required.", [nameof(MessageId)]);
        }
    }
}

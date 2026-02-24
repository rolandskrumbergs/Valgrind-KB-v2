using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.Authentication.ChangePassword;

public sealed class ChangePasswordCommand : IValidatableObject
{
    public Guid UserId { get; init; }
    public required string CurrentPassword { get; init; }
    public required string NewPassword { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (UserId == Guid.Empty)
        {
            yield return new ValidationResult("User ID is required.", [nameof(UserId)]);
        }

        if (string.IsNullOrWhiteSpace(CurrentPassword))
        {
            yield return new ValidationResult("Current password is required.", [nameof(CurrentPassword)]);
        }

        if (string.IsNullOrWhiteSpace(NewPassword))
        {
            yield return new ValidationResult("New password is required.", [nameof(NewPassword)]);
        }

        if (CurrentPassword == NewPassword)
        {
            yield return new ValidationResult("New password must be different from current password.", [nameof(NewPassword)]);
        }
    }
}

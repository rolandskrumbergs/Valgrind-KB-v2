using System.ComponentModel.DataAnnotations;
using KB.Domain.Enums;

namespace KB.Core.Features.Authentication.VerifyMfa;

public sealed class VerifyMfaCommand : IValidatableObject
{
    public Guid UserId { get; init; }
    public required string Code { get; init; }
    public MfaMethod MfaMethod { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (UserId == Guid.Empty)
        {
            yield return new ValidationResult("User ID is required.", [nameof(UserId)]);
        }

        if (string.IsNullOrWhiteSpace(Code))
        {
            yield return new ValidationResult("Code is required.", [nameof(Code)]);
        }

        if (MfaMethod == MfaMethod.None)
        {
            yield return new ValidationResult("MFA method must be specified.", [nameof(MfaMethod)]);
        }
    }
}

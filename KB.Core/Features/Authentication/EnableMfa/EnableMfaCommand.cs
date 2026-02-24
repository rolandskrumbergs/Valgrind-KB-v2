using System.ComponentModel.DataAnnotations;
using KB.Domain.Enums;

namespace KB.Core.Features.Authentication.EnableMfa;

public sealed class EnableMfaCommand : IValidatableObject
{
    public Guid UserId { get; init; }
    public MfaMethod MfaMethod { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (UserId == Guid.Empty)
        {
            yield return new ValidationResult("User ID is required.", [nameof(UserId)]);
        }

        if (MfaMethod == MfaMethod.None)
        {
            yield return new ValidationResult("MFA method must be specified.", [nameof(MfaMethod)]);
        }
    }
}

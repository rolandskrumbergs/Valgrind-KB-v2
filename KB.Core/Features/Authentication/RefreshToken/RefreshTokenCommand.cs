using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.Authentication.RefreshToken;

public sealed class RefreshTokenCommand : IValidatableObject
{
    public required string RefreshToken { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(RefreshToken))
        {
            yield return new ValidationResult("Refresh token is required.", [nameof(RefreshToken)]);
        }
    }
}

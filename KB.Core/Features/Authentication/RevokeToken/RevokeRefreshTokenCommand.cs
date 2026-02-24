using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.Authentication.RevokeToken;

public sealed class RevokeRefreshTokenCommand : IValidatableObject
{
    public Guid UserId { get; init; }
    public string? RefreshToken { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (UserId == Guid.Empty)
        {
            yield return new ValidationResult("User ID is required.", [nameof(UserId)]);
        }
    }
}

using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.Authentication.Login;

public sealed class LoginCommand : IValidatableObject
{
    public required string Email { get; init; }
    public required string Password { get; init; }
    public bool IsMobileApp { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Email))
        {
            yield return new ValidationResult("Email is required.", [nameof(Email)]);
        }

        if (string.IsNullOrWhiteSpace(Password))
        {
            yield return new ValidationResult("Password is required.", [nameof(Password)]);
        }
    }
}

using System.ComponentModel.DataAnnotations;

namespace KB.Core.Features.Authentication.Register;

public sealed class RegisterCommand : IValidatableObject
{
    public required string Email { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required string Password { get; init; }
    public required string ConfirmPassword { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Email))
        {
            yield return new ValidationResult("Email is required.", [nameof(Email)]);
        }
        else if (!IsValidEmail(Email))
        {
            yield return new ValidationResult("Invalid email format.", [nameof(Email)]);
        }

        if (string.IsNullOrWhiteSpace(FirstName))
        {
            yield return new ValidationResult("First name is required.", [nameof(FirstName)]);
        }

        if (string.IsNullOrWhiteSpace(LastName))
        {
            yield return new ValidationResult("Last name is required.", [nameof(LastName)]);
        }

        if (string.IsNullOrWhiteSpace(Password))
        {
            yield return new ValidationResult("Password is required.", [nameof(Password)]);
        }

        if (string.IsNullOrWhiteSpace(ConfirmPassword))
        {
            yield return new ValidationResult("Confirm password is required.", [nameof(ConfirmPassword)]);
        }

        if (Password != ConfirmPassword)
        {
            yield return new ValidationResult("Passwords do not match.", [nameof(ConfirmPassword)]);
        }
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}

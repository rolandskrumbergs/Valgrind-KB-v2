using System.ComponentModel.DataAnnotations;

namespace KB.Core.Infrastructure;

public static class ValidationHelper
{
    public static Result Validate(IValidatableObject validatable)
    {
        ArgumentNullException.ThrowIfNull(validatable);

        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(validatable);
        var isValid = Validator.TryValidateObject(validatable, validationContext, validationResults, validateAllProperties: true);

        if (!isValid)
        {
            var errors = validationResults.Select(vr => vr.ErrorMessage ?? "Validation error");
            return Result.Invalid([.. errors]);
        }

        return Result.Success();
    }

    public static Result<T> Validate<T>(IValidatableObject validatable)
    {
        ArgumentNullException.ThrowIfNull(validatable);

        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(validatable);
        var isValid = Validator.TryValidateObject(validatable, validationContext, validationResults, validateAllProperties: true);

        if (!isValid)
        {
            var errors = validationResults.Select(vr => vr.ErrorMessage ?? "Validation error");
            return Result<T>.Invalid([.. errors]);
        }

        return Result<T>.Success(default!);
    }
}

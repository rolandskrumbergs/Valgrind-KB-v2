using KB.Core.Infrastructure;

namespace KB.Server;

internal static class ResultHttpExtensions
{
    public static IResult ToHttpResult<T>(this Result<T> result)
    {
        ArgumentNullException.ThrowIfNull(result, nameof(result));

        return result.Status switch
        {
            ResultStatus.Ok => result.Value is null ? Results.Ok() : Results.Ok(result.Value),
            ResultStatus.Created => Results.Created(string.Empty, result.Value),
            ResultStatus.NoContent => Results.NoContent(),
            ResultStatus.NotFound => CreateProblemResult(result, StatusCodes.Status404NotFound, "Not Found"),
            ResultStatus.Unauthorized => Results.Unauthorized(),
            ResultStatus.Invalid => CreateValidationProblemResult(result),
            ResultStatus.Error => CreateProblemResult(result, StatusCodes.Status500InternalServerError, "Internal Server Error"),
            _ => CreateProblemResult(result, StatusCodes.Status500InternalServerError, "Unexpected Error")
        };
    }

    public static IResult ToHttpResult(this Result? result)
    {
        ArgumentNullException.ThrowIfNull(result, nameof(result));

        return result.Status switch
        {
            ResultStatus.Ok => Results.Ok(),
            ResultStatus.Created => Results.StatusCode(StatusCodes.Status201Created),
            ResultStatus.NoContent => Results.NoContent(),
            ResultStatus.NotFound => CreateProblemResult(result, StatusCodes.Status404NotFound, "Not Found"),
            ResultStatus.Unauthorized => Results.Unauthorized(),
            ResultStatus.Invalid => CreateValidationProblemResult(result),
            ResultStatus.Error => CreateProblemResult(result, StatusCodes.Status500InternalServerError, "Internal Server Error"),
            _ => CreateProblemResult(result, StatusCodes.Status500InternalServerError, "Unexpected Error")
        };
    }

    private static IResult CreateProblemResult<T>(Result<T> result, int statusCode, string title)
    {
        return Results.Problem(
            detail: result.Errors.Any() ? string.Join(", ", result.Errors) : null,
            statusCode: statusCode,
            title: title);
    }

    private static IResult CreateProblemResult(Result result, int statusCode, string title)
    {
        return Results.Problem(
            detail: result.Errors.Any() ? string.Join(", ", result.Errors) : null,
            statusCode: statusCode,
            title: title);
    }

    private static IResult CreateValidationProblemResult<T>(Result<T> result)
    {
        return Results.ValidationProblem(
            errors: new Dictionary<string, string[]>
            {
                { "ValidationErrors", result.Errors.ToArray() }
            },
            title: "One or more validation errors occurred");
    }

    private static IResult CreateValidationProblemResult(Result result)
    {
        return Results.ValidationProblem(
            errors: new Dictionary<string, string[]>
            {
                { "ValidationErrors", result.Errors.ToArray() }
            },
            title: "One or more validation errors occurred");
    }
}

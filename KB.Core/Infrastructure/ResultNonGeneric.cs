namespace KB.Core.Infrastructure;

public record Result : Result<Result>
{
    public Result() : base() { }
    protected internal Result(ResultStatus status) : base(status) { }

    public static Result Success() => new();
    public static Result SuccessWithMessage(string successMessage) => new() { SuccessMessage = successMessage };
    public static Result<T> Success<T>(T value) => new(value);
    public static Result<T> Success<T>(T value, string successMessage) => new(value, successMessage);
    public static Result<T> Created<T>(T value) => Result<T>.Created(value);
    public new static Result Created() => new(ResultStatus.Created);
    public new static Result Invalid(params string[] errorMessages) => new(ResultStatus.Invalid) { Errors = errorMessages };
    public new static Result Error(string errorMessage) => new(ResultStatus.Error) { Errors = new[] { errorMessage } };
    public new static Result Error(params string[] errorMessages) => new(ResultStatus.Error) { Errors = [.. errorMessages] };
    public new static Result NotFound() => new Result(ResultStatus.NotFound);
    public new static Result NotFound(params string[] errorMessages) => new(ResultStatus.NotFound) { Errors = errorMessages };
    public new static Result Forbidden() => new(ResultStatus.Forbidden);
    public new static Result Forbidden(params string[] errorMessages) => new(ResultStatus.Forbidden) { Errors = errorMessages };
    public new static Result Unauthorized() => new(ResultStatus.Unauthorized);
    public new static Result Unauthorized(params string[] errorMessages) => new(ResultStatus.Unauthorized) { Errors = errorMessages };
    public new static Result Conflict() => new(ResultStatus.Conflict);
    public new static Result Conflict(params string[] errorMessages) => new(ResultStatus.Conflict) { Errors = errorMessages };
    public new static Result Unavailable(params string[] errorMessages) => new(ResultStatus.Unavailable) { Errors = errorMessages };
    public new static Result CriticalError(params string[] errorMessages) => new(ResultStatus.CriticalError) { Errors = errorMessages };
    public new static Result NoContent() => new(ResultStatus.NoContent);

    public static Result FromError<TSource>(Result<TSource> source) =>
        new(source.Status) { Errors = source.Errors };
}

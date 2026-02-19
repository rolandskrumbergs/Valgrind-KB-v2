namespace KB.Core.Infrastructure;

public enum ResultStatus
{
    Ok,
    Created,
    Error,
    Forbidden,
    Unauthorized,
    Invalid,
    NotFound,
    NoContent,
    Conflict,
    CriticalError,
    Unavailable
}

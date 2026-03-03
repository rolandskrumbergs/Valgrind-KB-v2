namespace KB.Core.Features.Authentication.Login;

public sealed record LoginResponse(
    bool RequiresMfa,
    string? AccessToken,
    string? RefreshToken,
    Guid? UserId,
    string? Role);

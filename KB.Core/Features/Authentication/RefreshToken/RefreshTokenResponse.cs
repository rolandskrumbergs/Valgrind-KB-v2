namespace KB.Core.Features.Authentication.RefreshToken;

public sealed record RefreshTokenResponse(
    string AccessToken,
    string RefreshToken);

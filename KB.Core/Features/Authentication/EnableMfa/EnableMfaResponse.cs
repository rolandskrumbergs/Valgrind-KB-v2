using KB.Domain.Enums;

namespace KB.Core.Features.Authentication.EnableMfa;

public sealed record EnableMfaResponse(
    MfaMethod Method,
    string? QrCodeUri,
    string? Secret);

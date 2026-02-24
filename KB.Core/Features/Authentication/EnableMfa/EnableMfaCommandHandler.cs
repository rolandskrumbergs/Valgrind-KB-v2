using KB.Core.Infrastructure;
using KB.Core.Interfaces;
using KB.Domain.Enums;

namespace KB.Core.Features.Authentication.EnableMfa;

public sealed class EnableMfaCommandHandler(
    IAuthenticationService authenticationService,
    ITotpService totpService,
    IEmailService emailService)
{
    private readonly IAuthenticationService _authenticationService = authenticationService;
    private readonly ITotpService _totpService = totpService;
    private readonly IEmailService _emailService = emailService;

    public async Task<Result<EnableMfaResponse>> Handle(EnableMfaCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return Result<EnableMfaResponse>.Invalid([.. validationResult.Errors]);
        }

        var user = await _authenticationService.GetUserByIdAsync(request.UserId, cancellationToken);
        if (user == null)
        {
            return Result<EnableMfaResponse>.NotFound($"User with ID {request.UserId} not found.");
        }

        if (request.MfaMethod == MfaMethod.EmailOtp)
        {
            await _authenticationService.EnableMfaAsync(request.UserId, MfaMethod.EmailOtp, null, cancellationToken);

            var testCode = GenerateEmailOtpCode();
            await _emailService.SendMfaCodeAsync(user.Email!, testCode, cancellationToken);

            return Result<EnableMfaResponse>.Success(new EnableMfaResponse(
                Method: MfaMethod.EmailOtp,
                QrCodeUri: null,
                Secret: null));
        }

        if (request.MfaMethod == MfaMethod.AuthenticatorApp)
        {
            var secret = _totpService.GenerateSecret();
            var qrCodeUri = _totpService.GenerateQrCodeUri(user.Email!, secret);

            await _authenticationService.EnableMfaAsync(request.UserId, MfaMethod.AuthenticatorApp, secret, cancellationToken);

            return Result<EnableMfaResponse>.Success(new EnableMfaResponse(
                Method: MfaMethod.AuthenticatorApp,
                QrCodeUri: qrCodeUri,
                Secret: secret));
        }

        return Result<EnableMfaResponse>.Invalid("Invalid MFA method.");
    }

    private static string GenerateEmailOtpCode()
    {
        return Random.Shared.Next(100000, 999999).ToString();
    }
}

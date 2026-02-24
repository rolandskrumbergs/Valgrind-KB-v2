using KB.Core.Infrastructure;
using KB.Core.Interfaces;
using KB.Domain.Enums;

namespace KB.Core.Features.Authentication.VerifyMfa;

public sealed class VerifyMfaCommandHandler(
    IAuthenticationService authenticationService,
    ITotpService totpService)
{
    private readonly IAuthenticationService _authenticationService = authenticationService;
    private readonly ITotpService _totpService = totpService;

    public async Task<Result<bool>> Handle(VerifyMfaCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return Result<bool>.Invalid([.. validationResult.Errors]);
        }

        var user = await _authenticationService.GetUserByIdAsync(request.UserId, cancellationToken);
        if (user == null)
        {
            return Result<bool>.NotFound($"User with ID {request.UserId} not found.");
        }

        if (!user.TwoFactorEnabled)
        {
            return Result<bool>.Invalid("MFA is not enabled for this user.");
        }

        if (user.MfaMethod != request.MfaMethod)
        {
            return Result<bool>.Invalid("MFA method mismatch.");
        }

        bool isValid = false;

        if (request.MfaMethod == MfaMethod.EmailOtp)
        {
            isValid = true;
        }
        else if (request.MfaMethod == MfaMethod.AuthenticatorApp)
        {
            if (string.IsNullOrEmpty(user.AuthenticatorKey))
            {
                return Result<bool>.Invalid("Authenticator key not configured.");
            }

            isValid = _totpService.ValidateCode(user.AuthenticatorKey, request.Code);
        }

        if (!isValid)
        {
            return Result<bool>.Invalid("Invalid verification code.");
        }

        return Result<bool>.Success(true);
    }
}

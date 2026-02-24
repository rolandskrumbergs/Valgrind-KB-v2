using KB.Core.Infrastructure;
using KB.Core.Interfaces;

namespace KB.Core.Features.Authentication.RevokeToken;

public sealed class RevokeRefreshTokenCommandHandler(IAuthenticationService authenticationService)
{
    private readonly IAuthenticationService _authenticationService = authenticationService;

    public async Task<Result> Handle(RevokeRefreshTokenCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return Result.Invalid([.. validationResult.Errors]);
        }

        var user = await _authenticationService.GetUserByIdWithRefreshTokensAsync(request.UserId, cancellationToken);
        if (user == null)
        {
            return Result.NotFound($"User with ID {request.UserId} not found.");
        }

        if (string.IsNullOrEmpty(request.RefreshToken))
        {
            foreach (var token in user.RefreshTokens.Where(rt => !rt.IsRevoked()))
            {
                token.Revoke();
            }
        }
        else
        {
            var token = user.RefreshTokens.FirstOrDefault(rt => rt.Token == request.RefreshToken);
            if (token == null)
            {
                return Result.NotFound("Refresh token not found.");
            }

            if (token.IsRevoked())
            {
                return Result.Invalid("Refresh token is already revoked.");
            }

            token.Revoke();
        }

        await _authenticationService.UpdateUserAsync(user, cancellationToken);

        return Result.Success();
    }
}
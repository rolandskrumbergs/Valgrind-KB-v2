using KB.Core.Infrastructure;
using KB.Core.Interfaces;

namespace KB.Core.Features.Authentication.ChangePassword;

public sealed class ChangePasswordCommandHandler(IAuthenticationService authenticationService)
{
    private readonly IAuthenticationService _authenticationService = authenticationService;

    public async Task<Result> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return Result.Invalid([.. validationResult.Errors]);
        }

        var user = await _authenticationService.GetUserByIdAsync(request.UserId, cancellationToken);
        if (user == null)
        {
            return Result.NotFound($"User with ID {request.UserId} not found.");
        }

        var (success, errors) = await _authenticationService.ChangePasswordAsync(
            request.UserId,
            request.CurrentPassword,
            request.NewPassword,
            cancellationToken);

        if (!success)
        {
            return Result.Invalid([.. errors]);
        }

        return Result.Success();
    }
}

using KB.Core.Infrastructure;
using KB.Core.Interfaces;
using KB.Domain.Enums;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Authentication.Register;

public sealed class RegisterCommandHandler(
    IAuthenticationService authenticationService)
{
    private readonly IAuthenticationService _authenticationService = authenticationService;

    public async Task<Result<Guid>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return Result<Guid>.Invalid([.. validationResult.Errors]);
        }

        var (success, errors, userId) = await _authenticationService.RegisterUserAsync(
            request.Email,
            request.Password,
            cancellationToken);

        if (!success)
        {
            return Result<Guid>.Invalid([.. errors]);
        }

        return Result<Guid>.Success(userId);
    }
}

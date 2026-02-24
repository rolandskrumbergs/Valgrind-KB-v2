using KB.Core.Infrastructure;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.AiProfiles.Activate;

public sealed class ActivateAiProfileCommandHandler(
    IAiProfileRepository aiProfileRepository)
{
    private readonly IAiProfileRepository _aiProfileRepository = aiProfileRepository;

    public async Task<Result> Handle(ActivateAiProfileCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return validationResult;
        }

        var profile = await _aiProfileRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (profile is null)
        {
            return Result.NotFound($"AI profile with ID '{request.Id}' not found.");
        }

        // Deactivate all other profiles first if activating
        if (request.IsActive)
        {
            var activeProfile = await _aiProfileRepository.GetActiveProfileAsync(cancellationToken).ConfigureAwait(false);
            if (activeProfile is not null && activeProfile.Id != request.Id)
            {
                activeProfile.Deactivate();
                await _aiProfileRepository.UpdateAsync(activeProfile, cancellationToken).ConfigureAwait(false);
            }

            profile.Activate();
        }
        else
        {
            profile.Deactivate();
        }

        await _aiProfileRepository.UpdateAsync(profile, cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }
}

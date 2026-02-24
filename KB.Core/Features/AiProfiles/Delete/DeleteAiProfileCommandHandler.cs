using KB.Core.Infrastructure;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.AiProfiles.Delete;

public sealed class DeleteAiProfileCommandHandler(
    IAiProfileRepository aiProfileRepository)
{
    private readonly IAiProfileRepository _aiProfileRepository = aiProfileRepository;

    public async Task<Result> Handle(DeleteAiProfileCommand request, CancellationToken cancellationToken)
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

        await _aiProfileRepository.DeleteAsync(profile, cancellationToken).ConfigureAwait(false);

        return Result.NoContent();
    }
}

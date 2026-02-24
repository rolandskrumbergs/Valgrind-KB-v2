using KB.Core.Infrastructure;
using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.AiProfiles.GetById;

public sealed class GetAiProfileByIdQueryHandler(
    IAiProfileRepository aiProfileRepository)
{
    private readonly IAiProfileRepository _aiProfileRepository = aiProfileRepository;

    public async Task<Result<AiProfileViewModel>> Handle(GetAiProfileByIdQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate<AiProfileViewModel>(request);
        if (!validationResult.IsSuccess)
        {
            return validationResult;
        }

        var profile = await _aiProfileRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (profile is null)
        {
            return Result.NotFound($"AI profile with ID '{request.Id}' not found.");
        }

        return Result<AiProfileViewModel>.Success(MapToViewModel(profile));
    }

    private static AiProfileViewModel MapToViewModel(AiProfile p) =>
        new(p.Id, p.Name, p.IsActive, p.KnowledgeBaseId, p.Model, p.TopK,
            p.MinRelevanceThreshold, p.MinRelevanceChunksRequired,
            p.HighConfidenceThreshold, p.HighConfidenceChunksRequired, p.CreatedAt);
}

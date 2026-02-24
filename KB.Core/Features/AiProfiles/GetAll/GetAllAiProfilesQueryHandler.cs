using KB.Core.Infrastructure;
using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.AiProfiles.GetAll;

public sealed class GetAllAiProfilesQueryHandler(
    IAiProfileRepository aiProfileRepository)
{
    private readonly IAiProfileRepository _aiProfileRepository = aiProfileRepository;

    public async Task<Result<List<AiProfileViewModel>>> Handle(GetAllAiProfilesQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var profiles = await _aiProfileRepository.ListAsync(cancellationToken).ConfigureAwait(false);

        var viewModels = profiles.Select(MapToViewModel).ToList();

        return Result<List<AiProfileViewModel>>.Success(viewModels);
    }

    private static AiProfileViewModel MapToViewModel(AiProfile p) =>
        new(p.Id, p.Name, p.IsActive, p.KnowledgeBaseId, p.Model, p.TopK,
            p.MinRelevanceThreshold, p.MinRelevanceChunksRequired,
            p.HighConfidenceThreshold, p.HighConfidenceChunksRequired, p.CreatedAt);
}

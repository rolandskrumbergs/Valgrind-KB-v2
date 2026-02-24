using KB.Core.Infrastructure;
using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.AiProfiles.Create;

public sealed class CreateAiProfileCommandHandler(
    IAiProfileRepository aiProfileRepository,
    IKnowledgeBaseRepository knowledgeBaseRepository)
{
    private readonly IAiProfileRepository _aiProfileRepository = aiProfileRepository;
    private readonly IKnowledgeBaseRepository _knowledgeBaseRepository = knowledgeBaseRepository;

    public async Task<Result<AiProfileViewModel>> Handle(CreateAiProfileCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return Result<AiProfileViewModel>.Invalid([.. validationResult.Errors]);
        }

        var kb = await _knowledgeBaseRepository.GetByIdAsync(request.KnowledgeBaseId, cancellationToken).ConfigureAwait(false);
        if (kb is null)
        {
            return Result.NotFound($"Knowledge base with ID '{request.KnowledgeBaseId}' not found.");
        }

        var profile = AiProfile.Create(
            request.Name, request.Model, request.KnowledgeBaseId,
            request.TopK, request.MinRelevanceThreshold, request.MinRelevanceChunksRequired,
            request.HighConfidenceThreshold, request.HighConfidenceChunksRequired);

        await _aiProfileRepository.AddAsync(profile, cancellationToken).ConfigureAwait(false);

        return Result<AiProfileViewModel>.Success(MapToViewModel(profile));
    }

    private static AiProfileViewModel MapToViewModel(AiProfile p) =>
        new(p.Id, p.Name, p.IsActive, p.KnowledgeBaseId, p.Model, p.TopK,
            p.MinRelevanceThreshold, p.MinRelevanceChunksRequired,
            p.HighConfidenceThreshold, p.HighConfidenceChunksRequired, p.CreatedAt);
}

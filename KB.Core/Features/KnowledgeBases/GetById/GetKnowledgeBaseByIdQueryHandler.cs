using KB.Core.Infrastructure;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.KnowledgeBases.GetById;

public sealed class GetKnowledgeBaseByIdQueryHandler(
    IKnowledgeBaseRepository knowledgeBaseRepository)
{
    private readonly IKnowledgeBaseRepository _knowledgeBaseRepository = knowledgeBaseRepository;

    public async Task<Result<KnowledgeBaseViewModel>> Handle(GetKnowledgeBaseByIdQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return Result<KnowledgeBaseViewModel>.Invalid([.. validationResult.Errors]);
        }

        var knowledgeBase = await _knowledgeBaseRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (knowledgeBase is null)
        {
            return Result.NotFound($"Knowledge base with ID '{request.Id}' not found.");
        }

        return Result<KnowledgeBaseViewModel>.Success(
            new KnowledgeBaseViewModel(
                knowledgeBase.Id, knowledgeBase.Name, knowledgeBase.Slug, knowledgeBase.Description,
                knowledgeBase.IsActive, knowledgeBase.BlobContainerName, knowledgeBase.SearchIndexPrefix,
                knowledgeBase.CreatedAt));
    }
}

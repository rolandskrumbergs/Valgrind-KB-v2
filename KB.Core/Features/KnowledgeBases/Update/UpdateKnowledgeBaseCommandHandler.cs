using KB.Core.Infrastructure;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.KnowledgeBases.Update;

public sealed class UpdateKnowledgeBaseCommandHandler(
    IKnowledgeBaseRepository knowledgeBaseRepository)
{
    private readonly IKnowledgeBaseRepository _knowledgeBaseRepository = knowledgeBaseRepository;

    public async Task<Result<KnowledgeBaseViewModel>> Handle(UpdateKnowledgeBaseCommand request, CancellationToken cancellationToken)
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

        knowledgeBase.Update(request.Name, request.Description, request.IsActive);

        await _knowledgeBaseRepository.UpdateAsync(knowledgeBase, cancellationToken).ConfigureAwait(false);

        return Result<KnowledgeBaseViewModel>.Success(
            new KnowledgeBaseViewModel(
                knowledgeBase.Id, knowledgeBase.Name, knowledgeBase.Slug, knowledgeBase.Description,
                knowledgeBase.IsActive, knowledgeBase.BlobContainerName, knowledgeBase.SearchIndexPrefix,
                knowledgeBase.CreatedAt));
    }
}

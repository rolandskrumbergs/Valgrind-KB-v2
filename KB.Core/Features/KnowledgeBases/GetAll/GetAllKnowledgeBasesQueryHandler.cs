using KB.Core.Infrastructure;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.KnowledgeBases.GetAll;

public sealed class GetAllKnowledgeBasesQueryHandler(
    IKnowledgeBaseRepository knowledgeBaseRepository)
{
    private readonly IKnowledgeBaseRepository _knowledgeBaseRepository = knowledgeBaseRepository;

    public async Task<Result<List<KnowledgeBaseViewModel>>> Handle(GetAllKnowledgeBasesQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var knowledgeBases = await _knowledgeBaseRepository.ListAsync(cancellationToken).ConfigureAwait(false);

        var viewModels = knowledgeBases.Select(kb =>
            new KnowledgeBaseViewModel(
                kb.Id, kb.Name, kb.Slug, kb.Description,
                kb.IsActive, kb.BlobContainerName, kb.SearchIndexPrefix,
                kb.CreatedAt))
            .ToList();

        return Result<List<KnowledgeBaseViewModel>>.Success(viewModels);
    }
}

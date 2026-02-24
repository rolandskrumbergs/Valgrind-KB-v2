using KB.Core.Infrastructure;
using KB.Core.Interfaces;
using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.KnowledgeBases.Create;

public sealed class CreateKnowledgeBaseCommandHandler(
    IKnowledgeBaseRepository knowledgeBaseRepository,
    IBlobStorageService blobStorageService)
{
    private readonly IKnowledgeBaseRepository _knowledgeBaseRepository = knowledgeBaseRepository;
    private readonly IBlobStorageService _blobStorageService = blobStorageService;

    public async Task<Result<KnowledgeBaseViewModel>> Handle(CreateKnowledgeBaseCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return Result<KnowledgeBaseViewModel>.Invalid([.. validationResult.Errors]);
        }

        var existing = await _knowledgeBaseRepository.GetBySlugAsync(request.Slug, cancellationToken).ConfigureAwait(false);
        if (existing is not null)
        {
            return Result<KnowledgeBaseViewModel>.Invalid([$"A knowledge base with slug '{request.Slug}' already exists."]);
        }

        var knowledgeBase = KnowledgeBase.Create(request.Name, request.Slug, request.Description);

        await _blobStorageService.CreateContainerIfNotExistsAsync(knowledgeBase.BlobContainerName, cancellationToken).ConfigureAwait(false);

        await _knowledgeBaseRepository.AddAsync(knowledgeBase, cancellationToken).ConfigureAwait(false);

        return Result<KnowledgeBaseViewModel>.Success(MapToViewModel(knowledgeBase));
    }

    private static KnowledgeBaseViewModel MapToViewModel(KnowledgeBase kb) =>
        new(kb.Id, kb.Name, kb.Slug, kb.Description, kb.IsActive, kb.BlobContainerName, kb.SearchIndexPrefix, kb.CreatedAt);
}

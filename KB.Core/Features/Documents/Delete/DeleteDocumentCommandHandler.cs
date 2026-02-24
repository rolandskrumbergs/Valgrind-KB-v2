using KB.Core.Infrastructure;
using KB.Core.Interfaces;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Documents.Delete;

public sealed class DeleteDocumentCommandHandler(
    IDocumentRepository documentRepository,
    IKnowledgeBaseRepository knowledgeBaseRepository,
    IBlobStorageService blobStorageService)
{
    private readonly IDocumentRepository _documentRepository = documentRepository;
    private readonly IKnowledgeBaseRepository _knowledgeBaseRepository = knowledgeBaseRepository;
    private readonly IBlobStorageService _blobStorageService = blobStorageService;

    public async Task<Result> Handle(DeleteDocumentCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return Result.Invalid([.. validationResult.Errors]);
        }

        var knowledgeBase = await _knowledgeBaseRepository.GetByIdAsync(request.KnowledgeBaseId, cancellationToken).ConfigureAwait(false);
        if (knowledgeBase is null)
        {
            return Result.NotFound($"Knowledge base with ID '{request.KnowledgeBaseId}' not found.");
        }

        var document = await _documentRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (document is null)
        {
            return Result.NotFound($"Document with ID '{request.Id}' not found.");
        }

        await _blobStorageService.DeleteAsync(knowledgeBase.BlobContainerName, document.BlobPath, cancellationToken).ConfigureAwait(false);

        await _documentRepository.DeleteAsync(document, cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }
}

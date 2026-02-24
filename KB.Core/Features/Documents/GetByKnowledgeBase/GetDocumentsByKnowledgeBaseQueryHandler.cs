using KB.Core.Infrastructure;
using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Documents.GetByKnowledgeBase;

public sealed class GetDocumentsByKnowledgeBaseQueryHandler(
    IDocumentRepository documentRepository)
{
    private readonly IDocumentRepository _documentRepository = documentRepository;

    public async Task<Result<List<DocumentViewModel>>> Handle(GetDocumentsByKnowledgeBaseQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return Result<List<DocumentViewModel>>.Invalid([.. validationResult.Errors]);
        }

        var documents = await _documentRepository.GetByKnowledgeBaseIdAsync(request.KnowledgeBaseId, cancellationToken).ConfigureAwait(false);

        var viewModels = documents.Select(MapToViewModel).ToList();

        return Result<List<DocumentViewModel>>.Success(viewModels);
    }

    private static DocumentViewModel MapToViewModel(Document doc) =>
        new(doc.Id, doc.KnowledgeBaseId, doc.FileName, doc.FileSize, doc.ContentType,
            doc.Category, doc.BlobPath, doc.ChunkingPreset, doc.ProcessingStatus,
            doc.ProcessingProgress, doc.ErrorMessage, doc.TotalChunks, doc.IndexedChunks,
            doc.FailedChunks, doc.CreatedAt);
}

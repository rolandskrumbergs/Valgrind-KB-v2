using KB.Core.Infrastructure;
using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Documents.GetById;

public sealed class GetDocumentByIdQueryHandler(
    IDocumentRepository documentRepository)
{
    private readonly IDocumentRepository _documentRepository = documentRepository;

    public async Task<Result<DocumentViewModel>> Handle(GetDocumentByIdQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return Result<DocumentViewModel>.Invalid([.. validationResult.Errors]);
        }

        var document = await _documentRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (document is null)
        {
            return Result.NotFound($"Document with ID '{request.Id}' not found.");
        }

        return Result<DocumentViewModel>.Success(MapToViewModel(document));
    }

    private static DocumentViewModel MapToViewModel(Document doc) =>
        new(doc.Id, doc.KnowledgeBaseId, doc.FileName, doc.FileSize, doc.ContentType,
            doc.Category, doc.BlobPath, doc.ChunkingPreset, doc.ProcessingStatus,
            doc.ProcessingProgress, doc.ErrorMessage, doc.TotalChunks, doc.IndexedChunks,
            doc.FailedChunks, doc.CreatedAt);
}

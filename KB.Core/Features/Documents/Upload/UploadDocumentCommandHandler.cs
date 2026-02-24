using KB.Core.Infrastructure;
using KB.Core.Interfaces;
using KB.Domain.Entities;
using KB.Domain.Interfaces;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Documents.Upload;

public sealed class UploadDocumentCommandHandler(
    IDocumentRepository documentRepository,
    IKnowledgeBaseRepository knowledgeBaseRepository,
    IBlobStorageService blobStorageService,
    IDocumentIngestionService documentIngestionService,
    IUserContext userContext)
{
    private readonly IDocumentRepository _documentRepository = documentRepository;
    private readonly IKnowledgeBaseRepository _knowledgeBaseRepository = knowledgeBaseRepository;
    private readonly IBlobStorageService _blobStorageService = blobStorageService;
    private readonly IDocumentIngestionService _documentIngestionService = documentIngestionService;
    private readonly IUserContext _userContext = userContext;

    public async Task<Result<DocumentViewModel>> Handle(UploadDocumentCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return Result<DocumentViewModel>.Invalid([.. validationResult.Errors]);
        }

        var knowledgeBase = await _knowledgeBaseRepository.GetByIdAsync(request.KnowledgeBaseId, cancellationToken).ConfigureAwait(false);
        if (knowledgeBase is null)
        {
            return Result.NotFound($"Knowledge base with ID '{request.KnowledgeBaseId}' not found.");
        }

        var existingDoc = await _documentRepository.GetByContentHashAsync(request.KnowledgeBaseId, request.ContentHash, cancellationToken).ConfigureAwait(false);
        if (existingDoc is not null)
        {
            return Result<DocumentViewModel>.Invalid([$"A document with the same content already exists: '{existingDoc.FileName}'."]);
        }

        var blobPath = $"{request.Category.ToString().ToLowerInvariant()}/{Guid.NewGuid()}/{request.FileName}";

        await _blobStorageService.UploadAsync(
            knowledgeBase.BlobContainerName, blobPath, request.FileStream, request.ContentType, cancellationToken).ConfigureAwait(false);

        var document = Document.Create(
            request.KnowledgeBaseId,
            request.FileName,
            request.FileSize,
            request.ContentType,
            request.Category,
            blobPath,
            request.ContentHash,
            _userContext.AccountObjectId,
            request.ChunkingPreset);

        await _documentRepository.AddAsync(document, cancellationToken).ConfigureAwait(false);

        // Fire-and-forget ingestion pipeline
        _ = _documentIngestionService.StartIngestionAsync(document.Id, CancellationToken.None);

        return Result<DocumentViewModel>.Success(MapToViewModel(document));
    }

    private static DocumentViewModel MapToViewModel(Document doc) =>
        new(doc.Id, doc.KnowledgeBaseId, doc.FileName, doc.FileSize, doc.ContentType,
            doc.Category, doc.BlobPath, doc.ChunkingPreset, doc.ProcessingStatus,
            doc.ProcessingProgress, doc.ErrorMessage, doc.TotalChunks, doc.IndexedChunks,
            doc.FailedChunks, doc.CreatedAt);
}

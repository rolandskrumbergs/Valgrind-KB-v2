using KB.Core.Interfaces;
using KB.Domain.Interfaces.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.KernelMemory;

namespace KB.Infrastructure.AI;

public sealed class DocumentIngestionService(
    IServiceScopeFactory serviceScopeFactory,
    IKernelMemory kernelMemory,
    IBlobStorageService blobStorageService,
    ILogger<DocumentIngestionService> logger) : IDocumentIngestionService
{
    private readonly IServiceScopeFactory _serviceScopeFactory = serviceScopeFactory;
    private readonly IKernelMemory _kernelMemory = kernelMemory;
    private readonly IBlobStorageService _blobStorageService = blobStorageService;
    private readonly ILogger<DocumentIngestionService> _logger = logger;

    public async Task StartIngestionAsync(Guid documentId, CancellationToken cancellationToken = default)
    {
        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var documentRepository = scope.ServiceProvider.GetRequiredService<IDocumentRepository>();
            var knowledgeBaseRepository = scope.ServiceProvider.GetRequiredService<IKnowledgeBaseRepository>();

            var document = await documentRepository.GetByIdAsync(documentId, cancellationToken).ConfigureAwait(false);
            if (document is null)
            {
                _logger.LogWarning("Document {DocumentId} not found for ingestion", documentId);
                return;
            }

            var knowledgeBase = await knowledgeBaseRepository.GetByIdAsync(document.KnowledgeBaseId, cancellationToken)
                .ConfigureAwait(false);
            if (knowledgeBase is null)
            {
                _logger.LogWarning("Knowledge base {KnowledgeBaseId} not found for document {DocumentId}",
                    document.KnowledgeBaseId, documentId);
                return;
            }

            document.MarkProcessing("{\"stage\":\"downloading\",\"progress\":0}");
            await documentRepository.UpdateAsync(document, cancellationToken).ConfigureAwait(false);

            _logger.LogInformation("Starting ingestion for {DocumentId} ({FileName})", documentId, document.FileName);

            // Download blob content
            var blobStream = await _blobStorageService.DownloadAsync(
                knowledgeBase.BlobContainerName, document.BlobPath, cancellationToken).ConfigureAwait(false);

            using var memoryStream = new MemoryStream();
            await blobStream.CopyToAsync(memoryStream, cancellationToken).ConfigureAwait(false);
            memoryStream.Position = 0;

            document.MarkProcessing("{\"stage\":\"embedding\",\"progress\":30}");
            await documentRepository.UpdateAsync(document, cancellationToken).ConfigureAwait(false);

            // Import into Kernel Memory (chunk → embed → index into PostgreSQL via pgvector)
            var docId = await _kernelMemory.ImportDocumentAsync(
                content: memoryStream,
                fileName: document.FileName,
                documentId: documentId.ToString(),
                index: knowledgeBase.SearchIndexPrefix,
                tags: new TagCollection
                {
                    { "knowledge_base_id", knowledgeBase.Id.ToString() },
                    { "category", document.Category.ToString() },
                    { "document_id", documentId.ToString() }
                },
                cancellationToken: cancellationToken).ConfigureAwait(false);

            _logger.LogInformation("Kernel Memory import completed for {DocumentId}, KM doc ID: {KmDocId}",
                documentId, docId);

            // Wait for KM pipeline to complete processing
            while (!await _kernelMemory.IsDocumentReadyAsync(
                documentId: documentId.ToString(),
                index: knowledgeBase.SearchIndexPrefix,
                cancellationToken: cancellationToken).ConfigureAwait(false))
            {
                await Task.Delay(1000, cancellationToken).ConfigureAwait(false);
            }

            document.MarkCompleted(totalChunks: 1, indexedChunks: 1, failedChunks: 0,
                metrics: $"{{\"kmDocumentId\":\"{docId}\"}}");
            await documentRepository.UpdateAsync(document, cancellationToken).ConfigureAwait(false);

            _logger.LogInformation("Document ingestion completed for {DocumentId}", documentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Document ingestion failed for {DocumentId}", documentId);

            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var documentRepository = scope.ServiceProvider.GetRequiredService<IDocumentRepository>();
                var document = await documentRepository.GetByIdAsync(documentId, cancellationToken).ConfigureAwait(false);
                if (document is not null)
                {
                    document.MarkFailed(ex.Message);
                    await documentRepository.UpdateAsync(document, cancellationToken).ConfigureAwait(false);
                }
            }
            catch (Exception innerEx)
            {
                _logger.LogError(innerEx, "Failed to mark document {DocumentId} as failed", documentId);
            }
        }
    }
}

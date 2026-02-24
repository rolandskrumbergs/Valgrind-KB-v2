using KB.Core.Interfaces;
using KB.Domain.Interfaces.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace KB.Infrastructure.AI;

public sealed class DocumentIngestionService(
    IServiceScopeFactory serviceScopeFactory,
    ILogger<DocumentIngestionService> logger) : IDocumentIngestionService
{
    private readonly IServiceScopeFactory _serviceScopeFactory = serviceScopeFactory;
    private readonly ILogger<DocumentIngestionService> _logger = logger;

    public async Task StartIngestionAsync(Guid documentId, CancellationToken cancellationToken = default)
    {
        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var documentRepository = scope.ServiceProvider.GetRequiredService<IDocumentRepository>();

            var document = await documentRepository.GetByIdAsync(documentId, cancellationToken).ConfigureAwait(false);
            if (document is null)
            {
                _logger.LogWarning("Document {DocumentId} not found for ingestion", documentId);
                return;
            }

            document.MarkProcessing("{\"stage\":\"chunking\",\"progress\":0}");
            await documentRepository.UpdateAsync(document, cancellationToken).ConfigureAwait(false);

            // TODO: Integrate Kernel Memory pipeline here
            // Pipeline: download blob → chunk → embed → index into Azure AI Search
            // For now, mark as completed with 0 chunks as a placeholder
            _logger.LogInformation("Document ingestion started for {DocumentId} ({FileName})", documentId, document.FileName);

            document.MarkCompleted(totalChunks: 0, indexedChunks: 0, failedChunks: 0,
                metrics: "{\"note\":\"Kernel Memory pipeline not yet configured\"}");
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

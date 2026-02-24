namespace KB.Core.Interfaces;

public interface IDocumentIngestionService
{
    Task StartIngestionAsync(Guid documentId, CancellationToken cancellationToken = default);
}

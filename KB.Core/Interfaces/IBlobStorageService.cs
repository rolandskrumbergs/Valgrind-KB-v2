namespace KB.Core.Interfaces;

public interface IBlobStorageService
{
    Task<string> UploadAsync(string containerName, string blobPath, Stream content, string contentType, CancellationToken cancellationToken = default);
    Task<Stream> DownloadAsync(string containerName, string blobPath, CancellationToken cancellationToken = default);
    Task DeleteAsync(string containerName, string blobPath, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string containerName, string blobPath, CancellationToken cancellationToken = default);
    Task<string> GetUrlAsync(string containerName, string blobPath, CancellationToken cancellationToken = default);
    Task CreateContainerIfNotExistsAsync(string containerName, CancellationToken cancellationToken = default);
}

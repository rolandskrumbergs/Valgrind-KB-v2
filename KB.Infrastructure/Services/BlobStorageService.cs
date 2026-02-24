using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using KB.Core.Interfaces;
using KB.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace KB.Infrastructure.Services;

public sealed class BlobStorageService(IOptions<AiSettings> aiSettings) : IBlobStorageService
{
    private readonly BlobServiceClient _blobServiceClient = new(aiSettings.Value.AzureBlobStorage.ConnectionString);

    public async Task<string> UploadAsync(string containerName, string blobPath, Stream content, string contentType, CancellationToken cancellationToken = default)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        await containerClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken).ConfigureAwait(false);

        var blobClient = containerClient.GetBlobClient(blobPath);
        await blobClient.UploadAsync(content, new BlobHttpHeaders { ContentType = contentType }, cancellationToken: cancellationToken).ConfigureAwait(false);

        return blobClient.Uri.ToString();
    }

    public async Task<Stream> DownloadAsync(string containerName, string blobPath, CancellationToken cancellationToken = default)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        var blobClient = containerClient.GetBlobClient(blobPath);
        var response = await blobClient.DownloadStreamingAsync(cancellationToken: cancellationToken).ConfigureAwait(false);
        return response.Value.Content;
    }

    public async Task DeleteAsync(string containerName, string blobPath, CancellationToken cancellationToken = default)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        var blobClient = containerClient.GetBlobClient(blobPath);
        await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<bool> ExistsAsync(string containerName, string blobPath, CancellationToken cancellationToken = default)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        var blobClient = containerClient.GetBlobClient(blobPath);
        var response = await blobClient.ExistsAsync(cancellationToken).ConfigureAwait(false);
        return response.Value;
    }

    public Task<string> GetUrlAsync(string containerName, string blobPath, CancellationToken cancellationToken = default)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        var blobClient = containerClient.GetBlobClient(blobPath);
        return Task.FromResult(blobClient.Uri.ToString());
    }

    public async Task CreateContainerIfNotExistsAsync(string containerName, CancellationToken cancellationToken = default)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        await containerClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken).ConfigureAwait(false);
    }
}

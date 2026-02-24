using System.Security.Cryptography;
using KB.Core.Features.Documents;
using KB.Core.Features.Documents.Delete;
using KB.Core.Features.Documents.GetById;
using KB.Core.Features.Documents.GetByKnowledgeBase;
using KB.Core.Features.Documents.Reprocess;
using KB.Core.Features.Documents.Upload;
using KB.Domain.Enums;

namespace KB.Server.Endpoints.Documents;

internal static class DocumentEndpoints
{
    public static IEndpointRouteBuilder MapDocumentEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/knowledge-bases/{knowledgeBaseId:guid}/documents")
            .WithTags("Documents")
            .RequireAuthorization("AdminOnly");

        group.MapGet("/", GetByKnowledgeBaseAsync)
            .WithName("GetDocumentsByKnowledgeBase")
            .Produces<List<DocumentViewModel>>();

        group.MapGet("/{id:guid}", GetByIdAsync)
            .WithName("GetDocumentById")
            .Produces<DocumentViewModel>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", UploadAsync)
            .WithName("UploadDocument")
            .Produces<DocumentViewModel>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .DisableAntiforgery();

        group.MapPost("/{id:guid}/reprocess", ReprocessAsync)
            .WithName("ReprocessDocument")
            .Produces<DocumentViewModel>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:guid}", DeleteAsync)
            .WithName("DeleteDocument")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> GetByKnowledgeBaseAsync(
        Guid knowledgeBaseId,
        GetDocumentsByKnowledgeBaseQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(
            new GetDocumentsByKnowledgeBaseQuery { KnowledgeBaseId = knowledgeBaseId },
            cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetByIdAsync(
        Guid knowledgeBaseId,
        Guid id,
        GetDocumentByIdQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetDocumentByIdQuery { Id = id, KnowledgeBaseId = knowledgeBaseId }, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UploadAsync(
        Guid knowledgeBaseId,
        IFormFile file,
        [AsParameters] UploadDocumentQueryParams queryParams,
        UploadDocumentCommandHandler handler,
        CancellationToken cancellationToken)
    {
        using var stream = file.OpenReadStream();
        using var hashStream = new MemoryStream();
        await stream.CopyToAsync(hashStream, cancellationToken);
        var hash = Convert.ToHexString(SHA256.HashData(hashStream.ToArray()));
        hashStream.Position = 0;

        var command = new UploadDocumentCommand
        {
            KnowledgeBaseId = knowledgeBaseId,
            FileName = file.FileName,
            FileSize = file.Length,
            ContentType = file.ContentType,
            Category = queryParams.Category,
            FileStream = hashStream,
            ContentHash = hash,
            ChunkingPreset = queryParams.ChunkingPreset
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> ReprocessAsync(
        Guid knowledgeBaseId,
        Guid id,
        ReprocessDocumentCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new ReprocessDocumentCommand { Id = id, KnowledgeBaseId = knowledgeBaseId }, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> DeleteAsync(
        Guid knowledgeBaseId,
        Guid id,
        DeleteDocumentCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new DeleteDocumentCommand { Id = id, KnowledgeBaseId = knowledgeBaseId }, cancellationToken);
        return result.ToHttpResult();
    }
}

internal sealed record UploadDocumentQueryParams(KnowledgeCategory Category, string? ChunkingPreset = null);

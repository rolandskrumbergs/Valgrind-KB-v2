using KB.Core.Features.KnowledgeBases;
using KB.Core.Features.KnowledgeBases.Create;
using KB.Core.Features.KnowledgeBases.Delete;
using KB.Core.Features.KnowledgeBases.GetAll;
using KB.Core.Features.KnowledgeBases.GetById;
using KB.Core.Features.KnowledgeBases.Update;

namespace KB.Server.Endpoints.KnowledgeBases;

internal static class KnowledgeBaseEndpoints
{
    public static IEndpointRouteBuilder MapKnowledgeBaseEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/knowledge-bases")
            .WithTags("Knowledge Bases")
            .RequireAuthorization("AdminOnly");

        group.MapGet("/", GetAllAsync)
            .WithName("GetAllKnowledgeBases")
            .Produces<List<KnowledgeBaseViewModel>>();

        group.MapGet("/{id:guid}", GetByIdAsync)
            .WithName("GetKnowledgeBaseById")
            .Produces<KnowledgeBaseViewModel>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateAsync)
            .WithName("CreateKnowledgeBase")
            .Produces<KnowledgeBaseViewModel>(StatusCodes.Status200OK)
            .ProducesValidationProblem();

        group.MapPut("/{id:guid}", UpdateAsync)
            .WithName("UpdateKnowledgeBase")
            .Produces<KnowledgeBaseViewModel>()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesValidationProblem();

        group.MapDelete("/{id:guid}", DeleteAsync)
            .WithName("DeleteKnowledgeBase")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> GetAllAsync(
        GetAllKnowledgeBasesQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetAllKnowledgeBasesQuery(), cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        GetKnowledgeBaseByIdQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetKnowledgeBaseByIdQuery { Id = id }, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> CreateAsync(
        CreateKnowledgeBaseRequest request,
        CreateKnowledgeBaseCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new CreateKnowledgeBaseCommand
        {
            Name = request.Name,
            Slug = request.Slug,
            Description = request.Description
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UpdateKnowledgeBaseRequest request,
        UpdateKnowledgeBaseCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new UpdateKnowledgeBaseCommand
        {
            Id = id,
            Name = request.Name,
            Description = request.Description,
            IsActive = request.IsActive
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        DeleteKnowledgeBaseCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new DeleteKnowledgeBaseCommand { Id = id }, cancellationToken);
        return result.ToHttpResult();
    }
}

internal sealed record CreateKnowledgeBaseRequest(string Name, string Slug, string? Description);
internal sealed record UpdateKnowledgeBaseRequest(string Name, string? Description, bool IsActive);

using KB.Core.Features.AiProfiles;
using KB.Core.Features.AiProfiles.Activate;
using KB.Core.Features.AiProfiles.Create;
using KB.Core.Features.AiProfiles.Delete;
using KB.Core.Features.AiProfiles.GetAll;
using KB.Core.Features.AiProfiles.GetById;
using KB.Core.Features.AiProfiles.Update;

namespace KB.Server.Endpoints.AiProfiles;

internal static class AiProfileEndpoints
{
    public static IEndpointRouteBuilder MapAiProfileEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/ai-profiles")
            .WithTags("AI Profiles")
            .RequireAuthorization("AdminOnly");

        group.MapGet("/", GetAllAsync)
            .WithName("GetAllAiProfiles")
            .Produces<List<AiProfileViewModel>>();

        group.MapGet("/{id:guid}", GetByIdAsync)
            .WithName("GetAiProfileById")
            .Produces<AiProfileViewModel>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateAsync)
            .WithName("CreateAiProfile")
            .Produces<AiProfileViewModel>(StatusCodes.Status200OK)
            .ProducesValidationProblem();

        group.MapPut("/{id:guid}", UpdateAsync)
            .WithName("UpdateAiProfile")
            .Produces<AiProfileViewModel>()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesValidationProblem();

        group.MapPut("/{id:guid}/activate", ActivateAsync)
            .WithName("ActivateAiProfile")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:guid}", DeleteAsync)
            .WithName("DeleteAiProfile")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> GetAllAsync(
        GetAllAiProfilesQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetAllAiProfilesQuery(), cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        GetAiProfileByIdQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetAiProfileByIdQuery { Id = id }, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> CreateAsync(
        CreateAiProfileRequest request,
        CreateAiProfileCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new CreateAiProfileCommand
        {
            Name = request.Name,
            KnowledgeBaseId = request.KnowledgeBaseId,
            Model = request.Model,
            TopK = request.TopK,
            MinRelevanceThreshold = request.MinRelevanceThreshold,
            MinRelevanceChunksRequired = request.MinRelevanceChunksRequired,
            HighConfidenceThreshold = request.HighConfidenceThreshold,
            HighConfidenceChunksRequired = request.HighConfidenceChunksRequired
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UpdateAiProfileRequest request,
        UpdateAiProfileCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new UpdateAiProfileCommand
        {
            Id = id,
            Name = request.Name,
            KnowledgeBaseId = request.KnowledgeBaseId,
            Model = request.Model,
            TopK = request.TopK,
            MinRelevanceThreshold = request.MinRelevanceThreshold,
            MinRelevanceChunksRequired = request.MinRelevanceChunksRequired,
            HighConfidenceThreshold = request.HighConfidenceThreshold,
            HighConfidenceChunksRequired = request.HighConfidenceChunksRequired
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> ActivateAsync(
        Guid id,
        ActivateAiProfileRequest request,
        ActivateAiProfileCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new ActivateAiProfileCommand
        {
            Id = id,
            IsActive = request.IsActive
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        DeleteAiProfileCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new DeleteAiProfileCommand { Id = id }, cancellationToken);
        return result.ToHttpResult();
    }
}

internal sealed record CreateAiProfileRequest(
    string Name, Guid KnowledgeBaseId, string Model, int TopK,
    decimal MinRelevanceThreshold, int MinRelevanceChunksRequired,
    decimal HighConfidenceThreshold, int HighConfidenceChunksRequired);

internal sealed record UpdateAiProfileRequest(
    string Name, Guid KnowledgeBaseId, string Model, int TopK,
    decimal MinRelevanceThreshold, int MinRelevanceChunksRequired,
    decimal HighConfidenceThreshold, int HighConfidenceChunksRequired);

internal sealed record ActivateAiProfileRequest(bool IsActive);

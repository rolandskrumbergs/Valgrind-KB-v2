using KB.Core.Features.Organizations;
using KB.Core.Features.Organizations.Create;
using KB.Core.Features.Organizations.Delete;
using KB.Core.Features.Organizations.GetAll;
using KB.Core.Features.Organizations.GetById;
using KB.Core.Features.Organizations.Update;

namespace KB.Server.Endpoints.Organizations;

internal static class OrganizationEndpoints
{
    public static IEndpointRouteBuilder MapOrganizationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/organizations")
            .WithTags("Organizations")
            .RequireAuthorization("AdminOnly");

        group.MapGet("/", GetAllAsync)
            .WithName("GetAllOrganizations")
            .Produces<List<OrganizationViewModel>>();

        group.MapGet("/{id:guid}", GetByIdAsync)
            .WithName("GetOrganizationById")
            .Produces<OrganizationViewModel>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateAsync)
            .WithName("CreateOrganization")
            .Produces<OrganizationViewModel>(StatusCodes.Status200OK)
            .ProducesValidationProblem();

        group.MapPut("/{id:guid}", UpdateAsync)
            .WithName("UpdateOrganization")
            .Produces<OrganizationViewModel>()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesValidationProblem();

        group.MapDelete("/{id:guid}", DeleteAsync)
            .WithName("DeleteOrganization")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> GetAllAsync(
        GetAllOrganizationsQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetAllOrganizationsQuery(), cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        GetOrganizationByIdQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetOrganizationByIdQuery { Id = id }, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> CreateAsync(
        CreateOrganizationRequest request,
        CreateOrganizationCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new CreateOrganizationCommand
        {
            Name = request.Name,
            MaxSeats = request.MaxSeats,
            ContactInfo = request.ContactInfo,
            InvoiceInfo = request.InvoiceInfo
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UpdateOrganizationRequest request,
        UpdateOrganizationCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new UpdateOrganizationCommand
        {
            Id = id,
            Name = request.Name,
            MaxSeats = request.MaxSeats,
            ContactInfo = request.ContactInfo,
            InvoiceInfo = request.InvoiceInfo,
            IsActive = request.IsActive
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        DeleteOrganizationCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new DeleteOrganizationCommand { Id = id }, cancellationToken);
        return result.ToHttpResult();
    }
}

internal sealed record CreateOrganizationRequest(string Name, int MaxSeats, string? ContactInfo, string? InvoiceInfo);
internal sealed record UpdateOrganizationRequest(string Name, int MaxSeats, string? ContactInfo, string? InvoiceInfo, bool IsActive);

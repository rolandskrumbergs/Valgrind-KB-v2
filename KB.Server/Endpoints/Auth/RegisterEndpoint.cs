using KB.Core.Features.Authentication.Register;
using KB.Server;

namespace KB.Server.Endpoints.Auth;

internal static class RegisterEndpoint
{
    public static IEndpointRouteBuilder MapRegister(this IEndpointRouteBuilder endpoints)
    {
        endpoints
            .MapPost("/api/auth/register", RegisterAsync)
            .WithName("Register")
            .WithTags("Authentication")
            .Produces(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoints;
    }

    private static async Task<IResult> RegisterAsync(
        RegisterRequest request,
        RegisterCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new RegisterCommand
        {
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Password = request.Password,
            ConfirmPassword = request.ConfirmPassword
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }
}

internal sealed record RegisterRequest(
    string Email,
    string FirstName,
    string LastName,
    string Password,
    string ConfirmPassword);

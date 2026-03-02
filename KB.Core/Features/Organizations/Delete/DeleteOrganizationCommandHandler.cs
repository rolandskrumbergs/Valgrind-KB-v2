using KB.Core.Infrastructure;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Organizations.Delete;

public sealed class DeleteOrganizationCommandHandler(
    IOrganizationRepository organizationRepository)
{
    private readonly IOrganizationRepository _organizationRepository = organizationRepository;

    public async Task<Result> Handle(DeleteOrganizationCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
            return validationResult;

        var organization = await _organizationRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (organization is null)
            return Result.NotFound($"Organization with ID '{request.Id}' not found.");

        await _organizationRepository.DeleteAsync(organization, cancellationToken).ConfigureAwait(false);
        return Result.NoContent();
    }
}

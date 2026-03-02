using KB.Core.Infrastructure;
using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Organizations.Update;

public sealed class UpdateOrganizationCommandHandler(
    IOrganizationRepository organizationRepository)
{
    private readonly IOrganizationRepository _organizationRepository = organizationRepository;

    public async Task<Result<OrganizationViewModel>> Handle(UpdateOrganizationCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
            return Result<OrganizationViewModel>.Invalid([.. validationResult.Errors]);

        var organization = await _organizationRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (organization is null)
            return Result.NotFound($"Organization with ID '{request.Id}' not found.");

        organization.Update(request.Name, request.ContactInfo, request.InvoiceInfo, request.MaxSeats, request.IsActive);

        await _organizationRepository.UpdateAsync(organization, cancellationToken).ConfigureAwait(false);
        return Result<OrganizationViewModel>.Success(MapToViewModel(organization));
    }

    private static OrganizationViewModel MapToViewModel(Organization o) =>
        new(o.Id, o.Name, o.ContactInfo, o.InvoiceInfo, o.MaxSeats, o.IsActive, 0, o.CreatedAt);
}

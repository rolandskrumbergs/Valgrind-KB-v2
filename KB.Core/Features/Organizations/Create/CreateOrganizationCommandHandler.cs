using KB.Core.Infrastructure;
using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Organizations.Create;

public sealed class CreateOrganizationCommandHandler(
    IOrganizationRepository organizationRepository)
{
    private readonly IOrganizationRepository _organizationRepository = organizationRepository;

    public async Task<Result<OrganizationViewModel>> Handle(CreateOrganizationCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
            return Result<OrganizationViewModel>.Invalid([.. validationResult.Errors]);

        var organization = Organization.Create(
            request.Name, request.MaxSeats, request.ContactInfo, request.InvoiceInfo);

        await _organizationRepository.AddAsync(organization, cancellationToken).ConfigureAwait(false);
        return Result<OrganizationViewModel>.Success(MapToViewModel(organization));
    }

    private static OrganizationViewModel MapToViewModel(Organization o) =>
        new(o.Id, o.Name, o.ContactInfo, o.InvoiceInfo, o.MaxSeats, o.IsActive, 0, o.CreatedAt);
}

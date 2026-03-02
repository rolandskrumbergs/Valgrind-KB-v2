using KB.Core.Infrastructure;
using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Organizations.GetAll;

public sealed class GetAllOrganizationsQueryHandler(
    IOrganizationRepository organizationRepository)
{
    private readonly IOrganizationRepository _organizationRepository = organizationRepository;

    public async Task<Result<List<OrganizationViewModel>>> Handle(GetAllOrganizationsQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var organizations = await _organizationRepository.ListAsync(cancellationToken).ConfigureAwait(false);
        var viewModels = organizations.Select(MapToViewModel).ToList();
        return Result<List<OrganizationViewModel>>.Success(viewModels);
    }

    private static OrganizationViewModel MapToViewModel(Organization o) =>
        new(o.Id, o.Name, o.ContactInfo, o.InvoiceInfo, o.MaxSeats, o.IsActive, 0, o.CreatedAt);
}

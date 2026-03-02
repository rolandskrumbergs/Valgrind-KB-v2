using KB.Core.Infrastructure;
using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Organizations.GetById;

public sealed class GetOrganizationByIdQueryHandler(
    IOrganizationRepository organizationRepository)
{
    private readonly IOrganizationRepository _organizationRepository = organizationRepository;

    public async Task<Result<OrganizationViewModel>> Handle(GetOrganizationByIdQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate<OrganizationViewModel>(request);
        if (!validationResult.IsSuccess)
            return validationResult;

        var organization = await _organizationRepository.GetWithSubscriptionsAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (organization is null)
            return Result.NotFound($"Organization with ID '{request.Id}' not found.");

        return Result<OrganizationViewModel>.Success(MapToViewModel(organization));
    }

    private static OrganizationViewModel MapToViewModel(Organization o) =>
        new(o.Id, o.Name, o.ContactInfo, o.InvoiceInfo, o.MaxSeats, o.IsActive, o.GetAssignedSeatCount(), o.CreatedAt);
}

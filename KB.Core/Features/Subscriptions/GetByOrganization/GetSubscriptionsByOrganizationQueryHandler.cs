using KB.Core.Infrastructure;
using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Subscriptions.GetByOrganization;

public sealed class GetSubscriptionsByOrganizationQueryHandler(
    IOrganizationRepository organizationRepository)
{
    private readonly IOrganizationRepository _organizationRepository = organizationRepository;

    public async Task<Result<List<SubscriptionViewModel>>> Handle(GetSubscriptionsByOrganizationQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate<List<SubscriptionViewModel>>(request);
        if (!validationResult.IsSuccess)
            return validationResult;

        var organization = await _organizationRepository.GetWithSubscriptionsAsync(request.OrganizationId, cancellationToken).ConfigureAwait(false);
        if (organization is null)
            return Result.NotFound($"Organization with ID '{request.OrganizationId}' not found.");

        var viewModels = organization.Subscriptions.Select(MapToViewModel).ToList();
        return Result<List<SubscriptionViewModel>>.Success(viewModels);
    }

    private static SubscriptionViewModel MapToViewModel(Subscription s) =>
        new(s.Id, s.OrganizationId, s.UserId, s.IsActive, s.ActivatedAt, s.DeactivatedAt, s.CreatedAt);
}

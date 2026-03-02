using KB.Core.Infrastructure;
using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Subscriptions.Assign;

public sealed class AssignSubscriptionCommandHandler(
    IOrganizationRepository organizationRepository)
{
    private readonly IOrganizationRepository _organizationRepository = organizationRepository;

    public async Task<Result<SubscriptionViewModel>> Handle(AssignSubscriptionCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
            return Result<SubscriptionViewModel>.Invalid([.. validationResult.Errors]);

        var organization = await _organizationRepository.GetWithSubscriptionsAsync(request.OrganizationId, cancellationToken).ConfigureAwait(false);
        if (organization is null)
            return Result.NotFound($"Organization with ID '{request.OrganizationId}' not found.");

        var subscription = organization.Subscriptions.FirstOrDefault(s => s.Id == request.SubscriptionId);
        if (subscription is null)
            return Result.NotFound($"Subscription with ID '{request.SubscriptionId}' not found.");

        if (subscription.IsAssigned())
            return Result<SubscriptionViewModel>.Invalid("Subscription is already assigned to a user.");

        subscription.Assign(request.UserId);

        await _organizationRepository.UpdateAsync(organization, cancellationToken).ConfigureAwait(false);
        return Result<SubscriptionViewModel>.Success(MapToViewModel(subscription));
    }

    private static SubscriptionViewModel MapToViewModel(Subscription s) =>
        new(s.Id, s.OrganizationId, s.UserId, s.IsActive, s.ActivatedAt, s.DeactivatedAt, s.CreatedAt);
}

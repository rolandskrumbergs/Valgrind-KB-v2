using KB.Core.Infrastructure;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Subscriptions.Delete;

public sealed class DeleteSubscriptionCommandHandler(
    IOrganizationRepository organizationRepository)
{
    private readonly IOrganizationRepository _organizationRepository = organizationRepository;

    public async Task<Result> Handle(DeleteSubscriptionCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
            return validationResult;

        var organization = await _organizationRepository.GetWithSubscriptionsAsync(request.OrganizationId, cancellationToken).ConfigureAwait(false);
        if (organization is null)
            return Result.NotFound($"Organization with ID '{request.OrganizationId}' not found.");

        var subscription = organization.Subscriptions.FirstOrDefault(s => s.Id == request.SubscriptionId);
        if (subscription is null)
            return Result.NotFound($"Subscription with ID '{request.SubscriptionId}' not found.");

        organization.Subscriptions.Remove(subscription);

        await _organizationRepository.UpdateAsync(organization, cancellationToken).ConfigureAwait(false);
        return Result.NoContent();
    }
}

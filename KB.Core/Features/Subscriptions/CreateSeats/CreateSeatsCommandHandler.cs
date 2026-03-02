using KB.Core.Infrastructure;
using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Subscriptions.CreateSeats;

public sealed class CreateSeatsCommandHandler(
    IOrganizationRepository organizationRepository)
{
    private readonly IOrganizationRepository _organizationRepository = organizationRepository;

    public async Task<Result<List<SubscriptionViewModel>>> Handle(CreateSeatsCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
            return Result<List<SubscriptionViewModel>>.Invalid([.. validationResult.Errors]);

        var organization = await _organizationRepository.GetWithSubscriptionsAsync(request.OrganizationId, cancellationToken).ConfigureAwait(false);
        if (organization is null)
            return Result.NotFound($"Organization with ID '{request.OrganizationId}' not found.");

        var subscriptions = new List<Subscription>();
        for (var i = 0; i < request.Count; i++)
        {
            subscriptions.Add(organization.AddSubscription());
        }

        await _organizationRepository.UpdateAsync(organization, cancellationToken).ConfigureAwait(false);
        return Result<List<SubscriptionViewModel>>.Success(subscriptions.Select(MapToViewModel).ToList());
    }

    private static SubscriptionViewModel MapToViewModel(Subscription s) =>
        new(s.Id, s.OrganizationId, s.UserId, s.IsActive, s.ActivatedAt, s.DeactivatedAt, s.CreatedAt);
}

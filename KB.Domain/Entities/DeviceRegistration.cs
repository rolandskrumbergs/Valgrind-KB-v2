using KB.Domain.Abstract;
using KB.Domain.Interfaces;

namespace KB.Domain.Entities;

public class DeviceRegistration : DomainEntity<Guid>, IAggregateRoot
{
    public Guid UserId { get; protected set; }
    public string PushToken { get; protected set; } = default!;
    public string Platform { get; protected set; } = default!;
    public string? AppVersion { get; protected set; }
    public DateTimeOffset CreatedAt { get; protected set; }
    public DateTimeOffset UpdatedAt { get; protected set; }

    public ApplicationUser User { get; protected set; } = default!;

    public void UpdateToken(string pushToken, string? appVersion)
    {
        PushToken = pushToken;
        AppVersion = appVersion;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public static DeviceRegistration Create(Guid userId, string pushToken, string platform, string? appVersion = null)
    {
        return new DeviceRegistration
        {
            UserId = userId,
            PushToken = pushToken,
            Platform = platform,
            AppVersion = appVersion,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }
}

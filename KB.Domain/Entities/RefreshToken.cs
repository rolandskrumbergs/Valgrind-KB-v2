using KB.Domain.Abstract;

namespace KB.Domain.Entities;

public class RefreshToken : DomainEntity<Guid>
{
    public string Token { get; protected set; } = default!;
    public Guid UserId { get; protected set; }
    public DateTimeOffset ExpiresAt { get; protected set; }
    public DateTimeOffset CreatedAt { get; protected set; }
    public DateTimeOffset? RevokedAt { get; protected set; }

    public ApplicationUser User { get; protected set; } = default!;

    public bool IsExpired() => DateTimeOffset.UtcNow >= ExpiresAt;

    public bool IsRevoked() => RevokedAt.HasValue;

    public bool IsValid() => !IsExpired() && !IsRevoked();

    public void Revoke()
    {
        RevokedAt = DateTimeOffset.UtcNow;
    }

    public static RefreshToken Create(string token, Guid userId, DateTimeOffset expiresAt)
    {
        return new RefreshToken
        {
            Token = token,
            UserId = userId,
            ExpiresAt = expiresAt,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}

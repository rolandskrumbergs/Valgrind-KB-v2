using KB.Domain.Enums;
using KB.Domain.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace KB.Domain.Entities;

public class ApplicationUser : IdentityUser<Guid>, IAggregateRoot, ISoftDeletable, IAuditable
{
    private ApplicationUser() { }

    public ApplicationUser(Guid id, string email, string firstName, string lastName, UserRole role)
    {
        Id = id;
        Email = email;
        UserName = email;
        FirstName = firstName;
        LastName = lastName;
        Role = role;
        TwoFactorEnabled = false;
        MfaMethod = MfaMethod.None;
    }

    public string FirstName { get; protected set; } = default!;
    public string LastName { get; protected set; } = default!;
    public string? SecurityNumber { get; protected set; }
    public UserRole Role { get; set; }
    public bool IsBanned { get; protected set; }
    public string? BanReason { get; protected set; }
    public DateTimeOffset? BanExpiresAt { get; protected set; }
    public bool IsInvited { get; protected set; }
    public DateTimeOffset? InvitationAcceptedAt { get; protected set; }
    public bool MustResetPassword { get; protected set; }
    public string? LegacyUserId { get; protected set; }
    public MfaMethod MfaMethod { get; set; }
    public string? AuthenticatorKey { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; } = [];

    // ISoftDeletable
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // IAuditable
    public DateTimeOffset CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Domain methods
    public bool CanLogin() => !IsDeleted && EmailConfirmed && !IsLockedOut();

    public bool IsLockedOut() => LockoutEnd.HasValue && LockoutEnd > DateTimeOffset.UtcNow;

    public void IncrementAccessFailedCount()
    {
        AccessFailedCount++;
    }

    public void ResetAccessFailedCount()
    {
        AccessFailedCount = 0;
        LockoutEnd = null;
    }

    public void SetLockout(DateTimeOffset lockoutEnd)
    {
        LockoutEnd = lockoutEnd;
    }

    public void EnableTwoFactor(MfaMethod method, string? authenticatorKey = null)
    {
        TwoFactorEnabled = true;
        MfaMethod = method;
        AuthenticatorKey = authenticatorKey;
    }

    public void DisableTwoFactor()
    {
        TwoFactorEnabled = false;
        MfaMethod = MfaMethod.None;
        AuthenticatorKey = null;
    }

    public void ConfirmEmail()
    {
        EmailConfirmed = true;
    }

    public void UpdatePasswordHash(string passwordHash)
    {
        PasswordHash = passwordHash;
    }

    public void Ban(string? reason = null, DateTimeOffset? expiresAt = null)
    {
        IsBanned = true;
        BanReason = reason;
        BanExpiresAt = expiresAt;
    }

    public void Unban()
    {
        IsBanned = false;
        BanReason = null;
        BanExpiresAt = null;
    }

    public void AcceptInvitation()
    {
        IsInvited = false;
        InvitationAcceptedAt = DateTimeOffset.UtcNow;
    }

    public void UpdateProfile(string firstName, string lastName, string? securityNumber)
    {
        FirstName = firstName;
        LastName = lastName;
        SecurityNumber = securityNumber;
    }
}

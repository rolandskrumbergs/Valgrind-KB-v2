using KB.Domain.Enums;
using KB.Domain.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace KB.Domain.Entities;

public class ApplicationUser : IdentityUser<Guid>, IAggregateRoot, ISoftDeletable, IAuditable
{
    private ApplicationUser() { }

    public ApplicationUser(Guid id, string email, UserRole role)
    {
        Id = id;
        Email = email;
        UserName = email;
        Role = role;
        TwoFactorEnabled = false;
        MfaMethod = MfaMethod.None;
    }

    public UserRole Role { get; set; }
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
}

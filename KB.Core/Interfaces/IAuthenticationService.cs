using KB.Domain.Entities;
using KB.Domain.Enums;

namespace KB.Core.Interfaces;

public interface IAuthenticationService
{
    Task<(bool Success, string[] Errors, Guid UserId)> RegisterUserAsync(string email, string password, string firstName, string lastName, CancellationToken cancellationToken = default);
    Task<(bool Success, string[] Errors)> ValidateCredentialsAsync(string email, string password, CancellationToken cancellationToken = default);
    Task SignInAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<string[]> GetUserRolesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<(bool Success, string[] Errors)> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken cancellationToken = default);
    
    // User retrieval
    Task<ApplicationUser?> GetUserByEmailWithRefreshTokensAsync(string email, CancellationToken cancellationToken = default);
    Task<ApplicationUser?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ApplicationUser?> GetUserWithRefreshTokenByTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<ApplicationUser?> GetUserByIdWithRefreshTokensAsync(Guid userId, CancellationToken cancellationToken = default);
    
    // User operations
    Task<bool> UpdateUserAsync(ApplicationUser user, CancellationToken cancellationToken = default);
    Task<bool> EnableMfaAsync(Guid userId, MfaMethod method, string? authenticatorKey = null, CancellationToken cancellationToken = default);
}

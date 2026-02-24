using KB.Core.Interfaces;
using KB.Domain.Entities;
using KB.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace KB.Infrastructure.Services;

public class AuthenticationService(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager) : IAuthenticationService
{
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly SignInManager<ApplicationUser> _signInManager = signInManager;

    public async Task<(bool Success, string[] Errors, Guid UserId)> RegisterUserAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser != null)
        {
            return (false, ["A user with this email already exists."], Guid.Empty);
        }

        var userId = Guid.NewGuid();

        var applicationUser = new ApplicationUser(userId, email, UserRole.User);
        applicationUser.ConfirmEmail(); // TODO: Implement email confirmation workflow

        var identityResult = await _userManager.CreateAsync(applicationUser, password);
        if (!identityResult.Succeeded)
        {
            var errors = identityResult.Errors.Select(e => e.Description).ToArray();
            return (false, errors, Guid.Empty);
        }

        return (true, [], userId);
    }

    public async Task<(bool Success, string[] Errors)> ValidateCredentialsAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        var applicationUser = await _userManager.FindByEmailAsync(email);
        if (applicationUser == null)
        {
            return (false, ["Invalid credentials."]);
        }

        var signInResult = await _signInManager.CheckPasswordSignInAsync(
            applicationUser,
            password,
            lockoutOnFailure: true);

        if (signInResult.IsLockedOut)
        {
            return (false, ["Account is locked due to multiple failed login attempts."]);
        }

        if (!signInResult.Succeeded)
        {
            return (false, ["Invalid credentials."]);
        }

        return (true, []);
    }

    public async Task SignInAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var applicationUser = await _userManager.FindByIdAsync(userId.ToString());
        if (applicationUser != null)
        {
            await _signInManager.SignInAsync(applicationUser, isPersistent: true);
        }
    }

    public async Task<string[]> GetUserRolesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var applicationUser = await _userManager.FindByIdAsync(userId.ToString());
        if (applicationUser == null)
        {
            return [];
        }

        var roles = await _userManager.GetRolesAsync(applicationUser);
        return [.. roles];
    }

    public async Task<(bool Success, string[] Errors)> ChangePasswordAsync(
        Guid userId,
        string currentPassword,
        string newPassword,
        CancellationToken cancellationToken = default)
    {
        var applicationUser = await _userManager.FindByIdAsync(userId.ToString());
        if (applicationUser == null)
        {
            return (false, ["User not found."]);
        }

        var identityResult = await _userManager.ChangePasswordAsync(
            applicationUser,
            currentPassword,
            newPassword);

        if (!identityResult.Succeeded)
        {
            var errors = identityResult.Errors.Select(e => e.Description).ToArray();
            return (false, errors);
        }

        return (true, []);
    }

    public async Task<ApplicationUser?> GetUserByEmailWithRefreshTokensAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _userManager.Users
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
    }

    public async Task<ApplicationUser?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _userManager.FindByIdAsync(userId.ToString());
    }

    public async Task<ApplicationUser?> GetUserWithRefreshTokenByTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        return await _userManager.Users
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.RefreshTokens.Any(rt => rt.Token == refreshToken), cancellationToken);
    }

    public async Task<ApplicationUser?> GetUserByIdWithRefreshTokensAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _userManager.Users
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
    }

    public async Task<bool> UpdateUserAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }

    public async Task<bool> EnableMfaAsync(Guid userId, MfaMethod method, string? authenticatorKey = null, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return false;
        }

        user.EnableTwoFactor(method, authenticatorKey);
        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }
}

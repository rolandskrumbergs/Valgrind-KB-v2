using KB.Domain.Enums;
using KB.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace KB.Operations.Seeding;

public sealed class UserSeeder(
    UserManager<ApplicationUser> userManager,
    ILogger<UserSeeder> logger)
{
    public async Task SeedAsync()
    {
        logger.LogInformation("Starting user seeding...");

        await SeedAdminUserAsync();
        await SeedTestUserAsync();

        logger.LogInformation("User seeding completed.");
    }

    private async Task SeedAdminUserAsync()
    {
        const string adminEmail = "admin@kb.local";
        const string adminPassword = "Admin@123";

        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
        if (existingAdmin is not null)
        {
            logger.LogInformation("Admin user already exists, skipping.");
            return;
        }

        var userId = Guid.NewGuid();

        var applicationUser = new ApplicationUser(userId, adminEmail, UserRole.Admin);
        applicationUser.ConfirmEmail();

        var identityResult = await userManager.CreateAsync(applicationUser, adminPassword);
        if (!identityResult.Succeeded)
        {
            logger.LogError("Failed to create admin user: {Errors}", string.Join(", ", identityResult.Errors.Select(e => e.Description)));
            return;
        }

        logger.LogInformation("Admin user created successfully: {Email}", adminEmail);
    }

    private async Task SeedTestUserAsync()
    {
        const string testEmail = "user@kb.local";
        const string testPassword = "User@123";

        var existingUser = await userManager.FindByEmailAsync(testEmail);
        if (existingUser is not null)
        {
            logger.LogInformation("Test user already exists, skipping.");
            return;
        }

        var userId = Guid.NewGuid();

        var applicationUser = new ApplicationUser(userId, testEmail, UserRole.User);
        applicationUser.ConfirmEmail();

        var identityResult = await userManager.CreateAsync(applicationUser, testPassword);
        if (!identityResult.Succeeded)
        {
            logger.LogError("Failed to create test user: {Errors}", string.Join(", ", identityResult.Errors.Select(e => e.Description)));
            return;
        }

        logger.LogInformation("Test user created successfully: {Email}", testEmail);
    }
}

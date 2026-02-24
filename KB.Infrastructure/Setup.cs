using KB.Core.Interfaces;
using KB.Domain.Interfaces;
using KB.Infrastructure.Data;
using KB.Infrastructure.Data.Interceptors;
using KB.Infrastructure.Events;
using KB.Domain.Entities;
using KB.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace KB.Infrastructure;

public static class Setup
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<SoftDeleteInterceptor>();
        services.AddScoped<AuditingInterceptor>();
        services.AddSingleton<DapperContext>();

        services.AddDbContext<AppDbContext>((serviceProvider, contextOptions) =>
            contextOptions
                .UseNpgsql(
                    configuration.GetConnectionString("DefaultConnection"),
                    options => options.EnableRetryOnFailure())
                .AddInterceptors(
                    serviceProvider.GetRequiredService<SoftDeleteInterceptor>(),
                    serviceProvider.GetRequiredService<AuditingInterceptor>()));

        services.AddSingleton<IDomainEventChannel, DomainEventChannel>();
        services.AddScoped<IDomainEventDispatcher, DomainEventDispatcher>();

        services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequiredLength = 8;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireLowercase = true;

            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.AllowedForNewUsers = true;

            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

        services.AddScoped<KB.Core.Interfaces.IAuthenticationService, AuthenticationService>();
        services.AddScoped<KB.Core.Interfaces.ITokenService, TokenService>();
        services.AddScoped<KB.Core.Interfaces.IEmailService, EmailService>();
        services.AddScoped<KB.Core.Interfaces.ITotpService, TotpService>();

        return services;
    }
}

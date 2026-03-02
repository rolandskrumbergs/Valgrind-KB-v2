using KB.Core.Interfaces;
using KB.Domain.Interfaces;
using KB.Domain.Interfaces.Repositories;
using KB.Infrastructure.AI;
using KB.Infrastructure.Configuration;
using KB.Infrastructure.Data;
using KB.Infrastructure.Data.Interceptors;
using KB.Infrastructure.Data.Repositories;
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

        services.Configure<AiSettings>(configuration.GetSection(AiSettings.SectionName));

        // AI services
        services.AddSemanticKernel(configuration);
        services.AddSingleton<IBlobStorageService, BlobStorageService>();
        services.AddSingleton<IDocumentIngestionService, DocumentIngestionService>();
        services.AddScoped<IChatOrchestrationService, ChatOrchestrationService>();

        // Repositories
        services.AddScoped<IKnowledgeBaseRepository, KnowledgeBaseRepository>();
        services.AddScoped<IDocumentRepository, DocumentRepository>();
        services.AddScoped<IAiProfileRepository, AiProfileRepository>();
        services.AddScoped<IConversationRepository, ConversationRepository>();
        services.AddScoped<IAiInvocationRepository, AiInvocationRepository>();
        services.AddScoped<IUsageRecordRepository, UsageRecordRepository>();
        services.AddScoped<IConversationStarterRepository, ConversationStarterRepository>();
        services.AddScoped<IOrganizationRepository, OrganizationRepository>();
        services.AddScoped<IArticleRepository, ArticleRepository>();
        services.AddScoped<ICourseRepository, CourseRepository>();
        services.AddScoped<IEnrollmentRepository, EnrollmentRepository>();
        services.AddScoped<IPurchaseRepository, PurchaseRepository>();
        services.AddScoped<IDeviceRegistrationRepository, DeviceRegistrationRepository>();

        return services;
    }
}

using KB.Domain.Interfaces;
using KB.Infrastructure;
using KB.Operations;
using KB.Operations.Seeding;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddScoped<IUserContext, SystemUserContext>();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<UserSeeder>();

var host = builder.Build();

using (var scope = host.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        logger.LogInformation("Starting database seeding...");

        var userSeeder = services.GetRequiredService<UserSeeder>();
        await userSeeder.SeedAsync();

        logger.LogInformation("Database seeding completed successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred during database seeding.");
        throw;
    }
}

await host.RunAsync();

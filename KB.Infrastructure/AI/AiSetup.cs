using KB.Infrastructure.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.KernelMemory;
using Microsoft.KernelMemory.Postgres;
using Microsoft.SemanticKernel;

namespace KB.Infrastructure.AI;

public static class AiSetup
{
    public static IServiceCollection AddSemanticKernel(this IServiceCollection services, IConfiguration configuration)
    {
        var aiSettings = configuration.GetSection(AiSettings.SectionName).Get<AiSettings>() ?? new AiSettings();

        var azureSettings = aiSettings.AzureOpenAi;
        if (string.IsNullOrWhiteSpace(azureSettings.ApiKey) || string.IsNullOrWhiteSpace(azureSettings.Endpoint))
        {
            // Azure OpenAI not configured — skip AI service registration
            return services;
        }

        services.AddKernel();

        services.AddAzureOpenAIChatCompletion(
            deploymentName: azureSettings.ChatDeployment,
            endpoint: azureSettings.Endpoint,
            apiKey: azureSettings.ApiKey);

        // Register Kernel Memory with pgvector Postgres connector
        var connectionString = configuration.GetConnectionString("DefaultConnection") ?? string.Empty;

        var postgresConfig = new PostgresConfig
        {
            ConnectionString = connectionString,
            TableNamePrefix = "km_"
        };

        var kmBuilder = new KernelMemoryBuilder();

        var azureConfig = new AzureOpenAIConfig
        {
            Deployment = azureSettings.ChatDeployment,
            Endpoint = azureSettings.Endpoint,
            APIKey = azureSettings.ApiKey,
            Auth = AzureOpenAIConfig.AuthTypes.APIKey,
            APIType = AzureOpenAIConfig.APITypes.ChatCompletion,
        };
        var azureEmbeddingConfig = new AzureOpenAIConfig
        {
            Deployment = azureSettings.EmbeddingDeployment,
            Endpoint = azureSettings.Endpoint,
            APIKey = azureSettings.ApiKey,
            Auth = AzureOpenAIConfig.AuthTypes.APIKey,
            APIType = AzureOpenAIConfig.APITypes.EmbeddingGeneration,
        };
        kmBuilder.WithAzureOpenAITextGeneration(azureConfig);
        kmBuilder.WithAzureOpenAITextEmbeddingGeneration(azureEmbeddingConfig);

        kmBuilder.WithPostgresMemoryDb(postgresConfig);

        // Use Azure Blob Storage if configured, otherwise KM defaults to volatile (in-memory) storage
        if (!string.IsNullOrEmpty(aiSettings.AzureBlobStorage.ConnectionString) &&
            !aiSettings.AzureBlobStorage.ConnectionString.Contains("USE USER SECRETS"))
        {
            kmBuilder.WithAzureBlobsDocumentStorage(new AzureBlobsConfig
            {
                Auth = AzureBlobsConfig.AuthTypes.ConnectionString,
                ConnectionString = aiSettings.AzureBlobStorage.ConnectionString,
                Container = "kernel-memory"
            });
        }

        var memory = kmBuilder.Build<MemoryServerless>();
        services.AddSingleton<IKernelMemory>(memory);

        return services;
    }
}

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

        services.AddKernel();

        if (string.Equals(aiSettings.Provider, "AzureOpenAI", StringComparison.OrdinalIgnoreCase))
        {
            services.AddAzureOpenAIChatCompletion(
                deploymentName: aiSettings.AzureOpenAi.ChatDeployment,
                endpoint: aiSettings.AzureOpenAi.Endpoint,
                apiKey: aiSettings.AzureOpenAi.ApiKey);
        }
        else
        {
            services.AddOpenAIChatCompletion(
                modelId: aiSettings.OpenAi.ChatModel,
                apiKey: aiSettings.OpenAi.ApiKey,
                orgId: aiSettings.OpenAi.OrganizationId);
        }

        // Register Kernel Memory with pgvector Postgres connector
        var connectionString = configuration.GetConnectionString("DefaultConnection") ?? string.Empty;

        var postgresConfig = new PostgresConfig
        {
            ConnectionString = connectionString,
            TableNamePrefix = "km_"
        };

        var kmBuilder = new KernelMemoryBuilder();

        if (string.Equals(aiSettings.Provider, "AzureOpenAI", StringComparison.OrdinalIgnoreCase))
        {
            var azureConfig = new AzureOpenAIConfig
            {
                Deployment = aiSettings.AzureOpenAi.ChatDeployment,
                Endpoint = aiSettings.AzureOpenAi.Endpoint,
                APIKey = aiSettings.AzureOpenAi.ApiKey,
                Auth = AzureOpenAIConfig.AuthTypes.APIKey,
                APIType = AzureOpenAIConfig.APITypes.ChatCompletion,
            };
            var azureEmbeddingConfig = new AzureOpenAIConfig
            {
                Deployment = aiSettings.AzureOpenAi.EmbeddingDeployment,
                Endpoint = aiSettings.AzureOpenAi.Endpoint,
                APIKey = aiSettings.AzureOpenAi.ApiKey,
                Auth = AzureOpenAIConfig.AuthTypes.APIKey,
                APIType = AzureOpenAIConfig.APITypes.EmbeddingGeneration,
            };
            kmBuilder.WithAzureOpenAITextGeneration(azureConfig);
            kmBuilder.WithAzureOpenAITextEmbeddingGeneration(azureEmbeddingConfig);
        }
        else
        {
            var openAiConfig = new OpenAIConfig
            {
                TextModel = aiSettings.OpenAi.ChatModel,
                EmbeddingModel = aiSettings.OpenAi.EmbeddingModel,
                APIKey = aiSettings.OpenAi.ApiKey,
                OrgId = aiSettings.OpenAi.OrganizationId ?? string.Empty,
            };
            kmBuilder.WithOpenAI(openAiConfig);
        }

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

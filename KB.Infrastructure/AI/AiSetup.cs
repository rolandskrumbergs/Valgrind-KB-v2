using KB.Infrastructure.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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

        return services;
    }
}

namespace KB.Infrastructure.Configuration;

public sealed class AiSettings
{
    public const string SectionName = "AI";

    public string DefaultModel { get; set; } = "gpt-4o";
    public int MaxAgenticLoopSteps { get; set; } = 5;
    public int MaxConversationHistoryMessages { get; set; } = 20;
    public string Provider { get; set; } = "OpenAI";
    public OpenAiSettings OpenAi { get; set; } = new();
    public AzureOpenAiSettings AzureOpenAi { get; set; } = new();
    public AzureBlobStorageSettings AzureBlobStorage { get; set; } = new();
    public ConfidenceThresholdDefaults ConfidenceDefaults { get; set; } = new();
}

public sealed class OpenAiSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string? OrganizationId { get; set; }
    public string ChatModel { get; set; } = "gpt-4o";
    public string EvaluationModel { get; set; } = "gpt-4o-mini";
    public string EmbeddingModel { get; set; } = "text-embedding-3-large";
}

public sealed class AzureOpenAiSettings
{
    public string Endpoint { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string ChatDeployment { get; set; } = string.Empty;
    public string EvaluationDeployment { get; set; } = string.Empty;
    public string EmbeddingDeployment { get; set; } = string.Empty;
}

public sealed class AzureBlobStorageSettings
{
    public string ConnectionString { get; set; } = string.Empty;
}

public sealed class ConfidenceThresholdDefaults
{
    public decimal MinRelevanceScore { get; set; } = 0.7m;
    public int MinRelevanceChunksRequired { get; set; } = 2;
    public decimal HighConfidenceScore { get; set; } = 0.85m;
    public int HighConfidenceChunksRequired { get; set; } = 1;
    public int ChunkEvaluationMinScore { get; set; } = 5;
    public decimal JudgeMinGroundedness { get; set; } = 3.0m;
    public decimal JudgeMinRelevance { get; set; } = 3.0m;
    public decimal JudgeMinCoherence { get; set; } = 3.0m;
    public decimal JudgeMinFactualAccuracy { get; set; } = 3.0m;
    public decimal MaxUnverifiedCitationRatio { get; set; } = 0.3m;
}

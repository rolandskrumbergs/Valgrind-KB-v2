using System.ComponentModel;
using System.Text;
using System.Text.Json;
using Azure;
using Azure.Search.Documents;
using Azure.Search.Documents.Models;
using KB.Core.Features.Conversations;
using KB.Domain.Entities;
using KB.Domain.Enums;
using KB.Infrastructure.Configuration;
using Microsoft.SemanticKernel;

namespace KB.Infrastructure.AI.Plugins;

public sealed class KnowledgeBasePlugin
{
    private readonly AiSettings _settings;
    private readonly AiProfile _aiProfile;
    private readonly List<RetrievedChunk> _retrievedChunks = [];

    public IReadOnlyList<RetrievedChunk> RetrievedChunks => _retrievedChunks;

    public KnowledgeBasePlugin(AiSettings settings, AiProfile aiProfile)
    {
        _settings = settings;
        _aiProfile = aiProfile;
    }

    [KernelFunction("SearchKnowledgeBase")]
    [Description("Söker i kunskapsbasen efter relevant information om svensk juridik, godmanskap och förvaltarskap. Använd denna funktion för att hitta lagtext, rättsfall och annan juridisk information.")]
    public async Task<string> SearchKnowledgeBaseAsync(
        [Description("Sökfrågan på svenska")] string query,
        [Description("Valfri kategori att söka i: Books, Laws, LegalCases, Other. Lämna tomt för att söka i alla.")] string? category = null,
        CancellationToken cancellationToken = default)
    {
        var knowledgeBase = _aiProfile.KnowledgeBase;
        var categories = GetSearchCategories(category);
        var allChunks = new List<RetrievedChunk>();

        foreach (var cat in categories)
        {
            var indexName = knowledgeBase.GetIndexName(cat);
            var chunks = await SearchIndexAsync(indexName, query, cancellationToken).ConfigureAwait(false);
            allChunks.AddRange(chunks);
        }

        // Sort by relevance and take topK
        var topChunks = allChunks
            .OrderByDescending(c => c.RelevanceScore)
            .Take(_aiProfile.TopK)
            .ToList();

        _retrievedChunks.AddRange(topChunks);

        if (topChunks.Count == 0)
        {
            return "Inga relevanta resultat hittades i kunskapsbasen.";
        }

        return FormatChunksForLlm(topChunks);
    }

    private async Task<List<RetrievedChunk>> SearchIndexAsync(
        string indexName, string query, CancellationToken cancellationToken)
    {
        try
        {
            var searchClient = new SearchClient(
                new Uri(_settings.AzureAiSearch.Endpoint),
                indexName,
                new AzureKeyCredential(_settings.AzureAiSearch.ApiKey));

            var searchOptions = new SearchOptions
            {
                Size = _aiProfile.TopK,
                QueryType = SearchQueryType.Semantic,
                SemanticSearch = new SemanticSearchOptions
                {
                    SemanticConfigurationName = "default"
                },
                Select = { "content", "title", "category" }
            };

            var response = await searchClient.SearchAsync<SearchDocument>(
                query, searchOptions, cancellationToken).ConfigureAwait(false);

            var chunks = new List<RetrievedChunk>();

            await foreach (var result in response.Value.GetResultsAsync().WithCancellation(cancellationToken))
            {
                var score = result.SemanticSearch?.RerankerScore ?? result.Score ?? 0;

                if (score < (double)_aiProfile.MinRelevanceThreshold)
                    continue;

                var content = result.Document.GetString("content");
                var title = result.Document.GetString("title");
                var cat = result.Document.TryGetValue("category", out var catVal) ? catVal?.ToString() : indexName;

                chunks.Add(new RetrievedChunk(
                    Content: content,
                    DocumentName: title ?? "Okänt dokument",
                    Category: cat ?? "Other",
                    RelevanceScore: score));
            }

            return chunks;
        }
        catch (RequestFailedException)
        {
            // Index may not exist yet — return empty results
            return [];
        }
    }

    private static List<KnowledgeCategory> GetSearchCategories(string? category)
    {
        if (!string.IsNullOrWhiteSpace(category) &&
            Enum.TryParse<KnowledgeCategory>(category, ignoreCase: true, out var parsed))
        {
            return [parsed];
        }

        return [KnowledgeCategory.Books, KnowledgeCategory.Laws, KnowledgeCategory.LegalCases, KnowledgeCategory.Other];
    }

    private static string FormatChunksForLlm(List<RetrievedChunk> chunks)
    {
        var sb = new StringBuilder();
        sb.AppendLine("## Resultat från kunskapsbasen\n");

        for (var i = 0; i < chunks.Count; i++)
        {
            var chunk = chunks[i];
            sb.AppendLine($"### Källa {i + 1}: {chunk.DocumentName} ({chunk.Category})");
            sb.AppendLine($"Relevans: {chunk.RelevanceScore:F2}");
            sb.AppendLine();
            sb.AppendLine(chunk.Content);
            sb.AppendLine();
        }

        return sb.ToString();
    }
}

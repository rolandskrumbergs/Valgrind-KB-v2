using System.ComponentModel;
using System.Text;
using KB.Core.Features.Conversations;
using KB.Domain.Entities;
using KB.Infrastructure.Configuration;
using Microsoft.KernelMemory;
using Microsoft.SemanticKernel;

namespace KB.Infrastructure.AI.Plugins;

public sealed class KnowledgeBasePlugin
{
    private readonly AiSettings _settings;
    private readonly AiProfile _aiProfile;
    private readonly IKernelMemory _memory;
    private readonly List<RetrievedChunk> _retrievedChunks = [];

    public IReadOnlyList<RetrievedChunk> RetrievedChunks => _retrievedChunks;

    public KnowledgeBasePlugin(AiSettings settings, AiProfile aiProfile, IKernelMemory memory)
    {
        _settings = settings;
        _aiProfile = aiProfile;
        _memory = memory;
    }

    [KernelFunction("SearchKnowledgeBase")]
    [Description("Söker i kunskapsbasen efter relevant information om svensk juridik, godmanskap och förvaltarskap. Använd denna funktion för att hitta lagtext, rättsfall och annan juridisk information.")]
    public async Task<string> SearchKnowledgeBaseAsync(
        [Description("Sökfrågan på svenska")] string query,
        [Description("Valfri kategori att söka i: Books, Laws, LegalCases, Other. Lämna tomt för att söka i alla.")] string? category = null,
        CancellationToken cancellationToken = default)
    {
        var knowledgeBase = _aiProfile.KnowledgeBase;
        var index = knowledgeBase.SearchIndexPrefix;

        var filters = new List<MemoryFilter>();
        if (!string.IsNullOrWhiteSpace(category))
        {
            var filter = new MemoryFilter();
            filter.Add("category", category);
            filters.Add(filter);
        }

        var searchResult = await _memory.SearchAsync(
            query: query,
            index: index,
            filters: filters.Count > 0 ? filters : null,
            minRelevance: (double)_aiProfile.MinRelevanceThreshold,
            limit: _aiProfile.TopK,
            cancellationToken: cancellationToken).ConfigureAwait(false);

        foreach (var citation in searchResult.Results)
        {
            foreach (var partition in citation.Partitions)
            {
                var cat = partition.Tags.TryGetValue("category", out var cats) && cats.Count > 0
                    ? cats[0] ?? "Other"
                    : "Other";

                _retrievedChunks.Add(new RetrievedChunk(
                    Content: partition.Text,
                    DocumentName: citation.DocumentId,
                    Category: cat,
                    RelevanceScore: partition.Relevance));
            }
        }

        if (_retrievedChunks.Count == 0)
        {
            return "Inga relevanta resultat hittades i kunskapsbasen.";
        }

        return FormatChunksForLlm(_retrievedChunks);
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

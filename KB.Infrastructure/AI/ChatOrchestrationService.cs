using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using KB.Core.Features.Conversations;
using KB.Core.Interfaces;
using KB.Domain.Entities;
using KB.Domain.Enums;
using KB.Domain.Interfaces.Repositories;
using KB.Infrastructure.AI.Plugins;
using KB.Infrastructure.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.KernelMemory;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.AzureOpenAI;

namespace KB.Infrastructure.AI;

public sealed class ChatOrchestrationService(
    IServiceScopeFactory scopeFactory,
    Kernel kernel,
    IKernelMemory kernelMemory,
    IOptions<AiSettings> aiSettings,
    ILogger<ChatOrchestrationService> logger) : IChatOrchestrationService
{
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
    private readonly Kernel _kernel = kernel;
    private readonly IKernelMemory _kernelMemory = kernelMemory;
    private readonly AiSettings _aiSettings = aiSettings.Value;
    private readonly ILogger<ChatOrchestrationService> _logger = logger;

    private static readonly string SystemPrompt = LoadEmbeddedPrompt("SystemPrompt.txt");

    public async IAsyncEnumerable<ChatStreamEvent> SendMessageAsync(
        Guid conversationId,
        string userMessage,
        Guid userId,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var conversationRepository = scope.ServiceProvider.GetRequiredService<IConversationRepository>();
        var aiProfileRepository = scope.ServiceProvider.GetRequiredService<IAiProfileRepository>();
        var aiInvocationRepository = scope.ServiceProvider.GetRequiredService<IAiInvocationRepository>();
        var usageRecordRepository = scope.ServiceProvider.GetRequiredService<IUsageRecordRepository>();

        // Load conversation with history
        var conversation = await conversationRepository.GetWithMessagesAsync(conversationId, cancellationToken)
            .ConfigureAwait(false);

        if (conversation is null)
        {
            yield return ChatStreamEvent.ErrorEvent("Konversationen hittades inte.");
            yield break;
        }

        // Load active AI profile
        var aiProfile = await aiProfileRepository.GetActiveProfileAsync(cancellationToken)
            .ConfigureAwait(false);

        if (aiProfile is null)
        {
            yield return ChatStreamEvent.ErrorEvent("Ingen aktiv AI-profil hittades.");
            yield break;
        }

        // Persist user message
        var userMsg = conversation.AddMessage(MessageRole.User, userMessage);
        await conversationRepository.UpdateAsync(conversation, cancellationToken).ConfigureAwait(false);

        // Set up KB plugin for this request
        var kbPlugin = new KnowledgeBasePlugin(_aiSettings, aiProfile, _kernelMemory);
        var chatKernel = _kernel.Clone();
        chatKernel.Plugins.AddFromObject(kbPlugin, "KnowledgeBase");

        // Build chat history from conversation
        var chatHistory = BuildChatHistory(conversation);

        // Configure tool execution
        var executionSettings = new AzureOpenAIPromptExecutionSettings
        {
            FunctionChoiceBehavior = FunctionChoiceBehavior.Auto(),
            MaxTokens = 4096,
            Temperature = 0.3
        };

        var chatCompletionService = chatKernel.GetRequiredService<IChatCompletionService>();

        // Stream the response
        var responseBuilder = new StringBuilder();
        var toolCallsLogged = false;

        await foreach (var streamChunk in chatCompletionService
            .GetStreamingChatMessageContentsAsync(chatHistory, executionSettings, chatKernel, cancellationToken)
            .ConfigureAwait(false))
        {
            if (cancellationToken.IsCancellationRequested)
                yield break;

            // Track tool calls
            if (streamChunk.Metadata?.ContainsKey("ToolCalls") == true && !toolCallsLogged)
            {
                yield return ChatStreamEvent.ToolCall("SearchKnowledgeBase");
                toolCallsLogged = true;
            }

            if (!string.IsNullOrEmpty(streamChunk.Content))
            {
                responseBuilder.Append(streamChunk.Content);
                yield return ChatStreamEvent.Token(streamChunk.Content);
            }
        }

        var fullResponse = responseBuilder.ToString();

        // Persist assistant message with AI profile snapshot
        var profileSnapshot = JsonSerializer.Serialize(new
        {
            aiProfile.Id,
            aiProfile.Name,
            aiProfile.Model,
            aiProfile.TopK,
            aiProfile.MinRelevanceThreshold,
            aiProfile.HighConfidenceThreshold
        });

        var assistantMsg = conversation.AddMessage(
            MessageRole.Assistant,
            fullResponse,
            aiProfileSnapshot: profileSnapshot);

        await conversationRepository.UpdateAsync(conversation, cancellationToken).ConfigureAwait(false);

        // Persist usage record
        var usage = UsageRecord.Create(
            userId: userId,
            conversationId: conversationId,
            messageId: assistantMsg.Id,
            promptTokens: 0, // Updated by confidence scoring / post-processing
            completionTokens: 0,
            model: aiProfile.Model,
            aiProfileSnapshot: profileSnapshot);

        await usageRecordRepository.AddAsync(usage, cancellationToken).ConfigureAwait(false);

        // Persist AI invocation if KB was searched
        if (kbPlugin.RetrievedChunks.Count > 0)
        {
            var invocation = AiInvocation.Create(
                conversationId: conversationId,
                messageId: assistantMsg.Id,
                userId: userId,
                searchQuery: userMessage,
                outcome: InvocationOutcome.Success,
                model: aiProfile.Model,
                retrievedChunks: JsonSerializer.Serialize(kbPlugin.RetrievedChunks),
                aiProfileSnapshot: profileSnapshot);

            await aiInvocationRepository.AddAsync(invocation, cancellationToken).ConfigureAwait(false);
        }

        // Auto-generate title for new conversations
        if (string.IsNullOrEmpty(conversation.Title) && conversation.Messages.Count <= 2)
        {
            conversation.UpdateTitle(GenerateTitle(userMessage));
            await conversationRepository.UpdateAsync(conversation, cancellationToken).ConfigureAwait(false);
        }

        yield return ChatStreamEvent.Done(assistantMsg.Id);
    }

    private ChatHistory BuildChatHistory(Conversation conversation)
    {
        var chatHistory = new ChatHistory();
        chatHistory.AddSystemMessage(SystemPrompt);

        var messages = conversation.Messages
            .OrderBy(m => m.CreatedAt)
            .TakeLast(_aiSettings.MaxConversationHistoryMessages)
            .ToList();

        foreach (var message in messages)
        {
            switch (message.Role)
            {
                case MessageRole.User:
                    chatHistory.AddUserMessage(message.Content ?? string.Empty);
                    break;
                case MessageRole.Assistant:
                    chatHistory.AddAssistantMessage(message.Content ?? string.Empty);
                    break;
                case MessageRole.System:
                    chatHistory.AddSystemMessage(message.Content ?? string.Empty);
                    break;
            }
        }

        return chatHistory;
    }

    private static string GenerateTitle(string userMessage)
    {
        const int maxTitleLength = 60;
        var title = userMessage.Length <= maxTitleLength
            ? userMessage
            : string.Concat(userMessage.AsSpan(0, maxTitleLength - 3), "...");

        return title;
    }

    private static string LoadEmbeddedPrompt(string fileName)
    {
        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = assembly.GetManifestResourceNames()
            .FirstOrDefault(n => n.EndsWith(fileName, StringComparison.OrdinalIgnoreCase));

        if (resourceName is null)
            throw new InvalidOperationException($"Embedded prompt resource '{fileName}' not found.");

        using var stream = assembly.GetManifestResourceStream(resourceName)!;
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}

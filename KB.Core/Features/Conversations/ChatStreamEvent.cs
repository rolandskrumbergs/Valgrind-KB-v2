namespace KB.Core.Features.Conversations;

public sealed record ChatStreamEvent
{
    public required string Type { get; init; }
    public string? Content { get; init; }
    public string? ToolName { get; init; }
    public Guid? MessageId { get; init; }
    public string? Error { get; init; }

    public static ChatStreamEvent Token(string content) => new() { Type = "token", Content = content };
    public static ChatStreamEvent ToolCall(string toolName) => new() { Type = "tool_call", ToolName = toolName };
    public static ChatStreamEvent Done(Guid messageId) => new() { Type = "done", MessageId = messageId };
    public static ChatStreamEvent ErrorEvent(string error) => new() { Type = "error", Error = error };
}

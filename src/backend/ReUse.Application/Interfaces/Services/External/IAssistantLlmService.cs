using ReUse.Application.DTOs.Assistant;

namespace ReUse.Application.Interfaces.Services.External;

public interface IAssistantLlmService
{
    Task<string> CompleteAsync(
        string systemPrompt,
        IReadOnlyList<AssistantTurn> history,
        string userMessage,
        CancellationToken cancellationToken = default);
}
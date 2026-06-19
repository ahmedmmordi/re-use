namespace ReUse.Application.DTOs.Assistant.Requests;

public record AssistantChatRequest(
    string Message,

    // Prior turns of the conversation, oldest first. The backend trims this
    // to the most recent N turns to bound prompt size and latency.
    List<AssistantTurn>? History
);
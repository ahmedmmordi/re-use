namespace ReUse.Application.DTOs.Assistant;

// A single prior turn of the conversation, passed in by the client.
// Role is "user" or "assistant".
public record AssistantTurn(
    string Role,
    string Content
);
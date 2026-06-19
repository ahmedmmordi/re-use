using ReUse.Application.DTOs.Products.Responses;

namespace ReUse.Application.DTOs.Assistant.Responses;

public record AssistantChatResponse
{
    // Natural-language reply written by the LLM.
    public string Reply { get; init; } = string.Empty;

    // Top products matching the user's request, ordered by relevance. Holds
    // 0 to ResultsToShow items depending on how many clear the similarity
    // threshold. Empty for non-search messages.
    public List<ProductResponse> Products { get; init; } = [];
}
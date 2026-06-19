using ReUse.Application.DTOs.Assistant.Requests;
using ReUse.Application.DTOs.Assistant.Responses;

namespace ReUse.Application.Interfaces.Services;

public interface IAssistantService
{
    Task<AssistantChatResponse> ChatAsync(AssistantChatRequest request);

    // Backfill feed consumed by the embedding service on startup/reindex:
    // every active product as a {productId, text} pair.
    Task<List<ProductFeedItem>> GetProductFeedAsync();
}
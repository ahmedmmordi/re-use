namespace ReUse.Application.DTOs.Assistant.Responses;

// One product as exposed to the embedding service's backfill feed.
public record ProductFeedItem(
    string ProductId,
    string Text
);
namespace ReUse.Application.DTOs.Assistant;

public record EmbeddingSearchHit(
    Guid ProductId,
    double Score
);
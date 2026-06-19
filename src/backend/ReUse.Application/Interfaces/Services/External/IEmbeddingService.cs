using ReUse.Application.DTOs.Assistant;

namespace ReUse.Application.Interfaces.Services.External;

public interface IEmbeddingService
{
    Task<IReadOnlyList<EmbeddingSearchHit>> SearchAsync(
        string query, int topN, double minScore = 0.3, CancellationToken cancellationToken = default);

    Task IndexProductAsync(
        Guid productId, string text, CancellationToken cancellationToken = default);

    Task DeleteProductAsync(
        Guid productId, CancellationToken cancellationToken = default);
}
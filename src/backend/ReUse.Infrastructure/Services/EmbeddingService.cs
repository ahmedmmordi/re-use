using System.Net.Http.Json;
using System.Text.Json;

using ReUse.Application.DTOs.Assistant;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Infrastructure.Models.Assistant;

namespace ReUse.Infrastructure.Services;

public class EmbeddingService : IEmbeddingService
{
    private readonly HttpClient _http;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public EmbeddingService(HttpClient http)
    {
        _http = http;
    }

    public async Task<IReadOnlyList<EmbeddingSearchHit>> SearchAsync(
        string query, int topN, double minScore = 0.3, CancellationToken cancellationToken = default)
    {
        var payload = new SearchRequestModel { Query = query, TopN = topN, MinScore = minScore };

        var response = await _http.PostAsJsonAsync("/search", payload, cancellationToken);
        response.EnsureSuccessStatusCode();

        var body = await response.Content
            .ReadFromJsonAsync<SearchResponseModel>(JsonOptions, cancellationToken);

        if (body is null)
            return [];

        return body.Hits
            .Where(h => Guid.TryParse(h.ProductId, out _))
            .Select(h => new EmbeddingSearchHit(Guid.Parse(h.ProductId), h.Score))
            .ToList();
    }

    public async Task IndexProductAsync(
        Guid productId, string text, CancellationToken cancellationToken = default)
    {
        var payload = new IndexRequestModel
        {
            ProductId = productId.ToString(),
            Text = text
        };

        var response = await _http.PostAsJsonAsync("/index", payload, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    public async Task DeleteProductAsync(
        Guid productId, CancellationToken cancellationToken = default)
    {
        var response = await _http.DeleteAsync($"/index/{productId}", cancellationToken);
        response.EnsureSuccessStatusCode();
    }
}
using System.Text.Json.Serialization;

namespace ReUse.Infrastructure.Models.Assistant;

internal sealed class IndexRequestModel
{
    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}

internal sealed class SearchRequestModel
{
    [JsonPropertyName("query")]
    public string Query { get; set; } = string.Empty;

    [JsonPropertyName("topN")]
    public int TopN { get; set; }

    [JsonPropertyName("minScore")]
    public double MinScore { get; set; }
}

internal sealed class SearchResponseModel
{
    [JsonPropertyName("hits")]
    public List<SearchHitModel> Hits { get; set; } = [];
}

internal sealed class SearchHitModel
{
    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("score")]
    public double Score { get; set; }
}
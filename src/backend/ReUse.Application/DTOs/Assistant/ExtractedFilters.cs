namespace ReUse.Application.DTOs.Assistant;

// Structured intent and filter constraints extracted from the user's message
// by the LLM. Mirrors the JSON the model is asked to return.
public record ExtractedFilters
{
    public bool IsOnTopic { get; init; }
    public string Intent { get; init; } = "off_topic";
    public string? Category { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    public string? Condition { get; init; }
    public List<string> ExcludedBrands { get; init; } = [];
}
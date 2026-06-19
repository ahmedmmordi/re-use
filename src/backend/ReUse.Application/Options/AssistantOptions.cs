namespace ReUse.Application.Options;

public class AssistantOptions
{
    public string EmbeddingBaseUrl { get; set; } = string.Empty;
    public string GroqApiKey { get; set; } = string.Empty;
    public string GroqModel { get; set; } = "llama-3.3-70b-versatile";
    public string InternalKey { get; set; } = string.Empty;
    public int MaxHistoryTurns { get; set; } = 8;
    public int SearchTopN { get; set; } = 10;
    public double MinScore { get; set; } = 0.3;
    public int ResultsToShow { get; set; } = 3;
}
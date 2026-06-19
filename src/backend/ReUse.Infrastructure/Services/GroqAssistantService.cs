using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

using Microsoft.Extensions.Options;

using ReUse.Application.DTOs.Assistant;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Application.Options;

namespace ReUse.Infrastructure.Services;

public class GroqAssistantService : IAssistantLlmService
{
    private readonly HttpClient _http;
    private readonly AssistantOptions _options;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public GroqAssistantService(HttpClient http, IOptions<AssistantOptions> options)
    {
        _http = http;
        _options = options.Value;
        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", _options.GroqApiKey);
    }

    public async Task<string> CompleteAsync(
        string systemPrompt,
        IReadOnlyList<AssistantTurn> history,
        string userMessage,
        CancellationToken cancellationToken = default)
    {
        var messages = new List<GroqMessage>
        {
            new() { Role = "system", Content = systemPrompt }
        };

        foreach (var turn in history)
            messages.Add(new GroqMessage { Role = turn.Role, Content = turn.Content });

        messages.Add(new GroqMessage { Role = "user", Content = userMessage });

        var payload = new
        {
            model = _options.GroqModel,
            messages,
            stream = false
        };

        HttpResponseMessage response;
        try
        {
            response = await _http.PostAsJsonAsync(
                "https://api.groq.com/openai/v1/chat/completions", payload, cancellationToken);
        }
        catch (HttpRequestException)
        {
            throw new ServiceUnavailableException(
                "The assistant is temporarily unavailable. Please try again in a moment.");
        }

        if (!response.IsSuccessStatusCode)
            throw new ServiceUnavailableException(
                "The assistant is temporarily unavailable. Please try again in a moment.");

        var body = await response.Content
            .ReadFromJsonAsync<GroqResponse>(JsonOptions, cancellationToken);

        return body?.Choices?.FirstOrDefault()?.Message?.Content?.Trim() ?? string.Empty;
    }
}

file record GroqMessage
{
    [JsonPropertyName("role")] public string Role { get; init; } = "";
    [JsonPropertyName("content")] public string Content { get; init; } = "";
}

file record GroqResponse
{
    [JsonPropertyName("choices")] public List<GroqChoice>? Choices { get; init; }
}

file record GroqChoice
{
    [JsonPropertyName("message")] public GroqMessage? Message { get; init; }
}
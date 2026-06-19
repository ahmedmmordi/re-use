using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using ReUse.Application.DTOs.Assistant.Responses;
using ReUse.Application.Interfaces.Services;
using ReUse.Application.Options;

namespace ReUse.API.Controllers;

// Machine-to-machine endpoint consumed by the embedding service for backfill.
// Not behind JWT; protected by a shared internal key header instead.
[ApiController]
[AllowAnonymous]
[Route("api/internal/assistant")]
public class InternalAssistantController : ControllerBase
{
    private const string InternalKeyHeader = "X-Internal-Key";

    private readonly IAssistantService _assistantService;
    private readonly AssistantOptions _options;

    public InternalAssistantController(
        IAssistantService assistantService,
        IOptions<AssistantOptions> options)
    {
        _assistantService = assistantService;
        _options = options.Value;
    }

    [HttpGet("product-feed")]
    [ProducesResponseType(typeof(List<ProductFeedItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProductFeed()
    {
        if (!IsAuthorized())
            return Unauthorized();

        var feed = await _assistantService.GetProductFeedAsync();
        return Ok(feed);
    }

    private bool IsAuthorized()
    {
        if (string.IsNullOrEmpty(_options.InternalKey))
            return false;

        if (!Request.Headers.TryGetValue(InternalKeyHeader, out var provided))
            return false;

        return string.Equals(provided.ToString(), _options.InternalKey, StringComparison.Ordinal);
    }
}
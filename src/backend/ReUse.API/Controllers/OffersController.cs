using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.Application.DTOs.Offers;
using ReUse.Application.Interfaces.Services;

namespace ReUse.API.Controllers;

[ApiController]
[Authorize]
[Route("api/offers")]
[Tags("Offers")]
public class OffersController : ControllerBase
{
    private readonly IOfferService _offerService;

    public OffersController(IOfferService offerService)
    {
        _offerService = offerService;
    }

    [HttpGet("sent")]
    public async Task<IActionResult> GetSentOffers([FromQuery] OffersFilterParams filterParams)
    {
        var userId = User.GetBusinessId();
        var offers = await _offerService.GetSentOffers(filterParams, userId);
        return Ok(offers);
    }

    [HttpPost]
    public async Task<IActionResult> SendOffer(SendOfferRequest request)
    {
        var userId = User.GetBusinessId();
        await _offerService.SendOffer(request, userId);
        return NoContent();
    }

    [HttpPatch("{offerId:Guid}/cancel")]
    public async Task<IActionResult> CancelOffer(Guid offerId)
    {
        var userId = User.GetBusinessId();
        await _offerService.CancelOffer(offerId, userId);
        return NoContent();
    }

    [HttpGet("received")]
    public async Task<IActionResult> GetReceivedOffers([FromQuery] OffersFilterParams filterParams)
    {
        var userId = User.GetBusinessId();
        var offers = await _offerService.GetReceivedOffers(filterParams, userId);
        return Ok(offers);
    }

    [HttpPost("{offerId:Guid}/accept")]
    public async Task<IActionResult> AcceptOffer(Guid offerId)
    {
        var userId = User.GetBusinessId();
        await _offerService.AcceptOffer(offerId, userId);
        return NoContent();
    }

    [HttpPost("{offerId:Guid}/reject")]
    public async Task<IActionResult> RejectOffer(Guid offerId)
    {
        var userId = User.GetBusinessId();
        await _offerService.RejectOffer(offerId, userId);
        return NoContent();
    }
}
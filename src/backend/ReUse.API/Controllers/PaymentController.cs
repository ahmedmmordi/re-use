using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.Application.DTOs.Payment;
using ReUse.Application.Interfaces.Services.External;

namespace ReUse.API.Controllers;

[ApiController]
[Route("api/payments")]
[Tags("Payments")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Pay(PayRequest dto)
    {
        var userId = User.GetBusinessId();
        var payUrl = await _paymentService.Pay(dto.Items, dto.BillingData, userId);
        return Ok(payUrl);
    }

    [HttpPost]
    [Route("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromBody] JsonElement payload)
    {
        string receivedHmac = Request.Query["hmac"];
        await _paymentService.Callback(receivedHmac, payload);
        return Ok();
    }
}
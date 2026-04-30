
using ReUse.Application.DTOs.Identity.EmailConfirmation;

namespace ReUse.Application.Interfaces.Services.External;

public interface IEmailConfirmationService
{
    Task SendAsync(SendEmailConfirmationRequest request);
    Task ConfirmAsync(ConfirmEmailRequest request);
}
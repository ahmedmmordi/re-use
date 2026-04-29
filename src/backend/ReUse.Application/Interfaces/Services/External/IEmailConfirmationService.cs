
using ReUse.Application.DTOs.Identity.EmailConfirmation;

namespace ReUse.Application.Interfaces.Services.External;

public interface IEmailConfirmationService
{
    Task SendAsync(SendEmailConfirmationRequest dto);
    Task ConfirmAsync(ConfirmEmailRequest dto);
}

using System.Net;
using System.Net.Mail;

using Microsoft.Extensions.Options;

using ReUse.Application.Options.Auth;
using ReUse.Infrastructure.Interfaces.Services;

namespace ReUse.Infrastructure.Services.Auth;

public class EmailService : IEmailService
{
    private readonly EmailOptions _email;

    public EmailService(IOptions<EmailOptions> options)
    {
        _email = options.Value;
    }

    public async Task SendAsync(string to, string subject, string body)
    {
        var message = new MailMessage
        {
            From = new MailAddress(_email.From),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };

        message.To.Add(to);

        using var client = new SmtpClient(_email.Host, _email.Port)
        {
            Credentials = new NetworkCredential(
                _email.Username,
                _email.Password
            ),
            EnableSsl = true
        };

        await client.SendMailAsync(message);
    }
}

using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

using ReUse.Application.Interfaces;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Notifications.SignalR;

namespace ReUse.Infrastructure.Notifications;

public class SignalRNotificationChannelHandler : INotificationChannelHandler
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<SignalRNotificationChannelHandler> _logger;
    private readonly IUnitOfWork _unitOfWork;
    public NotificationChannel Channel => NotificationChannel.InApp;

    public SignalRNotificationChannelHandler(
        IUnitOfWork unitOfWork,
        IHubContext<NotificationHub> hubContext,
        ILogger<SignalRNotificationChannelHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendAsync(Notification notification)
    {
        var delivery = notification.Deliveries
            .SingleOrDefault(x =>
                x.Channel == NotificationChannel.InApp);

        if (delivery == null)
        {
            _logger.LogWarning(
                "No delivery found for channel {Channel} in notification {NotificationId}",
                NotificationChannel.InApp,
                notification.Id);
            return;
        }

        try
        {
            var dto = notification.ToDto();

            _logger.LogInformation(
                "dto in habdler {dto}",
                dto);

            var IdentityUserId = await _unitOfWork.User.GetIdentityUserIdAsync(notification.UserId);
            await _hubContext.Clients
                .User(IdentityUserId!)
                .SendAsync("ReceiveNotification", dto);

            delivery.Status = DeliveryStatus.Sent;
            delivery.SentAt = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            delivery.Status = DeliveryStatus.Failed;
            delivery.FailedAt = DateTime.UtcNow;
            delivery.ErrorMessage = ex.Message;
            delivery.RetryCount++;

            _logger.LogError(ex,
                "Failed to send notification to user {UserId}",
                notification.UserId);

            throw;
        }
    }
}
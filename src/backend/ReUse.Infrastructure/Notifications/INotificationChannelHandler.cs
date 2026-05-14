using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Infrastructure.Notifications;

public interface INotificationChannelHandler
{
    NotificationChannel Channel { get; }
    Task SendAsync(Notification notification);
}
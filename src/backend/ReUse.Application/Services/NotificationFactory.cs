using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

using ReUse.Application.DTOs.Notification.NotificationData;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Services;

public class NotificationFactory : INotificationFactory
{
    public Notification Create<T>(
        Guid userId,
        NotificationType type,
        string title,
        string body,
        T data,
        IEnumerable<NotificationChannel> channels,
        Dictionary<string, string>? metadata = null,
        Guid? correlationId = null,
        Guid? causationId = null
        ) where T : INotificationData
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Body = body,
            CreatedAt = DateTime.UtcNow,
            CorrelationId = correlationId ?? Guid.NewGuid(),
            CausationId = causationId,
            Data = JsonSerializer.Serialize(data),
            Metadata = metadata == null
                ? null
                : JsonSerializer.Serialize(metadata),
            Deliveries = new List<NotificationDelivery>()
        };

        foreach (var channel in channels)
        {
            notification.Deliveries.Add(new NotificationDelivery
            {
                Channel = channel,
                Status = DeliveryStatus.Pending,
                CreatedAt = DateTime.UtcNow
            });
        }

        return notification;
    }
}
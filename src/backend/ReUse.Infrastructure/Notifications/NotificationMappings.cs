using System.Text.Json;

using ReUse.Application.DTOs.Notification;
using ReUse.Domain.Entities;

namespace ReUse.Infrastructure.Notifications;

public static class NotificationMappings
{
    public static NotificationDto ToDto(this Notification notification)
    {
        return new NotificationDto
        {
            Id = notification.Id,
            UserId = notification.UserId,
            Title = notification.Title,
            Body = notification.Body,
            Type = notification.Type.ToString(),
            Data = notification.Data == null
                ? null
                : JsonSerializer.Deserialize<object>(notification.Data),
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt,
            ReadAt = notification.ReadAt
        };
    }
}
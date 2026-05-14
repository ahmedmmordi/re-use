using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Application.DTOs.Notification.NotificationData;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Interfaces.Services;

public interface INotificationFactory
{
    Notification Create<T>(
        Guid userId,
        NotificationType type,
        string title,
        string body,
        T data,
        IEnumerable<NotificationChannel> channels,
        Dictionary<string, string>? metadata = null,
        Guid? correlationId = null,
        Guid? causationId = null) where T : INotificationData;
}
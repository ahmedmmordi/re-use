using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ReUse.Application.DTOs.Notification;

public record NotificationDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string Title { get; init; } = null!;
    public string Body { get; init; } = null!;
    public string Type { get; init; } = null!;
    public object? Data { get; init; }
    // public string? Metadata { get; init; }
    public bool IsRead { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ReadAt { get; init; }
}
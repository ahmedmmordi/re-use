using ReUse.Domain.Enums;

namespace ReUse.Application.DTOs.Reports;

public record ReportDetailsResponse
{
    public Guid Id { get; init; }
    public ReportTargetType TargetType { get; init; }
    public Guid TargetId { get; init; }
    public ReportReason Reason { get; init; }
    public string? Notes { get; init; }
    public string? TargetCommentBody { get; init; }
    public ReportStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public ReportUserResponse Reporter { get; init; } = default!;
    public ReportUserResponse? ReviewedBy { get; init; }
    public DateTime? ReviewedAt { get; init; }
    public string? ReviewNotes { get; init; }
}
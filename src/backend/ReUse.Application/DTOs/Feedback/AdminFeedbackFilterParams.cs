using ReUse.Application.Enums;

namespace ReUse.Application.DTOs.Feedback;

public class AdminFeedbackFilterParams
{
    private DateTime? _createdFrom;
    private DateTime? _createdTo;

    public PaginationParams Pagination { get; set; } = new();

    public SortDirection SortDirection { get; set; } = SortDirection.Desc;

    public Guid? ProductId { get; set; }

    // The user who gave the feedback
    public Guid? RaterUserId { get; set; }

    // The user who received the feedback
    public Guid? RateeUserId { get; set; }

    public int? MinStars { get; set; }
    public int? MaxStars { get; set; }

    // Date range on CreatedAt (inclusive). Normalized to UTC to match the
    // Postgres `timestamp with time zone` column kind expected by Npgsql.
    public DateTime? CreatedFrom
    {
        get => _createdFrom;
        set => _createdFrom = NormalizeToUtc(value);
    }

    public DateTime? CreatedTo
    {
        get => _createdTo;
        set => _createdTo = NormalizeToUtc(value);
    }

    private static DateTime? NormalizeToUtc(DateTime? value)
    {
        if (!value.HasValue) return null;

        return value.Value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.Value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value.Value, DateTimeKind.Utc),
        };
    }
}
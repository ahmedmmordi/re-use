using ReUse.Domain.Enums;

namespace ReUse.Application.DTOs.Products;

public class AdminProductFilterParams : ProductFilterParams
{
    private DateTime? _createdFrom;
    private DateTime? _createdTo;

    // Multi-select status filter (Active, Sold, Closed, Deleted, UnderReview)
    public List<ProductStatus>? Statuses { get; set; }

    public Guid? OwnerUserId { get; set; }

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
using ReUse.Application.Enums;

namespace ReUse.Application.DTOs.Offers;

public class OffersFilterParams
{
    public PaginationParams Pagination { get; set; } = new();

    // Sort
    public OfferSortBy SortBy { get; set; } = OfferSortBy.Date;

    public SortDirection SortDirection { get; set; } = SortDirection.Desc;

    // Type & Condition multi-select
    public Guid? ProductId { get; set; }
}
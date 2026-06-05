using ReUse.Application.Enums;
using ReUse.Domain.Entities;

namespace ReUse.Infrastructure.Extensions;

public static class PurchaseRequestQueryExtensions
{
    public static IQueryable<PurchaseRequest> ApplySort(
        this IQueryable<PurchaseRequest> query,
        OfferSortBy sortBy,
        SortDirection sortOrder)
    {
        var isDescending = sortOrder == SortDirection.Desc;

        // Map sorting field names
        query = sortBy switch
        {
            OfferSortBy.Date => isDescending
                ? query.OrderByDescending(p => p.RespondedAt)
                : query.OrderBy(p => p.RespondedAt),

            OfferSortBy.Price => isDescending
                ? query.OrderByDescending(p => p.OfferedPrice)
                : query.OrderBy(p => p.OfferedPrice),

            // Default: sort by RespondedAt desc
            _ => query.OrderByDescending(p => p.RespondedAt)
        };

        return query;
    }

    public static IQueryable<PurchaseRequest> FilterByProduct(
        this IQueryable<PurchaseRequest> query,
        Guid? productId)
    {
        if (productId == null)
            return query;

        return query.Where(p => p.ProductId == productId.Value);
    }
}
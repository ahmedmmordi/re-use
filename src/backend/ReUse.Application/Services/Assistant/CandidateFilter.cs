using ReUse.Application.DTOs.Assistant;
using ReUse.Domain.Enums;

namespace ReUse.Application.Services.Assistant;

// Applies the structured constraints extracted from the user's message to the
// hydrated search hits, then keeps the closest matches by semantic distance.
public static class CandidateFilter
{
    public static List<ProductCandidate> Filter(
        List<ProductCandidate> candidates, ExtractedFilters f, int take)
    {
        var q = candidates.AsEnumerable();

        // Match listing type to intent: a buyer must only see items for sale
        // (Regular), a swapper only swap offers. Wanted ads are other users'
        // buy-requests and must never surface as results.
        if (string.Equals(f.Intent, "buy", StringComparison.OrdinalIgnoreCase))
            q = q.Where(p => p.Type == ProductType.Regular);
        else if (string.Equals(f.Intent, "swap", StringComparison.OrdinalIgnoreCase))
            q = q.Where(p => p.Type == ProductType.Swap);

        if (f.MaxPrice.HasValue)
            q = q.Where(p => p.Price <= f.MaxPrice.Value);
        if (f.MinPrice.HasValue)
            q = q.Where(p => p.Price >= f.MinPrice.Value);
        if (f.Condition is not null and not "any")
            q = q.Where(p => p.Condition.Equals(f.Condition, StringComparison.OrdinalIgnoreCase));
        if (f.ExcludedBrands.Any())
            q = q.Where(p => !f.ExcludedBrands.Any(b =>
                p.Title.Contains(b, StringComparison.OrdinalIgnoreCase)));

        var ordered = q.OrderBy(p => p.SemanticDistance).ToList();
        if (ordered.Count == 0)
            return ordered;

        // Category cohesion: the embedding model compresses scores, so an
        // off-topic item (a laptop for "phone") can score within a hair of the
        // right one and fill a result slot. Anchor on the closest match's
        // category and keep only items that share it, so results stay coherent
        // instead of padding the quota with near-miss neighbours.
        var anchorCategory = ordered[0].Category;
        return ordered
            .Where(p => string.Equals(p.Category, anchorCategory, StringComparison.OrdinalIgnoreCase))
            .Take(take)
            .ToList();
    }
}
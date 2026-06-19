using ReUse.Application.DTOs.Assistant;

namespace ReUse.Application.Services.Assistant;

// Applies the structured constraints extracted from the user's message to the
// hydrated search hits, then keeps the closest matches by semantic distance.
public static class CandidateFilter
{
    public static List<ProductCandidate> Filter(
        List<ProductCandidate> candidates, ExtractedFilters f, int take)
    {
        var q = candidates.AsEnumerable();
        if (f.MaxPrice.HasValue)
            q = q.Where(p => p.Price <= f.MaxPrice.Value);
        if (f.MinPrice.HasValue)
            q = q.Where(p => p.Price >= f.MinPrice.Value);
        if (f.Condition is not null and not "any")
            q = q.Where(p => p.Condition.Equals(f.Condition, StringComparison.OrdinalIgnoreCase));
        if (f.ExcludedBrands.Any())
            q = q.Where(p => !f.ExcludedBrands.Any(b =>
                p.Title.Contains(b, StringComparison.OrdinalIgnoreCase)));

        return q.OrderBy(p => p.SemanticDistance).Take(take).ToList();
    }
}
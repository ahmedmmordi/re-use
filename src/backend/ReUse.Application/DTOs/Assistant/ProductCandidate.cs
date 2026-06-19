namespace ReUse.Application.DTOs.Assistant;

// A hydrated search hit carried through the filter stage. Holds the fields the
// CandidateFilter needs plus the semantic distance used to order results.
public record ProductCandidate
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public decimal? Price { get; init; }
    public string Condition { get; init; } = string.Empty;
    public double SemanticDistance { get; init; }
}
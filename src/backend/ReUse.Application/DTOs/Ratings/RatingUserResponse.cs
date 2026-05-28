namespace ReUse.Application.DTOs.Ratings;

public record RatingUserResponse
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string? ProfileImageUrl { get; init; }
}
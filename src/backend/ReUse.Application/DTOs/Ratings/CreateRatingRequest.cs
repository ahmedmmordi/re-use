namespace ReUse.Application.DTOs.Ratings;

public record CreateRatingRequest(Guid RateeUserId, int Stars);
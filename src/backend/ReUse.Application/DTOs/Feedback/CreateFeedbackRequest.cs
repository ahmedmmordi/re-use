namespace ReUse.Application.DTOs.Feedback;

public record CreateFeedbackRequest(Guid RateeUserId, int Stars, string Comment);
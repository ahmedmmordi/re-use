namespace ReUse.Application.DTOs.Deals.Responses;

public class DealParticipantDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
}
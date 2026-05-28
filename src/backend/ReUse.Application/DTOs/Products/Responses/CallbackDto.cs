namespace ReUse.Application.DTOs.Products.Responses;

public record CallbackDto
{
    public Guid ProductId { get; init; }
    public DateTime EndAt { get; init; }
}
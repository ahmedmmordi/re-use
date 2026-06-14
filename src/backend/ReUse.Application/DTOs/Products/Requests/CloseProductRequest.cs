
using ReUse.Domain.Enums;

namespace ReUse.Application.DTOs.Products.Requests;

public record CloseProductRequest
{
    public Guid ConversationId { get; set; }

    public decimal? FinalPrice { get; set; }

    public ProductClosureType ClosureType { get; set; }

    public string? Notes { get; set; }
}
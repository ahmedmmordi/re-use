using System.Text.Json.Serialization;

namespace ReUse.Application.DTOs.Payment;

public class ItemDto
{
    public string Name { get; set; }

    public decimal Amount { get; set; }

    public string? Description { get; set; }

    public int Quantity { get; set; }

    public string? Image { get; set; }
}
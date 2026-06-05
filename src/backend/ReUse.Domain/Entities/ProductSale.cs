namespace ReUse.Domain.Entities;

public class ProductSale : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;

    public Guid BuyerUserId { get; set; }
    public User Buyer { get; set; } = default!;

    public decimal FinalPrice { get; set; }

    public DateTime SoldAt { get; set; }
}
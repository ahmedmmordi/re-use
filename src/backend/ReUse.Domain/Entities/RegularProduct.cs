using ReUse.Domain.Enums;

namespace ReUse.Domain.Entities;

public class RegularProduct : Product
{
    public RegularProduct()
    {
        ProductType = ProductType.Regular;
    }
    public decimal Price { get; set; }
    public bool AllowNegotiation { get; set; }
}
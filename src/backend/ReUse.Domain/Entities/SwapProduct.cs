using ReUse.Domain.Enums;

namespace ReUse.Domain.Entities;

public class SwapProduct : Product
{
    public SwapProduct()
    {
        ProductType = ProductType.Swap;
    }
    public string WantedItemTitle { get; set; } = string.Empty;
    public string? WantedItemDescription { get; set; }
    public ProductCondition? WantedCondition { get; set; }
}
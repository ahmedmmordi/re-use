using ReUse.Domain.Enums;

namespace ReUse.Domain.Entities;

public class WantedProduct : Product
{
    public override ProductType ProductType => ProductType.Wanted;
    public decimal? DesiredPriceMin { get; set; }
    public decimal? DesiredPriceMax { get; set; }
}
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ReUse.Domain.Entities;

namespace ReUse.Infrastructure.Persistence.Configurations;

public class WantedProductEntityTypeConfiguration : IEntityTypeConfiguration<WantedProduct>
{
    public void Configure(EntityTypeBuilder<WantedProduct> builder)
    {
        builder.Property(p => p.DesiredPriceMin)
            .HasPrecision(10, 2);

        builder.Property(p => p.DesiredPriceMax)
            .HasPrecision(10, 2);
    }
}
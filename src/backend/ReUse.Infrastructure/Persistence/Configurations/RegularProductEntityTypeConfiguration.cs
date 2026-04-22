using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ReUse.Domain.Entities;

namespace ReUse.Infrastructure.Persistence.Configurations;

public class RegularProductEntityTypeConfiguration : IEntityTypeConfiguration<RegularProduct>
{
    public void Configure(EntityTypeBuilder<RegularProduct> builder)
    {
        builder.Property(p => p.Price)
            .HasPrecision(10, 2);

        builder.Property(p => p.AllowNegotiation)
            .HasDefaultValue(true);
    }
}
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ReUse.Domain.Entities;

namespace ReUse.Infrastructure.Persistence.Configurations;

public class SwapProductEntityTypeConfiguration : IEntityTypeConfiguration<SwapProduct>
{
    public void Configure(EntityTypeBuilder<SwapProduct> builder)
    {
        builder.Property(p => p.WantedItemTitle)
            .HasMaxLength(255)
            .IsRequired();
        builder.Property(p => p.WantedItemDescription);
        builder.Property(p => p.WantedCondition)
            .HasConversion<string>()
            .HasMaxLength(20);
    }
}
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ReUse.Domain.Entities;

namespace ReUse.Infrastructure.Persistence.Configurations;


public class ProductImageEntityTypeConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> builder)
    {
        builder.ToTable("ProductImages");

        // PK
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
               .ValueGeneratedNever();

        // URL
        builder.Property(x => x.Url)
               .IsRequired()
               .HasMaxLength(2048)
               .IsUnicode(false);

        // Display Order 
        builder.Property(x => x.DisplayOrder)
               .IsRequired()
               .HasDefaultValue(0);

        // FK
        builder.Property(x => x.ProductId)
               .IsRequired();

        builder.HasOne(x => x.Product)
               .WithMany(p => p.ProductImages)
               .HasForeignKey(x => x.ProductId)
               .OnDelete(DeleteBehavior.Cascade);


        builder.HasIndex(x => new { x.ProductId, x.DisplayOrder });

        // audit
        builder.Property(x => x.CreatedAt)
               .IsRequired();
    }

}
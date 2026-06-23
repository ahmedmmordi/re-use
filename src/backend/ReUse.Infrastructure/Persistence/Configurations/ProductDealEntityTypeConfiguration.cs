using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Infrastructure.Persistence.Configurations;

public class ProductDealEntityTypeConfiguration : IEntityTypeConfiguration<ProductDeal>
{
    public void Configure(EntityTypeBuilder<ProductDeal> builder)
    {
        builder.ToTable("ProductDeals");

        builder.HasKey(x => x.Id);

        // Product
        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Conversation
        builder.HasOne(x => x.Conversation)
            .WithMany()
            .HasForeignKey(x => x.ConversationId)
            .OnDelete(DeleteBehavior.Restrict);

        // Proposer
        builder.HasOne(x => x.Proposer)
            .WithMany()
            .HasForeignKey(x => x.ProposerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Receiver
        builder.HasOne(x => x.Receiver)
            .WithMany()
            .HasForeignKey(x => x.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(x => x.DealType)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.AgreedPrice)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.Notes)
            .HasMaxLength(1000);

        // Indexes
        builder.HasIndex(x => x.ProductId);
        builder.HasIndex(x => x.ConversationId)
            .IsUnique();
        builder.HasIndex(x => x.ProposerId);
        builder.HasIndex(x => x.ReceiverId);
    }
}
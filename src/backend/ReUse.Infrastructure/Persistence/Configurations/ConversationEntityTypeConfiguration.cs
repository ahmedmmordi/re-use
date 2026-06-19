using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Infrastructure.Persistence.Configurations;

public class ConversationEntityTypeConfiguration : IEntityTypeConfiguration<Conversation>
{
    public void Configure(EntityTypeBuilder<Conversation> builder)
    {
        builder.ToTable("conversations");

        // PK
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id)
               .ValueGeneratedNever();

        // Properties
        builder.Property(c => c.Status)
               .HasConversion<string>()
               .HasMaxLength(20)
               .IsRequired()
               .HasDefaultValue(ConversationStatus.Active);

        builder.Property(c => c.IsActive)
               .HasDefaultValue(true)
               .IsRequired();

        builder.Property(c => c.LastActivityAt)
               .IsRequired();

        // Audit
        builder.Property(c => c.CreatedAt)
               .IsRequired();

        // ── Relationships ────────────────────────────────────────────────────

        // FK → Product (Restrict so deleting a product does not cascade-wipe conversations)
        builder.HasOne(c => c.Product)
               .WithMany()
               .HasForeignKey(c => c.ProductId)
               .OnDelete(DeleteBehavior.Restrict);

        // FK → User (Buyer)
        builder.HasOne(c => c.Owner)
               .WithMany()
               .HasForeignKey(c => c.OwnerId)
               .OnDelete(DeleteBehavior.Restrict);

        // FK → User (Seller)
        builder.HasOne(c => c.Reactant)
               .WithMany()
               .HasForeignKey(c => c.ReactantId)
               .OnDelete(DeleteBehavior.Restrict);

        // One-to-many → Messages (cascade so deleting a conversation wipes its messages)
        builder.HasMany(c => c.Messages)
               .WithOne(m => m.Conversation)
               .HasForeignKey(m => m.ConversationId)
               .OnDelete(DeleteBehavior.Cascade);

        // ── Indexes ──────────────────────────────────────────────────────────

        // "Get all conversations for user X" — the most common query
        builder.HasIndex(c => new { c.OwnerId, c.Status });
        builder.HasIndex(c => new { c.ReactantId, c.Status });

        // Used by the background job to find stale conversations
        builder.HasIndex(c => c.LastActivityAt);

        // Used when checking if a conversation exists for a product
        builder.HasIndex(c => c.ProductId);
    }
}
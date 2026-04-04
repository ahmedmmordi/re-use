using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

using Reuse.Infrastructure.Identity.Models;

namespace ReUse.Infrastructure.Identity;

public class AppIdentityDbContext : IdentityDbContext<ApplicationUser>
{
    public AppIdentityDbContext(DbContextOptions<AppIdentityDbContext> options)
        : base(options)
    {
    }
    public DbSet<RefreshToken> RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        //modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppIdentityDbContext).Assembly);
        modelBuilder.Entity<ApplicationUser>()
            .HasMany(u => u.RefreshTokens)
            .WithOne(rt => rt.User)
            .HasForeignKey(u => u.UserId)
            .IsRequired();
    }
}
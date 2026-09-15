using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Recommendations.Api.Models.Entities;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Recommendations.Api.Persistances;

public class RecommendationDbContext(DbContextOptions options, IInMemoryBus bus) 
    : EfDbContextBase(options, bus)
{
    public DbSet<MaterializedProduct> MaterializedProducts => Set<MaterializedProduct>();
    public DbSet<MaterializedCategory> MaterializedCategories => Set<MaterializedCategory>();
    public DbSet<ProductView> ProductViews => Set<ProductView>();
    public DbSet<UserPurchaseHistory> UserPurchaseHistories => Set<UserPurchaseHistory>();
    public DbSet<UserWishlistItem> UserWishlistItems => Set<UserWishlistItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.AddOutboxStateEntity();
        modelBuilder.AddOutboxMessageEntity();
        modelBuilder.AddInboxStateEntity();

        modelBuilder.Entity<MaterializedProduct>(e =>
        {
            e.HasKey(p => p.ProductId);
            e.Property(p => p.ProductId).ValueGeneratedNever();
            e.Property(p => p.Name).HasMaxLength(300).IsRequired();
            e.Property(p => p.Price).HasColumnType("decimal(18,2)");
            e.Property(p => p.DiscountPrice).HasColumnType("decimal(18,2)");
            e.Property(p => p.AttributesJson).HasColumnType("text");

            e.HasIndex(p => p.CategoryId);
            e.HasIndex(p => p.ShopId);
            e.HasIndex(p => p.IsActive);
            e.HasIndex(p => new { p.CategoryId, p.IsActive });
            e.HasIndex(p => new { p.Sold, p.IsActive });
            e.HasIndex(p => new { p.AverageRating, p.IsActive });
        });

        modelBuilder.Entity<MaterializedCategory>(e =>
        {
            e.HasKey(c => c.CategoryId);
            e.Property(c => c.CategoryId).ValueGeneratedNever();
            e.Property(c => c.Name).HasMaxLength(200).IsRequired();
            e.HasIndex(c => c.ParentId);
        });

        modelBuilder.Entity<ProductView>(e =>
        {
            e.HasKey(v => v.Id);
            e.Property(v => v.Id).UseIdentityByDefaultColumn();
            e.HasIndex(v => v.ProductId);
            e.HasIndex(v => v.UserId);
            e.HasIndex(v => v.SessionId);
            e.HasIndex(v => v.ViewedAt);
            e.HasIndex(v => new { v.UserId, v.ProductId });
        });

        modelBuilder.Entity<UserPurchaseHistory>(e =>
        {
            e.HasKey(h => h.Id);
            e.Property(h => h.Id).UseIdentityByDefaultColumn();
            e.HasIndex(h => h.UserId);
            e.HasIndex(h => h.ProductId);
            e.HasIndex(h => h.CategoryId);
            e.HasIndex(h => h.PurchasedAt);
            e.HasIndex(h => new { h.UserId, h.CategoryId });
        });

        modelBuilder.Entity<UserWishlistItem>(e =>
        {
            e.HasKey(w => w.Id);
            e.Property(w => w.Id).UseIdentityByDefaultColumn();
            e.HasIndex(w => w.UserId);
            e.HasIndex(w => w.ProductId);
            e.HasIndex(w => new { w.UserId, w.IsActive });
        });
    }
}

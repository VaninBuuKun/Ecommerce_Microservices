using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Analytics.Api.Models.Entities;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Analytics.Api.Persistances;

public class AnalyticsDbContext(DbContextOptions options, IInMemoryBus bus)
    : EfDbContextBase(options, bus)
{
    public DbSet<DailyShopRevenue> DailyShopRevenues => Set<DailyShopRevenue>();
    public DbSet<DailyPlatformRevenue> DailyPlatformRevenues => Set<DailyPlatformRevenue>();
    public DbSet<ShopProductStats> ShopProductStats => Set<ShopProductStats>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.AddOutboxStateEntity();
        modelBuilder.AddOutboxMessageEntity();
        modelBuilder.AddInboxStateEntity();

        modelBuilder.Entity<DailyShopRevenue>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Id).UseIdentityByDefaultColumn();
            e.HasIndex(r => new { r.ShopId, r.Date }).IsUnique();
            e.HasIndex(r => r.Date);
        });

        modelBuilder.Entity<DailyPlatformRevenue>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Id).UseIdentityByDefaultColumn();
            e.HasIndex(r => r.Date).IsUnique();
        });

        modelBuilder.Entity<ShopProductStats>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.Id).UseIdentityByDefaultColumn();
            e.HasIndex(s => new { s.ShopId, s.ProductId }).IsUnique();
            e.HasIndex(s => new { s.ShopId, s.SoldQuantity });
        });
    }
}

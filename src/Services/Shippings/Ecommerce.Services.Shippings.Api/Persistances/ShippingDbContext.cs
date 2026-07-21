using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Shippings.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Shippings.Api.Persistances;

public class ShippingDbContext(DbContextOptions<ShippingDbContext> options, IInMemoryBus bus) : EfDbContextBase(options, bus)
{
    public DbSet<Shipment> Shipments { get; set; }
    public DbSet<Province> Provinces { get; set; }
    public DbSet<District> Districts { get; set; }
    public DbSet<Ward> Wards { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Shipment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ShippingFee).HasColumnType("decimal(18,2)");
            e.Property(x => x.WaybillCode).HasMaxLength(100).IsRequired(false);
            e.Property(x => x.CarrierName).HasMaxLength(50);
            e.Property(x => x.FailureReason).HasMaxLength(255).IsRequired(false);
        });

        modelBuilder.Entity<Province>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(20);
            e.Property(x => x.Name).HasMaxLength(150);
            e.Property(x => x.DisplayName).HasMaxLength(200);
            e.Property(x => x.GhtkId).HasMaxLength(50).IsRequired(false);
        });

        modelBuilder.Entity<District>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(20);
            e.Property(x => x.Name).HasMaxLength(150);
            e.Property(x => x.DisplayName).HasMaxLength(200);
            e.Property(x => x.GhtkId).HasMaxLength(50).IsRequired(false);

            e.HasOne(x => x.Province)
                .WithMany(p => p.Districts)
                .HasForeignKey(x => x.ProvinceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Ward>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(20);
            e.Property(x => x.Name).HasMaxLength(150);
            e.Property(x => x.DisplayName).HasMaxLength(200);
            e.Property(x => x.GhnCode).HasMaxLength(50).IsRequired(false);
            e.Property(x => x.GhtkCode).HasMaxLength(50).IsRequired(false);

            e.HasOne(x => x.District)
                .WithMany(d => d.Wards)
                .HasForeignKey(x => x.DistrictId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

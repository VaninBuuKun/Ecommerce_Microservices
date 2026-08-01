using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using MassTransit;

namespace Ecommerce.Services.Sellers.Api.Persistances;

public class SellerDbContext(DbContextOptions<SellerDbContext> options, IInMemoryBus bus) : EfDbContextBase(options, bus)
{
    public DbSet<Shop> Shops { get; set; }
    public DbSet<SellerKyc> SellerKycs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.AddOutboxStateEntity();
        modelBuilder.AddOutboxMessageEntity();
        modelBuilder.AddInboxStateEntity();

        modelBuilder.Entity<SellerKyc>(entity =>
        {
            entity.HasKey(k => k.Id);
            entity.Property(k => k.IdentityCardNumber).IsRequired().HasMaxLength(20);
            entity.Property(k => k.Status).HasConversion<int>();
            entity.Property(k => k.RejectReason).HasMaxLength(255).IsRequired(false);
        });

        modelBuilder.Entity<Shop>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Name).IsRequired().HasMaxLength(150);
            entity.Property(s => s.Status).HasConversion<int>();

            // Cấu hình PickUpAddress thành Owned Entity phẳng trong bảng Shops
            entity.OwnsOne(s => s.PickUpAddress, address =>
            {
                address.Property(a => a.RecipientName).HasColumnName("PickUp_RecipientName").HasMaxLength(100).IsRequired();
                address.Property(a => a.Phone).HasColumnName("PickUp_Phone").HasMaxLength(20).IsRequired();
                address.Property(a => a.Province).HasColumnName("PickUp_Province").HasMaxLength(100).IsRequired();
                address.Property(a => a.District).HasColumnName("PickUp_District").HasMaxLength(100).IsRequired();
                address.Property(a => a.Ward).HasColumnName("PickUp_Ward").HasMaxLength(100).IsRequired();
                address.Property(a => a.AddressLine).HasColumnName("PickUp_AddressLine").HasMaxLength(255).IsRequired();
                
                address.Property(a => a.ProvinceId).HasColumnName("PickUp_ProvinceId").IsRequired();
                address.Property(a => a.DistrictId).HasColumnName("PickUp_DistrictId").IsRequired();
                address.Property(a => a.WardId).HasColumnName("PickUp_WardId").HasMaxLength(20).IsRequired();
            });
        });
    }
}

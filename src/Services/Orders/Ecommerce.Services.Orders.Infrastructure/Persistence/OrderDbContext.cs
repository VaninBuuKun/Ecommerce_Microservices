using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Infrastructure.Sagas;
using Microsoft.EntityFrameworkCore;
using MassTransit;


namespace Ecommerce.Services.Orders.Infrastructure.Persistence;

public class OrderDbContext(DbContextOptions<OrderDbContext> options, IInMemoryBus bus) : EfDbContextBase(options, bus)
{
    public DbSet<SubOrderSagaState> SubOrderSagaStates { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<SubOrder> SubOrders { get; set; }
    public DbSet<SubOrderItem> OrderItems { get; set; }
    public DbSet<ShippingAddress> ShippingAddresses { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.AddOutboxStateEntity();
        modelBuilder.AddOutboxMessageEntity();
        modelBuilder.AddInboxStateEntity();
        
        modelBuilder.Entity<SubOrderSagaState>(entity =>
        {
            entity.HasKey(x => x.CorrelationId);
            entity.Property(x => x.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(x => x.FailureReason).HasMaxLength(255).IsRequired(false);
            entity.Property(x => x.ItemsJson).IsRequired(false);
            entity.Property(x => x.ShippingAddress).HasMaxLength(500).IsRequired(false);
        });
        
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.CustomerId).IsRequired();
            entity.Property(o => o.ShippingAddress).HasMaxLength(500);
            
            // Map các cột kiểu long tính toán tài chính
            entity.Property(o => o.SubTotal).HasColumnType("bigint");
            entity.Property(o => o.ShippingFee).HasColumnType("bigint");
            entity.Property(o => o.TotalDiscount).HasColumnType("bigint");
            entity.Property(o => o.GrandTotal).HasColumnType("bigint");

            entity.HasMany(o => o.SubOrderItems)
                  .WithOne(s => s.Order)
                  .HasForeignKey(s => s.OrderId)
                  .OnDelete(DeleteBehavior.Cascade); //Cascade xóa sạch theo cha, setnull khóa ngoại thành null, 
        });

        modelBuilder.Entity<SubOrder>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Status).HasConversion<int>();
            
            entity.Property(s => s.SubTotal).HasColumnType("bigint");
            entity.Property(s => s.ShippingFee).HasColumnType("bigint");
            entity.Property(s => s.SellerDiscount).HasColumnType("bigint");
            entity.Property(s => s.PlatformDiscount).HasColumnType("bigint");
            entity.Property(s => s.GrandTotal).HasColumnType("bigint");
            
            // Khai báo mối quan hệ 1-N với OrderItem thông qua Shadow FK "SubOrderId" tự sinh dưới bảng OrderItem
            entity.HasMany(s => s.SubOrderItems)
                  .WithOne(i => i.SubOrder)
                  .HasForeignKey(i => i.SubOrderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SubOrderItem>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.ProductName).IsRequired().HasMaxLength(255);
            entity.Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<ShippingAddress>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.RecipientName).IsRequired().HasMaxLength(100);
            entity.Property(a => a.Phone).IsRequired().HasMaxLength(20);
            entity.Property(a => a.Province).IsRequired().HasMaxLength(100);
            entity.Property(a => a.District).IsRequired().HasMaxLength(100);
            entity.Property(a => a.Ward).IsRequired().HasMaxLength(100);
            entity.Property(a => a.AddressLine).IsRequired().HasMaxLength(255);
        });
    }
}

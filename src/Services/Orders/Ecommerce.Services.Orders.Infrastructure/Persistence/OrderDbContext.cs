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
    public DbSet<RefundRequest> RefundRequests { get; set; }
    public DbSet<RefundRequestItem> RefundRequestItems { get; set; }
    public DbSet<DisputeThread> DisputeThreads { get; set; }
    public DbSet<DisputeMessage> DisputeMessages { get; set; }
    public DbSet<Voucher> Vouchers { get; set; }
    public DbSet<VoucherUsage> VoucherUsages { get; set; }

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
            entity.Property(o => o.Id).ValueGeneratedNever();
            entity.Property(o => o.CustomerId).IsRequired();
            entity.Property(o => o.ShippingAddress).HasMaxLength(500);
            
            entity.Property(o => o.SubTotal).HasColumnType("bigint");
            entity.Property(o => o.ShippingFee).HasColumnType("bigint");
            entity.Property(o => o.TotalDiscount).HasColumnType("bigint");
            entity.Property(o => o.GrandTotal).HasColumnType("bigint");

            entity.HasMany(o => o.SubOrderItems)
                  .WithOne(s => s.Order)
                  .HasForeignKey(s => s.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SubOrder>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Id).ValueGeneratedNever();
            entity.Property(s => s.Status).HasConversion<string>();
            
            entity.Property(s => s.SubTotal).HasColumnType("bigint");
            entity.Property(s => s.ShippingFee).HasColumnType("bigint");
            entity.Property(s => s.SellerDiscount).HasColumnType("bigint");
            entity.Property(s => s.PlatformDiscount).HasColumnType("bigint");
            entity.Property(s => s.GrandTotal).HasColumnType("bigint");
            
            entity.HasMany(s => s.SubOrderItems)
                  .WithOne(i => i.SubOrder)
                  .HasForeignKey(i => i.SubOrderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SubOrderItem>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.Id).ValueGeneratedNever();
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

        modelBuilder.Entity<RefundRequest>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.RequestedAmount).HasColumnType("decimal(18,2)");
            entity.Property(r => r.Reason).IsRequired().HasMaxLength(255);
            entity.Property(r => r.Status).HasConversion<string>();

            entity.HasMany(r => r.Items)
                  .WithOne()
                  .HasForeignKey(i => i.RefundRequestId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RefundRequestItem>(entity =>
        {
            entity.HasKey(ri => ri.Id);
            entity.Property(ri => ri.UnitPrice).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<DisputeThread>(entity =>
        {
            entity.HasKey(dt => dt.Id);
            entity.Property(dt => dt.Status).IsRequired().HasMaxLength(50);
            entity.Property(dt => dt.ResolutionDecision).HasMaxLength(50);

            entity.HasOne(dt => dt.RefundRequest)
                  .WithOne(r => r.DisputeThread)
                  .HasForeignKey<DisputeThread>(dt => dt.RefundRequestId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(dt => dt.Messages)
                  .WithOne()
                  .HasForeignKey(m => m.DisputeThreadId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DisputeMessage>(entity =>
        {
            entity.HasKey(dm => dm.Id);
            entity.Property(dm => dm.SenderRole).IsRequired().HasMaxLength(20);
            entity.Property(dm => dm.Content).IsRequired();
        });
        
        modelBuilder.Entity<Voucher>(entity =>
        {
            entity.HasKey(v => v.Id);
            entity.Property(v => v.Code).IsRequired().HasMaxLength(50);
            entity.Property(v => v.DiscountType).HasConversion<string>();
            entity.Property(v => v.Scope).HasConversion<string>();
            entity.Property(v => v.DiscountValue).HasColumnType("decimal(18,2)");
            entity.Property(v => v.MaxDiscountAmount).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<VoucherUsage>(entity =>
        {
            entity.HasKey(vu => vu.Id);
            
            entity.HasOne(vu => vu.Voucher)
                .WithMany()
                .HasForeignKey(vu => vu.VoucherId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

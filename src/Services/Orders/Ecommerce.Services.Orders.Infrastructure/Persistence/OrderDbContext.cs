using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Infrastructure.Sagas;
using Microsoft.EntityFrameworkCore;
using MassTransit;


namespace Ecommerce.Services.Orders.Infrastructure.Persistence;

public class OrderDbContext(DbContextOptions<OrderDbContext> options, IInMemoryBus bus) : EfDbContextBase(options, bus)
{
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.AddOutboxStateEntity();
        modelBuilder.AddOutboxMessageEntity();
        modelBuilder.AddInboxStateEntity();
        
        modelBuilder.Entity<OrderSagaState>(entity =>
        {
            entity.HasKey(x => x.CorrelationId); // Khóa chính
            entity.Property(x => x.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(x => x.FailureReason).HasMaxLength(255).IsRequired(false);
            entity.Property(x => x.ShippingAddress).HasMaxLength(500);
            entity.Property(x => x.PaymentUrl).IsRequired(false);
            entity.Property(x => x.SerializedVariantIds).IsRequired().HasDefaultValue("");
        });

        
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.CustomerId).IsRequired();
            entity.Property(o => o.TotalPrice).HasColumnType("decimal(18,2)");
            entity.Property(o => o.Status).HasConversion<int>();
            entity.Property(o => o.ShippingAddress).HasMaxLength(500);
            
            entity.HasMany(o => o.OrderItems)
                  .WithOne(i => i.Order)
                  .HasForeignKey(i => i.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.ProductName).IsRequired().HasMaxLength(255);
            entity.Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
        });
    }
}

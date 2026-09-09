using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Payments.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using MassTransit;

namespace Ecommerce.Services.Payments.Api.Persistances;

public class PaymentDbContext(DbContextOptions options, IInMemoryBus bus) : EfDbContextBase(options, bus)
{
    public DbSet<Payment> Payments { get; set; }
    public DbSet<PaymentMethod> PaymentMethods { get; set; }
    public DbSet<Wallet> Wallets { get; set; }
    public DbSet<BankAccount> BankAccounts { get; set; }
    public DbSet<WalletTransaction> WalletTransactions { get; set; }
    public DbSet<WithdrawalRequest> WithdrawalRequests { get; set; }
    public DbSet<PlatformCommissionConfig> PlatformCommissionConfigs { get; set; }
    public DbSet<RevenueRecord> RevenueRecords { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.AddOutboxStateEntity();
        modelBuilder.AddOutboxMessageEntity();
        modelBuilder.AddInboxStateEntity();

        modelBuilder.Entity<Payment>(e =>
        {
            e.Property(p => p.Amount).HasColumnType("decimal(18,2)");
            e.Property(p => p.Status).HasConversion<string>();
        });

        modelBuilder.Entity<PaymentMethod>(e =>
        {
            e.Property(pm => pm.MinAmount).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<Wallet>(e =>
        {
            e.Property(w => w.Balance).HasColumnType("decimal(18,2)");
            e.HasIndex(w => w.UserId).IsUnique();
        });

        modelBuilder.Entity<WalletTransaction>(e =>
        {
            e.Property(t => t.Amount).HasColumnType("decimal(18,2)");
            e.Property(t => t.BalanceAfter).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<WithdrawalRequest>(e =>
        {
            e.Property(w => w.Amount).HasColumnType("decimal(18,2)");
            e.Property(w => w.Status).HasConversion<string>();
        });

        modelBuilder.Entity<PlatformCommissionConfig>(e =>
        {
            e.Property(c => c.RatePercentage).HasColumnType("decimal(5,2)");
            e.HasData(new PlatformCommissionConfig
            {
                Id = 1,
                RatePercentage = 5.0m,
                CreatedDate = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
                LastModifiedDate = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero)
            });
        });

        modelBuilder.Entity<RevenueRecord>(e =>
        {
            e.Property(r => r.GrossAmount).HasColumnType("decimal(18,2)");
            e.Property(r => r.PlatformDiscountAmount).HasColumnType("decimal(18,2)");
            e.Property(r => r.CommissionRatePercentage).HasColumnType("decimal(5,2)");
            e.Property(r => r.CommissionAmount).HasColumnType("decimal(18,2)");
            e.Property(r => r.NetAmount).HasColumnType("decimal(18,2)");
            e.HasIndex(r => r.SubOrderId);
            e.HasIndex(r => r.ShopId);
        });
    }
}

using BuildingBlocks.Shared.Domains.Interfaces;
using Ecommerce.Services.Identity.Api.Models.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Identity.Api.Persistances;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<AppUser, IdentityRole<long>, long>(options)
{
    public DbSet<UserAddress> UserAddresses { get; set; }
    public DbSet<UserKnownDevice> UserKnownDevices { get; set; }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        UpdateTrackingEntities();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        UpdateTrackingEntities();
        return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void UpdateTrackingEntities()
    {
        var entries = ChangeTracker.Entries<IDateTracking>();
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.CreatedDate == default)
                {
                    entry.Entity.CreatedDate = now;
                }
                entry.Entity.LastModifiedDate = now;
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Entity.LastModifiedDate = now;
            }
        }
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<AppUser>(entity => 
        { 
            entity.ToTable("Users"); 
        });

        builder.Entity<UserAddress>(entity =>
        {
            entity.ToTable("UserAddresses");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.RecipientName).IsRequired().HasMaxLength(100);
            entity.Property(a => a.Phone).IsRequired().HasMaxLength(20);
            entity.Property(a => a.AddressLine).IsRequired().HasMaxLength(255);
            
            entity.HasOne(a => a.User)
                  .WithMany()
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserKnownDevice>(entity =>
        {
            entity.ToTable("UserKnownDevices");
            entity.HasKey(d => d.Id);
            entity.Property(d => d.DeviceHash).IsRequired().HasMaxLength(64);
            entity.Property(d => d.DeviceName).HasMaxLength(150);
            entity.Property(d => d.LastIpAddress).HasMaxLength(50);
            entity.HasIndex(d => new { d.UserId, d.DeviceHash }).IsUnique();

            entity.HasOne(d => d.User)
                  .WithMany()
                  .HasForeignKey(d => d.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<IdentityRole<long>>(entity =>
        {
            entity.ToTable("Roles");
        });
        builder.Entity<IdentityUserRole<long>>().ToTable("UserRoles");
        builder.Entity<IdentityUserClaim<long>>().ToTable("UserClaims");
        builder.Entity<IdentityUserLogin<long>>().ToTable("UserLogins");
        builder.Entity<IdentityRoleClaim<long>>().ToTable("RoleClaims");
        builder.Entity<IdentityUserToken<long>>().ToTable("UserTokens");
    }
}

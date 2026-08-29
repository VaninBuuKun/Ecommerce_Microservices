using Ecommerce.Services.Notifications.Api.Models;
using Ecommerce.Services.Notifications.Api.Models.Entities;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Notifications.Api.Persistances;

public class NotificationDbContext(DbContextOptions<NotificationDbContext> options) : DbContext(options)
{
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<ChatRoom> ChatRooms { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Outbox/Inbox for MassTransit
        modelBuilder.AddOutboxStateEntity();
        modelBuilder.AddOutboxMessageEntity();
        modelBuilder.AddInboxStateEntity();

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.UserId).IsRequired();
            entity.Property(n => n.Title).IsRequired().HasMaxLength(200);
            entity.Property(n => n.Body).IsRequired().HasMaxLength(1000);
            entity.Property(n => n.Type).HasConversion<string>().HasMaxLength(100).IsRequired();

            entity.Property(n => n.ReferenceId).HasMaxLength(100).IsRequired(false);

            // Index để query nhanh theo UserId + IsRead
            entity.HasIndex(n => new { n.UserId, n.IsRead });
            entity.HasIndex(n => n.CreatedAt);
        });

        modelBuilder.Entity<ChatRoom>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.ShopId).IsRequired();
            entity.Property(r => r.BuyerUserId).IsRequired();
            entity.Property(r => r.LastMessage).HasMaxLength(1000);

            // Index composite key to make Room lookup fast
            entity.HasIndex(r => new { r.ShopId, r.BuyerUserId }).IsUnique();
            entity.HasIndex(r => r.LastActiveAt);
        });


        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.RoomId).IsRequired();
            entity.Property(c => c.SenderId).IsRequired();
            entity.Property(c => c.Content).IsRequired().HasMaxLength(2000);

            entity.HasIndex(c => c.RoomId);
        });
    }
}


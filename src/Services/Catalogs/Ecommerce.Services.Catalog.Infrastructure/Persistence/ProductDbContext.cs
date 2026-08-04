using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Domain;
using Ecommerce.Services.Catalog.Domain.Products;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Catalog.Infrastructure.Persistence;

public class ProductDbContext(DbContextOptions<ProductDbContext> options, IInMemoryBus bus) : EfDbContextBase(options, bus)
{
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductOption> ProductOptions { get; set; }
    public DbSet<ProductOptionValue> ProductOptionValues { get; set; }
    public DbSet<ProductVariant> ProductVariants { get; set; }
    public DbSet<ProductVariantOption> ProductVariantOptions { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<ProductReview> ProductReviews { get; set; }
    public DbSet<ProductReviewImage> ProductReviewImages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).HasMaxLength(255).IsRequired();
            entity.Property(c => c.Description).HasMaxLength(1000);
            
            entity.HasOne(c => c.Parent)
                  .WithMany(c => c.SubCategories)
                  .HasForeignKey(c => c.ParentId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(pi => pi.Id);
            entity.Property(pi => pi.ImageUrl).HasMaxLength(1000).IsRequired();
        });

        modelBuilder.Entity<ProductReview>(entity =>
        {
            entity.HasKey(pr => pr.Id);
            entity.Property(pr => pr.Comment).HasMaxLength(2000);
            entity.Property(pr => pr.Rating).IsRequired();

            entity.HasMany(pr => pr.Images)
                  .WithOne()
                  .HasForeignKey(pri => pri.ProductReviewId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProductReviewImage>(entity =>
        {
            entity.HasKey(pri => pri.Id);
            entity.Property(pri => pri.ImageUrl).HasMaxLength(1000).IsRequired();
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Status)
                  .HasConversion<string>()
                  .HasMaxLength(20);

            entity.HasOne(p => p.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(p => p.Images)
                  .WithOne()
                  .HasForeignKey(pi => pi.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(p => p.Reviews)
                  .WithOne(pr => pr.Product)
                  .HasForeignKey(pr => pr.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(p => p.Options)
                  .WithOne()
                  .HasForeignKey(c => c.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Navigation(p => p.Options)
                  .UsePropertyAccessMode(PropertyAccessMode.Field);

            entity.HasMany(p => p.Variants)
                  .WithOne(v => v.Product)
                  .HasForeignKey(v => v.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Navigation(p => p.Variants)
                  .UsePropertyAccessMode(PropertyAccessMode.Field);
            
            entity.Property(p => p.Weight).HasDefaultValue(0);
            entity.Property(p => p.Height).HasDefaultValue(0);
            entity.Property(p => p.Width).HasDefaultValue(0);
            entity.Property(p => p.Length).HasDefaultValue(0);
            entity.Property(p => p.ThumbnailUrl).HasMaxLength(1000);
            entity.Property(p => p.VideoUrl).HasMaxLength(1000);
            entity.Property(p => p.ImageUrls)
                  .HasConversion(
                      v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions)null),
                      v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions)null) ?? new List<string>()
                  )
                  .HasColumnType("json");
        });

        modelBuilder.Entity<ProductOption>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.Name).HasMaxLength(255);

            entity.HasMany(o => o.Values)
                  .WithOne(v => v.Option)
                  .HasForeignKey(v => v.OptionId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Navigation(o => o.Values)
                  .UsePropertyAccessMode(PropertyAccessMode.Field);
        });

        modelBuilder.Entity<ProductOptionValue>(entity =>
        {
            entity.HasKey(ov => ov.Id);
            entity.Property(ov => ov.Value).HasMaxLength(255);
            entity.Property(ov => ov.ImageUrl).HasMaxLength(1000);
        });

        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.HasKey(v => v.Id);
            entity.Property(v => v.Price).HasColumnType("decimal(18,2)");
            entity.Property(v => v.Sku).HasMaxLength(50);
            

            entity.HasMany(v => v.Options)
                  .WithOne(vo => vo.Variant)
                  .HasForeignKey(vo => vo.VariantId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Navigation(v => v.Options)
                  .UsePropertyAccessMode(PropertyAccessMode.Field);
        });

        modelBuilder.Entity<ProductVariantOption>(entity =>
        {
            entity.HasKey(vo => new { vo.VariantId, vo.OptionValueId });

            entity.HasOne(vo => vo.OptionValue)
                  .WithMany()
                  .HasForeignKey(vo => vo.OptionValueId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}

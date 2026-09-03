using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using BuildingBlocks.Shared.InfrastructureInterfaces.IdGenerator;
using Ecommerce.Services.Catalog.Domain;
using Ecommerce.Services.Catalog.Domain.Products;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Infrastructure.Persistence;

public class CatalogDataSeeder(
    ProductDbContext dbContext,
    ISnowflakeIdGenerator snowflakeIdGenerator,
    ILogger<CatalogDataSeeder> logger
)
{
    private static readonly Random Rnd = new();

    // 1. Dynamic Attribute Pool (6 keys chung, mỗi key 4-5 options)
    private static readonly Dictionary<string, string[]> AttributePool = new()
    {
        { "Xuất xứ", new[] { "Việt Nam", "Hàn Quốc", "Nhật Bản", "Thái Lan", "Mỹ" } },
        { "Chất liệu", new[] { "Cotton cao cấp", "Da tổng hợp PU", "Vải dù chống nước", "Polyeste bền bỉ", "Hợp kim nhôm" } },
        { "Bảo hành", new[] { "1 tháng", "3 tháng", "6 tháng", "12 tháng", "Đổi trả 1-1 trong 7 ngày" } },
        { "Phong cách", new[] { "Hàn Quốc", "Tối giản (Minimalism)", "Vintage", "Thể thao năng động", "Hiện đại trẻ trung" } },
        { "Mục đích sử dụng", new[] { "Hằng ngày", "Đi học / Đi làm", "Du lịch / Dã ngoại", "Thể thao", "Sự kiện / Dự tiệc" } },
        { "Hướng dẫn bảo quản", new[] { "Giặt tay nhẹ nhàng", "Tránh ánh nắng trực tiếp", "Để nơi khô ráo", "Không dùng chất tẩy mạnh", "Lau sạch bằng khăn mềm" } }
    };

    private static readonly string[] FallbackBrands = { "No Brand", "OEM", "Local Brand", "Premium Choice", "Eco Life", "Urban Fashion" };

    // 2. Image Pools theo Category (Mỗi category có danh sách link ảnh để lấy ngẫu nhiên 1 thumbnail + 3-6 ảnh phụ)
    private static readonly Dictionary<string, string[]> CategoryImagePools = new()
    {
        {
            "shoes", new[]
            {
                "https://down-vn.img.susercontent.com/file/vn-11134207-81ztc-mprhylzcy0p87d.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-81ztc-mprhylz83ua3db.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m70g7p0mm9mge1.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m70g7p0mm9mge1.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134201-7ra0g-m7nww6lhkcoj6e.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134201-820l4-mgd0jbwbv5e357.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134201-820l4-mgd0jd7m8lce33.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134201-820l4-mgd0jhqoydcf8d.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134201-820l4-mgd0jmqf864q48.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-820l4-mjs9z4rs04qv03.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m7968n6pcni41f.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m7968k4jtulv75.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134201-820l4-mgd0m88zgphob3.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134201-820l4-mgd0mdpffsaxa5.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134201-820l4-mgd0mb1v7z0pef.webp",
            }
        },
        {
            "bags", new[]
            {
                "https://down-vn.img.susercontent.com/file/sg-11134253-7rdym-mdh5i3o6mpic61.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-81ztc-mp35xzorec5q45.webp",
                "https://down-vn.img.susercontent.com/file/sg-11134253-7rdxg-mdh7178g08kq69.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m2t0033whxoac1.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lnwsqiuzpi0q52.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lnwsqiv04ycta4.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lnwsqix7m965fc.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m54pongq2sxv3a.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lnwsqivjoosa0e.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lnwsqiv0kelpa3.webp",
                "https://down-vn.img.susercontent.com/file/sg-11134253-81zuj-miprjfqon9j517.webp",
                "https://down-vn.img.susercontent.com/file/sg-11134253-81zuf-miprhalz3qiw32.webp",
                "https://down-vn.img.susercontent.com/file/sg-11134253-81ztq-miprt3m69ekk1f.webp",
                "https://down-vn.img.susercontent.com/file/sg-11134253-81zw3-miprn91mr11f7b.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lsp64gcyp6tgd8.webp",
                
            }
        },
        {
            "fashion", new[]
            {
                "https://down-vn.img.susercontent.com/file/vn-11134207-820l4-mezmpb16lzbf48.webp",
                "https://down-vn.img.susercontent.com/file/cn-11134207-820l4-mnb3gc91i3nn95.webp",
                "https://down-vn.img.susercontent.com/file/cn-11134207-820l4-mnb3gc8yjchw11.webp",
                "https://down-vn.img.susercontent.com/file/sg-11134201-7rbk1-lo51hv21w6rae1.webp",
                "https://down-vn.img.susercontent.com/file/sg-11134201-7rbkr-lo51hvdpf4f340.webp",
                "https://down-vn.img.susercontent.com/file/cn-11134207-820l4-mgbmidswor9of4.webp",
                "https://down-vn.img.susercontent.com/file/sg-11134201-7rbls-lo51hv7vnntd09.webp",
                "https://down-vn.img.susercontent.com/file/cn-11134207-820l4-mephdcpv4xz571.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lowb53w0pdgb2b.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mcsmoz70hbjhf3.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mcsmoubxiqfw2b.webp",
            }
        },
        {
            "accessories", new[]
            {
                "https://down-vn.img.susercontent.com/file/cn-11134207-7ras8-matkqr5jq8bw3c.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-820l4-mjgiibjgdgcic4.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-820l4-mjgiibjgdgcic4.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-820l4-mjgiibjgdgcic4.webp",
                "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lyc0wdm1n4ulb4.webp",
                "https://down-vn.img.susercontent.com/file/sg-11134253-81zwi-mj0b6g941r7rb3.webp",
                "https://down-vn.img.susercontent.com/file/sg-11134253-81zww-mj08br9ntypt57.webp",
                "https://down-vn.img.susercontent.com/file/sg-11134253-81zw3-mj08ko6ya7t00d.webp",
                "https://down-vn.img.susercontent.com/file/cn-11134207-820l4-mir0aap4od1df9.webp",
                "https://down-vn.img.susercontent.com/file/cn-11134207-820l4-mir0aag6b11je3.webp",
            }
        }
    };

    public async Task SeedAsync(bool resetExisting = false, int maxItemsPerFile = 30)
    {
        try
        {
            // // Tăng timeout lên 180s cho phiên seed để đảm bảo an toàn tuyệt đối
            // dbContext.Database.SetCommandTimeout(180);

            if (resetExisting)
            {
                logger.LogInformation("Resetting existing Products and Variants tables...");
                
                await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM `ProductVariantOptions`");
                await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM `ProductOptionValues`");
                await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM `ProductOptions`");
                await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM `ProductVariants`");
                await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM `ProductReviews`");
                await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM `Products`");
            }

            var hasProducts = await dbContext.Products.AnyAsync();
            if (hasProducts)
            {
                logger.LogInformation("Products table already contains data. Skipping seed.");
                return;
            }

            var csvDirectory = FindCsvDirectory();
            if (string.IsNullOrEmpty(csvDirectory) || !Directory.Exists(csvDirectory))
            {
                logger.LogWarning("CSV data directory not found. Please ensure 'src/scripts/seed-data/datas' exists.");
                return;
            }

            var existingCategories = await dbContext.Categories.ToListAsync();
            var csvFiles = Directory.GetFiles(csvDirectory, "*.csv");

            logger.LogInformation("Found {Count} CSV files in {Dir}. Starting seeding with Snowflake IDs...", csvFiles.Length, csvDirectory);

            var productsToInsert = new List<Product>();

            foreach (var filePath in csvFiles)
            {
                var fileName = Path.GetFileNameWithoutExtension(filePath);
                var categoryId = ResolveCategoryId(fileName, existingCategories);

                logger.LogInformation("Processing CSV file: {FileName} (Matched CategoryId: {CategoryId})", fileName, categoryId);

                var products = ParseCsvFile(filePath, categoryId, maxItemsPerFile);
                productsToInsert.AddRange(products);
            }

            if (productsToInsert.Count > 0)
            {
                await dbContext.Products.AddRangeAsync(productsToInsert);
                await dbContext.SaveChangesAsync();
                logger.LogInformation("Successfully seeded {Count} products from CSVs with Snowflake IDs and Default Variants.", productsToInsert.Count);
            }
            else
            {
                logger.LogWarning("No products parsed from CSV files.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during CSV Product seeding.");
            throw;
        }
    }

    private List<Product> ParseCsvFile(string filePath, long? categoryId, int maxItems)
    {
        var result = new List<Product>();
        var lines = File.ReadAllLines(filePath);
        if (lines.Length <= 1) return result;

        // Xác định Category Type từ file path để chọn Image Pool và Dimensions phù hợp
        var catKey = DetectCategoryKey(filePath);

        int count = 0;
        for (int i = 1; i < lines.Length && count < maxItems; i++)
        {
            var line = lines[i];
            if (string.IsNullOrWhiteSpace(line)) continue;

            var cols = ParseCsvRow(line);
            if (cols.Count < 6) continue;

            try
            {
                var name = cols[2]?.Trim().Trim('"');
                var description = cols[3]?.Trim().Trim('"');
                if (string.IsNullOrWhiteSpace(name) || name.Length < 3) continue;

                // Giá
                decimal.TryParse(cols[4], NumberStyles.Any, CultureInfo.InvariantCulture, out var originalPrice);
                decimal.TryParse(cols[5], NumberStyles.Any, CultureInfo.InvariantCulture, out var price);
                if (price <= 0) price = originalPrice > 0 ? originalPrice : 150000;
                if (originalPrice <= 0) originalPrice = price;

                decimal? discountPrice = originalPrice > price ? price : null;
                var basePrice = originalPrice > price ? originalPrice : price;

                // Brand (Nếu rỗng thì random từ FallbackBrands)
                var rawBrand = cols.Count > 7 ? cols[7]?.Trim().Trim('"') : null;
                var brand = !string.IsNullOrWhiteSpace(rawBrand) && rawBrand != "OEM" && rawBrand != "No Brand"
                    ? rawBrand
                    : FallbackBrands[Rnd.Next(FallbackBrands.Length)];

                // Sinh Kích thước và Trọng lượng phù hợp theo Category Type (ngẫu nhiên trong khoảng thực tế)
                var (weight, length, width, height) = GenerateCategoryDimensions(catKey);

                // Lấy hình ảnh: Chọn ngẫu nhiên 1 thumbnail + 3-6 ảnh phụ từ image pool
                var (thumbnail, imageUrls) = SelectImagesFromPool(catKey);

                // Sinh danh sách Attributes ngẫu nhiên (3-4 attributes ngẫu nhiên + Brand)
                var attributesJson = GenerateAttributesJson(brand);

                var product = new Product(
                    shopId: Rnd.Next(1, 13),
                    name: name,
                    description: string.IsNullOrWhiteSpace(description) || description == "..."
                        ? $"<p>Sản phẩm <strong>{name}</strong> chính hãng, chất liệu cao cấp, độ bền vượt trội và phong cách thời thượng.</p>"
                        : $"<p>{description}</p>",
                    thumbnailUrl: thumbnail,
                    weight: weight,
                    length: length,
                    width: width,
                    height: height
                )
                {
                    Id = snowflakeIdGenerator.NewId(),
                };

                product.SetCategory(categoryId);
                product.SetMedia(thumbnail, null, imageUrls);
                product.SetAttributes(attributesJson);

                // Review, Sold và Thống kê khởi tạo mặc định bằng 0 (theo yêu cầu)

                // Tạo Default Variant cho mỗi Product dùng Snowflake ID
                var defaultVariant = product.AddVariant(
                    price: basePrice,
                    availableStock: Rnd.Next(50, 200),
                    discountPrice: discountPrice
                );
                defaultVariant.Id = snowflakeIdGenerator.NewId();

                product.Publish();
                product.RecalculateCachedPrices();

                result.Add(product);
                count++;
            }
            catch
            {
                // Bỏ qua dòng lỗi format CSV
            }
        }

        return result;
    }

    private static (double weight, double length, double width, double height) GenerateCategoryDimensions(string catKey)
    {
        return catKey switch
        {
            // Giày dép: Thường 600g - 1100g, hộp 30-34cm x 18-22cm x 11-14cm
            "shoes" => (
                weight: Math.Round(Rnd.Next(600, 1100) + Rnd.NextDouble(), 0),
                length: Math.Round(Rnd.Next(30, 35) + Rnd.NextDouble(), 1),
                width: Math.Round(Rnd.Next(18, 23) + Rnd.NextDouble(), 1),
                height: Math.Round(Rnd.Next(11, 15) + Rnd.NextDouble(), 1)
            ),
            // Balo, Túi xách: Thường 300g - 850g, 25-42cm x 15-32cm x 8-18cm
            "bags" => (
                weight: Math.Round(Rnd.Next(300, 850) + Rnd.NextDouble(), 0),
                length: Math.Round(Rnd.Next(25, 42) + Rnd.NextDouble(), 1),
                width: Math.Round(Rnd.Next(15, 32) + Rnd.NextDouble(), 1),
                height: Math.Round(Rnd.Next(8, 18) + Rnd.NextDouble(), 1)
            ),
            // Quần áo / Thời trang: Thường 180g - 400g, gấp gọn 26-32cm x 18-24cm x 2-4cm
            "fashion" => (
                weight: Math.Round(Rnd.Next(180, 400) + Rnd.NextDouble(), 0),
                length: Math.Round(Rnd.Next(26, 33) + Rnd.NextDouble(), 1),
                width: Math.Round(Rnd.Next(18, 25) + Rnd.NextDouble(), 1),
                height: Math.Round(Rnd.Next(2, 5) + Rnd.NextDouble(), 1)
            ),
            // Phụ kiện: Thường 50g - 200g, 10-18cm x 8-14cm x 2-6cm
            _ => (
                weight: Math.Round(Rnd.Next(50, 200) + Rnd.NextDouble(), 0),
                length: Math.Round(Rnd.Next(10, 19) + Rnd.NextDouble(), 1),
                width: Math.Round(Rnd.Next(8, 15) + Rnd.NextDouble(), 1),
                height: Math.Round(Rnd.Next(2, 7) + Rnd.NextDouble(), 1)
            )
        };
    }

    private static (string thumbnail, List<string> imageUrls) SelectImagesFromPool(string catKey)
    {
        if (!CategoryImagePools.TryGetValue(catKey, out var pool) || pool.Length == 0)
        {
            pool = CategoryImagePools["accessories"];
        }

        var shuffled = pool.OrderBy(_ => Rnd.Next()).ToList();
        var thumbnail = shuffled[0];

        // Lấy ngẫu nhiên từ 3 đến 6 ảnh còn lại làm imageUrls (bao gồm cả thumbnail)
        int additionalCount = Math.Min(Rnd.Next(3, 7), shuffled.Count);
        var imageUrls = shuffled.Take(additionalCount).ToList();

        if (!imageUrls.Contains(thumbnail))
        {
            imageUrls.Insert(0, thumbnail);
        }

        return (thumbnail, imageUrls);
    }

    private static string GenerateAttributesJson(string brand)
    {
        var attributesList = new List<object>
        {
            new { key = "Thương hiệu", value = brand }
        };

        // Chọn ngẫu nhiên 3 - 4 keys từ 6 keys trong AttributePool
        int numberOfAttrsToPick = Rnd.Next(3, 5);
        var pickedKeys = AttributePool.Keys.OrderBy(_ => Rnd.Next()).Take(numberOfAttrsToPick);

        foreach (var key in pickedKeys)
        {
            var options = AttributePool[key];
            var randomVal = options[Rnd.Next(options.Length)];
            attributesList.Add(new { key, value = randomVal });
        }

        return JsonSerializer.Serialize(attributesList);
    }

    private static string DetectCategoryKey(string filePath)
    {
        var lower = filePath.ToLowerInvariant();
        if (lower.Contains("shoe") || lower.Contains("giay")) return "shoes";
        if (lower.Contains("bag") || lower.Contains("backpack") || lower.Contains("suitcase") || lower.Contains("balo") || lower.Contains("tui")) return "bags";
        if (lower.Contains("fashion") || lower.Contains("cloth") || lower.Contains("ao")) return "fashion";
        return "accessories";
    }

    private static List<string> ParseCsvRow(string row)
    {
        var pattern = @"(?<=^|,)(?:""(?<val>(?:[^""]|"""")*)""|(?<val>[^,]*))";
        var matches = Regex.Matches(row, pattern);
        var list = new List<string>();
        foreach (Match match in matches)
        {
            var val = match.Groups["val"].Value.Replace("\"\"", "\"");
            list.Add(val);
        }
        return list;
    }

    private static string? FindCsvDirectory()
    {
        var current = Directory.GetCurrentDirectory();
        while (!string.IsNullOrEmpty(current))
        {
            var candidate = Path.Combine(current, "src", "scripts", "seed-data", "datas");
            if (Directory.Exists(candidate)) return candidate;

            var parent = Directory.GetParent(current);
            if (parent == null || parent.FullName == current) break;
            current = parent.FullName;
        }

        return null;
    }

    private static long? ResolveCategoryId(string fileName, List<Category> categories)
    {
        if (categories == null || categories.Count == 0) return null;

        var lower = fileName.ToLowerInvariant();
        if (lower.Contains("shoe") || lower.Contains("giay"))
        {
            return categories.FirstOrDefault(c => c.Name.Contains("Giày") || c.Name.Contains("Dép"))?.Id 
                   ?? categories.FirstOrDefault(c => c.Name.Contains("Thời trang"))?.Id;
        }
        if (lower.Contains("bag") || lower.Contains("backpack") || lower.Contains("suitcase") || lower.Contains("balo") || lower.Contains("tui"))
        {
            return categories.FirstOrDefault(c => c.Name.Contains("Túi") || c.Name.Contains("Balo") || c.Name.Contains("Ví"))?.Id 
                   ?? categories.FirstOrDefault(c => c.Name.Contains("Phụ kiện") || c.Name.Contains("Thời trang"))?.Id;
        }
        if (lower.Contains("accessories") || lower.Contains("fashion"))
        {
            return categories.FirstOrDefault(c => c.Name.Contains("Thời trang") || c.Name.Contains("Phụ kiện"))?.Id;
        }

        return categories.FirstOrDefault(c => c.ParentId.HasValue)?.Id ?? categories.FirstOrDefault()?.Id;
    }
}

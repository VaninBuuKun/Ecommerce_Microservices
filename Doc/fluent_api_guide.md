# Cẩm Nang Cấu Hình EF Core Fluent API Từ Căn Bản Đến Nâng Cao

Tài liệu này cung cấp hướng dẫn toàn diện, chi tiết và thực tế nhất về cách sử dụng **Fluent API** trong Entity Framework Core (EF Core 8+). Fluent API là cách tốt nhất để cấu hình database schema, đảm bảo tính tách biệt (Separation of Concerns) và hỗ trợ đầy đủ các tính năng nâng cao mà Data Annotations không thể làm được.

---

## 1. Thiết Lập & Tổ Chức Cấu Hình (Setup & Organization)

Thay vì viết tất cả cấu hình trong phương thức `OnModelCreating` của `DbContext` làm file phình to và khó duy trì, ta nên tách nhỏ cấu hình cho từng Entity thành các class riêng triển khai `IEntityTypeConfiguration<T>`.

### A. Định nghĩa class cấu hình riêng biệt (`IEntityTypeConfiguration<T>`)
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        // Toàn bộ cấu hình Fluent API của Product viết ở đây
        builder.ToTable("Products", "catalog");
        
        builder.HasKey(p => p.Id);
    }
}
```

### B. Tự động quét và áp dụng cấu hình trong `DbContext`
Sử dụng `ApplyConfigurationsFromAssembly` để EF Core tự động quét qua toàn bộ Assembly chứa các class cấu hình và áp dụng chúng.
```csharp
using System.Reflection;
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Quét toàn bộ Class kế thừa IEntityTypeConfiguration trong Assembly hiện tại
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        
        // Hoặc quét từ một Assembly cụ thể (nếu cấu hình nằm ở tầng Infrastructure/Persistence)
        // modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
```

---

## 2. Cấu Hình Bảng & Thực Thể (Table & Entity Level)

### A. Tên bảng và Schema (Table & Schema Mapping)
Định nghĩa tên bảng vật lý trong Database và Schema phân vùng của nó.
```csharp
builder.ToTable("Products"); // Mặc định schema là 'dbo' trong SQL Server

builder.ToTable("Products", "catalog"); // Chỉ định rõ Schema là 'catalog'
```

### B. Bỏ qua Entity (Ignore Entity)
Không ánh xạ một class thành bảng trong Database.
```csharp
modelBuilder.Ignore<TemporaryReport>();
```

### C. Ánh xạ View hoặc Function (Mapping to Views / Functions)
Ánh xạ Entity sang một View có sẵn trong Database (chỉ đọc).
```csharp
builder.ToView("View_ProductSummary", "catalog")
       .HasNoKey(); // Thường View không có Khóa chính
```

---

## 3. Cấu Hình Thuộc Tính & Cột (Property & Column Level)

### A. Tên cột, Kiểu dữ liệu và Tính bắt buộc
```csharp
builder.Property(p => p.Name)
       .HasColumnName("ProductName") // Đổi tên cột trong DB
       .HasColumnType("nvarchar(250)") // Xác định kiểu dữ liệu DB
       .IsRequired(); // NOT NULL
       
builder.Property(p => p.Description)
       .IsRequired(false); // NULL (Có thể nhận giá trị null)
```

### B. Giới hạn độ dài (MaxLength)
```csharp
builder.Property(p => p.Sku)
       .HasMaxLength(50) // Giới hạn tối đa 50 ký tự
       .IsFixedLength(); // CHAR(50) thay vì VARCHAR(50)
```

### C. Giá trị mặc định (Default Values)
*   **Giá trị tĩnh (Default Value):** EF Core tự gán giá trị khi chèn mới.
*   **Giá trị SQL (Default Value SQL):** Sử dụng câu lệnh hoặc hàm của Database.
```csharp
// Gán giá trị mặc định tĩnh
builder.Property(p => p.IsActive)
       .HasDefaultValue(true);

// Dùng hàm SQL để lấy thời gian hiện tại
builder.Property(p => p.CreatedDate)
       .HasDefaultValueSql("GETUTCDATE()"); // Đối với PostgreSQL dùng: "timezone('utc'::text, now())"

// Tạo mã ngẫu nhiên tự sinh bên phía Database
builder.Property(p => p.UniqueCode)
       .HasDefaultValueSql("NEWID()"); // Dùng "gen_random_uuid()" đối với PostgreSQL
```

### D. Cột tính toán tự động (Computed Columns)
Cột có giá trị tự động được tính toán dựa trên các cột khác trong DB.
```csharp
builder.Property(p => p.TotalPrice)
       .HasComputedColumnSql("[Quantity] * [UnitPrice]", stored: true); 
       // stored: true có nghĩa là tính toán một lần rồi lưu trực tiếp vào ổ đĩa để tăng tốc truy vấn.
```

### E. Chuyển đổi dữ liệu (Value Converters)
Chuyển đổi kiểu dữ liệu C# sang kiểu khác khi lưu xuống DB (ví dụ: Enum lưu thành String, hoặc đối tượng phức tạp lưu thành Json).

#### 1. Chuyển đổi Enum sang String
```csharp
builder.Property(p => p.Status)
       .HasConversion(
            v => v.ToString(), // Khi lưu xuống DB: chuyển sang String
            v => (ProductStatus)Enum.Parse(typeof(ProductStatus), v) // Khi đọc lên C#: parse lại Enum
       )
       .HasMaxLength(50);
```

#### 2. Lưu đối tượng phức tạp dưới dạng JSON (EF Core 8+)
```csharp
builder.Property(p => p.Features)
       .HasColumnType("nvarchar(max)") // Lưu dạng text JSON
       .HasConversion(
           v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
           v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null)
       );
```
*(Lưu ý: Đối với EF Core 8+, bạn cũng có thể sử dụng cấu hình Owned JSON thay thế).*

---

## 4. Cấu Hình Khóa Chính & Khóa Thay Thế (Keys Configuration)

### A. Khóa chính đơn (Primary Key)
```csharp
builder.HasKey(p => p.Id);
```

### B. Khóa chính phức hợp (Composite Primary Key)
```csharp
builder.HasKey(o => new { o.OrderId, o.ProductId });
```

### C. Cơ chế sinh khóa (Value Generation)
Xác định cách khóa chính được sinh ra.
```csharp
// Tự động tăng (IDENTITY) - mặc định cho kiểu số nguyên (int, long)
builder.Property(p => p.Id)
       .ValueGeneratedOnAdd();

// Không tự động tăng, Client phải tự cung cấp giá trị Id
builder.Property(p => p.Id)
       .ValueGeneratedNever();
```

### D. Khóa thay thế (Alternate Key / Unique Constraint)
Tạo thêm khóa phụ không trùng lặp ngoài khóa chính.
```csharp
builder.HasAlternateKey(p => p.TaxCode);
```

---

## 5. Mối Quan Hệ Giữa Các Bảng (Relationships)

Cú pháp thiết lập quan hệ tuân theo cấu trúc:
`builder.[Mối quan hệ nguồn]().[Mối quan hệ đích]().HasForeignKey<Bảng đích>(...)`

### A. Quan hệ Một - Nhiều (One-to-Many - 1:N)
Ví dụ: Một `Category` có nhiều `Product`, một `Product` thuộc về một `Category`.
```csharp
builder.HasOne(p => p.Category)
       .WithMany(c => c.Products)
       .HasForeignKey(p => p.CategoryId)
       .OnDelete(DeleteBehavior.Restrict); // Tránh CASCADE delete không mong muốn
```
**Các chế độ xóa (DeleteBehavior):**
*   `Cascade`: Xóa cha thì con bị tự động xóa theo (Mặc định nếu FK không cho phép null).
*   `Restrict` hoặc `NoAction`: Không cho phép xóa cha nếu vẫn còn con tham chiếu đến.
*   `SetNull`: Xóa cha thì con cập nhật Foreign Key thành `NULL` (FK phải cho phép null).

### B. Quan hệ Một - Một (One-to-One - 1:1)
Ví dụ: Một `Product` có một `ProductDetail`. Cần chỉ rõ Class chứa Foreign Key bằng `HasForeignKey<TargetEntity>`.
```csharp
builder.HasOne(p => p.ProductDetail)
       .WithOne(d => d.Product)
       .HasForeignKey<ProductDetail>(d => d.ProductId) // Chỉ định ProductDetail là bảng chứa FK
       .OnDelete(DeleteBehavior.Cascade);
```

### C. Quan hệ Nhiều - Nhiều (Many-to-Many - N:N)

#### Cách 1: Tự động ngầm định (Implicit Join Table) - EF Core 5+
EF Core tự tạo ra bảng trung gian có tên `ProductTag` gồm hai trường `ProductsId` và `TagsId`.
```csharp
builder.HasMany(p => p.Tags)
       .WithMany(t => t.Products);
```

#### Cách 2: Định nghĩa chi tiết bảng trung gian (Explicit Join Table - Khuyên dùng)
Dành cho trường hợp bảng trung gian chứa thêm các cột phụ (ví dụ: `CreatedDate`, `CreatedBy`) hoặc cần chỉ định rõ tên bảng và tên khóa ngoại.
```csharp
builder.HasMany(p => p.Tags)
       .WithMany(t => t.Products)
       .UsingEntity<ProductTag>(
           // 1. Cấu hình liên kết đến Tag
           j => j.HasOne(pt => pt.Tag)
                 .WithMany(t => t.ProductTags)
                 .HasForeignKey(pt => pt.TagId),
                 
           // 2. Cấu hình liên kết đến Product
           j => j.HasOne(pt => pt.Product)
                 .WithMany(p => p.ProductTags)
                 .HasForeignKey(pt => pt.ProductId),
                 
           // 3. Cấu hình bổ sung cho chính bảng trung gian ProductTag
           j =>
           {
               j.ToTable("ProductTags");
               j.HasKey(pt => new { pt.ProductId, pt.TagId }); // Thiết lập khóa phức hợp
               j.Property(pt => pt.CreatedDate).HasDefaultValueSql("GETUTCDATE()");
           }
       );
```

### D. Quan hệ Tự Tham Chiếu (Self-Referencing Relationship)
Ví dụ: Một danh mục (`Category`) có thể có một danh mục cha (`ParentCategory`) và nhiều danh mục con (`SubCategories`).
```csharp
builder.HasOne(c => c.ParentCategory)
       .WithMany(c => c.SubCategories)
       .HasForeignKey(c => c.ParentCategoryId)
       .OnDelete(DeleteBehavior.Restrict);
```

---

## 6. Chỉ Mục & Ràng Buộc (Indexes & Constraints)

### A. Chỉ mục đơn & Chỉ mục phức hợp
```csharp
// Index đơn giúp tăng tốc tìm kiếm theo Sku
builder.HasIndex(p => p.Sku);

// Index phức hợp giúp tối ưu hóa truy vấn kết hợp nhiều trường
builder.HasIndex(p => new { p.CategoryId, p.IsActive });
```

### B. Chỉ mục Unique (Unique Index)
Đảm bảo giá trị của trường không bị trùng lặp ở tầng Database.
```csharp
builder.HasIndex(p => p.Sku)
       .IsUnique();
```

### C. Chỉ mục có bộ lọc (Filtered Index / Partial Index)
Tạo index lọc trên một nhóm dữ liệu cụ thể (rất hữu ích khi kết hợp với Soft Delete để bỏ qua các dòng đã xóa).
```csharp
builder.HasIndex(p => p.Sku)
       .IsUnique()
       .HasFilter("[IsDeleted] = 0"); // SQL Server syntax
```

### D. Ràng buộc kiểm tra (Check Constraint)
Ràng buộc trực tiếp tại Database để bảo toàn tính toàn vẹn dữ liệu.
```csharp
builder.ToTable("Products", t => 
    t.HasCheckConstraint("CK_Product_Price", "[Price] >= 0")
);
```

---

## 7. Chiến Lược Kế Thừa (Inheritance Mapping)

Giả sử ta có class cha `Payment` và hai class con kế thừa là `CreditCardPayment` và `PaypalPayment`.

### A. TPH (Table-per-Hierarchy) - Mặc định
Lưu tất cả các class kế thừa vào **duy nhất một bảng** (`Payments`). EF Core tự tạo cột `Discriminator` để phân biệt loại đối tượng.
```csharp
builder.HasDiscriminator<string>("PaymentType")
       .HasValue<CreditCardPayment>("CreditCard")
       .HasValue<PaypalPayment>("Paypal")
       .HasValue<Payment>("Base");
```

### B. TPT (Table-per-Type)
Mỗi class được lưu ở **một bảng riêng biệt**, liên kết với nhau qua khóa ngoại đồng thời là khóa chính.
```csharp
// Class cha lưu ở bảng Payments
builder.ToTable("Payments");

// Class con CreditCardPayment lưu ở bảng CreditCardPayments
// (Chỉ cần ToTable trong Configure của class con)
// builder.ToTable("CreditCardPayments");
```

### C. TPC (Table-per-Concrete-Class) - EF Core 7+
Mỗi class con được lưu ở một bảng độc lập chứa toàn bộ các thuộc tính của cha và con, không có liên kết khóa ngoại giữa các bảng này.
```csharp
builder.UseTpcMappingStrategy();
```

---

## 8. Các Tính Năng Nâng Cao (Advanced Features)

### A. Bộ lọc truy vấn toàn cục (Global Query Filters)
Tự động áp dụng điều kiện lọc cho tất cả các câu lệnh LINQ truy vấn vào thực thể này. Phù hợp nhất cho Soft Delete và Multi-Tenant.
```csharp
// Chỉ lấy các sản phẩm chưa bị xóa ảo
builder.HasQueryFilter(p => !p.IsDeleted);
```
*Cách truy vấn bỏ qua Global Filter khi cần thiết:*
```csharp
var allProductsIncludingDeleted = await _db.Products
                                           .IgnoreQueryFilters()
                                           .ToListAsync();
```

### B. Xử lý đồng thời (Concurrency Tokens / Optimistic Lock)
Ngăn chặn xung đột dữ liệu khi có nhiều Request ghi đè lên cùng một dòng dữ liệu tại một thời điểm.

#### Cách 1: Sử dụng cột RowVersion (Chỉ dành cho SQL Server)
Database tự động tăng giá trị của cột kiểu byte[] này mỗi khi có thay đổi.
```csharp
builder.Property(p => p.Version)
       .IsRowVersion();
```

#### Cách 2: Sử dụng thuộc tính bất kỳ làm Token
```csharp
builder.Property(p => p.LastModifiedDate)
       .IsConcurrencyToken();
```

### C. Tách bảng và Ghép bảng (Table Splitting & Entity Splitting)

#### 1. Table Splitting (Một bảng vật lý chia thành nhiều Entity trong C#)
Giúp tối ưu hóa hiệu năng bằng cách tách các trường dữ liệu nặng (như tệp nhị phân, hình ảnh hoặc mô tả rất dài) sang một Entity phụ nhưng vẫn lưu chung một bảng vật lý.
```csharp
// Cả Product và ProductDetails đều lưu chung bảng "Products"
builder.ToTable("Products");

builder.HasOne(p => p.Details)
       .WithOne()
       .HasForeignKey<ProductDetails>(d => d.Id);
```

#### 2. Entity Splitting (Một Entity trong C# chia ra lưu ở nhiều bảng vật lý)
```csharp
builder.ToTable("Products")
       .SplitToTable("ProductDetails", tableBuilder =>
       {
           tableBuilder.Property(p => p.DetailedDescription);
           tableBuilder.Property(p => p.WarrantyTerms);
       });
```

### D. Giá trị sở hữu (Owned Entities - DDD Value Objects)
Thiết lập các thành phần không có định danh độc lập (Value Object) đi kèm với thực thể chính.

#### 1. Owned Entity cùng bảng (Lưu chung bảng chính dưới dạng cột phụ)
```csharp
builder.OwnsOne(p => p.Price, price =>
{
    // Ánh xạ thuộc tính Price.Amount thành cột Price_Amount
    price.Property(p => p.Amount).HasColumnName("PriceAmount").HasColumnType("decimal(18,2)");
    price.Property(p => p.Currency).HasColumnName("CurrencyCode").HasMaxLength(3);
});
```

#### 2. Owned Entity khác bảng (Tự động tách thành một bảng liên kết con)
```csharp
builder.OwnsMany(p => p.Specifications, spec =>
{
    spec.ToTable("ProductSpecifications");
    spec.WithOwner().HasForeignKey("ProductId");
    spec.HasKey("Id"); // Tự định nghĩa Shadow Key cho bảng con
    spec.Property(s => s.Key).HasMaxLength(100);
    spec.Property(s => s.Value).HasMaxLength(500);
});
```

### E. Dữ liệu mẫu (Data Seeding)
Gán sẵn dữ liệu mặc định ban đầu cho DB (khi Migration chạy). Cần khai báo đầy đủ các cột kể cả khóa ngoại.
```csharp
builder.HasData(
    new Product 
    { 
        Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), 
        Name = "Default Product", 
        Sku = "DEF-PROD",
        CategoryId = Guid.Parse("22222222-2222-2222-2222-222222222222")
    }
);
```

---

## 9. Bộ Quy Tắc Thực Chiến & Best Practices

1.  **Luôn tách biệt cấu hình:** Không lạm dụng `OnModelCreating` trong DbContext để viết hàng ngàn dòng code Fluent API. Dùng class `IEntityTypeConfiguration<T>`.
2.  **Explicit > Implicit:** Dù EF Core có cơ chế tự suy luận (Convention) rất tốt, luôn cấu hình rõ ràng `HasMaxLength`, `IsRequired`, `HasColumnType("decimal(18,2)")` đối với các thuộc tính nhạy cảm như Tiền tệ hoặc Chuỗi ký tự độ dài lớn.
3.  **Hạn chế Cascade Delete:** Khi xây dựng Microservices hay kiến trúc DDD, hãy cấu hình `OnDelete(DeleteBehavior.Restrict)` cho các mối quan hệ không cần thiết để tránh việc DB tự động xóa dữ liệu liên đới ngoài kiểm soát.
4.  **Tối ưu chỉ mục và Soft Delete:** Luôn tạo index có bộ lọc `HasFilter("[IsDeleted] = 0")` trên các cột có ràng buộc `IsUnique` nếu thực thể đó có hỗ trợ Soft Delete (để tránh việc không thể thêm lại một bản ghi có Sku giống bản ghi đã bị xóa).
5.  **Dùng Shadow Properties khi cần thiết:** Những trường hệ thống như `CreatedBy`, `LastModifiedBy` có thể được cấu hình dạng Shadow Properties để tránh làm rác Domain Entity Model của bạn.

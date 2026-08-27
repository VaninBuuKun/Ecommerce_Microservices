# Cẩm Nang Sử Dụng Mapster Từ Căn Bản Đến Nâng Cao

Tài liệu này tổng hợp toàn bộ các cách sử dụng Mapster trong các dự án .NET (đặc biệt phù hợp cho kiến trúc Microservices / Clean Architecture).

---

## 1. Thiết lập Cấu hình & Dependency Injection (DI)

### Cài đặt Package
```bash
# Thư viện Core
dotnet add package Mapster

# Thư viện tích hợp Dependency Injection
dotnet add package Mapster.DependencyInjection
```

### Cấu hình trong tầng Application (`BuildingBlocks.Application`)
```csharp
using System.Reflection;
using Mapster;
using MapsterMapper;
using Microsoft.Extensions.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationMapping(this IServiceCollection services, Assembly assembly)
    {
        // 1. Quét các class kế thừa IRegister trong dự án con
        TypeAdapterConfig.GlobalSettings.Scan(assembly);

        // 2. Đăng ký Mapster DI (Tự động đăng ký IMapper -> ServiceMapper)
        services.AddMapster();

        return services;
    }
}
```

---

## 2. Cách Ánh Xạ Căn Bản (Basic Mapping)

Nếu các thuộc tính của Source và Destination trùng tên và kiểu dữ liệu, ta dùng cơ chế tự động (không cần cấu hình).

### A. Sử dụng Static Extension Method (Không cần Inject)
Phù hợp cho các helper method hoặc nơi không cần viết Unit Test giả lập (Mock).
```csharp
using Mapster;

// 1. Map sang một Object mới
var productDto = product.Adapt<ProductDto>();

// 2. Map sang một Danh sách mới
var productDtos = products.Adapt<List<ProductDto>>();

// 3. Map đè lên Object có sẵn (thường dùng khi Update dữ liệu)
var request = new UpdateProductCommand { Name = "New Name" };
request.Adapt(product); // Các thuộc tính trùng tên trong 'product' sẽ bị đè bởi 'request'
```

### B. Sử dụng Dependency Injection (Inject `IMapper`)
Phù hợp khi viết Business Logic trong các Command/Query Handlers để dễ viết Unit Test Mocking.
```csharp
using MapsterMapper;

public class GetProductHandler
{
    private readonly IMapper _mapper;

    public GetProductHandler(IMapper mapper) => _mapper = mapper;

    public Task<ProductDto> Handle(...)
    {
        var product = _repository.Get();
        return Task.FromResult(_mapper.Map<ProductDto>(product));
    }
}
```

---

## 3. Cấu hình Ánh Xạ Tùy Chỉnh (Custom Mapping - `IRegister`)

Khi hai đối tượng khác tên thuộc tính, khác kiểu dữ liệu hoặc cần logic đặc biệt, tạo một class triển khai `IRegister`.

```csharp
using Mapster;
using System.Globalization;

public class OrderMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<Order, OrderDto>()
            // 1. Map thuộc tính khác tên
            .Map(dest => dest.CustomerIdValue, src => src.CustomerId)

            // 2. Ép kiểu dữ liệu phức tạp (ví dụ: decimal -> string trong gRPC)
            .Map(dest => dest.TotalPriceString, src => src.TotalPrice.ToString("G29", CultureInfo.InvariantCulture))

            // 3. Đánh giá tính toán động
            .Map(dest => dest.IsHighValue, src => src.TotalPrice > 1000)

            // 4. Bỏ qua không map một thuộc tính nào đó
            .Ignore(dest => dest.InternalNotes);
    }
}
```

---

## 4. Các Tính Năng Nâng Cao (Advanced Features)

### A. Tối ưu hóa truy vấn SQL (EF Core Projection)
Thay vì load toàn bộ các trường của Entity từ Database về RAM rồi mới map, Projection giúp EF Core sinh ra câu lệnh SQL chỉ `SELECT` các cột mà DTO yêu cầu.

```csharp
using Mapster;
using Microsoft.EntityFrameworkCore;

// Inject TypeAdapterConfig từ DI
public class GetOrdersHandler(OrderDbContext db, TypeAdapterConfig config)
{
    public async Task<List<OrderDto>> Handle(...)
    {
        return await db.Orders
            .AsNoTracking()
            .ProjectToType<OrderDto>(config) // Tự động tạo câu lệnh SELECT tối ưu
            .ToListAsync();
    }
}
```

### B. Tự Động Làm Phẳng Thuộc Tính (Flattening)
Nếu class nguồn có các đối tượng lồng nhau, Mapster sẽ tự động "làm phẳng" chúng sang DTO nếu DTO đặt tên theo quy tắc viết liền/camelCase ghép tên đối tượng con:

```csharp
// Source
public class Order {
    public Customer Customer { get; set; }
}
public class Customer {
    public string Name { get; set; }
}

// Destination (DTO)
public class OrderDto {
    // Mapster sẽ tự động map Customer.Name vào CustomerName mà không cần cấu hình
    public string CustomerName { get; set; } 
}
```

### C. Sử dụng Callback (Before/After Mapping)
Cho phép bạn chạy các đoạn mã tùy chỉnh trước hoặc sau khi quá trình map hoàn thành.

```csharp
config.NewConfig<Order, OrderDto>()
    .BeforeMapping((src, dest) => {
        // Thực hiện hành động trước khi map
    })
    .AfterMapping((src, dest) => {
        // Ví dụ: mã hóa/giải mã thông tin nhạy cảm sau khi map xong
        dest.FormattedDate = src.CreatedDate.ToString("yyyy-MM-dd HH:mm:ss");
    });
```

### D. Xử lý giá trị Null (Null Handling)
Mặc định, nếu đối tượng nguồn là `null`, Mapster sẽ tạo một đối tượng đích mới hoặc trả về giá trị mặc định của kiểu đó. Bạn có thể cấu hình bỏ qua không ghi đè nếu nguồn bị `null`:

```csharp
config.NewConfig<UpdateDto, Entity>()
    // Bỏ qua tất cả các trường có giá trị null ở nguồn để tránh đè đè giá trị cũ trong database
    .IgnoreNullValues(true); 
```

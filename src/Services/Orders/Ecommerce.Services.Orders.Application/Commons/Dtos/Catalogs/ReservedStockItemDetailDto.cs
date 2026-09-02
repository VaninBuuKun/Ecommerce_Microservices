namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Catalogs;

public record ReservedStockItemDetailDto(
    long ShopId,
    Guid VariantId,
    int Quantity,
    int AvailableStock,
    string ProductName,
    string VariantName,
    decimal UnitPrice
);

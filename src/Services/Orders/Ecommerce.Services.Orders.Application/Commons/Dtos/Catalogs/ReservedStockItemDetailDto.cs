namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Catalogs;

public record ReservedStockItemDetailDto(
    long ShopId,
    Guid VariantId,
    int Quantity,
    int AvailableStocks,
    string ProductName,
    string VariantName,
    decimal UnitPrice
);

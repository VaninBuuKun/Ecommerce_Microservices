namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Catalogs;

public record ReserveStockItemDto(long ProductId, long VariantId, int Quantity);
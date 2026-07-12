namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Catalogs;

public record ReserveStockResponseDto(
    bool IsValid,
    List<ReservedStockItemDetailDto> Items,
    string ErrorMessage
);
namespace Ecommerce.Services.Carts.Contracts.Dtos;


//Chứa thông tin các product variant trả về khi mà không đủ hàng, kể cả có variant đủ
public class VariantStockInsufficientData
{
    public Guid VariantId { get; set; }
    public int Quantity { get; set; }
    public int Stocks { get; set; }
}
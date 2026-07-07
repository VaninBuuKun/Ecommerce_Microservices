namespace Ecommerce.Services.Carts.Contracts.Dtos;

public class OrderStatus
{
    public static readonly string Confirmed = nameof(Confirmed);
    public static readonly string Cancelled = nameof(Cancelled);
    public static readonly string Failed = nameof(Failed);
    public static readonly string Delivered = nameof(Delivered);
}
using System.Threading.Tasks;

namespace Ecommerce.Services.Orders.Application.Services;

public interface IOrderJobService
{
    /// <summary>
    /// Tự động hoàn tất đơn hàng SubOrder sau 7 ngày kể từ khi Delivered (Idempotent job).
    /// </summary>
    Task AutoCompleteSubOrderAsync(long subOrderId);
}

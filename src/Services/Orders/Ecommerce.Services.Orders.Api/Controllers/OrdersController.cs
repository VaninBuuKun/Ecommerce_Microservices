using BuildingBlocks.Web.Controllers;
using Ecommerce.Services.Orders.Application.Features.Commands.CreateOrder;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Ecommerce.Services.Orders.Application.Features.Queries.GetCustomerOrders;
using Microsoft.AspNetCore.Mvc;
using BuildingBlocks.Auth;

namespace Ecommerce.Services.Orders.Api.Controllers;

/// <summary>
/// Quản lý đơn hàng
/// </summary>
[Tags("Orders")]
public class OrdersController(ICurrentUserService currentUserService) : CleanV1CustomController
{
    private long UserId => currentUserService.UserId;
    
    /// <summary>
    /// Lấy danh sách lịch sử mua hàng theo mã khách hàng (CustomerId)
    /// </summary>
    /// <param name="customerId">Mã số định danh của khách hàng</param>
    /// <param name="cancellationToken">Token hủy yêu cầu</param>
    /// <returns>Danh sách đơn hàng đã mua</returns>
    /// <response code="200">Lấy lịch sử mua hàng thành công</response>
    /// <response code="400">Dữ liệu đầu vào không hợp lệ</response>
    [HttpGet("customer/{customerId:long}")]
    [ProducesResponseType(typeof(CustomerOrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetOrdersByCustomer(long customerId, CancellationToken cancellationToken)
    {
        var result = await _sender.SendAsync(new GetCustomerOrdersQuery(UserId), cancellationToken);

        return result.IsSuccess 
            ? Ok(result) 
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Thực hiện thanh toán giỏ hàng và tạo đơn hàng
    /// </summary>
    /// <param name="customerId">Mã khách hàng</param>
    /// <param name="cancellationToken">Token hủy yêu cầu</param>
    /// <returns>Mã đơn hàng vừa tạo</returns>
    [HttpPost("checkout")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Checkout(int customerId, CancellationToken cancellationToken)
    {
        var result = await _sender.SendAsync(new CreateOrderCommand(UserId), cancellationToken);

        return result.IsSuccess 
            ? Ok(result) 
            : StatusCode(result.GetHttpStatusCode(), result);
    }
}

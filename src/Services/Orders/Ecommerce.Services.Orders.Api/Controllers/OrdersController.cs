using BuildingBlocks.Web.Controllers;
using Ecommerce.Services.Orders.Application.Features.Commands.CreateOrder;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Ecommerce.Services.Orders.Application.Features.Queries.GetCustomerOrders;
using Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetOrderById;
using Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetSubOrdersByShop;
using Ecommerce.Services.Orders.Application.Features.Orders.Commands.SellerConfirmSubOrder;
using Ecommerce.Services.Orders.Application.Features.Orders.Commands.SellerRejectSubOrder;
using Ecommerce.Services.Orders.Application.Features.Orders.Commands.SellerPackageReady;
using Ecommerce.Services.Orders.Application.Features.Orders.Commands.CancelOrder;
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
    [HttpGet("customer/{customerId:long}")]
    [ProducesResponseType(typeof(List<CustomerOrderResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetOrdersByCustomer(long customerId, CancellationToken cancellationToken)
    {
        var result = await _sender.SendAsync(new GetSubOrdersQuery(UserId), cancellationToken);

        return result.IsSuccess 
            ? Ok(result) 
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Lấy thông tin đơn hàng chi tiết theo Id
    /// </summary>
    [HttpGet("{orderId:guid}")]
    [ProducesResponseType(typeof(CustomerOrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrderById(Guid orderId, CancellationToken cancellationToken)
    {
        var result = await _sender.SendAsync(new GetOrderByIdQuery(orderId, UserId), cancellationToken);

        return result.IsSuccess 
            ? Ok(result) 
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Thực hiện thanh toán các sản phẩm được chọn từ giỏ hàng và tạo đơn hàng
    /// </summary>
    [HttpPost("checkout")]
    [ProducesResponseType(typeof(CustomerOrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Checkout([FromBody] CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var result = await _sender.SendAsync(request with{CustomerId = UserId}, cancellationToken);

        return result.IsSuccess 
            ? Ok(result) 
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Lấy danh sách các đơn hàng con (SubOrder) của cửa hàng (dành cho Seller)
    /// </summary>
    [HttpGet("shop/{shopId:long}/suborders")]
    [ProducesResponseType(typeof(List<CustomerOrderResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSubOrdersByShop(long shopId, CancellationToken cancellationToken)
    {
        var result = await _sender.SendAsync(new GetSubOrdersByShopQuery(shopId, UserId), cancellationToken);

        return result.IsSuccess 
            ? Ok(result) 
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Người bán xác nhận đơn hàng con bắt đầu xử lý
    /// </summary>
    [HttpPut("suborder/{subOrderId:guid}/confirm")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ConfirmSubOrder(Guid subOrderId, CancellationToken cancellationToken)
    {
        var sellerId = currentUserService.UserId;
        var result = await _sender.SendAsync(new SellerConfirmSubOrderCommand(subOrderId, sellerId), cancellationToken);

        return result.IsSuccess 
            ? Ok(result) 
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Người bán từ chối đơn hàng con (hết hàng, sự cố...)
    /// </summary>
    [HttpPut("suborder/{subOrderId:guid}/reject")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> RejectSubOrder(Guid subOrderId, [FromQuery] string reason, CancellationToken cancellationToken)
    {
        var sellerId = currentUserService.UserId;
        var result = await _sender.SendAsync(new SellerRejectSubOrderCommand(subOrderId, sellerId, reason), cancellationToken);

        return result.IsSuccess
            ? Ok(result) 
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Người bán hoàn tất đóng gói, nhập kích thước cân nặng thực tế và gửi hãng vận chuyển
    /// </summary>
    [HttpPut("suborder/{subOrderId:guid}/package-ready")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> PackageReady(Guid subOrderId, [FromBody] SellerPackageReadyRequest request, CancellationToken cancellationToken)
    {
        var sellerId = currentUserService.UserId;
        var result = await _sender.SendAsync(new SellerPackageReadyCommand(
            subOrderId,
            sellerId,
            request.Weight,
            request.Length,
            request.Width,
            request.Height
        ), cancellationToken);

        return result.IsSuccess 
            ? Ok(result) 
            : StatusCode(result.GetHttpStatusCode(), result);
    }

    /// <summary>
    /// Khách hàng yêu cầu hủy đơn hàng con (chỉ khả dụng trước khi chuyển hàng)
    /// </summary>
    [HttpPut("suborder/{subOrderId:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> CancelSubOrder(Guid subOrderId, [FromQuery] string reason, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId;
        var result = await _sender.SendAsync(new CancelSubOrderCommand(subOrderId, UserId, reason), cancellationToken);

        return result.IsSuccess 
            ? Ok(result) 
            : StatusCode(result.GetHttpStatusCode(), result);
    }
}

public record SellerPackageReadyRequest(
    double Weight,
    double Length,
    double Width,
    double Height
);
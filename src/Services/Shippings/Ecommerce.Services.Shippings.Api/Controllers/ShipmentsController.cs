using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Shippings.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Shippings.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShipmentsController(IShippingProvider shippingProvider) : ControllerBase
{
    [HttpPost("calculate-fee")]
    public async Task<IActionResult> CalculateFee([FromBody] CalculateFeeRequest request)
    {
        var result = await shippingProvider.CalculateFeeAsync(request);
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPost("preview-fee")]
    public async Task<IActionResult> PreviewFee([FromBody] PreviewFeeRequest request)
    {
        double totalWeight = 0;
        double maxLength = 0;
        double maxWidth = 0;
        double totalHeight = 0;

        foreach (var item in request.Items)
        {
            // Mặc định: Nặng 500g, Dài 20cm, Rộng 15cm, Cao 5cm cho mỗi sản phẩm
            double itemWeight = 500; 
            double itemLength = 20;
            double itemWidth = 15;
            double itemHeight = 5;

            totalWeight += itemWeight * item.Quantity;
            maxLength = Math.Max(maxLength, itemLength);
            maxWidth = Math.Max(maxWidth, itemWidth);
            totalHeight += itemHeight * item.Quantity;
        }

        if (request.Items.Count == 0)
        {
            totalWeight = 500;
            maxLength = 20;
            maxWidth = 15;
            totalHeight = 5;
        }

        var providerRequest = new CalculateFeeRequest(
            request.SenderWardId,
            request.RecipientWardId,
            totalWeight,
            maxLength,
            maxWidth,
            totalHeight
        );

        var result = await shippingProvider.CalculateFeeAsync(providerRequest);
        if (result.IsSuccess)
        {
            return Ok(new PreviewFeeResponse(
                result.Value,
                totalWeight,
                maxLength,
                maxWidth,
                totalHeight
            ));
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPost("create-waybill")]
    public async Task<IActionResult> CreateWaybill([FromBody] CreateWaybillRequest request)
    {
        var result = await shippingProvider.CreateWaybillAsync(request);
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPost("cancel-waybill/{waybillCode}")]
    public async Task<IActionResult> CancelWaybill(string waybillCode)
    {
        var result = await shippingProvider.CancelWaybillAsync(waybillCode);
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}

public record PreviewFeeItem(Guid VariantId, int Quantity);
public record PreviewFeeRequest(
    long SenderWardId,
    long RecipientWardId,
    System.Collections.Generic.List<PreviewFeeItem> Items
);
public record PreviewFeeResponse(
    decimal ShippingFee,
    double EstimatedWeight,
    double EstimatedLength,
    double EstimatedWidth,
    double EstimatedHeight
);

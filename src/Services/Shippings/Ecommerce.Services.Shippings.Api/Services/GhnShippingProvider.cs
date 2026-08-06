using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Ecommerce.Services.Shippings.Api.Persistances;

namespace Ecommerce.Services.Shippings.Api.Services;

public class GhnShippingProvider(
    HttpClient httpClient,
    IConfiguration configuration,
    ILogger<GhnShippingProvider> logger,
    ShippingDbContext dbContext)
    : IShippingProvider
{
    private readonly string _token = configuration["ShippingProviders:GHN:Token"] ?? string.Empty;
    private readonly string _shopId = configuration["ShippingProviders:GHN:ShopId"] ?? string.Empty;
    private readonly string _baseUrl = configuration["ShippingProviders:GHN:BaseUrl"] ?? "https://dev-online-gateway.ghn.vn";

    public string ProviderName => "GHN";

    public async Task<Result<decimal>> CalculateFeeAsync(CalculateFeeRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            logger.LogInformation(
                "GHN: Calculating shipping fee from WardId {Sender} to WardId {Recipient} using config ShopId {ShopId}",
                request.SenderWardId, request.RecipientWardId, _shopId);

            if (string.IsNullOrEmpty(_shopId))
            {
                return Result<decimal>.Failure("Thiếu mã cửa hàng GHN (ShippingProviders:GHN:ShopId)", EErrorCode.InvalidInput);
            }

            var senderWard = await dbContext.Wards
                .Include(w => w.District)
                .FirstOrDefaultAsync(w => w.Id == request.SenderWardId, cancellationToken);

            if (senderWard == null || senderWard.District?.GhnId == null || string.IsNullOrEmpty(senderWard.GhnCode))
            {
                return Result<decimal>.Failure($"Không tìm thấy thông tin địa chỉ lấy hàng (WardId: {request.SenderWardId})", EErrorCode.NotFound);
            }

            var recipientWard = await dbContext.Wards
                .Include(w => w.District)
                .FirstOrDefaultAsync(w => w.Id == request.RecipientWardId, cancellationToken);

            if (recipientWard == null || recipientWard.District?.GhnId == null || string.IsNullOrEmpty(recipientWard.GhnCode))
            {
                return Result<decimal>.Failure($"Không tìm thấy thông tin địa chỉ nhận hàng (WardId: {request.RecipientWardId})", EErrorCode.NotFound);
            }

            var client = httpClient;
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("Token", _token);
            client.DefaultRequestHeaders.Add("ShopId", _shopId);

            var payload = new
            {
                service_type_id = 2,
                from_district_id = senderWard.District.GhnId.Value,
                from_ward_code = senderWard.GhnCode,
                to_district_id = recipientWard.District.GhnId.Value,
                to_ward_code = recipientWard.GhnCode,
                weight = (int)request.Weight,
                length = (int)request.Length,
                width = (int)request.Width,
                height = (int)request.Height,
                insurance_value = 0
            };

            var response = await client.PostAsJsonAsync($"{_baseUrl}/shiip/public-api/v2/shipping-order/fee", payload, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
                logger.LogError("GHN Fee API error response: {Status} - {Response}", response.StatusCode, errorText);
                return Result<decimal>.Failure($"GHN API Error: {response.StatusCode} - {errorText}", EErrorCode.InternalServerError);
            }

            var jsonResult = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);
            var apiFee = jsonResult?["data"]?["total"]?.GetValue<decimal>();

            if (apiFee.HasValue)
            {
                return Result<decimal>.Success(apiFee.Value);
            }

            return Result<decimal>.Failure("Could not parse fee from GHN API response", EErrorCode.InternalServerError);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GHN: Error calculating shipping fee");
            return Result<decimal>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }

    public async Task<Result<List<Result<decimal>>>> CalculateBatchFeeAsync(List<CalculateFeeRequest> requests, CancellationToken cancellationToken = default)
    {
        try
        {
            logger.LogInformation("GHN: Calculating batch shipping fees for {Count} requests", requests.Count);

            if (string.IsNullOrEmpty(_shopId))
            {
                return Result<List<Result<decimal>>>.Failure("Thiếu mã cửa hàng GHN (ShippingProviders:GHN:ShopId)", EErrorCode.InvalidInput);
            }

            var wardIds = requests
                .SelectMany(r => new[] { r.SenderWardId, r.RecipientWardId })
                .Distinct()
                .ToList();
            var wards = await dbContext.Wards
                .Include(w => w.District)
                .Where(w => wardIds.Contains(w.Id))
                .ToDictionaryAsync(w => w.Id, cancellationToken);

            var tasks = requests.Select(async request =>
            {
                if (!wards.TryGetValue(request.SenderWardId, out var senderWard) || senderWard.District?.GhnId == null || string.IsNullOrEmpty(senderWard.GhnCode))
                {
                    return Result<decimal>.Failure($"Không tìm thấy địa chỉ lấy hàng cho WardId {request.SenderWardId}", EErrorCode.NotFound);
                }

                if (!wards.TryGetValue(request.RecipientWardId, out var recipientWard) || recipientWard.District?.GhnId == null || string.IsNullOrEmpty(recipientWard.GhnCode))
                {
                    return Result<decimal>.Failure($"Không tìm thấy địa chỉ nhận hàng cho WardId {request.RecipientWardId}", EErrorCode.NotFound);
                }

                var client = httpClient;
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("Token", _token);
                client.DefaultRequestHeaders.Add("ShopId", _shopId);

                var payload = new
                {
                    service_type_id = 2,
                    from_district_id = senderWard.District.GhnId.Value,
                    from_ward_code = senderWard.GhnCode,
                    to_district_id = recipientWard.District.GhnId.Value,
                    to_ward_code = recipientWard.GhnCode,
                    weight = (int)request.Weight,
                    length = (int)request.Length,
                    width = (int)request.Width,
                    height = (int)request.Height,
                    insurance_value = 0
                };

                var response = await client.PostAsJsonAsync($"{_baseUrl}/shiip/public-api/v2/shipping-order/fee", payload, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
                    return Result<decimal>.Failure($"GHN API Error: {errorText}", EErrorCode.InternalServerError);
                }

                var jsonResult = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);
                var apiFee = jsonResult?["data"]?["total"]?.GetValue<decimal>();

                if (apiFee.HasValue)
                {
                    return Result<decimal>.Success(apiFee.Value);
                }

                return Result<decimal>.Failure("Could not parse fee from GHN API response", EErrorCode.InternalServerError);
            }).ToList();

            var results = await Task.WhenAll(tasks);
            return Result<List<Result<decimal>>>.Success(results.ToList());
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GHN: Error in CalculateBatchFeeAsync");
            return Result<List<Result<decimal>>>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }

    public async Task<Result<CreateWaybillResponse>> CreateWaybillAsync(CreateWaybillRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            logger.LogInformation("GHN: Creating waybill for SubOrder {SubOrderId}", request.SubOrderId);

            if (string.IsNullOrEmpty(_shopId))
            {
                return Result<CreateWaybillResponse>.Failure("Thiếu mã cửa hàng GHN (ShippingProviders:GHN:ShopId)", EErrorCode.InvalidInput);
            }

            var client = httpClient;
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("Token", _token);
            client.DefaultRequestHeaders.Add("ShopId", _shopId);

            var senderWard = await dbContext.Wards
                .Include(w => w.District)
                .FirstOrDefaultAsync(w => w.Id == request.SenderWardId, cancellationToken);

            if (senderWard == null || senderWard.District?.GhnId == null || string.IsNullOrEmpty(senderWard.GhnCode))
            {
                return Result<CreateWaybillResponse>.Failure($"Không tìm thấy địa chỉ lấy hàng cho WardId {request.SenderWardId}", EErrorCode.NotFound);
            }

            var recipientWard = await dbContext.Wards
                .Include(w => w.District)
                .ThenInclude(d => d.Province)
                .FirstOrDefaultAsync(w => w.Id == request.RecipientWardId, cancellationToken);

            if (recipientWard == null || recipientWard.District?.GhnId == null || string.IsNullOrEmpty(recipientWard.GhnCode))
            {
                return Result<CreateWaybillResponse>.Failure($"Không tìm thấy địa chỉ nhận hàng cho WardId {request.RecipientWardId}", EErrorCode.NotFound);
            }

            var payload = new
            {
                payment_type_id = 2,
                note = "Cho xem hàng, không cho thử",
                required_note = "CHOXEMHANGKHONGTHU",
                from_name = request.SenderName,
                from_phone = request.SenderPhone,
                from_address = request.SenderAddress,
                from_ward_code = senderWard.GhnCode,
                from_district_id = senderWard.District.GhnId.Value,
                to_name = request.RecipientName,
                to_phone = request.RecipientPhone,
                to_address = request.RecipientAddress,
                to_ward_code = recipientWard.GhnCode,
                to_district_id = recipientWard.District.GhnId.Value,
                weight = (int)request.Weight,
                length = (int)request.Length,
                width = (int)request.Width,
                height = (int)request.Height,
                service_type_id = 2,
                cod_amount = (int)request.CodAmount,
                items = request.Items.Select(item => new
                {
                    name = item.Name,
                    code = item.Code,
                    quantity = item.Quantity,
                    price = item.Price
                }).ToArray()
            };

            var response = await client.PostAsJsonAsync($"{_baseUrl}/shiip/public-api/v2/shipping-order/create", payload, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
                logger.LogError("GHN Order Create API error: {Status} - {Response}", response.StatusCode, errorText);
                return Result<CreateWaybillResponse>.Failure($"GHN API Error: {response.StatusCode} - {errorText}", EErrorCode.InternalServerError);
            }

            var jsonResult = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);
            var orderCode = jsonResult?["data"]?["order_code"]?.GetValue<string>();
            var totalFee = jsonResult?["data"]?["total_fee"]?.GetValue<decimal>() ?? 0;
            var expectedDeliveryStr = jsonResult?["data"]?["expected_delivery_time"]?.GetValue<string>();
            
            var deliveryDate = DateTime.UtcNow.AddDays(3);
            if (DateTime.TryParse(expectedDeliveryStr, out var parsedDate))
            {
                deliveryDate = parsedDate.ToUniversalTime();
            }

            if (!string.IsNullOrEmpty(orderCode))
            {
                return Result<CreateWaybillResponse>.Success(new CreateWaybillResponse(orderCode, totalFee, deliveryDate));
            }

            return Result<CreateWaybillResponse>.Failure("Could not parse waybill code from GHN API response", EErrorCode.InternalServerError);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GHN: Error creating waybill");
            return Result<CreateWaybillResponse>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }

    public async Task<Result<bool>> CancelWaybillAsync(string waybillCode, CancellationToken cancellationToken = default)
    {
        try
        {
            logger.LogInformation("GHN: Canceling waybill {WaybillCode}", waybillCode);

            var client = httpClient;
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("Token", _token);

            var payload = new { order_codes = new[] { waybillCode } };
            var response = await client.PostAsJsonAsync($"{_baseUrl}/shiip/public-api/v2/switch-status/cancel", payload, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
                logger.LogError("GHN Order Cancel API error: {Status} - {Response}", response.StatusCode, errorText);
                return Result<bool>.Failure($"GHN API Error: {response.StatusCode} - {errorText}", EErrorCode.InternalServerError);
            }

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GHN: Error canceling waybill {WaybillCode}", waybillCode);
            return Result<bool>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}

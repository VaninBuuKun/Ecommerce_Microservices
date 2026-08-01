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
            logger.LogInformation("GHN: Calculating shipping fee to WardId {Recipient} using GhnShopId {GhnShopId}", request.RecipientWardId, request.GhnShopId);

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
            
            var activeShopId = !string.IsNullOrEmpty(request.GhnShopId) ? request.GhnShopId : _shopId;
            if (string.IsNullOrEmpty(activeShopId))
            {
                return Result<decimal>.Failure("Thiếu mã cửa hàng GHN (GhnShopId)", EErrorCode.InvalidInput);
            }
            client.DefaultRequestHeaders.Add("ShopId", activeShopId);

            var payload = new
            {
                service_type_id = 2, // Default Standard (ecom)
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

            var wardIds = requests.Select(r => r.RecipientWardId).Distinct().ToList();
            var Wards = await dbContext.Wards
                .Include(w => w.District)
                .Where(w => wardIds.Contains(w.Id))
                .ToDictionaryAsync(w => w.Id, cancellationToken);

            var tasks = requests.Select(async request =>
            {
                if (!Wards.TryGetValue(request.RecipientWardId, out var recipientWard) || recipientWard.District?.GhnId == null || string.IsNullOrEmpty(recipientWard.GhnCode))
                {
                    return Result<decimal>.Failure($"Không tìm thấy địa chỉ nhận hàng cho WardId {request.RecipientWardId}", EErrorCode.NotFound);
                }

                var client = httpClient;
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("Token", _token);
                
                var activeShopId = !string.IsNullOrEmpty(request.GhnShopId) ? request.GhnShopId : _shopId;
                if (string.IsNullOrEmpty(activeShopId))
                {
                    return Result<decimal>.Failure("Thiếu mã cửa hàng GHN (GhnShopId)", EErrorCode.InvalidInput);
                }
                client.DefaultRequestHeaders.Add("ShopId", activeShopId);

                var payload = new
                {
                    service_type_id = 2, // Standard
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

            var client = httpClient;
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("Token", _token);
            if (!string.IsNullOrEmpty(request.SenderProviderShopId))
            {
                client.DefaultRequestHeaders.Add("ShopId", request.SenderProviderShopId);
            }
            else if (!string.IsNullOrEmpty(_shopId))
            {
                client.DefaultRequestHeaders.Add("ShopId", _shopId);
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
                payment_type_id = 2, // Người mua trả phí ship
                note = "Cho xem hàng, không cho thử",
                required_note = "CHOXEMHANGKHONGTHU",
                to_name = request.RecipientName,
                to_phone = request.RecipientPhone,
                to_address = request.RecipientAddress,
                to_ward_code = recipientWard.GhnCode,
                to_district_id = recipientWard.District.GhnId.Value,
                weight = (int)request.Weight,
                length = (int)request.Length,
                width = (int)request.Width,
                height = (int)request.Height,
                service_type_id = 2, // Standard
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

    public async Task<Result<int>> RegisterShopAsync(long wardId, string name, string phone, string address, CancellationToken cancellationToken = default)
    {
        try
        {
            logger.LogInformation("GHN: Registering shop '{Name}' with phone {Phone} at Ward {WardId}", name, phone, wardId);
            
            var ward = await dbContext.Wards.Include(ward => ward.District).FirstOrDefaultAsync(w => w.Id == wardId, cancellationToken: cancellationToken);
            if (ward == null || ward.District?.GhnId == null || string.IsNullOrEmpty(ward.GhnCode))
            {
                return Result<int>.Failure($"Không tìm thấy thông tin địa chỉ cửa hàng (WardId: {wardId})", EErrorCode.NotFound);
            }
            
            var client = httpClient;
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("Token", _token);

            var payload = new
            {
                district_id = ward.District.GhnId.Value,
                ward_code = ward.GhnCode,
                name = name,
                phone = phone,
                address = address
            };

            var response = await client.PostAsJsonAsync($"{_baseUrl}/shiip/public-api/v2/shop/register", payload, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
                logger.LogError("GHN Shop Register API error: {Status} - {Response}", response.StatusCode, errorText);
                return Result<int>.Failure($"GHN API Error: {response.StatusCode} - {errorText}", EErrorCode.InternalServerError);
            }

            var jsonResult = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);
            var shopId = jsonResult?["data"]?["shop_id"]?.GetValue<int>();

            if (shopId.HasValue)
            {
                return Result<int>.Success(shopId.Value);
            }

            return Result<int>.Failure("Could not parse shop_id from GHN API response", EErrorCode.InternalServerError);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GHN: Error registering shop '{Name}'", name);
            return Result<int>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}

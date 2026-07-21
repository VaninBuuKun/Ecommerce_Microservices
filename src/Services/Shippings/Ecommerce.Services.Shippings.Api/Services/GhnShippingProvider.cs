using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Ecommerce.Services.Shippings.Api.Persistances;

namespace Ecommerce.Services.Shippings.Api.Services;

public class GhnShippingProvider : IShippingProvider
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GhnShippingProvider> _logger;
    private readonly string _token;
    private readonly string _shopId;
    private readonly string _baseUrl;
    private readonly ShippingDbContext dbContext;

    public string ProviderName => "GHN";

    public GhnShippingProvider(HttpClient httpClient, IConfiguration configuration, ILogger<GhnShippingProvider> logger, ShippingDbContext dbContext)
    {
        _httpClient = httpClient;
        _logger = logger;
        this.dbContext = dbContext;
        _token = configuration["ShippingProviders:GHN:Token"] ?? "MOCK_TOKEN";
        _shopId = configuration["ShippingProviders:GHN:ShopId"] ?? "MOCK_SHOP_ID";
        _baseUrl = configuration["ShippingProviders:GHN:BaseUrl"] ?? "https://dev-online-gateway.ghn.vn";
    }

    public async Task<Result<decimal>> CalculateFeeAsync(CalculateFeeRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("GHN: Calculating shipping fee from WardId {Sender} to WardId {Recipient}", request.SenderWardId, request.RecipientWardId);
            
            // Nếu chưa thiết lập API Token thực tế, sử dụng phương thức tính cước phí giả lập
            if (string.IsNullOrEmpty(_token) || _token == "MOCK_TOKEN" || _token == "MOCK_GHN_SANDBOX_TOKEN")
            {
                var baseFee = 20000m;
                var weightKg = request.Weight / 1000.0;
                var additionalFee = (decimal)(Math.Max(0, weightKg - 1.0) * 5000);
                var totalFee = baseFee + additionalFee;
                return Result<decimal>.Success(totalFee);
            }

            var client = _httpClient;
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("Token", _token);
            client.DefaultRequestHeaders.Add("ShopId", _shopId);

            // Gán ID mặc định của GHN nếu không tìm thấy trong DB
            int fromDistrictId = 1442; // Quận 1, HCM
            int toDistrictId = 1482;   // Ba Đình, Hà Nội
            string toWardCode = "20002"; // Bến Nghé
            string fromWardCode = "20002";
            var senderWard = await dbContext.Wards
                .Include(w => w.District)
                .FirstOrDefaultAsync(w => w.Id == request.SenderWardId, cancellationToken);
            
            if (senderWard != null)
            {
                if (!string.IsNullOrEmpty(senderWard.GhnCode))
                {
                    fromWardCode = senderWard.GhnCode;
                }
                if (senderWard.District?.GhnId != null)
                {
                    fromDistrictId = senderWard.District.GhnId.Value;
                }
            }

            var recipientWard = await dbContext.Wards
                .Include(w => w.District)
                .FirstOrDefaultAsync(w => w.Id == request.RecipientWardId, cancellationToken);
            if (recipientWard != null)
            {
                if (!string.IsNullOrEmpty(recipientWard.GhnCode))
                {
                    toWardCode = recipientWard.GhnCode;
                }
                if (recipientWard.District?.GhnId != null)
                {
                    toDistrictId = recipientWard.District.GhnId.Value;
                }
            }

            var payload = new
            {
                service_type_id = 2, // Dịch vụ chuẩn (Standard)
                from_district_id = fromDistrictId,
                from_ward_code = fromWardCode,
                to_district_id = toDistrictId,
                to_ward_code = toWardCode,
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
                _logger.LogError("GHN Fee API error response: {Status} - {Response}", response.StatusCode, errorText);
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
            _logger.LogError(ex, "GHN: Error calculating shipping fee");
            return Result<decimal>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }

    public async Task<Result<CreateWaybillResponse>> CreateWaybillAsync(CreateWaybillRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("GHN: Creating waybill for SubOrder {SubOrderId}", request.SubOrderId);

            // Nếu chưa thiết lập API Token thực tế, sử dụng phương thức giả lập
            if (string.IsNullOrEmpty(_token) || _token == "MOCK_TOKEN" || _token == "MOCK_GHN_SANDBOX_TOKEN")
            {
                var waybillCode = "GHN" + Guid.NewGuid().ToString("N")[..10].ToUpper();
                var feeResult = await CalculateFeeAsync(new CalculateFeeRequest(
                    request.SenderWardId, request.RecipientWardId, request.Weight, request.Length, request.Width, request.Height
                ), cancellationToken);
                var fee = feeResult.IsSuccess ? feeResult.Value : 35000m;
                var expectedDeliveryDate = DateTime.UtcNow.AddDays(3);
                return Result<CreateWaybillResponse>.Success(new CreateWaybillResponse(waybillCode, fee, expectedDeliveryDate));
            }

            var client = _httpClient;
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("Token", _token);
            if (!string.IsNullOrEmpty(_shopId) && _shopId != "MOCK_SHOP_ID")
            {
                client.DefaultRequestHeaders.Add("ShopId", _shopId);
            }

            // Lấy thông tin từ DB để truyền cho GHN
            int toDistrictId = 1482;   // Ba Đình, Hà Nội
            string toWardCode = "20002"; // Bến Nghé
            
            var senderWard = await dbContext.Wards
                .Include(w => w.District)
                .ThenInclude(d => d.Province)
                .FirstOrDefaultAsync(w => w.Id == request.SenderWardId, cancellationToken);

            var recipientWard = await dbContext.Wards
                .Include(w => w.District)
                .ThenInclude(d => d.Province)
                .FirstOrDefaultAsync(w => w.Id == request.RecipientWardId, cancellationToken);

            if (recipientWard != null)
            {
                if (!string.IsNullOrEmpty(recipientWard.GhnCode))
                {
                    toWardCode = recipientWard.GhnCode;
                }
                if (recipientWard.District?.GhnId != null)
                {
                    toDistrictId = recipientWard.District.GhnId.Value;
                }
            }

            var payload = new
            {
                payment_type_id = 2, // Người mua trả phí ship
                note = "Cho xem hàng, không cho thử",
                required_note = "CHOXEMHANGKHONGTHU",
                from_name = request.SenderName,
                from_phone = request.SenderPhone,
                from_address = request.SenderAddress,
                from_ward_name = senderWard?.DisplayName ?? "Phường Bến Nghé",
                from_district_name = senderWard?.District?.DisplayName ?? "Quận 1",
                from_province_name = senderWard?.District?.Province?.DisplayName ?? "Hồ Chí Minh",
                to_name = request.RecipientName,
                to_phone = request.RecipientPhone,
                to_address = request.RecipientAddress,
                to_ward_code = toWardCode,
                to_district_id = toDistrictId,
                weight = (int)request.Weight,
                length = (int)request.Length,
                width = (int)request.Width,
                height = (int)request.Height,
                service_type_id = 2, // Standard
                cod_amount = (int)request.CodAmount,
                items = new[]
                {
                    new
                    {
                        name = "Sản phẩm đơn hàng",
                        code = "SP",
                        quantity = 1,
                        price = (int)request.CodAmount,
                        weight = (int)request.Weight
                    }
                }
            };

            var response = await client.PostAsJsonAsync($"{_baseUrl}/shiip/public-api/v2/shipping-order/create", payload, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("GHN Order Create API error: {Status} - {Response}", response.StatusCode, errorText);
                return Result<CreateWaybillResponse>.Failure($"GHN API Error: {response.StatusCode} - {errorText}", EErrorCode.InternalServerError);
            }

            var jsonResult = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);
            var orderCode = jsonResult?["data"]?["order_code"]?.GetValue<string>();
            var totalFee = jsonResult?["data"]?["total_fee"]?.GetValue<decimal>() ?? 0;
            var expectedDeliveryStr = jsonResult?["data"]?["expected_delivery_time"]?.GetValue<string>();
            
            var deliveryDate = DateTime.UtcNow.AddDays(3);
            if (DateTime.TryParse(expectedDeliveryStr, out var parsedDate))
            {
                deliveryDate = parsedDate;
            }

            if (!string.IsNullOrEmpty(orderCode))
            {
                return Result<CreateWaybillResponse>.Success(new CreateWaybillResponse(orderCode, totalFee, deliveryDate));
            }

            return Result<CreateWaybillResponse>.Failure("Could not parse waybill code from GHN API response", EErrorCode.InternalServerError);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GHN: Error creating waybill");
            return Result<CreateWaybillResponse>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }

    public async Task<Result<bool>> CancelWaybillAsync(string waybillCode, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("GHN: Canceling waybill {WaybillCode}", waybillCode);
            
            if (string.IsNullOrEmpty(_token) || _token == "MOCK_TOKEN" || _token == "MOCK_GHN_SANDBOX_TOKEN")
            {
                await Task.Delay(100, cancellationToken);
                return Result<bool>.Success(true);
            }

            var client = _httpClient;
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("Token", _token);

            var payload = new { order_codes = new[] { waybillCode } };
            var response = await client.PostAsJsonAsync($"{_baseUrl}/shiip/public-api/v2/switch-status/cancel", payload, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("GHN Order Cancel API error: {Status} - {Response}", response.StatusCode, errorText);
                return Result<bool>.Failure($"GHN API Error: {response.StatusCode} - {errorText}", EErrorCode.InternalServerError);
            }

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GHN: Error canceling waybill {WaybillCode}", waybillCode);
            return Result<bool>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}

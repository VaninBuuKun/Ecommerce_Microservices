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

public class GhtkShippingProvider : IShippingProvider
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GhtkShippingProvider> _logger;
    private readonly string _token;
    private readonly string _baseUrl;
    private readonly ShippingDbContext dbContext;

    public string ProviderName => "GHTK";

    public GhtkShippingProvider(HttpClient httpClient, IConfiguration configuration, ILogger<GhtkShippingProvider> logger, ShippingDbContext dbContext)
    {
        _httpClient = httpClient;
        _logger = logger;
        this.dbContext = dbContext;
        _token = configuration["ShippingProviders:GHTK:Token"] ?? "MOCK_TOKEN";
        _baseUrl = configuration["ShippingProviders:GHTK:BaseUrl"] ?? "https://services.giaohangtietkiem.vn";
    }

    public async Task<Result<decimal>> CalculateFeeAsync(CalculateFeeRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("GHTK: Calculating shipping fee from WardId {Sender} to WardId {Recipient}", request.SenderWardId, request.RecipientWardId);
            
            if (string.IsNullOrEmpty(_token) || _token == "MOCK_TOKEN")
            {
                var baseFee = 18000m;
                var weightKg = request.Weight / 1000.0;
                var additionalFee = (decimal)(Math.Max(0, weightKg - 1.0) * 4500);
                var totalFee = baseFee + additionalFee;
                return Result<decimal>.Success(totalFee);
            }

            var senderWard = await dbContext.Wards
                .Include(w => w.District)
                .ThenInclude(d => d.Province)
                .FirstOrDefaultAsync(w => w.Id == request.SenderWardId, cancellationToken);

            var recipientWard = await dbContext.Wards
                .Include(w => w.District)
                .ThenInclude(d => d.Province)
                .FirstOrDefaultAsync(w => w.Id == request.RecipientWardId, cancellationToken);

            if (senderWard == null || recipientWard == null)
            {
                return Result<decimal>.Failure("Không tìm thấy thông tin phường xã người gửi hoặc nhận", EErrorCode.InvalidInput);
            }

            var pickProvince = senderWard.District.Province.DisplayName;
            var pickDistrict = senderWard.District.DisplayName;
            
            var province = recipientWard.District.Province.DisplayName;
            var district = recipientWard.District.DisplayName;
            var ward = recipientWard.DisplayName;

            var client = _httpClient;
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("Token", _token);

            // GHTK sử dụng GET với query parameters
            var query = $"?pick_province={Uri.EscapeDataString(pickProvince)}" +
                        $"&pick_district={Uri.EscapeDataString(pickDistrict)}" +
                        $"&province={Uri.EscapeDataString(province)}" +
                        $"&district={Uri.EscapeDataString(district)}" +
                        $"&ward={Uri.EscapeDataString(ward)}" +
                        $"&weight={(int)request.Weight}" +
                        $"&deliver_option=none";

            var response = await client.GetAsync($"{_baseUrl}/services/shipment/fee{query}", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("GHTK Fee API error response: {Status} - {Response}", response.StatusCode, errorText);
                return Result<decimal>.Failure($"GHTK API Error: {response.StatusCode} - {errorText}", EErrorCode.InternalServerError);
            }

            var jsonResult = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);
            var success = jsonResult?["success"]?.GetValue<bool>() ?? false;
            
            if (success)
            {
                var apiFee = jsonResult?["fee"]?["fee"]?.GetValue<decimal>();
                if (apiFee.HasValue)
                {
                    return Result<decimal>.Success(apiFee.Value);
                }
            }

            var message = jsonResult?["message"]?.GetValue<string>() ?? "Không thể tính phí vận chuyển từ GHTK";
            return Result<decimal>.Failure(message, EErrorCode.InternalServerError);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GHTK: Error calculating shipping fee");
            return Result<decimal>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }

    public async Task<Result<CreateWaybillResponse>> CreateWaybillAsync(CreateWaybillRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("GHTK: Creating waybill for SubOrder {SubOrderId}", request.SubOrderId);

            if (string.IsNullOrEmpty(_token) || _token == "MOCK_TOKEN")
            {
                var waybillCode = "GHTK" + Guid.NewGuid().ToString("N")[..10].ToUpper();
                var feeResult = await CalculateFeeAsync(new CalculateFeeRequest(
                    request.SenderWardId, request.RecipientWardId, request.Weight, request.Length, request.Width, request.Height
                ), cancellationToken);
                var fee = feeResult.IsSuccess ? feeResult.Value : 30000m;
                var expectedDeliveryDate = DateTime.UtcNow.AddDays(3);
                return Result<CreateWaybillResponse>.Success(new CreateWaybillResponse(waybillCode, fee, expectedDeliveryDate));
            }

            var senderWard = await dbContext.Wards
                .Include(w => w.District)
                .ThenInclude(d => d.Province)
                .FirstOrDefaultAsync(w => w.Id == request.SenderWardId, cancellationToken);

            var recipientWard = await dbContext.Wards
                .Include(w => w.District)
                .ThenInclude(d => d.Province)
                .FirstOrDefaultAsync(w => w.Id == request.RecipientWardId, cancellationToken);

            if (senderWard == null || recipientWard == null)
            {
                return Result<CreateWaybillResponse>.Failure("Không tìm thấy thông tin phường xã người gửi hoặc nhận", EErrorCode.InvalidInput);
            }

            var client = _httpClient;
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("Token", _token);

            var payload = new
            {
                products = new[]
                {
                    new
                    {
                        name = "Sản phẩm đơn hàng",
                        weight = request.Weight / 1000.0, // GHTK yêu cầu kg cho sản phẩm đơn lẻ hoặc gram tùy phiên bản. Payload chuẩn thường quy đổi
                        quantity = 1
                    }
                },
                order = new
                {
                    id = request.SubOrderId.ToString(),
                    pick_name = request.SenderName,
                    pick_money = (int)request.CodAmount,
                    pick_phone = request.SenderPhone,
                    pick_address = request.SenderAddress,
                    pick_province = senderWard.District.Province.DisplayName,
                    pick_district = senderWard.District.DisplayName,
                    pick_ward = senderWard.DisplayName,
                    
                    name = request.RecipientName,
                    phone = request.RecipientPhone,
                    address = request.RecipientAddress,
                    province = recipientWard.District.Province.DisplayName,
                    district = recipientWard.District.DisplayName,
                    ward = recipientWard.DisplayName,
                    
                    value = (int)request.CodAmount,
                    transport = "road", // Mặc định đường bộ
                    deliver_option = "none"
                }
            };

            var response = await client.PostAsJsonAsync($"{_baseUrl}/services/shipment/order", payload, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("GHTK Order Create API error: {Status} - {Response}", response.StatusCode, errorText);
                return Result<CreateWaybillResponse>.Failure($"GHTK API Error: {response.StatusCode} - {errorText}", EErrorCode.InternalServerError);
            }

            var jsonResult = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);
            var success = jsonResult?["success"]?.GetValue<bool>() ?? false;

            if (success)
            {
                var orderNode = jsonResult?["order"];
                var waybillCode = orderNode?["label"]?.GetValue<string>();
                var fee = orderNode?["fee"]?.GetValue<decimal>() ?? 0;
                var expectedDeliveryDate = DateTime.UtcNow.AddDays(3); // GHTK không trả về trực tiếp ngày giao dự kiến dạng rõ ràng trong json đơn giản

                if (!string.IsNullOrEmpty(waybillCode))
                {
                    return Result<CreateWaybillResponse>.Success(new CreateWaybillResponse(waybillCode, fee, expectedDeliveryDate));
                }
            }

            var message = jsonResult?["message"]?.GetValue<string>() ?? "Không thể tạo vận đơn tại GHTK";
            return Result<CreateWaybillResponse>.Failure(message, EErrorCode.InternalServerError);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GHTK: Error creating waybill");
            return Result<CreateWaybillResponse>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }

    public async Task<Result<bool>> CancelWaybillAsync(string waybillCode, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("GHTK: Canceling waybill {WaybillCode}", waybillCode);

            if (string.IsNullOrEmpty(_token) || _token == "MOCK_TOKEN")
            {
                return Result<bool>.Success(true);
            }

            var client = _httpClient;
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("Token", _token);

            var response = await client.PostAsync($"{_baseUrl}/services/shipment/cancel/{waybillCode}", null, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("GHTK Order Cancel API error: {Status} - {Response}", response.StatusCode, errorText);
                return Result<bool>.Failure($"GHTK API Error: {response.StatusCode} - {errorText}", EErrorCode.InternalServerError);
            }

            var jsonResult = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);
            var success = jsonResult?["success"]?.GetValue<bool>() ?? false;

            if (success)
            {
                return Result<bool>.Success(true);
            }

            var message = jsonResult?["message"]?.GetValue<string>() ?? "Không thể hủy vận đơn tại GHTK";
            return Result<bool>.Failure(message, EErrorCode.InternalServerError);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GHTK: Error canceling waybill");
            return Result<bool>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}

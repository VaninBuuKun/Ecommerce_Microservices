using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using Ecommerce.Services.Payments.Api.Models.Settings;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Ecommerce.Services.Payments.Api.Services;

public class MomoPaymentGateway(IOptions<MomoSettings> settings, IHttpClientFactory httpClientFactory)
    : IPaymentGateway
{
    private readonly MomoSettings _settings = settings.Value;
    private readonly HttpClient _httpClient = httpClientFactory.CreateClient();

    public string GatewayName => "momo";
    public async Task<CreatePaymentResult> CreatePaymentAsync(CreatePaymentInput input, CancellationToken ct = default)
    {
        var requestId = Guid.NewGuid().ToString();
        var orderId = input.TargetId.ToString("N");
        var amountLong = (long)input.Amount;
        var amountStr = amountLong.ToString();
        var ipnUrl = _settings.IpnUrl;
        var redirectUrl = _settings.RedirectUrl;
        var extraData = "";
        
        
        var rawSignature = $"accessKey={_settings.AccessKey}" +
                           $"&amount={amountStr}" +
                           $"&extraData={extraData}" +
                           $"&ipnUrl={ipnUrl}" +
                           $"&orderId={orderId}" +
                           $"&orderInfo=Thanh toán đơn hàng" +
                           $"&partnerCode={_settings.PartnerCode}" +
                           $"&redirectUrl={redirectUrl}" +
                           $"&requestId={requestId}" +
                           $"&requestType=payWithMethod"; //Hiển thị đầy đủ phương thức của Momo,Có các type khác captureWallet, payWithAtm
        

        var signature = HmacSha256(_settings.SecretKey, rawSignature);
        

        //Mục tiêu singature là verify serectkey để chống sửa đổi, xem cái yêu cầu có hợp lệ hay không
        //dùng thực toán với rawdate, sao cho ra cùng signature.
        var requestBody = new
        {
            partnerCode = _settings.PartnerCode,
            accessKey = _settings.AccessKey,
            requestId,
            amount = amountLong,
            orderId,
            orderInfo = "Thanh toán đơn hàng",
            redirectUrl = redirectUrl,
            ipnUrl = ipnUrl,
            requestType = "payWithMethod",
            extraData = extraData,
            lang = "vi",
            signature
        };
        

        var jsonContent = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json"
        );
        var response = await _httpClient.PostAsync($"{_settings.BaseUrl}/create", jsonContent, ct);
        var responseBody = await response.Content.ReadAsStringAsync(ct);
        var momoResponse = JsonSerializer.Deserialize<MomoCreateResponse>(responseBody, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
        if (momoResponse?.ResultCode == 0)
        {
            return new CreatePaymentResult()
            {
                Success = true,
                ErrorMessage = null,
                GatewayTransactionId = momoResponse.OrderId,
                PaymentUrl = momoResponse.PayUrl
            };
        }

        return new CreatePaymentResult()
        {
            Success = false,
            ErrorMessage = momoResponse?.Message ?? "Unknown error"
        };
    }
    
    public Task<bool> VerifyCallbackAsync(Dictionary<string, string> callbackParams)
    {
        // ===== Xác thực chữ ký IPN từ Momo =====
        if (!callbackParams.TryGetValue("signature", out var receivedSignature))
            return Task.FromResult(false);
        var rawSignature = $"accessKey={_settings.AccessKey}" +
                           $"&amount={callbackParams["amount"]}" +
                           $"&extraData={callbackParams.GetValueOrDefault("extraData", "")}" +
                           $"&message={callbackParams["message"]}" +
                           $"&orderId={callbackParams["orderId"]}" +
                           $"&orderInfo={callbackParams["orderInfo"]}" +
                           $"&orderType={callbackParams["orderType"]}" +
                           $"&partnerCode={_settings.PartnerCode}" +
                           $"&payType={callbackParams["payType"]}" +
                           $"&requestId={callbackParams["requestId"]}" +
                           $"&responseTime={callbackParams["responseTime"]}" +
                           $"&resultCode={callbackParams["resultCode"]}" +
                           $"&transId={callbackParams["transId"]}";
        var computedSignature = HmacSha256(_settings.SecretKey, rawSignature);
        return Task.FromResult(
            string.Equals(computedSignature, receivedSignature, StringComparison.InvariantCultureIgnoreCase)
        );
    }
    private static string HmacSha256(string key, string data)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }
}

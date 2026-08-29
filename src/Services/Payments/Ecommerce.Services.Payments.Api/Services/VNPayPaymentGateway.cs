using System.Net;
using System.Security.Cryptography;
using System.Text;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Entities;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using Ecommerce.Services.Payments.Api.Models.Settings;
using Microsoft.Extensions.Options;

namespace Ecommerce.Services.Payments.Api.Services;

public class VNPayPaymentGateway(IOptions<VNPaySettings> options, IHttpContextAccessor accessor) : IPaymentGateway
{
    private readonly VNPaySettings settings = options.Value;
    private HttpContext HttpContext => accessor.HttpContext;
    public string GatewayName => "vnpay";


    public Task<CreatePaymentResult> CreatePaymentAsync(Payment payment, CancellationToken ct = default)
    {
        var createDate = DateTime.Now.ToString("yyyyMMddHHmmss");
        var txnRef = payment.OrderId.ToString("N");
        var expireDate = DateTime.Now.AddMinutes(15).ToString("yyyyMMddHHmmss");
        var clientIp = HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        if (clientIp == "::1") clientIp = "127.0.0.1";
        var vnpParams = new SortedDictionary<string, string>
        {
            { "vnp_Version", "2.1.0" },
            { "vnp_Command", "pay" },
            { "vnp_TmnCode", settings.TmnCode },
            { "vnp_Amount", ((long)(payment.Amount * 100)).ToString() },
            { "vnp_CreateDate", createDate },
            { "vnp_CurrCode", "VND" },
            { "vnp_IpAddr", clientIp},
            { "vnp_Locale", "vn" },
            { "vnp_OrderInfo", $"Thanh toan don hang {payment.OrderId}" },
            { "vnp_OrderType", "other" },
            { "vnp_ReturnUrl", settings.RedirectUrl },
            { "vnp_TxnRef", txnRef },
            { "vnp_ExpireDate", expireDate }
        };
        // Tạo query string với tham số đã được URLEncode theo chuẩn VNPay
        var queryString = string.Join("&",
            vnpParams.Select(kvp => $"{kvp.Key}={VnPayEncode(kvp.Value)}"));
        
        // Ký trực tiếp lên chuỗi query string đã được ENCODE
        var secureHash = HmacSha512(settings.HashSecret, queryString);
        var paymentUrl = $"{settings.BaseUrl}?{queryString}&vnp_SecureHash={secureHash}";
        return Task.FromResult(new CreatePaymentResult()
        {
            Success = true,
            PaymentUrl = paymentUrl
        });
    }
    public Task<bool> VerifyCallbackAsync(Dictionary<string, string> callbackParams)
    {
        if (!callbackParams.TryGetValue("vnp_SecureHash", out var receivedHash))
            return Task.FromResult(false);
        
        
        var filteredParams = callbackParams
            .Where(kvp => kvp.Key != "vnp_SecureHash" && kvp.Key != "vnp_SecureHashType")
            .OrderBy(kvp => kvp.Key);
        // Khi verify cũng phải URLEncode các value
        var signData = string.Join("&", 
            filteredParams.Select(kvp => $"{kvp.Key}={VnPayEncode(kvp.Value)}"));
            
        var computedHash = HmacSha512(settings.HashSecret, signData);
        
        return Task.FromResult(
            string.Equals(computedHash, receivedHash, StringComparison.InvariantCultureIgnoreCase)
        );
    }
    // Thêm 2 hàm Helper chuẩn hóa chữ ký và encode của VNPay:
    private static string VnPayEncode(string input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        return Uri.EscapeDataString(input).Replace("%20", "+");
    }
    private static string HmacSha512(string key, string data)
    {
        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return BitConverter.ToString(hash).Replace("-", "").ToLower();  
    }

}

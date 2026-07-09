using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Entities;
using Ecommerce.Services.Payments.Api.Models.Interfaces;

namespace Ecommerce.Services.Payments.Api.Services;

public class CODPaymentGateway : IPaymentGateway
{
    public string GatewayName => "cod";

    public Task<CreatePaymentResult> CreatePaymentAsync(Payment payment, CancellationToken ct = default)
    {
        // COD (Cash on Delivery) không cần gọi API bên thứ ba. Trả về thành công luôn.
        return Task.FromResult(new CreatePaymentResult
        {
            Success = true
        });
    }

    public Task<bool> VerifyCallbackAsync(Dictionary<string, string> callbackParams)
    {
        return Task.FromResult(true);
    }
}

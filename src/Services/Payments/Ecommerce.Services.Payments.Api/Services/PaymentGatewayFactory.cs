using Ecommerce.Services.Payments.Api.Models.Interfaces;

namespace Ecommerce.Services.Payments.Api.Services;

public class PaymentGatewayFactory(IEnumerable<IPaymentGateway> gateways)
{
    public IPaymentGateway? GetPaymentGateway(string gatewayName)
    {
        var gateway = gateways.FirstOrDefault(g => g.GatewayName.Equals(gatewayName, StringComparison.OrdinalIgnoreCase));

        return gateway;
    }
}

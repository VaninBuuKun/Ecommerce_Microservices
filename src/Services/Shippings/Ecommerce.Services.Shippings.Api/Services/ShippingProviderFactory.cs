using System;
using System.Collections.Generic;
using System.Linq;

namespace Ecommerce.Services.Shippings.Api.Services;

public interface IShippingProviderFactory
{
    IShippingProvider GetProvider(string providerName);
}

public class ShippingProviderFactory(IEnumerable<IShippingProvider> providers) : IShippingProviderFactory
{
    public IShippingProvider GetProvider(string providerName)
    {
        var provider = providers.FirstOrDefault(p => p.ProviderName.Equals(providerName, StringComparison.OrdinalIgnoreCase));
        if (provider == null)
        {
            // Fallback sang GHN mặc định nếu không khớp
            return providers.FirstOrDefault(p => p.ProviderName == "GHN") 
                   ?? throw new ArgumentException($"Shipping provider '{providerName}' is not supported.");
        }
        return provider;
    }
}

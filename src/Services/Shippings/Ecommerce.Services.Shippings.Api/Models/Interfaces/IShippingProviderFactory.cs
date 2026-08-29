namespace Ecommerce.Services.Shippings.Api.Models.Interfaces;

public interface IShippingProviderFactory
{
    IShippingProvider GetProvider(string providerName = "GHN");
}

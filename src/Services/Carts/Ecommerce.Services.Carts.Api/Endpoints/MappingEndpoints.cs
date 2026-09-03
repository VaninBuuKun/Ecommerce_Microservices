namespace Ecommerce.Services.Carts.Api.Endpoints;

public static class MappingEndpoints
{
    public static IEndpointRouteBuilder AddMappingEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.AddCartEndpoints();

        return endpoints;
    }
}

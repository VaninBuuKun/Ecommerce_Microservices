using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Catalog.Application.Features.Search.Commands.SaveSearchKeyword;

public record SaveSearchKeywordCommand(
    string Keyword, 
    long? UserId = null, 
    string? ClientIp = null
) : ICommand<bool>;

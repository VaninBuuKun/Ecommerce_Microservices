using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Catalog.Application.Features.Search.Commands.ClearSearchHistory;

public record ClearSearchHistoryCommand(long UserId) : ICommand<bool>;

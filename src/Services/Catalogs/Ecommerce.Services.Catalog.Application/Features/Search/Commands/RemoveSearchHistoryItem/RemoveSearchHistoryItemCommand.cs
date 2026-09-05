using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Catalog.Application.Features.Search.Commands.RemoveSearchHistoryItem;

public record RemoveSearchHistoryItemCommand(long UserId, string Keyword) : ICommand<bool>;

using System.Collections.Generic;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Catalog.Application.Features.Search.Commands.SyncSearchHistory;

public record SyncSearchHistoryCommand(
    long UserId, 
    List<string> Keywords
) : ICommand<List<string>>;

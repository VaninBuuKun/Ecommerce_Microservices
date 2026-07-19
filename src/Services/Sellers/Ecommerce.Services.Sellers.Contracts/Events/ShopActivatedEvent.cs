using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Sellers.Contracts.Events;

public class ShopActivatedEvent(long ShopId, long OwnerUserId, string ShopName) : IIntegrationEvent;
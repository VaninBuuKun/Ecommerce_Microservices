using System;

namespace Ecommerce.Services.Catalog.Contracts.Events;

public record ProductCreatedEvent(
    Guid ProductId,
    long ShopId,
    string Name,
    string? ThumbnailUrl,
    DateTime CreatedAt
);

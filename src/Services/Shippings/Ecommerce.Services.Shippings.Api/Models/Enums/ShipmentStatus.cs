namespace Ecommerce.Services.Shippings.Api.Models.Enums;

public enum ShipmentStatus
{
    Created = 1,
    ReadyToPick = 2,
    Picking = 3,
    InTransit = 4,
    Delivered = 5,
    Cancelled = 6,
    Returned = 7,
    Failed = 8
}

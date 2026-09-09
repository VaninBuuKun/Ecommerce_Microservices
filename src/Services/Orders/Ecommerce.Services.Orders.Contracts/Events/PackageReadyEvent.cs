using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class PackageReadyEvent : IIntegrationEvent
{
    public long SubOrderId { get; set; }
    // Thông tin đóng gói thực tế từ Seller
    public int Weight { get; set; }   // grams
    public int Height { get; set; }   // cm
    public int Width { get; set; }    // cm
    public int Length { get; set; }   // cm
}

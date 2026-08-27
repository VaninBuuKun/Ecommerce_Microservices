using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class PackageReadyEvent : IIntegrationEvent
{
    public long SubOrderId { get; set; }
    // Thông tin đóng gói thực tế từ Seller
    public double Weight { get; set; }   // grams
    public double Height { get; set; }   // cm
    public double Width { get; set; }    // cm
    public double Length { get; set; }   // cm
}

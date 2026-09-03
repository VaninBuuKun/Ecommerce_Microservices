using System;
using System.Text.Json.Serialization;
using BuildingBlocks.Shared.Converters;
using BuildingBlocks.Shared.Domains;
using Ecommerce.Services.Shippings.Api.Models.Enums;

namespace Ecommerce.Services.Shippings.Api.Models.Entities;

public class Shipment : EntityTrackingBase<Guid>
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long SubOrderId { get; set; }
    public long OrderId { get; set; }
    public long CustomerId { get; set; }
    public string? WaybillCode { get; set; }
    public string CarrierName { get; set; } = "GHN";
    public decimal ShippingFee { get; set; }
    public ShipmentStatus Status { get; set; } = ShipmentStatus.Created;

    
    public string SenderAddress { get; set; } = string.Empty;
    public string RecipientAddress { get; set; } = string.Empty;
    
    public double Weight { get; set; } // in grams
    public double Height { get; set; } // in cm
    public double Width { get; set; }  // in cm
    public double Length { get; set; } // in cm

    public string RecipientName { get; set; } = string.Empty;
    public string RecipientPhone { get; set; } = string.Empty;
    public long RecipientWardId { get; set; }
    public long ShopId { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public bool IsRefund { get; set; }
    public string? FailureReason { get; set; }
    public string? TrackingLogs { get; set; } // JSON format of delivery stages
}

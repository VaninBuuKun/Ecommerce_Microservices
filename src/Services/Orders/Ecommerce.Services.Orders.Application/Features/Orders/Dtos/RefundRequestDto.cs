using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using BuildingBlocks.Shared.Converters;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

public class RefundRequestDto
{
    public long Id { get; set; }
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long SubOrderId { get; set; }
    public long CustomerId { get; set; }
    public long ShopId { get; set; }
    public decimal RequestedAmount { get; set; }
    public decimal RefundAmount => RequestedAmount; // Backward compatibility
    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ProofImagesJson { get; set; }
    public List<string> Medias { get; set; } = new();
    public int AttemptCount { get; set; }
    public string? SellerRejectReason { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset ExpirationDate { get; set; }
}

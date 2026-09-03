using System;
using System.Text.Json.Serialization;
using BuildingBlocks.Shared.Converters;
using Ecommerce.Services.Orders.Domain.Enums;

namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;

public class VoucherDto
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public VoucherScope Scope { get; set; }
    public decimal MinOrderValue { get; set; }
    public long MaxUsageCount { get; set; }
    public long UsageCount { get; set; }
    public long MaxUsagePerUser { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    
    [JsonConverter(typeof(NullableLongToStringJsonConverter))]
    public long? ShopId { get; set; }
    
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset EndDate { get; set; }
    public bool IsActive { get; set; }
    
    [JsonConverter(typeof(NullableLongToStringJsonConverter))]
    public long? CreatedByUserId { get; set; }
}
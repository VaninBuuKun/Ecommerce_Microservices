using System;

namespace Ecommerce.Services.Orders.Contracts.Datas;

public class SubOrderData
{
    public long SubOrderId { get; set; }
    public long SellerId { get; set; }
    public decimal TotalPrice { get; set; }
}

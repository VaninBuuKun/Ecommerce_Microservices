using System;

namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class WalletDto
{
    public Guid Id { get; set; }
    public long UserId { get; set; }
    public decimal Balance { get; set; }
    public bool IsLocked { get; set; }
}

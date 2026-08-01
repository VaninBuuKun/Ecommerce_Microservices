using System;

namespace Ecommerce.Services.Payments.Api.Models.Dtos;

public class CreateWithdrawalRequest
{
    public decimal Amount { get; set; }
    public Guid BankAccountId { get; set; }
}

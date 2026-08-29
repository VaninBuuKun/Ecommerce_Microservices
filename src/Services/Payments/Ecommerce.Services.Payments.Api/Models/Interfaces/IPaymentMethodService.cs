using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Entities;

namespace Ecommerce.Services.Payments.Api.Models.Interfaces;

public interface IPaymentMethodService
{ 
    Task<Result<PaymentMethod>> CreateNewPaymentMethod(CreatePaymentMethodRequest paymentMethod);
    Task<Result<List<PaymentMethod>>> GetPaymentMethods();
    Task<Result<PaymentMethod>> GetPaymentMethodById(long id);
}

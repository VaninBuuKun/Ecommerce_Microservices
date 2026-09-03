using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Entities;

namespace Ecommerce.Services.Payments.Api.Models.Interfaces;

public interface IPaymentService
{ 
    Task<Result<CreatePaymentResult>> ProcessPayment(CreatePaymentRequest paymentRequest);
    Task<Result<Payment>> GetPaymentByOrderIdAsync(long orderId);
}

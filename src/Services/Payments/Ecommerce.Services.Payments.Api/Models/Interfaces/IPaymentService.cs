using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Payments.Api.Models.Dtos;

namespace Ecommerce.Services.Payments.Api.Models.Interfaces;

public interface IPaymentService
{ 
    Task<Result<CreatePaymentResult>> ProcessPayment(CreatePaymentRequest paymentRequest);
}
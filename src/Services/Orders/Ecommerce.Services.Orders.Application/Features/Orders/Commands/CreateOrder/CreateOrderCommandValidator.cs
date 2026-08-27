using System.Collections.Generic;
using FluentValidation;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CreateOrder;

public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        var paymentMethodAllows = new List<string>() { "cod", "momo", "vnpay" };
        
        RuleFor(x => x.PaymentProvider).Must(provider => !string.IsNullOrEmpty(provider) && paymentMethodAllows.Contains(provider.ToLower()))
            .WithMessage($"Payment provider must be one of the following: {string.Join(", ", paymentMethodAllows)}");

        RuleFor(x => x.CheckoutSessionKey).NotEmpty()
            .WithMessage("CheckoutSessionKey is required.");

        RuleFor(x => x.AddressId).GreaterThan(0)
            .WithMessage("AddressId is required.");
    }
}
using FluentValidation;

namespace Ecommerce.Services.Orders.Application.Features.Commands.CreateOrder;

public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        var paymentMethodAllows = new List<string>(){ "cod", "momo" };
        
        RuleFor(x => x.PaymentProvider).Must(provider => !string.IsNullOrEmpty(provider) && paymentMethodAllows.Contains(provider.ToLower()))
            .WithMessage($"Payment provider must be one of the following: {string.Join(", ", paymentMethodAllows)}");

        RuleFor(x => x.CheckoutSessionId).NotEmpty()
            .WithMessage("CheckoutSessionId is required.");
    }
}
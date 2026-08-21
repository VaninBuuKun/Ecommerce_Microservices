using System;
using Ardalis.Specification;

namespace Ecommerce.Services.Catalog.Domain.Products.Specifications;

public class WishlistByCustomerIdSpec : Specification<Wishlist>
{
    public WishlistByCustomerIdSpec(long customerId)
    {
        Query.Where(w => w.CustomerId == customerId)
             .Include(w => w.Product)
                .ThenInclude(p => p.Category)
             .OrderByDescending(w => w.CreatedAt);

    }
}

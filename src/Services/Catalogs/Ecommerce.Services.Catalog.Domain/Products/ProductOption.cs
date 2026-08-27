using System;
using System.Collections.Generic;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Catalog.Domain.Products;

public class ProductOption : EntityTrackingBase<long>
{
    public long ProductId { get; private set; }
    public string Name { get; private set; }
    public int SortOrder { get; private set; }
    
    public bool IsDeleted { get; private set; }

    private readonly List<ProductOptionValue> _values = new();
    public IReadOnlyCollection<ProductOptionValue> Values => _values.AsReadOnly();

    private ProductOption() { Name = null!;}

    public ProductOption(long productId, string name, int sortOrder)
    {
        ProductId = productId;
        Name = name;
        SortOrder = sortOrder;
    }

    public void Update(string name, int sortOrder)
    {
        Name = name;
        SortOrder = sortOrder;
    }

    public void AddValue(ProductOptionValue value)
    {
        _values.Add(value);
    }

    public void SoftDelete()
    {
        IsDeleted = true; 
    }
}

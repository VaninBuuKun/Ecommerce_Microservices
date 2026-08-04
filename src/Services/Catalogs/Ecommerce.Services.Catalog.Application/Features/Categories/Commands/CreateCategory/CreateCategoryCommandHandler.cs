using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Commands.CreateCategory;

public class CreateCategoryCommandHandler(IEfUnitOfWork unitOfWork) : IRequestHandler<CreateCategoryCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var categoryRepository = unitOfWork.Repository<Category, Guid>();

        if (request.ParentId.HasValue)
        {
            var parent = await categoryRepository.GetByIdAsync(request.ParentId.Value, cancellationToken);
            if (parent == null)
            {
                return Result<Guid>.Failure("Danh mục cha không tồn tại.", EErrorCode.NotFound);
            }

            // Kiểm tra phân cấp tối đa 2 level (Root -> Child)
            if (parent.ParentId.HasValue)
            {
                return Result<Guid>.Failure("Hệ thống chỉ hỗ trợ phân cấp tối đa 2 tầng danh mục.");
            }
        }

        var category = new Category(request.Name, request.Description, request.IconUrl,request.ParentId);
        categoryRepository.Add(category);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(category.Id);
    }
}

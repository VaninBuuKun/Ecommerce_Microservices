using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Categories.Commands.DeleteCategory;

public class DeleteCategoryCommandHandler(IEfUnitOfWork unitOfWork) : IRequestHandler<DeleteCategoryCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var categoryRepository = unitOfWork.Repository<Category, Guid>();
        var category = await categoryRepository.GetByIdAsync(request.Id, cancellationToken);
        if (category == null)
        {
            return Result<bool>.Failure("Danh mục không tồn tại.", EErrorCode.NotFound);
        }

        // Kiểm tra xem danh mục này có chứa danh mục con nào không
        var hasChildrenSpec = await categoryRepository.AnyAsync(c => c.ParentId == category.Id, cancellationToken);
        if (hasChildrenSpec)
        {
            return Result<bool>.Failure("Không thể xóa danh mục này vì nó chứa các danh mục con. Hãy xóa các danh mục con trước.");
        }

        categoryRepository.Delete(category);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}

using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.Commons;

namespace BuildingBlocks.Shared.Extensions;

public static class ErrorCodeExtensions
{
    public static int ToHttpStatusCode(this EErrorCode errorCode)
    {
        var httpStatusCode = errorCode switch
        {
            //200
            EErrorCode.Success => EHttpStatusCode.Ok,         
            
            EErrorCode.SuccessCreated => EHttpStatusCode.Created,
            
            //400
            EErrorCode.InvalidArgument => EHttpStatusCode.BadRequest,
            
            EErrorCode.RecordAlreadyExists => EHttpStatusCode.BadRequest,
            EErrorCode.InvalidInput => EHttpStatusCode.BadRequest,
            EErrorCode.Conflict => EHttpStatusCode.BadRequest,
            
            // 401
            EErrorCode.Unauthorized => EHttpStatusCode.Unauthorized,    
            
            // 403
            EErrorCode.Forbidden => EHttpStatusCode.Forbidden,                   
            
            // 404
            EErrorCode.NotFound => EHttpStatusCode.NotFound,                     
            
            // 422
            EErrorCode.ValidationErrors => EHttpStatusCode.UnprocessableEntity,  
            
            // 500
            _ => EHttpStatusCode.InternalServerError                             
        };
        return (int)httpStatusCode;
    }
    
    public static string ToDefaultMessage(this EErrorCode errorCode)
    {
        return errorCode switch
        {
            EErrorCode.Success => "Thao tác thành công.",
            EErrorCode.SuccessCreated => "Tạo thành công",
            EErrorCode.InvalidArgument => "Dữ liệu yêu cầu không hợp lệ.",
            EErrorCode.Unauthorized => "Vui lòng đăng nhập để thực hiện chức năng này.",
            EErrorCode.Forbidden => "Bạn không có quyền truy cập vào tài nguyên này.",
            EErrorCode.NotFound => "Không tìm thấy tài nguyên yêu cầu.",
            EErrorCode.ValidationErrors => "Dữ liệu xác thực không hợp lệ.",
            _ => "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau."
        };
    }
}
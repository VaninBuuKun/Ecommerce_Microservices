using System.Text.Json.Serialization;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.Extensions;

namespace BuildingBlocks.Shared.Commons;


public class Result
{
    public bool IsSuccess { get; init; }
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Message { get; private init; }
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public object? Errors { get; init; }
    
    [JsonIgnore]
    public EErrorCode ErrorCode { get; private init; }

    [JsonIgnore] 
    public int GetHttpStatusCode => ErrorCode.ToHttpStatusCode();

    public static Result Success(string? message = null) => 
        new() { IsSuccess = true, Message = message, ErrorCode = EErrorCode.Success};

    public static Result Failure(string? message, EErrorCode errorCode) => 
        new() { IsSuccess = false, Message = message ?? errorCode.ToDefaultMessage(), ErrorCode = errorCode};
    
    public static Result Failure(object errors) => 
        new() { IsSuccess = false, Message = "Dữ liệu không hợp lệ", Errors = errors, ErrorCode = EErrorCode.ValidationErrors };

    public static Result From<T>(Result<T> resultT)
    {
        return new Result
        {
            IsSuccess = resultT.IsSuccess,
            Message = resultT.Message,
            Errors = resultT.Errors,
            ErrorCode = resultT.ErrorCode
        };
    }
    
}

// Đổi tên từ ResultT<T> thành Result<T>
public class Result<T>
{
    //init chỉ đc khai báo trong constructor, ở nội bộ hoặc trong không thể thay đổi đc sau khởi tạo.
    //private init thì khng cho bên ngoài sử dụng {Message = a} để khởi tạo, nội bộ thì đc
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public T? Value { get; private init; }
    public bool IsSuccess { get; private init; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Message { get; private init; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public object? Errors { get; private init; }
    
    [JsonIgnore]
    public EErrorCode ErrorCode {get ; private init;}
    
    public int GetHttpStatusCode() => ErrorCode.ToHttpStatusCode();
    
    
    public static Result<T> Success(T value, EErrorCode successCode = EErrorCode.Success) => 
        new() { IsSuccess = true, Value = value, ErrorCode = successCode };
    
    public static Result<T> Failure(string? message, EErrorCode eError, object? errors = null) => 
        new() { IsSuccess = false, Message = message ?? eError.ToDefaultMessage(), ErrorCode = eError, Errors =  errors };
    
    // public static Result<T> Failure(string message, int statusCode) => 
    //     new() { IsSuccess = false, Message = message, ErrorCode = statusCode};
    
    public static Result<T> ValidationFailure(object errors) => 
        new() { IsSuccess = false, Message = "Dữ liệu không hợp lệ", Errors = errors, ErrorCode = EErrorCode.ValidationErrors };
}
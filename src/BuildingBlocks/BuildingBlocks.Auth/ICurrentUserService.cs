namespace BuildingBlocks.Auth;

public interface ICurrentUserService
{
    public string? Email { get; }
    public long UserId { get; }
    public bool IsAuthenticated { get; }
}
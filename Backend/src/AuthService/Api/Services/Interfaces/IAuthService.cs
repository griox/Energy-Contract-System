using Api.VMs;
using DefaultNamespace;

namespace Api.Services.Interfaces;

public interface IAuthService
{
    Task<RegisterResult> RegisterAsync(RegisterRequest request);
    Task<LoginResult> LoginAsync(LoginRequest request);
    Task<LogoutResult> LogoutAsync(string refreshToken);
    Task<UserResponse> GetMeAsync(int userId);

    Task<RefreshTokenResult> RefreshTokenAsync(string refreshToken);
    Task<RegisterResult> RegisterAdminAsync(RegisterRequest request);
}


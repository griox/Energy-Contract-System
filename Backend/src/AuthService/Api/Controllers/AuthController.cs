using System.Security.Claims;
using Api.Services.Interfaces; // Namespace chứa Interface Service
using Api.VMs;
using Microsoft.AspNetCore.Authorization; // Namespace chứa LoginRequest, RegisterRequest...
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/auth")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // POST: api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // 1. Gọi Service
        var result = await _authService.RegisterAsync(request);

        // 2. Kiểm tra kết quả
        if (!result.Success)
        {
            return BadRequest(new { message = result.ErrorMessage });
        }

        return Ok(new { message = "Đăng ký thành công!" });
    }
    [HttpPost("create-admin")] 
    public async Task<IActionResult> CreateAdmin([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAdminAsync(request);
        if (!result.Success)
        {
            return BadRequest(new { message = result.ErrorMessage });
        }

        return Ok(new { message = "Đăng ký thành công cho admin!" });
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);

        if (!result.Success)
        {
            // Trả về 401 Unauthorized nếu sai mật khẩu/user
            return Unauthorized(new { message = result.ErrorMessage });
        }
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,  // JavaScript không đọc được (Chống XSS)
            Expires = DateTime.UtcNow.AddDays(14), // Hạn sử dụng (khớp với logic service)
        
            // CẤU HÌNH CHO LOCALHOST (HTTP):
            Secure = false,   // Phải là false nếu chạy localhost http
            SameSite = SameSiteMode.Lax // Lax cho phép gửi cookie cùng domain localhost
        
            
        };

        // Gắn refreshToken vào Cookie của phản hồi
        Response.Cookies.Append("refreshToken", result.RefreshToken, cookieOptions);

        // Trả về cả AccessToken và RefreshToken
        return Ok(new 
        { 
            accessToken = result.AccessToken,
            refreshToken = result.RefreshToken 
        });
    }

    // POST: api/auth/refresh-token
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken()
    {
     
        var refreshToken = Request.Cookies["refreshToken"];

        if (string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized(new { message = "Refresh Token is missing in Cookie." });
        }

        // 2. GỌI SERVICE (Truyền token lấy từ cookie vào hàm Service của bạn)
        var result = await _authService.RefreshTokenAsync(refreshToken);

        if (!result.Success)
        {
            return Unauthorized(new { message = result.ErrorMessage });
        }

        // Trả về AccessToken mới
        return Ok(new { accessToken = result.AccessToken });
    }

    // POST: api/auth/logout
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] TokenRequest request)
    {
        var refreshToken = Request.Cookies["refreshToken"];
        
        if (!string.IsNullOrEmpty(refreshToken))
        {
            await _authService.LogoutAsync(refreshToken);
        }

        Response.Cookies.Delete("refreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Phải khớp với môi trường (true nếu https, false nếu http thường)
            SameSite = SameSiteMode.None // Hoặc Lax, phải khớp với lúc tạo cookie
        });

        return Ok(new { message = "Đăng xuất thành công" });
    }
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        // Lấy user ID từ claims
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized("Invalid token");
        }

        var result = await _authService.GetMeAsync(userId);
        
        if (!result.Success)
        {
            return BadRequest(result.ErrorMessage);
        }

        return Ok(result.User);
    }
}
using System.Security.Claims;
using Api.Services.Interfaces;
using Api.VMs;
using Microsoft.AspNetCore.Authorization;
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

    // ... (Giữ nguyên Register, CreateAdmin) ...
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        if (!result.Success) return BadRequest(new { message = result.ErrorMessage });
        return Ok(new { message = "Đăng ký thành công!" });
    }

    [HttpPost("create-admin")] 
    public async Task<IActionResult> CreateAdmin([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAdminAsync(request);
        if (!result.Success) return BadRequest(new { message = result.ErrorMessage });
        return Ok(new { message = "Đăng ký thành công cho admin!" });
    }

    // --- SỬA LẠI LOGIN CHO PRODUCTION ---
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);

        if (!result.Success)
        {
            return Unauthorized(new { message = result.ErrorMessage });
        }

        // ✅ CẤU HÌNH CỨNG CHO PRODUCTION
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddDays(14),
            
            // Bắt buộc True để chạy HTTPS
            Secure = true,   
            
            // Bắt buộc None để Cookie đi từ Backend sang Frontend (khác domain)
            SameSite = SameSiteMode.None 
        };

        Response.Cookies.Append("refreshToken", result.RefreshToken, cookieOptions);

        return Ok(new 
        { 
            accessToken = result.AccessToken,
            // Đã xóa refreshToken ở đây để bảo mật
        });
    }

    // --- REFRESH TOKEN (Giữ nguyên) ---
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken)) return Unauthorized(new { message = "No cookie" });

        var result = await _authService.RefreshTokenAsync(refreshToken);
        if (!result.Success) return Unauthorized(new { message = result.ErrorMessage });

        return Ok(new { accessToken = result.AccessToken });
    }

    // --- SỬA LẠI LOGOUT CHO PRODUCTION ---
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] TokenRequest request)
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (!string.IsNullOrEmpty(refreshToken))
        {
            await _authService.LogoutAsync(refreshToken);
        }

        // Phải khớp cấu hình với Login thì mới xóa được
        Response.Cookies.Delete("refreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // ✅ Khớp với Login
            SameSite = SameSiteMode.None // ✅ Khớp với Login
        });

        return Ok(new { message = "Đăng xuất thành công" });
    }

    // ... (Giữ nguyên GetMe) ...
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId)) return Unauthorized("Invalid token");
        
        var result = await _authService.GetMeAsync(userId);
        if (!result.Success) return BadRequest(result.ErrorMessage);
        return Ok(result.User);
    }
}
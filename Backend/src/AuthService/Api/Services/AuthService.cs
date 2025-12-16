using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Api.Infrastructures.Data;
using Api.Models;
using Api.Services.Interfaces;
using Api.VMs;
using DefaultNamespace;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Shared.Events;

namespace Api.Services;

public class AuthService : IAuthService
{
    private readonly AuthDBContext _context;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthService> _logger;
    private readonly IPublishEndpoint _publishEndpoint;
    
    // Access token sống 30 phút, refresh token sống 14 ngày
    private const int ACCESS_TOKEN_MINUTES = 30;
    private const int REFRESH_TOKEN_DAYS = 14;

    public AuthService(AuthDBContext context, IConfiguration config, ILogger<AuthService> logger, IPublishEndpoint publishEndpoint)
    {
        _context = context;
        _config = config;
        _logger = logger;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<RegisterResult> RegisterAsync(RegisterRequest request)
    {
        try
        {
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                _logger.LogError($"Username {request.Username} is already taken");
                throw new Exception("Username already exists.");
            }

            // Hash mật khẩu bằng BCrypt
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Tạo User mới
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Role = "User"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            _logger.LogWarning("Starting connnect to RabbitMQ to publish ContractCreatedEvent");
            await _publishEndpoint.Publish(new AccountCreatedEvent()
            {
                Email = user.Email,
                FullName = $"{user.FirstName} {user.LastName}",
                CreatedAt = DateTime.UtcNow
            });
            
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error registering user: {ex.Message}");
            return new RegisterResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }

        return new RegisterResult
        {
            Success = true
        };
    }

    public async Task<LoginResult> LoginAsync(LoginRequest request)
    {
        try
        {
            // 1. Tìm user theo username
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (user == null)
            {
                _logger.LogError($"Username {request.Username} is not found");
                throw new Exception("User not found.");
            }

            // 2. Kiểm tra password
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                _logger.LogError($"Password is incorrect");
                throw new Exception("Wrong password.");
            }

            // 3. Tạo access token (JWT)
            var accessToken = CreateAccessToken(user);
            
            // 4. Tạo refresh token (random 64 bytes)
            var refreshToken = GenerateRefreshToken();
            
            // 5. Lưu refresh token vào DB
            var session = new Session
            {
                UserId = user.Id,
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(REFRESH_TOKEN_DAYS)
            };
            
            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();

            return new LoginResult
            {
                Success = true,
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error during login: {ex.Message}");
            return new LoginResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<LogoutResult> LogoutAsync(string refreshToken)
    {
        try
        {
            if (string.IsNullOrEmpty(refreshToken))
            {
                return new LogoutResult { Success = true };
            }

            // Xóa session khỏi DB
            var session = await _context.Sessions.FirstOrDefaultAsync(s => s.Token == refreshToken);
            if (session != null)
            {
                _context.Sessions.Remove(session);
                await _context.SaveChangesAsync(); 
            }

            return new LogoutResult { Success = true };
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error during logout: {ex.Message}");
            return new LogoutResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<RefreshTokenResult> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            if (string.IsNullOrEmpty(refreshToken))
            {
                _logger.LogError("No refresh token provided");
                throw new Exception("No refresh token provided.");
            }


            var logToken = refreshToken.Length > 20 
                ? refreshToken.Substring(0, 20) 
                : refreshToken;

            // 2. Tìm session trong DB
            var session = await _context.Sessions.FirstOrDefaultAsync(s => s.Token == refreshToken);
            if (session == null)
            {
                _logger.LogError("Session not found in DB");
                throw new Exception("Invalid refresh token.");
            }

            _logger.LogInformation($"Found session: {session.Id}");

            // 3. Kiểm tra session đã hết hạn chưa
            if (session.ExpiresAt < DateTime.UtcNow)
            {
                _logger.LogError($"Session expired at: {session.ExpiresAt}");
                _context.Sessions.Remove(session);
                await _context.SaveChangesAsync();
                throw new Exception("Refresh token expired.");
            }

            // 4. Lấy thông tin user
            var user = await _context.Users.FindAsync(session.UserId);
            if (user == null)
            {
                _logger.LogError("User not found");
                throw new Exception("User not found.");
            }

            // 5. Tạo access token mới
            var newAccessToken = CreateAccessToken(user);
            
            _logger.LogInformation("Generated new access token");

            return new RefreshTokenResult
            {
                Success = true,
                AccessToken = newAccessToken
            };
        }
        catch (Exception ex)
        {
            _logger.LogError($"Refresh token error: {ex.Message}");
            return new RefreshTokenResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<RegisterResult> RegisterAdminAsync(RegisterRequest request)
    {
        try
        {
            // 1. Kiểm tra Username tồn tại chưa
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                _logger.LogError($"Username {request.Username} is already taken");
                throw new Exception("Username already exists.");
            }

            // 2. Hash mật khẩu
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // 3. Tạo User với Role là "Admin"
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Role = "Admin" 
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        
            _logger.LogInformation($"Admin user {user.Username} created successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error registering admin: {ex.Message}");
            return new RegisterResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }

        return new RegisterResult
        {
            Success = true
        };
    }

    private string CreateAccessToken(User user)
    {
        // Tạo claims chứa thông tin user
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        // Tạo key từ cấu hình
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Tạo JWT token với thời gian hết hạn 30 phút
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(ACCESS_TOKEN_MINUTES),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    public async Task<UserResponse> GetMeAsync(int userId)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                _logger.LogError($"User with ID {userId} not found");
                throw new Exception("User not found.");
            }
    
            return new UserResponse
            {
                Success = true,
                User = new UserDto()
                {
                    username = user.Username,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error getting user info: {ex.Message}");
            return new UserResponse
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }
    

    private string GenerateRefreshToken()
    {
        // Tạo refresh token random 64 bytes dưới dạng hex string
        var randomBytes = new byte[64];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }
        return Convert.ToHexString(randomBytes).ToLower();
    }
}

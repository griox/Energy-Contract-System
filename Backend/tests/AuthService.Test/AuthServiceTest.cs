using Api.Models;
using Api.Services;
using Api.VMs;
using AuthService.Tests.Base;
using FluentAssertions;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Shared.Events;
using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AuthService.Tests
{
    public class AuthServiceTests : BaseTest
    {
        // 1. Khai báo các Mock object (giả lập các dependencies bên ngoài)
        private readonly Mock<IConfiguration> _mockConfig;
        private readonly Mock<ILogger<Api.Services.AuthService>> _mockLogger;
        private readonly Mock<IPublishEndpoint> _mockPublishEndpoint;
        
        // 2. Service cần test
        private readonly Api.Services.AuthService _authService;

        public AuthServiceTests()
        {
            // Khởi tạo Mock
            _mockConfig = new Mock<IConfiguration>();
            _mockLogger = new Mock<ILogger<Api.Services.AuthService>>();
            _mockPublishEndpoint = new Mock<IPublishEndpoint>();

            // Setup giả lập Configuration cho JWT (Bắt buộc phải có để tạo Token)
            // Key phải đủ dài (>16 ký tự) để thuật toán HmacSha256 không báo lỗi
            _mockConfig.Setup(c => c["Jwt:Key"]).Returns("DayLaMotCaiKeyRatDaiDeTestJWT_SecretKey_123456");
            _mockConfig.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
            _mockConfig.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");

            // Khởi tạo AuthService với DB ảo và các Mock
            _authService = new Api.Services.AuthService(
                _dbContext, 
                _mockConfig.Object, 
                _mockLogger.Object, 
                _mockPublishEndpoint.Object
            );
        }

        #region Register Tests

        [Fact]
        public async Task RegisterAsync_ShouldReturnSuccess_WhenInfoIsValid()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Username = "newuser",
                Password = "password123",
                Email = "new@test.com",
                FirstName = "Nguyen",
                LastName = "Van A"
            };

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.Success.Should().BeTrue();

            // Kiểm tra DB đã lưu user chưa
            var userInDb = await _dbContext.Users.FirstOrDefaultAsync(u => u.Username == "newuser");
            userInDb.Should().NotBeNull();
            userInDb.Role.Should().Be("User"); // Mặc định là User
            
            // Kiểm tra mật khẩu đã được hash chưa (không được lưu text thường)
            userInDb.PasswordHash.Should().NotBe("password123");

            // QUAN TRỌNG: Kiểm tra xem RabbitMQ có được gọi lệnh Publish event không
            _mockPublishEndpoint.Verify(x => x.Publish(It.IsAny<AccountCreatedEvent>(), default), Times.Once);
        }

        [Fact]
        public async Task RegisterAsync_ShouldFail_WhenUsernameExists()
        {
            // Arrange: Tạo trước 1 user trong DB
            _dbContext.Users.Add(new User { Username = "existing", Email = "old@test.com", PasswordHash = "hash", Role = "User" });
            await _dbContext.SaveChangesAsync();

            var request = new RegisterRequest
            {
                Username = "existing", // Trùng tên
                Password = "123",
                Email = "new@test.com"
            };

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().Contain("Username already exists");

            // Đảm bảo KHÔNG bắn event RabbitMQ
            _mockPublishEndpoint.Verify(x => x.Publish(It.IsAny<AccountCreatedEvent>(), default), Times.Never);
        }

        #endregion

        #region Login Tests

        [Fact]
        public async Task LoginAsync_ShouldReturnToken_WhenCredentialsCorrect()
        {
            // Arrange
            string password = "mypassword";
            // Phải hash password thật bằng BCrypt để lát nữa hàm Verify mới đúng
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User { Username = "loginuser", PasswordHash = hashedPassword, Email = "test@test.com", Role = "User" };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var request = new LoginRequest { Username = "loginuser", Password = password };

            // Act
            var result = await _authService.LoginAsync(request);

            // Assert
            result.Success.Should().BeTrue();
            result.AccessToken.Should().NotBeNullOrEmpty();
            result.RefreshToken.Should().NotBeNullOrEmpty();

            // Kiểm tra session đã được lưu vào DB
            var session = await _dbContext.Sessions.FirstOrDefaultAsync(s => s.UserId == user.Id);
            session.Should().NotBeNull();
            session.Token.Should().Be(result.RefreshToken);
        }

        [Fact]
        public async Task LoginAsync_ShouldFail_WhenPasswordWrong()
        {
            // Arrange
            var user = new User { Username = "loginuser", PasswordHash = BCrypt.Net.BCrypt.HashPassword("dung"), Role = "User" };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var request = new LoginRequest { Username = "loginuser", Password = "sai" };

            // Act
            var result = await _authService.LoginAsync(request);

            // Assert
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().Contain("Wrong password");
        }

        #endregion

        #region RefreshToken Tests

        [Fact]
        public async Task RefreshTokenAsync_ShouldReturnNewAccess_WhenTokenValid()
        {
            // Arrange
            var user = new User { Username = "refresh", Role = "User" };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var validToken = "valid_refresh_token_hex_string";
            var session = new Session 
            { 
                UserId = user.Id, 
                Token = validToken, 
                ExpiresAt = DateTime.UtcNow.AddDays(1) // Còn hạn
            };
            _dbContext.Sessions.Add(session);
            await _dbContext.SaveChangesAsync();

            // Act
            var result = await _authService.RefreshTokenAsync(validToken);

            // Assert
            result.Success.Should().BeTrue();
            result.AccessToken.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public async Task RefreshTokenAsync_ShouldFail_AndRemoveSession_WhenTokenExpired()
        {
            // Arrange
            var user = new User { Username = "expired", Role = "User" };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var expiredToken = "expired_token";
            var session = new Session 
            { 
                UserId = user.Id, 
                Token = expiredToken, 
                ExpiresAt = DateTime.UtcNow.AddDays(-1) // Đã hết hạn
            };
            _dbContext.Sessions.Add(session);
            await _dbContext.SaveChangesAsync();

            // Act
            var result = await _authService.RefreshTokenAsync(expiredToken);

            // Assert
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().Contain("Refresh token expired");

            // Kiểm tra session cũ đã bị xóa khỏi DB chưa
            var sessionInDb = await _dbContext.Sessions.FirstOrDefaultAsync(s => s.Token == expiredToken);
            sessionInDb.Should().BeNull();
        }

        #endregion

        #region RegisterAdmin Tests

        
        [Fact]
        public async Task RegisterAdminAsync_ShouldCreateUserWithAdminRole()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Username = "admin",
                Password = "password",
                Email = "admin@test.com",
                FirstName = "Admin", 
                LastName = "System"
            };

            // Act
            var result = await _authService.RegisterAdminAsync(request);

            // --- SỬA ĐOẠN NÀY ---
            // Assert
            // Nếu Success là false, nó sẽ in cái ErrorMessage ra màn hình console của Test
            result.Success.Should().BeTrue(because: result.ErrorMessage); 
    
            var user = await _dbContext.Users.FirstOrDefaultAsync();
            user.Should().NotBeNull();
            user.Role.Should().Be("Admin");
        }

        #endregion
    }
}
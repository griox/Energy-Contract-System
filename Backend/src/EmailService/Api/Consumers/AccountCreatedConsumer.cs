using MassTransit;
using Shared.Events;
using MailKit.Net.Smtp;
using MimeKit;
using MailKit.Security; // Bắt buộc cho Brevo

namespace EmailService.Api.Consumers;

public class AccountCreatedConsumer : IConsumer<AccountCreatedEvent>
{
    private readonly ILogger<AccountCreatedConsumer> _logger;
    private readonly IConfiguration _configuration;

    public AccountCreatedConsumer(ILogger<AccountCreatedConsumer> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public async Task Consume(ConsumeContext<AccountCreatedEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation($"[RabbitMQ] Nhận thông báo tạo tài khoản mới: {msg.Email}");

        try
        {
            // 1. Đọc cấu hình Email
            var senderName = _configuration["EmailSettings:SenderName"];
            var senderEmail = _configuration["EmailSettings:SenderEmail"];
            var appPassword = _configuration["EmailSettings:AppPassword"]; // Key Brevo
            var smtpHost = _configuration["EmailSettings:SmtpHost"];       // smtp-relay.brevo.com
            var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"]!); // 587

            // 👇 QUAN TRỌNG: Thay localhost bằng link Frontend thật trên Render
            // Ví dụ: https://my-energy-app.onrender.com/login
            var loginLink = "https://energy-contract-system-six.vercel.app"; 

            // 2. Tạo nội dung Email
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(senderName, senderEmail));
            message.To.Add(new MailboxAddress(msg.FullName, msg.Email));
            message.Subject = "Chào mừng bạn đến với Energy System! 🎉";

            var bodyBuilder = new BodyBuilder();
            bodyBuilder.HtmlBody = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; }}
                    .header {{ background-color: #4A90E2; color: #ffffff; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; color: #333333; line-height: 1.6; }}
                    .footer {{ background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777; }}
                    .btn {{ display: inline-block; background-color: #4A90E2; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>CHÀO MỪNG THÀNH VIÊN MỚI</h1>
                    </div>
                    <div class='content'>
                        <p>Xin chào <strong>{msg.FullName}</strong>,</p>
                        <p>Chúc mừng bạn đã tạo tài khoản thành công tại <strong>Energy Contract System</strong>.</p>
                        <p>Tài khoản của bạn đã sẵn sàng. Bạn có thể đăng nhập ngay bây giờ để quản lý hợp đồng năng lượng của mình.</p>
                        
                        <div style='text-align: center;'>
                            <a href='{loginLink}' class='btn' style='color: #ffffff;'>Đăng Nhập Ngay</a>
                        </div>
                    </div>
                    <div class='footer'>
                        <p>&copy; 2024 Energy System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

            message.Body = bodyBuilder.ToMessageBody();

            // 3. Gửi Mail qua Brevo
            using var client = new SmtpClient();
            client.Timeout = 10000; // 10 giây

            _logger.LogInformation($"[DEBUG] Connecting to {smtpHost}:{smtpPort}...");

    // 👇 SỬA THÀNH 'Auto'. Nó sẽ tự động chọn StartTls hoặc SSL tùy theo Port bạn điền trên Render
            await client.ConnectAsync(smtpHost, smtpPort, MailKit.Security.SecureSocketOptions.Auto);

            // Đăng nhập
            await client.AuthenticateAsync(senderEmail, appPassword);

            // Gửi và ngắt kết nối
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation($"✅ [BREVO] Đã gửi mail thành công tới {msg.Email}");
        }
        catch (Exception ex)
        {
            // Chỉ cần 1 tầng catch là đủ bắt mọi lỗi (từ config sai đến lỗi mạng)
            _logger.LogError(ex, $"❌ [BREVO] Lỗi gửi mail: {ex.Message}");
            
            // Nếu muốn RabbitMQ gửi lại (Retry) khi lỗi mạng, hãy bỏ comment dòng dưới:
            // throw; 
        }
    }
}
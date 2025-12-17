using MassTransit;
using Shared.Events;
using MailKit.Net.Smtp;
using MimeKit;
using MailKit.Security; 

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
            // 1. Đọc cấu hình (QUAN TRỌNG: Kiểm tra null)
            var senderName = _configuration["EmailSettings:SenderName"] ?? "Energy System";
            // BẮT BUỘC: SenderEmail phải trùng với mail đăng nhập Brevo
            var senderEmail = _configuration["EmailSettings:SenderEmail"]; 
            
            // Key Brevo lấy từ Env
            var appPassword = _configuration["EmailSettings:AppPassword"]; 
            
            // Cấu hình cứng Host và Port của Brevo (Khỏi lo Env sai)
            var smtpHost = "smtp-relay.brevo.com"; 
            var smtpPort = 2525; // Port thần thánh

            // Link Frontend
            var loginLink = "https://energy-contract-system-six.vercel.app"; 

            // Debug log (Che mật khẩu)
            _logger.LogInformation($"[CONFIG CHECK] Sender: {senderEmail}");
            _logger.LogInformation($"[CONFIG CHECK] Key Length: {appPassword?.Length ?? 0}");

            if (string.IsNullOrEmpty(appPassword) || string.IsNullOrEmpty(senderEmail))
            {
                throw new Exception("❌ Cấu hình Email hoặc Password đang bị TRỐNG trên Render!");
            }

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

            // 3. Gửi Mail
            using var client = new SmtpClient();
            client.Timeout = 10000;

            _logger.LogInformation($"[CONNECT] {smtpHost}:{smtpPort}");
            await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.Auto);

            _logger.LogInformation("[AUTH] Đang đăng nhập...");
            // Dùng chính email sender để login
            await client.AuthenticateAsync(senderEmail, appPassword);

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation($"✅ [SUCCESS] Đã gửi mail thành công tới {msg.Email}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"❌ [ERROR] Lỗi gửi mail: {ex.Message}");
        }
    }
}
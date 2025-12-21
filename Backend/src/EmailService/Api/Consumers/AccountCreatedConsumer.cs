using MassTransit;
using Shared.Events;
using Api.Service; // Import Interface

namespace Api.Consumers;

public class AccountCreatedConsumer : IConsumer<AccountCreatedEvent>
{
    private readonly ILogger<AccountCreatedConsumer> _logger;
    private readonly IEmailSender _emailSender; // Inject service gửi mail

    public AccountCreatedConsumer(ILogger<AccountCreatedConsumer> logger, IEmailSender emailSender)
    {
        _logger = logger;
        _emailSender = emailSender;
    }

    public async Task Consume(ConsumeContext<AccountCreatedEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation($"[RabbitMQ] Nhận event tạo tài khoản: {msg.Email}");

        try
        {
            var loginLink = "https://energy-contract-system-six.vercel.app";
            
            // --- BẮT ĐẦU HTML TEMPLATE ---
            // Lưu ý: Trong C#, khi dùng $@"", muốn viết CSS { } thì phải nhân đôi thành {{ }}
            var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }}
                    .header {{ background-color: #4A90E2; color: #ffffff; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; color: #333333; line-height: 1.6; }}
                    .footer {{ background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777; }}
                    .btn {{ display: inline-block; background-color: #4A90E2; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }}
                    .btn:hover {{ background-color: #357ABD; }}
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
                        <br/>
                        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
                    </div>
                    <div class='footer'>
                        <p>&copy; {DateTime.Now.Year} Energy System. All rights reserved.</p>
                        <p>Đây là email tự động, vui lòng không trả lời.</p>
                    </div>
                </div>
            </body>
            </html>";
            // --- KẾT THÚC HTML TEMPLATE ---

            // 2. Gọi Service gửi mail (Code gọn gàng, tách biệt logic)
            await _emailSender.SendEmailAsync(
                msg.FullName, 
                msg.Email, 
                "Chào mừng bạn đến với Energy System! 🎉", 
                htmlContent
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Lỗi xử lý gửi mail trong Consumer");
        }
    }
}
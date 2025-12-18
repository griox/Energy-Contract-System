using MassTransit;
using Shared.Events;
using MailKit.Net.Smtp;
using MimeKit;
using MailKit.Security;

namespace Api.Consumers; // Đặt namespace chuẩn

public class ContractCreatedConsumer : IConsumer<ContractCreatedEvent>
{
    private readonly ILogger<ContractCreatedConsumer> _logger;
    private readonly IConfiguration _configuration;

    public ContractCreatedConsumer(ILogger<ContractCreatedConsumer> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public async Task Consume(ConsumeContext<ContractCreatedEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation($"[RabbitMQ] Nhận yêu cầu gửi mail hợp đồng: {msg.ContractNumber}");

        try
        {
            // 1. Đọc cấu hình
            var senderName = _configuration["EmailSettings:SenderName"] ?? "Energy System";
            
            // Dùng để hiển thị "From" (Phải là mail đã verify: nh920211@gmail.com)
            var senderEmail = _configuration["EmailSettings:SenderEmail"]; 
            
            // Password (SMTP Key)
            var appPassword = _configuration["EmailSettings:AppPassword"];
            
            // Cấu hình Brevo
            var smtpHost = "smtp-relay.brevo.com";
            var smtpPort = 2525; // Port 2525 ổn định nhất
            
            // 👇 QUAN TRỌNG: ID đăng nhập riêng của Brevo
            var smtpLoginUser = "9e44aa001@smtp-brevo.com";

            // 👇 SỬA LINK: Đổi localhost thành link Production
            var frontendUrl = "https://energy-contract-system-six.vercel.app";
            string contractUrl = $"{frontendUrl}/contracts/{msg.ContractNumber}";

            var cultureInfo = new System.Globalization.CultureInfo("vi-VN");
            string formattedDate = msg.CreatedAt.ToString("dd 'tháng' MM 'năm' yyyy, HH:mm", cultureInfo);

            // 2. Tạo nội dung Email
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(senderName, senderEmail)); // Gửi từ Gmail
            message.To.Add(new MailboxAddress(msg.FullName, msg.Email));
            message.Subject = $"Xác nhận hợp đồng số {msg.ContractNumber}";

            var bodyBuilder = new BodyBuilder();
            // (Giữ nguyên Template HTML của bạn)
            bodyBuilder.HtmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Xác nhận Hợp đồng</title>
</head>
<body style='margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;'>
    <table role='presentation' style='width: 100%; border-collapse: collapse;'>
        <tr>
            <td align='center' style='padding: 20px 0;'>
                <table role='presentation' style='width: 600px; border-collapse: collapse; border: 1px solid #dddddd; background-color: #ffffff; text-align: left;'>
                    <tr>
                        <td style='background-color: #0056b3; padding: 30px 40px; text-align: center; color: #ffffff;'>
                            <h1 style='margin: 0; font-size: 24px; font-weight: bold;'>XÁC NHẬN HỢP ĐỒNG</h1>
                            <p style='margin: 10px 0 0; font-size: 16px;'>Energy Contract Management System</p>
                        </td>
                    </tr>
                    <tr>
                        <td style='padding: 40px 40px 20px 40px;'>
                            <p>Kính gửi Quý khách <strong>{msg.FullName}</strong>,</p>
                            <p>Hồ sơ đăng ký dịch vụ của Quý khách đã được xử lý thành công.</p>
                            <table style='width: 100%; margin-bottom: 30px; background-color: #f9f9f9; padding: 15px; border-radius: 5px;'>
                                <tr>
                                    <td>Mã hợp đồng:</td>
                                    <td><strong>{msg.ContractNumber}</strong></td>
                                </tr>
                                <tr>
                                    <td>Thời gian tạo:</td>
                                    <td><strong>{formattedDate}</strong></td>
                                </tr>
                                <tr>
                                    <td>Trạng thái:</td>
                                    <td style='color: #28a745; font-weight: bold;'>Đã kích hoạt (Active)</td>
                                </tr>
                            </table>
                            <div style='text-align: center; margin-bottom: 30px;'>
                                <a href='{contractUrl}' style='background-color: #28a745; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;'>
                                    Xem Chi Tiết Hợp Đồng
                                </a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style='background-color: #333333; padding: 20px 40px; text-align: center;'>
                            <p style='color: #ffffff; font-size: 12px;'>&copy; 2024 Energy Contract System.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";

            message.Body = bodyBuilder.ToMessageBody();

            // 3. Gửi Mail
            using var client = new SmtpClient();
            client.Timeout = 10000;

            _logger.LogInformation($"[CONNECT] {smtpHost}:{smtpPort}");
            await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.Auto);

            // 👇 QUAN TRỌNG: Đăng nhập bằng ID 9e44aa...
            await client.AuthenticateAsync(smtpLoginUser, appPassword);

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation($"✅ [SUCCESS] Đã gửi mail hợp đồng tới {msg.Email}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"❌ [ERROR] Lỗi gửi mail hợp đồng: {ex.Message}");
        }
    }
}
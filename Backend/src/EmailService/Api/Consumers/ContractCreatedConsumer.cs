
using MassTransit;
using MimeKit;
using MailKit.Net.Smtp;
using Shared.Events;

namespace Api.Consumers;

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
        _logger.LogInformation($"[RabbitMQ] Nhận yêu cầu gửi mail cho: {msg.Email}");

        try
        {
            // 1. Đọc cấu hình từ appsettings.json
            var senderName = _configuration["EmailSettings:SenderName"];
            var senderEmail = _configuration["EmailSettings:SenderEmail"];
            var appPassword = _configuration["EmailSettings:AppPassword"];
            var smtpHost = _configuration["EmailSettings:SmtpHost"];
            var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"]!);
            var cultureInfo = new System.Globalization.CultureInfo("vi-VN");
            string formattedDate = msg.CreatedAt.ToString("dd 'tháng' MM 'năm' yyyy, HH:mm", cultureInfo);
            string contractUrl = $"http://localhost:5173/contracts/{msg.ContractNumber}";

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(senderName, senderEmail));
            message.To.Add(new MailboxAddress(msg.FullName, msg.Email));
            message.Subject = $"Xác nhận hợp đồng số {msg.ContractNumber}";

            var bodyBuilder = new BodyBuilder();
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
                            <p style='font-size: 16px; line-height: 1.5; color: #333333; margin-bottom: 20px;'>
                                Kính gửi Quý khách <strong>{msg.FullName}</strong>,
                            </p>
                            <p style='font-size: 16px; line-height: 1.5; color: #333333; margin-bottom: 20px;'>
                                Chúng tôi xin trân trọng thông báo hồ sơ đăng ký dịch vụ năng lượng của Quý khách đã được xử lý thành công. Dưới đây là thông tin tóm tắt của hợp đồng:
                            </p>

                            <table style='width: 100%; margin-bottom: 30px; background-color: #f9f9f9; padding: 15px; border-radius: 5px;'>
                                <tr>
                                    <td style='padding: 8px 0; color: #666666; font-size: 14px;'>Mã hợp đồng:</td>
                                    <td style='padding: 8px 0; color: #333333; font-weight: bold; font-size: 14px;'>{msg.ContractNumber}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px 0; color: #666666; font-size: 14px;'>Khách hàng:</td>
                                    <td style='padding: 8px 0; color: #333333; font-weight: bold; font-size: 14px;'>{msg.FullName}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px 0; color: #666666; font-size: 14px;'>Email đăng ký:</td>
                                    <td style='padding: 8px 0; color: #333333; font-weight: bold; font-size: 14px;'>{msg.Email}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px 0; color: #666666; font-size: 14px;'>Thời gian tạo:</td>
                                    <td style='padding: 8px 0; color: #333333; font-weight: bold; font-size: 14px;'>{formattedDate}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px 0; color: #666666; font-size: 14px;'>Trạng thái:</td>
                                    <td style='padding: 8px 0; color: #28a745; font-weight: bold; font-size: 14px;'>Đã kích hoạt (Active)</td>
                                </tr>
                            </table>

                            <div style='text-align: center; margin-bottom: 30px;'>
                                <a href='{contractUrl}' style='background-color: #28a745; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;'>
                                    Xem Chi Tiết Hợp Đồng
                                </a>
                            </div>

                            <p style='font-size: 14px; line-height: 1.5; color: #666666; margin-top: 20px; border-top: 1px solid #eeeeee; padding-top: 20px;'>
                                Nếu Quý khách không thực hiện yêu cầu này, vui lòng liên hệ ngay với bộ phận hỗ trợ của chúng tôi.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style='background-color: #333333; padding: 20px 40px; text-align: center;'>
                            <p style='color: #ffffff; font-size: 12px; margin: 0;'>
                                &copy; 2024 Energy Contract System. All rights reserved.
                            </p>
                            <p style='color: #bbbbbb; font-size: 12px; margin: 10px 0 0;'>
                                Địa chỉ: 10th VCN Tower,Phước Hải, Nha Trang<br>
                                Hotline: 1900 1234 | Email: huy.quangngo@infodation.vn
                            </p>
                        </td>
                    </tr>

                </table>
                </td>
        </tr>
    </table>
</body>
</html>";

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            
            // Sử dụng thông tin từ cấu hình
            await client.ConnectAsync(smtpHost, smtpPort, false);
            await client.AuthenticateAsync(senderEmail, appPassword);

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation($"✅ Đã gửi mail thành công tới {msg.Email}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[RabbitMQ] Lỗi khi gửi mail");
        }
    }
}
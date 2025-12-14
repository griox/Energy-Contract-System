using MassTransit;
using Shared.Events;
using MailKit.Net.Smtp;
using MimeKit;
using System.Globalization;

namespace Api.Consumers;

public class InvoiceReminderConsumer : IConsumer<InvoiceReminderEvent>
{
    private readonly ILogger<InvoiceReminderConsumer> _logger;
    private readonly IConfiguration _configuration;

    public InvoiceReminderConsumer(ILogger<InvoiceReminderConsumer> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public async Task Consume(ConsumeContext<InvoiceReminderEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation($"[RabbitMQ] Nhận yêu cầu gửi hóa đơn cho HĐ: {msg.ContractNumber}");

        try
        {
            // 1. Đọc cấu hình Email
            var senderName = _configuration["EmailSettings:SenderName"];
            var senderEmail = _configuration["EmailSettings:SenderEmail"];
            var appPassword = _configuration["EmailSettings:AppPassword"];
            var smtpHost = _configuration["EmailSettings:SmtpHost"];
            var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"]!);

            // 2. Format dữ liệu tiền tệ và ngày tháng
            var cultureInfo = new CultureInfo("vi-VN");
            string formattedAmount = msg.Amount.ToString("N0", cultureInfo); // Ví dụ: 500.000
            string formattedDate = msg.DueDate.ToString("dd/MM/yyyy");

            // 3. Tạo nội dung Email
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(senderName, senderEmail));
            message.To.Add(new MailboxAddress(msg.FullName, msg.Email));
            message.Subject = $"[NHẮC THANH TOÁN] Hóa đơn tháng {DateTime.Now.Month} - HĐ {msg.ContractNumber}";

            var bodyBuilder = new BodyBuilder();
            
            // HTML Template: Invoice Style
            bodyBuilder.HtmlBody = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: 'Helvetica', 'Arial', sans-serif; background-color: #f6f6f6; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }}
                    /* Header màu cam để gây chú ý cho việc thanh toán */
                    .header {{ background-color: #FF6B6B; color: #ffffff; padding: 25px; text-align: center; }}
                    .content {{ padding: 30px; color: #333333; line-height: 1.6; }}
                    .invoice-box {{ background-color: #f9f9f9; border: 1px solid #eeeeee; padding: 20px; border-radius: 5px; margin: 20px 0; }}
                    .amount {{ font-size: 24px; color: #d9534f; font-weight: bold; }}
                    .footer {{ background-color: #f6f6f6; padding: 15px; text-align: center; font-size: 12px; color: #999; }}
                    .btn {{ display: inline-block; background-color: #28a745; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 10px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1 style='margin:0; font-size: 22px;'>THÔNG BÁO CƯỚC PHÍ</h1>
                        <p style='margin: 5px 0 0; opacity: 0.9;'>Kỳ thanh toán tháng {DateTime.Now.Month}/{DateTime.Now.Year}</p>
                    </div>
                    
                    <div class='content'>
                        <p>Xin chào <strong>{msg.FullName}</strong>,</p>
                        <p>Đây là thông báo nhắc thanh toán định kỳ cho dịch vụ năng lượng của bạn. Dưới đây là chi tiết hóa đơn cần thanh toán:</p>
                        
                        <div class='invoice-box'>
                            <table style='width: 100%;'>
                                <tr>
                                    <td style='padding: 5px 0; color: #666;'>Mã hợp đồng:</td>
                                    <td style='text-align: right; font-weight: bold;'>{msg.ContractNumber}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 5px 0; color: #666;'>Hạn thanh toán:</td>
                                    <td style='text-align: right; font-weight: bold;'>{formattedDate}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 10px 0; border-top: 1px dashed #ddd; font-weight: bold;'>TỔNG CỘNG:</td>
                                    <td style='text-align: right; border-top: 1px dashed #ddd;'>
                                        <span class='amount'>{formattedAmount} VNĐ</span>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <p>Vui lòng thanh toán trước ngày hết hạn để tránh gián đoạn dịch vụ.</p>

                        <div style='text-align: center;'>
                            <a href='http://localhost:5173/payments?contract={msg.ContractNumber}' class='btn' style='color: #ffffff;'>Thanh Toán Ngay</a>
                        </div>
                    </div>

                    <div class='footer'>
                        <p>Mọi thắc mắc xin liên hệ hotline: 1900 1234</p>
                        <p>&copy; 2025 Energy System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

            message.Body = bodyBuilder.ToMessageBody();

            // 4. Gửi Mail
            using var client = new SmtpClient();
            await client.ConnectAsync(smtpHost, smtpPort, false);
            await client.AuthenticateAsync(senderEmail, appPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation($"✅ Đã gửi hóa đơn thành công tới {msg.Email}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Lỗi khi gửi hóa đơn");
        }
    }
}
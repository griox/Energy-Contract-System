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
        _logger.LogInformation($"[RabbitMQ] Nhận yêu cầu gửi nhắc nhở cho: {msg.Email}");

        try
        {
            // 1. Config Email (Giữ nguyên)
            var senderName = _configuration["EmailSettings:SenderName"];
            var senderEmail = _configuration["EmailSettings:SenderEmail"];
            var appPassword = _configuration["EmailSettings:AppPassword"];
            var smtpHost = _configuration["EmailSettings:SmtpHost"];
            var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"]!);

            // 2. Format
            var cultureInfo = new CultureInfo("vi-VN");
            string formattedAmount = msg.Amount.ToString("N0", cultureInfo); 
            string formattedDate = msg.DueDate.ToString("dd/MM/yyyy");

            // Xử lý Description nếu null (đề phòng)
            string description = !string.IsNullOrEmpty(msg.Description) 
                ? msg.Description 
                : $"Thanh toán định kỳ hợp đồng {msg.ContractNumber}";

            // 3. Tạo Email
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(senderName, senderEmail));
            message.To.Add(new MailboxAddress(msg.FullName, msg.Email));
            
            // Đổi Subject cho phù hợp hơn
            message.Subject = $"[NHẮC THANH TOÁN] Sắp hết hạn - {description}";

            var bodyBuilder = new BodyBuilder();
            
            // HTML Template: Invoice Style Updated
            bodyBuilder.HtmlBody = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: 'Helvetica', 'Arial', sans-serif; background-color: #f4f4f4; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden; }}
                    /* Header màu đỏ/cam cảnh báo */
                    .header {{ background-color: #FF5252; color: #ffffff; padding: 30px; text-align: center; }}
                    .content {{ padding: 30px; color: #555555; line-height: 1.6; }}
                    .info-box {{ background-color: #FFF8E1; border-left: 5px solid #FFC107; padding: 15px; margin: 20px 0; }}
                    .amount-box {{ text-align: center; margin: 30px 0; padding: 20px; background-color: #FAFAFA; border: 1px dashed #CCCCCC; border-radius: 5px; }}
                    .amount-value {{ font-size: 32px; color: #D32F2F; font-weight: bold; margin-top: 5px; display: block; }}
                    .label {{ font-size: 14px; text-transform: uppercase; color: #888; letter-spacing: 1px; }}
                    .btn {{ display: inline-block; background-color: #D32F2F; color: #ffffff !important; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 10px; }}
                    .footer {{ background-color: #eeeeee; padding: 20px; text-align: center; font-size: 12px; color: #999; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1 style='margin:0; font-size: 24px;'>SẮP ĐẾN HẠN THANH TOÁN</h1>
                        <p style='margin: 10px 0 0; opacity: 0.9;'>Vui lòng thanh toán trước ngày {formattedDate}</p>
                    </div>
                    
                    <div class='content'>
                        <p>Xin chào <strong>{msg.FullName}</strong>,</p>
                        <p>Hệ thống nhận thấy bạn có một khoản thanh toán sắp đến hạn. Để đảm bảo dịch vụ không bị gián đoạn, vui lòng hoàn tất thanh toán trong thời gian sớm nhất.</p>
                        
                        <div class='info-box'>
                            <strong>Nội dung:</strong> {description}<br>
                            <strong>Mã hợp đồng:</strong> {msg.ContractNumber}
                        </div>

                        <div class='amount-box'>
                            <span class='label'>Số tiền cần thanh toán</span>
                            <span class='amount-value'>{formattedAmount} VNĐ</span>
                            <div style='margin-top: 10px; font-size: 14px; color: #666;'>Hạn chót: <strong>{formattedDate}</strong></div>
                        </div>

                        <div style='text-align: center;'>
                            <a href='http://localhost:5173/payments/checkout?contract={msg.ContractNumber}' class='btn'>THANH TOÁN NGAY</a>
                        </div>
                        
                        <p style='margin-top: 30px; font-size: 13px; text-align: center;'>Nếu bạn đã thanh toán, vui lòng bỏ qua email này.</p>
                    </div>

                    <div class='footer'>
                        <p>Hotline hỗ trợ: 1900 1234 | Email: support@energysystem.com</p>
                        <p>&copy; 2025 Energy System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

            message.Body = bodyBuilder.ToMessageBody();

            // 👇 SỬA ĐOẠN NÀY ĐỂ FIX LỖI TIMEOUT & SSL
            using var client = new SmtpClient();
            client.Timeout = 10000; // Tăng timeout lên 10s

            // Dùng StartTls cho port 587
            await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
            
            await client.AuthenticateAsync(senderEmail, appPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation($"✅ Đã gửi mail thành công tới {msg.Email}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send email");
        }
    }
}
using MassTransit;
using Shared.Events;
using Api.Service; // Import Interface
using System.Globalization;

namespace Api.Consumers;

public class InvoiceReminderConsumer : IConsumer<InvoiceReminderEvent>
{
    private readonly ILogger<InvoiceReminderConsumer> _logger;
    private readonly IEmailSender _emailSender; // Inject Service gửi mail

    public InvoiceReminderConsumer(ILogger<InvoiceReminderConsumer> logger, IEmailSender emailSender)
    {
        _logger = logger;
        _emailSender = emailSender;
    }

    public async Task Consume(ConsumeContext<InvoiceReminderEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation($"[RabbitMQ] Nhận yêu cầu gửi nhắc nhở cho: {msg.Email}");

        try
        {
            // 1. Chuẩn bị dữ liệu (Frontend URL, Link thanh toán)
            var frontendUrl = "https://energy-contract-system-six.vercel.app";
            var checkoutLink = $"{frontendUrl}/payments/checkout?contract={msg.ContractNumber}";

            // 2. Format dữ liệu hiển thị (Tiền tệ, Ngày tháng)
            var cultureInfo = new CultureInfo("vi-VN");
            string formattedAmount = msg.Amount.ToString("N0", cultureInfo); 
            string formattedDate = msg.DueDate.ToString("dd/MM/yyyy");

            string description = !string.IsNullOrEmpty(msg.Description) 
                ? msg.Description 
                : $"Thanh toán định kỳ hợp đồng {msg.ContractNumber}";

            // 3. Chuẩn bị HTML Template
            // Lưu ý: CSS dùng {{ }} để tránh xung đột với biến C# { }
            var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: 'Helvetica', 'Arial', sans-serif; background-color: #f4f4f4; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden; }}
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
                            <a href='{checkoutLink}' class='btn'>THANH TOÁN NGAY</a>
                        </div>
                        
                        <p style='margin-top: 30px; font-size: 13px; text-align: center;'>Nếu bạn đã thanh toán, vui lòng bỏ qua email này.</p>
                    </div>

                    <div class='footer'>
                        <p>Hotline hỗ trợ: 1900 1234 | Email: support@energysystem.com</p>
                        <p>&copy; {DateTime.Now.Year} Energy System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

            // 4. Gọi Service gửi mail
            // Tiêu đề mail cũng được format tại đây
            var emailSubject = $"[NHẮC THANH TOÁN] Sắp hết hạn - {description}";

            await _emailSender.SendEmailAsync(
                msg.FullName, 
                msg.Email, 
                emailSubject, 
                htmlContent
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"❌ [ERROR] Lỗi gửi mail nhắc thanh toán: {ex.Message}");
        }
    }
}
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Api.Service;

namespace Api.Service;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toName, string toEmail, string subject, string htmlBody)
    {
        // 1. Đọc cấu hình (Code cũ của bạn chuyển sang đây)
        var senderName = _configuration["EmailSettings:SenderName"] ?? "Energy System";
        var senderEmail = _configuration["EmailSettings:SenderEmail"];
        var appPassword = _configuration["EmailSettings:AppPassword"];
        
        // Hardcode config Brevo (hoặc đưa vào appsettings.json càng tốt)
        var smtpHost = "smtp-relay.brevo.com";
        var smtpPort = 2525;
        var smtpLoginUser = "9e501d001@smtp-brevo.com"; // User login riêng

        if (string.IsNullOrEmpty(appPassword) || string.IsNullOrEmpty(senderEmail))
        {
            throw new Exception("❌ Cấu hình Email chưa đủ");
        }

        // 2. Tạo MimeMessage
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(senderName, senderEmail));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
        message.Body = bodyBuilder.ToMessageBody();

        // 3. Gửi qua SMTP
        using var client = new SmtpClient();
        client.Timeout = 10000;
        
        await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.Auto);
        await client.AuthenticateAsync(smtpLoginUser, appPassword);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
        
        _logger.LogInformation($"Gửi mail thành công tới {toEmail}");
    }
}
namespace Api.Service;

public interface IEmailSender
{
    Task SendEmailAsync(string toName, string toEmail, string subject, string htmlBody);
}
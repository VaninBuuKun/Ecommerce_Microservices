using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

using Ecommerce.Services.Notifications.Api.Models.Interfaces;

namespace Ecommerce.Services.Notifications.Api.Services;

public class EmailService(
    IConfiguration configuration,
    ILogger<EmailService> logger)
    : IEmailService
{
    private async Task SendHtmlEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var smtpHost = configuration["SmtpSettings:Host"];
        var smtpPortStr = configuration["SmtpSettings:Port"];
        var smtpUser = configuration["SmtpSettings:Username"];
        var smtpPass = configuration["SmtpSettings:Password"];
        var fromEmail = configuration["SmtpSettings:FromEmail"] ?? "no-reply@ecommerce-microservices.com";

        if (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(smtpUser))
        {
            logger.LogInformation("[DEV EMAIL SIMULATOR] To: {ToEmail} | Subject: {Subject}\nBody Preview:\n{Body}", toEmail, subject, htmlBody);
            return;
        }

        try
        {
            int port = int.TryParse(smtpPortStr, out var p) ? p : 587;
            using var client = new SmtpClient(smtpHost, port)
            {
                Credentials = new NetworkCredential(smtpUser, smtpPass),
                EnableSsl = true
            };

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(fromEmail, "Ecommerce System"),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            mailMessage.To.Add(toEmail);

            await client.SendMailAsync(mailMessage);
            logger.LogInformation("Successfully sent email to {ToEmail} with Subject: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {ToEmail}. Subject: {Subject}", toEmail, subject);
            // Fallback log in dev
            logger.LogInformation("[DEV EMAIL FALLBACK] To: {ToEmail} | Subject: {Subject}\nBody:\n{Body}", toEmail, subject, htmlBody);
        }
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string fullName)
    {
        var html = $@"
        <div style='font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px;'>
            <div style='max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;'>
                <h2 style='color: #0f172a; font-size: 20px; font-weight: 800; margin-top: 0;'>Chào mừng {WebUtility.HtmlEncode(fullName)} đến với Ecommerce! 🎉</h2>
                <p style='color: #475569; font-size: 14px; line-height: 1.6;'>Tài khoản của bạn đã được khởi tạo thành công trên hệ thống Ecommerce Microservices.</p>
                <p style='color: #475569; font-size: 14px; line-height: 1.6;'>Hãy khám phá hàng ngàn sản phẩm chất lượng và trải nghiệm dịch vụ mua sắm hiện đại ngay hôm nay.</p>
                <div style='margin-top: 24px; text-align: center;'>
                    <a href='http://localhost:3000' style='background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 99px; text-decoration: none; font-weight: bold; font-size: 13px; inline-block;'>Khám Phá Sàn Ngay</a>
                </div>
            </div>
        </div>";

        await SendHtmlEmailAsync(toEmail, "Chào mừng bạn đến với Ecommerce Platform!", html);
    }

    public async Task SendResetPasswordOtpEmailAsync(string toEmail, string otpCode)
    {
        var html = $@"
        <div style='font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px;'>
            <div style='max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;'>
                <h2 style='color: #0f172a; font-size: 20px; font-weight: 800; margin-top: 0;'>Mã OTP Khôi Phục Mật Khẩu 🔒</h2>
                <p style='color: #475569; font-size: 14px;'>Bạn vừa gửi yêu cầu khôi phục mật khẩu. Đây là mã OTP xác nhận của bạn (có hiệu lực trong 5 phút):</p>
                <div style='background-color: #f1f5f9; padding: 16px; border-radius: 12px; text-align: center; margin: 20px 0;'>
                    <span style='font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #0f172a;'>{otpCode}</span>
                </div>
                <p style='color: #64748b; font-size: 12px;'>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ bộ phận hỗ trợ.</p>
            </div>
        </div>";

        await SendHtmlEmailAsync(toEmail, $"Mã OTP Khôi Phục Mật Khẩu [{otpCode}]", html);
    }

    public async Task SendNewDeviceLoginAlertEmailAsync(string toEmail, string deviceName, string ipAddress, DateTimeOffset loginTime)
    {
        var html = $@"
        <div style='font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px;'>
            <div style='max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;'>
                <h2 style='color: #dc2626; font-size: 20px; font-weight: 800; margin-top: 0;'>⚠️ Cảnh Báo: Đăng Nhập Từ Thiết Bị Mới</h2>
                <p style='color: #475569; font-size: 14px;'>Hệ thống phát hiện tài khoản của bạn vừa đăng nhập từ một thiết bị mới:</p>
                <ul style='color: #334155; font-size: 13px; line-height: 1.8; background-color: #f8fafc; padding: 16px 24px; border-radius: 12px;'>
                    <li><b>Thiết bị:</b> {WebUtility.HtmlEncode(deviceName)}</li>
                    <li><b>Địa chỉ IP:</b> {WebUtility.HtmlEncode(ipAddress)}</li>
                    <li><b>Thời gian:</b> {loginTime:dd/MM/yyyy HH:mm:ss UTC}</li>
                </ul>
                <p style='color: #64748b; font-size: 12px;'>Nếu đây là bạn, không cần làm gì thêm. Nếu không phải bạn, hãy đổi mật khẩu ngay lập tức!</p>
            </div>
        </div>";

        await SendHtmlEmailAsync(toEmail, "Cảnh báo đăng nhập từ thiết bị mới!", html);
    }
}

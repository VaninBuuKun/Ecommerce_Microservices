using System;
using System.Collections.Generic;
using System.Globalization;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Ecommerce.Services.Notifications.Api.Models.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Notifications.Api.Services;

public class EmailService(
    IConfiguration configuration,
    ITemplateRenderer templateRenderer,
    ILogger<EmailService> logger)
    : IEmailService
{
    private async Task SendHtmlEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var smtpHost = configuration["SmtpSettings:Host"];
        var smtpPortStr = configuration["SmtpSettings:Port"];
        var smtpUser = configuration["SmtpSettings:Username"];
        var smtpPass = configuration["SmtpSettings:Password"];
        var fromEmail = configuration["SmtpSettings:FromEmail"] ?? "no-reply@buustore.com";

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
                From = new MailAddress(fromEmail, "BuuStore"),
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
            logger.LogInformation("[DEV EMAIL FALLBACK] To: {ToEmail} | Subject: {Subject}\nBody:\n{Body}", toEmail, subject, htmlBody);
        }
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string fullName)
    {
        var encodedName = WebUtility.HtmlEncode(fullName);
        var frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:5173";
        var exploreUrl = $"{frontendUrl}/login?email={Uri.EscapeDataString(toEmail)}&redirect=/";

        var replacements = new Dictionary<string, string>
        {
            ["FullName"] = encodedName,
            ["ExploreUrl"] = exploreUrl
        };

        var html = await templateRenderer.RenderAsync("WelcomeEmail", replacements);
        await SendHtmlEmailAsync(toEmail, "🎉 Chào mừng bạn đến với BuuStore!", html);
    }

    public async Task SendResetPasswordOtpEmailAsync(string toEmail, string otpCode)
    {
        var replacements = new Dictionary<string, string>
        {
            ["Badge"] = "Bảo mật",
            ["Title"] = "Mã OTP Khôi Phục Mật Khẩu 🔒",
            ["Description"] = $"Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản <strong>{WebUtility.HtmlEncode(toEmail)}</strong>. Sử dụng mã OTP dưới đây để xác nhận:",
            ["OtpCode"] = otpCode,
            ["ExpiryText"] = "Hiệu lực trong 5 phút",
            ["Note"] = "Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này để bảo đảm an toàn tài khoản."
        };

        var html = await templateRenderer.RenderAsync("OtpEmail", replacements);
        await SendHtmlEmailAsync(toEmail, $"Mã OTP Khôi Phục Mật Khẩu [{otpCode}] - BuuStore", html);
    }

    public async Task SendRegisterOtpEmailAsync(string toEmail, string otpCode)
    {
        var replacements = new Dictionary<string, string>
        {
            ["Badge"] = "Xác thực tài khoản",
            ["Title"] = "Mã OTP Xác Thực Đăng Ký Tài Khoản ⚡",
            ["Description"] = $"Chào mừng bạn đến với <strong>BuuStore</strong>! Sử dụng mã OTP dưới đây để hoàn tất quá trình kích hoạt tài khoản của bạn:",
            ["OtpCode"] = otpCode,
            ["ExpiryText"] = "Hiệu lực trong 5 phút",
            ["Note"] = "Tuyệt đối không chia sẻ mã OTP này cho bất kỳ ai, kể cả nhân viên hỗ trợ."
        };

        var html = await templateRenderer.RenderAsync("OtpEmail", replacements);
        await SendHtmlEmailAsync(toEmail, $"Mã OTP Xác Thực Đăng Ký [{otpCode}] - BuuStore", html);
    }

    public async Task SendWithdrawalSuccessEmailAsync(
        string toEmail,
        string fullName,
        decimal amount,
        string bankName,
        string bankAccountNumber,
        string bankAccountHolder,
        string? proofImageUrl,
        string? adminNote,
        DateTimeOffset completedAt)
    {
        var formattedAmount = amount.ToString("N0", new CultureInfo("vi-VN"));

        string adminNoteRow = string.IsNullOrWhiteSpace(adminNote) ? string.Empty : $@"
            <tr>
                <td style='color: #737373; font-size: 13px; padding: 4px 0;'>Ghi chú từ Admin:</td>
                <td align='right' style='color: #171717; font-size: 13px; font-style: italic; padding: 4px 0;'>{WebUtility.HtmlEncode(adminNote)}</td>
            </tr>";

        string proofImageSection = string.IsNullOrWhiteSpace(proofImageUrl) ? string.Empty : $@"
            <div style='margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; background-color: #f8fafc;'>
                <div style='padding: 10px 16px; background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #475569;'>
                    📸 Ảnh chứng từ chuyển khoản
                </div>
                <div style='padding: 12px; text-align: center;'>
                    <a href='{proofImageUrl}' target='_blank' style='display: inline-block;'>
                        <img src='{proofImageUrl}' alt='Chứng từ chuyển khoản' style='max-width: 100%; max-height: 360px; border-radius: 4px; border: 1px solid #cbd5e1; object-fit: contain;' />
                    </a>
                    <div style='margin-top: 6px; font-size: 11px; color: #94a3b8;'>
                        (Nhấp vào ảnh để xem kích thước đầy đủ)
                    </div>
                </div>
            </div>";

        var replacements = new Dictionary<string, string>
        {
            ["FullName"] = WebUtility.HtmlEncode(fullName),
            ["FormattedAmount"] = formattedAmount,
            ["BankName"] = WebUtility.HtmlEncode(bankName),
            ["BankAccountNumber"] = WebUtility.HtmlEncode(bankAccountNumber),
            ["BankAccountHolder"] = WebUtility.HtmlEncode(bankAccountHolder),
            ["CompletedAt"] = completedAt.ToString("dd/MM/yyyy HH:mm:ss") + " UTC",
            ["AdminNoteRow"] = adminNoteRow,
            ["ProofImageSection"] = proofImageSection
        };

        var html = await templateRenderer.RenderAsync("WithdrawalSuccessEmail", replacements);
        await SendHtmlEmailAsync(toEmail, $"[BuuStore] Chuyển tiền rút thành công (+{formattedAmount} VND)", html);
    }

    public async Task SendNewDeviceLoginAlertEmailAsync(string toEmail, string deviceName, string ipAddress, DateTimeOffset loginTime)
    {
        var replacements = new Dictionary<string, string>
        {
            ["Email"] = WebUtility.HtmlEncode(toEmail),
            ["DeviceName"] = WebUtility.HtmlEncode(deviceName),
            ["IpAddress"] = WebUtility.HtmlEncode(ipAddress),
            ["LoginTime"] = $"{loginTime:dd/MM/yyyy HH:mm:ss} UTC"
        };

        var html = await templateRenderer.RenderAsync("NewDeviceAlertEmail", replacements);
        await SendHtmlEmailAsync(toEmail, "⚠️ Cảnh báo đăng nhập thiết bị mới - BuuStore", html);
    }

    public async Task SendPasswordChangedEmailAsync(string toEmail, string fullName, DateTimeOffset changedAt)
    {
        var replacements = new Dictionary<string, string>
        {
            ["Email"] = WebUtility.HtmlEncode(toEmail),
            ["FullName"] = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(fullName) ? toEmail : fullName),
            ["ChangedAt"] = $"{changedAt:dd/MM/yyyy HH:mm:ss} UTC"
        };

        var html = await templateRenderer.RenderAsync("PasswordChangedSuccessEmail", replacements);
        await SendHtmlEmailAsync(toEmail, "🔒 Mật khẩu tài khoản BuuStore đã được thay đổi", html);
    }
}

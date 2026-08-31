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
        
        var html = $@"
        <!DOCTYPE html>
        <html lang='vi'>
        <head>
            <meta charset='utf-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        </head>
        <body style='margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #171717;'>
            <table role='presentation' width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color: #fafafa; padding: 32px 12px;'>
                <tr>
                    <td align='center'>
                        <table role='presentation' width='100%' border='0' cellspacing='0' cellpadding='0' style='max-width: 480px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 4px; overflow: hidden;'>
                            
                            <!-- Header: Nền Trắng - Chữ Xanh Emerald -->
                            <tr>
                                <td style='background-color: #ffffff; padding: 24px 28px 20px 28px; border-bottom: 1px solid #f0f0f0;'>
                                    <table role='presentation' width='100%' border='0' cellspacing='0' cellpadding='0'>
                                        <tr>
                                            <td>
                                                <span style='color: #10b981; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;'>⚡ BuuStore</span>
                                            </td>
                                            <td align='right'>
                                                <span style='color: #a3a3a3; font-size: 11px; font-weight: 600; text-transform: uppercase;'>Welcome</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Nội dung chính: Gọn nhẹ, năng động -->
                            <tr>
                                <td style='padding: 28px;'>
                                    <h1 style='color: #171717; font-size: 18px; font-weight: 700; margin: 0 0 12px 0; letter-spacing: -0.3px;'>
                                        Chào mừng {encodedName}! 👋
                                    </h1>
                                    
                                    <p style='color: #525252; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;'>
                                        Tài khoản mua sắm của bạn đã sẵn sàng tại <strong>BuuStore</strong>. Bắt đầu khám phá hàng ngàn sản phẩm chất lượng cùng các ưu đãi hấp dẫn ngay hôm nay.
                                    </p>

                                    <!-- Nút Khám Phá: Bo nhẹ 4px, năng động -->
                                    <div style='margin-bottom: 24px;'>
                                        <a href='{exploreUrl}' target='_blank' style='display: inline-block; background-color: #10b981; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 11px 24px; border-radius: 4px; letter-spacing: 0.2px;'>
                                            Khám Phá BuuStore &rarr;
                                        </a>
                                    </div>

                                    <!-- Quick Feature Strip -->
                                    <table role='presentation' width='100%' border='0' cellspacing='0' cellpadding='0' style='border-top: 1px solid #f5f5f5; padding-top: 16px;'>
                                        <tr>
                                            <td style='color: #737373; font-size: 12px; line-height: 1.5;'>
                                                🚀 Giao siêu tốc &bull; 🛡️ 100% Chính hãng &bull; 🎁 Ưu đãi độc quyền
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>";

        await SendHtmlEmailAsync(toEmail, "🎉 Chào mừng bạn đến với BuuStore!", html);
    }

    public async Task SendResetPasswordOtpEmailAsync(string toEmail, string otpCode)
    {
        var html = $@"
        <!DOCTYPE html>
        <html lang='vi'>
        <head>
            <meta charset='utf-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        </head>
        <body style='margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #171717;'>
            <table role='presentation' width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color: #fafafa; padding: 32px 12px;'>
                <tr>
                    <td align='center'>
                        <table role='presentation' width='100%' border='0' cellspacing='0' cellpadding='0' style='max-width: 480px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 4px; overflow: hidden;'>
                            
                            <!-- Header: Nền Trắng - Chữ Xanh Emerald -->
                            <tr>
                                <td style='background-color: #ffffff; padding: 24px 28px 20px 28px; border-bottom: 1px solid #f0f0f0;'>
                                    <table role='presentation' width='100%' border='0' cellspacing='0' cellpadding='0'>
                                        <tr>
                                            <td>
                                                <span style='color: #10b981; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;'>⚡ BuuStore</span>
                                            </td>
                                            <td align='right'>
                                                <span style='color: #a3a3a3; font-size: 11px; font-weight: 600; text-transform: uppercase;'>Bảo mật</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Nội dung OTP -->
                            <tr>
                                <td style='padding: 28px;'>
                                    <h1 style='color: #171717; font-size: 18px; font-weight: 700; margin: 0 0 12px 0; letter-spacing: -0.3px;'>
                                        Mã OTP Khôi Phục Mật Khẩu 🔒
                                    </h1>
                                    
                                    <p style='color: #525252; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;'>
                                        Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản <strong>{toEmail}</strong>. Sử dụng mã OTP dưới đây để xác nhận:
                                    </p>

                                    <!-- OTP Box: Gọn gàng, viền xanh nhẹ, bo 4px -->
                                    <div style='background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 16px; text-align: center; margin-bottom: 20px;'>
                                        <div style='font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #10b981; font-family: monospace;'>
                                            {otpCode}
                                        </div>
                                        <div style='color: #6b7280; font-size: 11px; margin-top: 4px;'>
                                            Hiệu lực trong 5 phút
                                        </div>
                                    </div>

                                    <p style='color: #a3a3a3; font-size: 12px; line-height: 1.5; margin: 0;'>
                                        Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này.
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>";

        await SendHtmlEmailAsync(toEmail, $"Mã OTP Khôi Phục Mật Khẩu [{otpCode}] - BuuStore", html);
    }

    public async Task SendNewDeviceLoginAlertEmailAsync(string toEmail, string deviceName, string ipAddress, DateTimeOffset loginTime)
    {
        var encodedDevice = WebUtility.HtmlEncode(deviceName);
        var encodedIp = WebUtility.HtmlEncode(ipAddress);

        var html = $@"
        <!DOCTYPE html>
        <html lang='vi'>
        <head>
            <meta charset='utf-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        </head>
        <body style='margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #171717;'>
            <table role='presentation' width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color: #fafafa; padding: 32px 12px;'>
                <tr>
                    <td align='center'>
                        <table role='presentation' width='100%' border='0' cellspacing='0' cellpadding='0' style='max-width: 480px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 4px; overflow: hidden;'>
                            
                            <!-- Header: Nền Trắng - Chữ Xanh Emerald -->
                            <tr>
                                <td style='background-color: #ffffff; padding: 24px 28px 20px 28px; border-bottom: 1px solid #f0f0f0;'>
                                    <table role='presentation' width='100%' border='0' cellspacing='0' cellpadding='0'>
                                        <tr>
                                            <td>
                                                <span style='color: #10b981; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;'>⚡ BuuStore</span>
                                            </td>
                                            <td align='right'>
                                                <span style='color: #ef4444; font-size: 11px; font-weight: 600; text-transform: uppercase;'>Cảnh báo</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Nội dung Cảnh báo -->
                            <tr>
                                <td style='padding: 28px;'>
                                    <h1 style='color: #171717; font-size: 18px; font-weight: 700; margin: 0 0 12px 0; letter-spacing: -0.3px;'>
                                        Đăng nhập từ thiết bị mới ⚠️
                                    </h1>
                                    
                                    <p style='color: #525252; font-size: 14px; line-height: 1.6; margin: 0 0 18px 0;'>
                                        Tài khoản <strong>{toEmail}</strong> vừa đăng nhập từ thiết bị mới:
                                    </p>

                                    <!-- Bảng chi tiết: Bo 4px -->
                                    <table role='presentation' width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color: #fafafa; border: 1px solid #f0f0f0; border-radius: 4px; margin-bottom: 20px;'>
                                        <tr>
                                            <td style='padding: 14px 18px;'>
                                                <table role='presentation' width='100%' border='0' cellspacing='0' cellpadding='0'>
                                                    <tr>
                                                        <td style='color: #737373; font-size: 12px; padding: 3px 0;'>Thiết bị:</td>
                                                        <td align='right' style='color: #171717; font-size: 13px; font-weight: 600; padding: 3px 0;'>{encodedDevice}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style='color: #737373; font-size: 12px; padding: 3px 0;'>Địa chỉ IP:</td>
                                                        <td align='right' style='color: #171717; font-size: 13px; font-weight: 600; font-family: monospace; padding: 3px 0;'>{encodedIp}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style='color: #737373; font-size: 12px; padding: 3px 0;'>Thời gian:</td>
                                                        <td align='right' style='color: #171717; font-size: 12px; padding: 3px 0;'>{loginTime:dd/MM/yyyy HH:mm:ss} UTC</td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style='color: #a3a3a3; font-size: 12px; line-height: 1.5; margin: 0;'>
                                        Nếu không phải bạn đăng nhập, vui lòng đổi mật khẩu ngay để bảo vệ tài khoản.
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>";

        await SendHtmlEmailAsync(toEmail, "⚠️ Cảnh báo đăng nhập thiết bị mới - BuuStore", html);
    }
}

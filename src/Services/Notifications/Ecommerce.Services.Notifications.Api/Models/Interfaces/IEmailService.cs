using System;
using System.Threading.Tasks;

namespace Ecommerce.Services.Notifications.Api.Models.Interfaces;

public interface IEmailService
{
    Task SendWelcomeEmailAsync(string toEmail, string fullName);
    Task SendResetPasswordOtpEmailAsync(string toEmail, string otpCode);
    Task SendRegisterOtpEmailAsync(string toEmail, string otpCode);
    Task SendWithdrawalSuccessEmailAsync(
        string toEmail,
        string fullName,
        decimal amount,
        string bankName,
        string bankAccountNumber,
        string bankAccountHolder,
        string? proofImageUrl,
        string? adminNote,
        DateTimeOffset completedAt);
    Task SendNewDeviceLoginAlertEmailAsync(string toEmail, string deviceName, string ipAddress, DateTimeOffset loginTime);
    Task SendPasswordChangedEmailAsync(string toEmail, string fullName, DateTimeOffset changedAt);
}

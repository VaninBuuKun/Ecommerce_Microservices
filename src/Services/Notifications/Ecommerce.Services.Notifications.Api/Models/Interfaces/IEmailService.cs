using System;
using System.Threading.Tasks;

namespace Ecommerce.Services.Notifications.Api.Models.Interfaces;

public interface IEmailService
{
    Task SendWelcomeEmailAsync(string toEmail, string fullName);
    Task SendResetPasswordOtpEmailAsync(string toEmail, string otpCode);
    Task SendNewDeviceLoginAlertEmailAsync(string toEmail, string deviceName, string ipAddress, DateTimeOffset loginTime);
}

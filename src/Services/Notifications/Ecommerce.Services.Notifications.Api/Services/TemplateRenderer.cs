using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Ecommerce.Services.Notifications.Api.Models.Interfaces;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Notifications.Api.Services;

public class TemplateRenderer(ILogger<TemplateRenderer> logger) : ITemplateRenderer
{
    private static readonly ConcurrentDictionary<string, string> TemplateCache = new();

    public async Task<string> RenderAsync(string templateName, IDictionary<string, string> replacements)
    {
        string rawHtml;

        if (TemplateCache.TryGetValue(templateName, out var cachedTemplate))
        {
            rawHtml = cachedTemplate;
        }
        else
        {
            var baseDir = AppContext.BaseDirectory;
            
            //Path dựa vào AppContext.BaseDirectory, thường là /bin/Debug/net9.0/ hoặc /bin/Release/net9.0/, khi build file dll (dùng trong production).
            var path1 = Path.Combine(baseDir, "Templates", "Emails", $"{templateName}.html");
            //Dựa trên thư mục gốc chạy dự án, project ví dụ notification.Api 
            var path2 = Path.Combine(Directory.GetCurrentDirectory(), "Templates", "Emails", $"{templateName}.html");

            string targetPath = File.Exists(path1) ? path1 : (File.Exists(path2) ? path2 : string.Empty);

            if (string.IsNullOrEmpty(targetPath) || !File.Exists(targetPath))
            {
                logger.LogError("Email template '{TemplateName}' not found in paths: {Path1} or {Path2}", templateName, path1, path2);
                throw new FileNotFoundException($"Email template '{templateName}.html' not found.");
            }

            rawHtml = await File.ReadAllTextAsync(targetPath);
            TemplateCache[templateName] = rawHtml;
        }

        var rendered = rawHtml;
        foreach (var (key, value) in replacements)
        {
            rendered = rendered.Replace($"{{{{{key}}}}}", value ?? string.Empty);
        }

        return rendered;
    }
}

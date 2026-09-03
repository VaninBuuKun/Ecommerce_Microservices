using System.Collections.Generic;
using System.Threading.Tasks;

namespace Ecommerce.Services.Notifications.Api.Models.Interfaces;

public interface ITemplateRenderer
{
    Task<string> RenderAsync(string templateName, IDictionary<string, string> replacements);
}

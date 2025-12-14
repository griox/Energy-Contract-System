namespace Api.Services.Interfaces;

public interface ITemplateService
{
    Task<string> GetTemplateByNameAsync(string templateName);
    Task<IEnumerable<Models.PdfTemplates>> GetAllTemplatesAsync();
    Task<Models.PdfTemplates?> GetTemplateByIdAsync(int id);
    Task<Models.PdfTemplates> CreateTemplateAsync(VMs.CreateTemplateDto dto);
    Task<Models.PdfTemplates?> UpdateTemplateAsync(int id, VMs.UpdateTemplateDto dto);
    Task<bool> DeleteTemplateAsync(int id);
    string RenderTemplate(string template, Dictionary<string, string> data);
}
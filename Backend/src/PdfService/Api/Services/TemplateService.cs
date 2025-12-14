using Api.Infrastructures.Data;
using Api.Models;
using Api.Services.Interfaces;
using Api.VMs;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public class TemplateService : ITemplateService
{
    private readonly ILogger<TemplateService> _logger;
    private readonly PdfDbContext _dbContext;
    public TemplateService(ILogger<TemplateService> logger, PdfDbContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }
    public async Task<string> GetTemplateByNameAsync(string templateName)
    {
        var template = await _dbContext.PdfTemplates
            .FirstOrDefaultAsync(t => t.Name == templateName && t.IsActive && !t.IsDeleted);

        if (template == null)
        {
            _logger.LogError($"Template not found: {templateName}");
            throw new Exception($"Template '{templateName}' not found");
        }

        return template.HtmlContent;
    }

    public async Task<IEnumerable<PdfTemplates>> GetAllTemplatesAsync()
    {
        return await _dbContext.PdfTemplates
            .Where(t => !t.IsDeleted)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<PdfTemplates?> GetTemplateByIdAsync(int id)
    {
        return await _dbContext.PdfTemplates
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);
    }

    public async Task<PdfTemplates> CreateTemplateAsync(CreateTemplateDto dto)
    {
        var template = new PdfTemplates
        {
            Name = dto.Name,
            Description = dto.Description,
            HtmlContent = dto.HtmlContent,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.PdfTemplates.Add(template);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation($"Template created: {template.Name}");
        return template;
    }

    public async Task<PdfTemplates?> UpdateTemplateAsync(int id, UpdateTemplateDto dto)
    {
        var template = await _dbContext.PdfTemplates.FindAsync(id);
        if (template == null || template.IsDeleted)
            return null;

        if (!string.IsNullOrEmpty(dto.Description))
            template.Description = dto.Description;

        if (!string.IsNullOrEmpty(dto.HtmlContent))
            template.HtmlContent = dto.HtmlContent;

        if (dto.IsActive.HasValue)
            template.IsActive = dto.IsActive.Value;

        template.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation($"Template updated: {template.Name}");
        return template;
    }

    public async Task<bool> DeleteTemplateAsync(int id)
    {
        var template = await _dbContext.PdfTemplates.FindAsync(id);
        if (template == null)
            return false;

        template.IsDeleted = true;
        template.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation($"Template deleted: {template.Name}");
        return true;
    }

    public string RenderTemplate(string template, Dictionary<string, string> data)
    {
        var result = template;
        foreach (var item in data)
        {
            result = result.Replace($"{{{item.Key}}}", item.Value);
        }
        return result;
    }
}
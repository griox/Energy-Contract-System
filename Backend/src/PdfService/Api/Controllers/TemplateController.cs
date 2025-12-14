using Api.Services.Interfaces;
using Api.VMs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;
[ApiController]
[Route("api/templates")]
[Authorize]
public class TemplateController : ControllerBase
{
    private readonly ITemplateService _templateService;
    private readonly ILogger<TemplateController> _logger;
    public TemplateController(ITemplateService templateService, ILogger<TemplateController> logger)
    {
        _templateService = templateService;
        _logger = logger;
    }
    /// <summary>
    /// Get all templates
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllTemplates()
    {
        var templates = await _templateService.GetAllTemplatesAsync();
        return Ok(templates);
    }

    /// <summary>
    /// Get template by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTemplateById(int id)
    {
        var template = await _templateService.GetTemplateByIdAsync(id);
        if (template == null)
        {
            return NotFound(new { message = $"Template with ID {id} not found" });
        }
        return Ok(template);
    }
    /// <summary>
    /// Get template by name
    /// </summary>
    [HttpGet("by-name/{name}")]
    public async Task<IActionResult> GetTemplateByName(string name)
    {
        try
        {
            var htmlContent = await _templateService.GetTemplateByNameAsync(name);
            return Ok(new { name, htmlContent });
        }
        catch (Exception ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
    /// <summary>
    /// Create new template
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var template = await _templateService.CreateTemplateAsync(dto);
        return CreatedAtAction(nameof(GetTemplateById), new { id = template.Id }, template);
    }
    /// <summary>
    /// Update template
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTemplate(int id, [FromBody] UpdateTemplateDto dto)
    {
        var template = await _templateService.UpdateTemplateAsync(id, dto);
        if (template == null)
        {
            return NotFound(new { message = $"Template with ID {id} not found" });
        }
        return Ok(template);
    }
    /// <summary>
    /// Delete template (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTemplate(int id)
    {
        var result = await _templateService.DeleteTemplateAsync(id);
        if (!result)
        {
            return NotFound(new { message = $"Template with ID {id} not found" });
        }
        return NoContent();
    }
}
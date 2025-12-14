namespace Api.VMs;

public class TemplateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
public class CreateTemplateDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class UpdateTemplateDto
{
    public string? Description { get; set; }
    public string? HtmlContent { get; set; }
    public bool? IsActive { get; set; }
}
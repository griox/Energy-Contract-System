
using Api.Common;

namespace Api.Models;

public class PdfTemplates : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string? PreviewImageUrl { get; set; }
}
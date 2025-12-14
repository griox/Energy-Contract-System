using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Infrastructures.Data;

public class PdfDbContext : DbContext
{
    public PdfDbContext(DbContextOptions<PdfDbContext> options) : base(options)
    {
    }
    public DbSet<PdfTemplates> PdfTemplates { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<PdfTemplates>(entity =>
        {
            entity.ToTable("pdf_templates");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.HtmlContent).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.IsActive);
        });

        // Seed default template
        modelBuilder.Entity<PdfTemplates>().HasData(
            new PdfTemplates
            {
                Id = 1,
                Name = "ContractTemplate",
                Description = "Default contract template",
                IsActive = true,
                HtmlContent = GetDefaultTemplate()
            }
        );
    }
    private static string GetDefaultTemplate()
    {
        return @"<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 40px; }
        .header h1 { color: #2c3e50; font-size: 32px; text-transform: uppercase; margin: 0; }
        .info { margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #3498db; }
        .info label { font-weight: bold; color: #2c3e50; }
        .footer { margin-top: 50px; text-align: center; color: #7f8c8d; font-size: 12px; }
    </style>
</head>
<body>
    <div class='header'>
        <h1>Service Contract</h1>
        <p>Contract Number: {ContractNumber}</p>
    </div>
    <div class='info'>
        <label>Client:</label> {FullName}<br>
        <label>Email:</label> {Email}<br>
        <label>Phone:</label> {Phone}<br>
        <label>Period:</label> {StartDate} - {EndDate}<br>
        <label>Amount:</label> {Currency} {TotalAmount}
    </div>
    <div class='footer'>
        <p>Generated: {GeneratedDate}</p>
    </div>
</body>
</html>";
    }
}
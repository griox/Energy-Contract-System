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
    // Trong file Api/Infrastructures/Data/PdfDbContext.cs

private static string GetDefaultTemplate()
{
    return @"<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.6; color: #000; padding: 40px; }
        
        /* Layout Header */
        .header-section { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
        .company-info h1 { margin: 0; font-size: 24px; text-transform: uppercase; color: #2c3e50; }
        .company-info p { margin: 5px 0 0; font-size: 12px; color: #555; }
        .contract-meta { text-align: right; }
        .contract-meta p { margin: 2px 0; font-weight: bold; }

        /* Titles */
        .doc-title { text-align: center; font-size: 28px; font-weight: bold; margin: 40px 0 20px; text-transform: uppercase; letter-spacing: 2px; }
        .section-title { background-color: #f0f0f0; padding: 8px; font-weight: bold; border-left: 5px solid #2c3e50; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase; font-size: 14px; }

        /* Info Grid */
        .info-grid { display: table; width: 100%; margin-bottom: 20px; }
        .info-row { display: table-row; }
        .info-label { display: table-cell; width: 150px; font-weight: bold; padding: 5px 0; }
        .info-value { display: table-cell; padding: 5px 0; }

        /* Order Table */
        table.order-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
        table.order-table th { background-color: #2c3e50; color: white; padding: 10px; text-align: left; }
        table.order-table td { border: 1px solid #ddd; padding: 10px; }
        table.order-table tr:nth-child(even) { background-color: #f9f9f9; }

        /* Footer / Signatures */
        .signatures { margin-top: 80px; display: table; width: 100%; }
        .sign-box { display: table-cell; width: 50%; text-align: center; vertical-align: top; }
        .sign-line { margin-top: 60px; border-top: 1px solid #000; width: 80%; margin-left: auto; margin-right: auto; }
        
        .footer-note { margin-top: 50px; font-size: 10px; text-align: center; color: #777; border-top: 1px solid #eee; padding-top: 10px; }
    </style>
</head>
<body>

    <div class='header-section'>
        <div class='company-info'>
            <h1>ENERGY PROVIDER CORP</h1>
            <p>123 Power Street, Energy City, Country</p>
            <p>Support: support@energycorp.com | Hotline: 1900-123-456</p>
        </div>
        <div class='contract-meta'>
            <p>Ref No: {ContractNumber}</p>
            <p>Date: {GeneratedDate}</p>
        </div>
    </div>

    <div class='doc-title'>Service Contract</div>

    <p>This Contract is made and entered into between <strong>ENERGY PROVIDER CORP</strong> (hereinafter referred to as ""Provider"") and the Customer listed below.</p>

    <div class='section-title'>1. Customer Information</div>
    <div class='info-grid'>
        <div class='info-row'>
            <span class='info-label'>Full Name:</span>
            <span class='info-value'>{FullName}</span>
        </div>
        <div class='info-row'>
            <span class='info-label'>Company:</span>
            <span class='info-value'>{CompanyName}</span>
        </div>
        <div class='info-row'>
            <span class='info-label'>Email:</span>
            <span class='info-value'>{Email}</span>
        </div>
        <div class='info-row'>
            <span class='info-label'>Phone:</span>
            <span class='info-value'>{Phone}</span>
        </div>
        <div class='info-row'>
            <span class='info-label'>Bank Account:</span>
            <span class='info-value'>{BankAccount}</span>
        </div>
    </div>

    <div class='section-title'>2. Contract Terms & Payment</div>
    <div class='info-grid'>
        <div class='info-row'>
            <span class='info-label'>Contract Period:</span>
            <span class='info-value'>From <strong>{StartDate}</strong> To <strong>{EndDate}</strong></span>
        </div>
        <div class='info-row'>
            <span class='info-label'>Total Value:</span>
            <span class='info-value' style='font-size: 16px; color: #e74c3c;'><strong>{TotalAmount} {Currency}</strong></span>
        </div>
    </div>

    <div class='section-title'>3. Registered Services (Orders)</div>
    <p>The Customer hereby agrees to subscribe to the following services under this contract:</p>
    
    <table class='order-table'>
        <thead>
            <tr>
                <th>Order No.</th>
                <th>Type</th>
                <th>Period</th>
                <th>Status</th>
                <th style='text-align: right;'>Fee</th>
            </tr>
        </thead>
        <tbody>
            {OrderRows}
        </tbody>
    </table>

    <div class='signatures'>
        <div class='sign-box'>
            <p><strong>REPRESENTATIVE OF PROVIDER</strong></p>
            <div class='sign-line'></div>
            <p>Director Signature</p>
        </div>
        <div class='sign-box'>
            <p><strong>REPRESENTATIVE OF CUSTOMER</strong></p>
            <div class='sign-line'></div>
            <p>{FullName}</p>
        </div>
    </div>

    <div class='footer-note'>
        This document is generated electronically and is valid without a physical signature in accordance with e-commerce regulations.<br>
        System generated at {GeneratedDate}.
    </div>

</body>
</html>";
}
}
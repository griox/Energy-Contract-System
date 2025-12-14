using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pdf_templates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    HtmlContent = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    PreviewImageUrl = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pdf_templates", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "pdf_templates",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "Description", "HtmlContent", "IsActive", "IsDeleted", "Name", "PreviewImageUrl", "UpdatedAt", "UpdatedBy" },
                values: new object[] { 1, null, null, "Default contract template", "<!DOCTYPE html>\n<html>\n<head>\n    <meta charset='UTF-8'>\n    <style>\n        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }\n        .header { text-align: center; border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 40px; }\n        .header h1 { color: #2c3e50; font-size: 32px; text-transform: uppercase; margin: 0; }\n        .info { margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #3498db; }\n        .info label { font-weight: bold; color: #2c3e50; }\n        .footer { margin-top: 50px; text-align: center; color: #7f8c8d; font-size: 12px; }\n    </style>\n</head>\n<body>\n    <div class='header'>\n        <h1>Service Contract</h1>\n        <p>Contract Number: {ContractNumber}</p>\n    </div>\n    <div class='info'>\n        <label>Client:</label> {FullName}<br>\n        <label>Email:</label> {Email}<br>\n        <label>Phone:</label> {Phone}<br>\n        <label>Period:</label> {StartDate} - {EndDate}<br>\n        <label>Amount:</label> {Currency} {TotalAmount}\n    </div>\n    <div class='footer'>\n        <p>Generated: {GeneratedDate}</p>\n    </div>\n</body>\n</html>", true, false, "ContractTemplate", null, null, null });

            migrationBuilder.CreateIndex(
                name: "IX_pdf_templates_IsActive",
                table: "pdf_templates",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_pdf_templates_Name",
                table: "pdf_templates",
                column: "Name");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pdf_templates");
        }
    }
}

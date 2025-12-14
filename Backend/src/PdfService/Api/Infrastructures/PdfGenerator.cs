using Api.Services.Interfaces;
using PuppeteerSharp;
using PuppeteerSharp.Media;
using System;
using System.Threading.Tasks;

namespace Api.Infrastructures;

public class PdfGenerator : IPdfGenerator
{
    private readonly ILogger<PdfGenerator> _logger;

    public PdfGenerator(ILogger<PdfGenerator> logger)
    {
        _logger = logger;
    }

    public async Task<byte[]> GeneratePdfFromHtmlAsync(string htmlContent)
    {
        try
        {
            _logger.LogInformation("Starting PDF generation with PuppeteerSharp...");

            // Lấy đường dẫn từ biến môi trường (đã set trong Dockerfile)
            var executablePath = Environment.GetEnvironmentVariable("PUPPETEER_EXECUTABLE_PATH");

            // Nếu không có biến môi trường (chạy local window), fallback về logic cũ (tải browser)
            if (string.IsNullOrEmpty(executablePath))
            {
                var browserFetcher = new BrowserFetcher();
                await browserFetcher.DownloadAsync();
            }

            var launchOptions = new LaunchOptions
            {
                Headless = true,
                // Quan trọng: Trỏ vào Chromium đã cài trong Docker
                ExecutablePath = executablePath,
                Args = new[]
                {
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--font-render-hinting=none" // Giúp render font đẹp hơn trên Linux
                }
            };

            using var browser = await Puppeteer.LaunchAsync(launchOptions);
            using var page = await browser.NewPageAsync();

            // 4. Set nội dung HTML
            // Thêm CSS cơ bản để đảm bảo hiển thị đẹp
            var styledHtml = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <style>
                        body {{ font-family: 'Arial', sans-serif; font-size: 14px; line-height: 1.5; margin: 0; padding: 0; }}
                        table {{ width: 100%; border-collapse: collapse; margin-bottom: 15px; }}
                        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                        th {{ background-color: #f2f2f2; }}
                        h1, h2, h3 {{ color: #333; margin-top: 0; }}
                        .page-break {{ page-break-after: always; }}
                    </style>
                </head>
                <body>
                    {htmlContent}
                </body>
                </html>";

            await page.SetContentAsync(styledHtml, new NavigationOptions
            {
                WaitUntil = new[] { WaitUntilNavigation.Networkidle0 }
            });

            // 5. Xuất ra PDF
            var pdfBytes = await page.PdfDataAsync(new PdfOptions
            {
                Format = PaperFormat.A4,
                PrintBackground = true,
                MarginOptions = new MarginOptions
                {
                    Top = "20mm",
                    Bottom = "20mm",
                    Left = "20mm",
                    Right = "20mm"
                }
            });

            _logger.LogInformation("PDF generated successfully.");
            return pdfBytes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating PDF with PuppeteerSharp");
            throw;
        }
    }
}
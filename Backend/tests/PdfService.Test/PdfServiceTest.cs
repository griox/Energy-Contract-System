using Api.Services;
using Api.Services.Interfaces;
using Api.VMs;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Shared.Tests;
using Xunit;

namespace Api.Tests.Services
{
    public class PdfServiceTests : TestBase
    {
        private readonly Mock<IPdfGenerator> _mockPdfGenerator;
        private readonly Mock<IStorageService> _mockStorageService;
        private readonly Mock<ITemplateService> _mockTemplateService;
        private readonly Mock<ICustomerApiClient> _mockCustomerApiClient;
        private readonly Mock<ILogger<PdfService>> _mockLogger;

        private readonly PdfService _pdfService;

        public PdfServiceTests()
        {
            _mockPdfGenerator = new Mock<IPdfGenerator>();
            _mockStorageService = new Mock<IStorageService>();
            _mockTemplateService = new Mock<ITemplateService>();
            _mockCustomerApiClient = new Mock<ICustomerApiClient>();
            _mockLogger = new Mock<ILogger<PdfService>>();

            _pdfService = new PdfService(
                _mockPdfGenerator.Object,
                _mockStorageService.Object,
                _mockTemplateService.Object,
                _mockCustomerApiClient.Object,
                _mockLogger.Object
            );
        }

        #region GenerateContractPdfAsync Tests

        [Fact]
        public async Task GenerateContractPdfAsync_ShouldReturnSuccess_WhenAllStepsSucceed()
        {
            // --- ARRANGE ---
            var request = new ContractPdfRequest
            {
                ContractNumber = "HD-001",
                CurrentPdfUrl = "https://old-url.com/old.pdf",
                TemplateName = "MyTemplate",
                FirstName = "Huy",
                LastName = "Ngo",
                TotalAmount = 100000,
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddYears(1)
            };

            // Setup Template
            _mockTemplateService.Setup(x => x.GetTemplateByNameAsync(It.IsAny<string>()))
                .ReturnsAsync("<html>CONTENT</html>");
            _mockTemplateService.Setup(x => x.RenderTemplate(It.IsAny<string>(), It.IsAny<Dictionary<string, string>>()))
                .Returns("<html>RENDERED</html>");

            // Setup Generator
            byte[] fakeBytes = new byte[] { 1, 2, 3 };
            _mockPdfGenerator.Setup(x => x.GeneratePdfFromHtmlAsync(It.IsAny<string>()))
                .ReturnsAsync(fakeBytes);

            // --- KHẮC PHỤC LỖI TẠI ĐÂY ---
            // UploadPdfAsync có tham số thứ 3 là folder = "contracts"
            // Ta PHẢI truyền It.IsAny<string>() vào vị trí thứ 3 này.
            string newUrl = "https://storage.com/new.pdf";
            _mockStorageService.Setup(x => x.UploadPdfAsync(
                    fakeBytes, 
                    It.IsAny<string>(), 
                    It.IsAny<string>() // <--- QUAN TRỌNG: Tham số 'folder'
                ))
                .ReturnsAsync(newUrl);
            
            // Setup Delete (Trả về true vì kiểu là Task<bool>)
            _mockStorageService.Setup(x => x.DeleteFileAsync(It.IsAny<string>()))
                .ReturnsAsync(true);

            // --- ACT ---
            var result = await _pdfService.GenerateContractPdfAsync(request);

            // --- ASSERT ---
            result.Success.Should().BeTrue();
            result.PdfUrl.Should().Be(newUrl);

            _mockStorageService.Verify(x => x.DeleteFileAsync(request.CurrentPdfUrl), Times.Once);

            // Verify cũng phải đủ 3 tham số
            _mockStorageService.Verify(x => x.UploadPdfAsync(
                    fakeBytes, 
                    It.IsAny<string>(), 
                    It.IsAny<string>() // <--- QUAN TRỌNG
                ), Times.Once);
            
            _mockCustomerApiClient.Verify(x => x.UpdateContractPdfUrlAsync("HD-001", newUrl), Times.Once);
        }

        [Fact]
        public async Task GenerateContractPdfAsync_ShouldContinue_WhenDeleteOldFileFails()
        {
            // --- ARRANGE ---
            var request = new ContractPdfRequest { ContractNumber = "HD-002", CurrentPdfUrl = "https://fail-delete.com" };

            _mockStorageService.Setup(x => x.DeleteFileAsync(It.IsAny<string>()))
                .ThrowsAsync(new Exception("S3 Delete Error"));

            _mockTemplateService.Setup(x => x.GetTemplateByNameAsync(It.IsAny<string>())).ReturnsAsync("html");
            _mockPdfGenerator.Setup(x => x.GeneratePdfFromHtmlAsync(It.IsAny<string>())).ReturnsAsync(new byte[1]);
            
            // Fix lỗi Optional argument
            _mockStorageService.Setup(x => x.UploadPdfAsync(It.IsAny<byte[]>(), It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync("new-url");

            // --- ACT ---
            var result = await _pdfService.GenerateContractPdfAsync(request);

            // --- ASSERT ---
            result.Success.Should().BeTrue();
            result.PdfUrl.Should().Be("new-url");
            
            _mockStorageService.Verify(x => x.DeleteFileAsync(It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task GenerateContractPdfAsync_ShouldReturnSuccess_EvenIfCustomerApiFails()
        {
            // --- ARRANGE ---
            var request = new ContractPdfRequest { ContractNumber = "HD-003" };

            _mockTemplateService.Setup(x => x.GetTemplateByNameAsync(It.IsAny<string>())).ReturnsAsync("html");
            _mockPdfGenerator.Setup(x => x.GeneratePdfFromHtmlAsync(It.IsAny<string>())).ReturnsAsync(new byte[1]);
            
            // Fix lỗi Optional argument
            _mockStorageService.Setup(x => x.UploadPdfAsync(It.IsAny<byte[]>(), It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync("valid-url");

            _mockCustomerApiClient.Setup(x => x.UpdateContractPdfUrlAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new Exception("Customer Service Down"));

            // --- ACT ---
            var result = await _pdfService.GenerateContractPdfAsync(request);

            // --- ASSERT ---
            result.Success.Should().BeTrue();
            result.PdfUrl.Should().Be("valid-url");
        }

        [Fact]
        public async Task GenerateContractPdfAsync_ShouldFail_WhenPdfGenerationFails()
        {
            // --- ARRANGE ---
            var request = new ContractPdfRequest { ContractNumber = "HD-FAIL" };
            _mockTemplateService.Setup(x => x.GetTemplateByNameAsync(It.IsAny<string>())).ReturnsAsync("html");
            
            _mockPdfGenerator.Setup(x => x.GeneratePdfFromHtmlAsync(It.IsAny<string>()))
                .ThrowsAsync(new Exception("Generator Error"));

            // --- ACT ---
            var result = await _pdfService.GenerateContractPdfAsync(request);

            // --- ASSERT ---
            result.Success.Should().BeFalse();
            
            // Fix lỗi Verify Optional argument (Dù Never gọi thì syntax vẫn phải đúng)
            _mockStorageService.Verify(x => x.UploadPdfAsync(It.IsAny<byte[]>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        #endregion

        #region DownloadPdfAsync Tests

        [Fact]
        public async Task DownloadPdfAsync_ShouldReturnBytes_WhenUrlIsValid()
        {
            // --- ARRANGE ---
            string url = "https://myserver.com/contracts/file.pdf";
            byte[] expectedBytes = new byte[] { 10, 20, 30 };

            _mockStorageService.Setup(x => x.DownloadFileAsync(It.IsAny<string>()))
                .ReturnsAsync(expectedBytes);

            // --- ACT ---
            var result = await _pdfService.DownloadPdfAsync(url);

            // --- ASSERT ---
            result.Should().BeEquivalentTo(expectedBytes);
        }

        [Fact]
        public async Task DownloadPdfAsync_ShouldReturnEmpty_WhenUrlIsInvalid()
        {
            string invalidUrl = "invalid-url-format";
            var result = await _pdfService.DownloadPdfAsync(invalidUrl);
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task DownloadPdfAsync_ShouldReturnEmpty_WhenStorageThrowsException()
        {
            string url = "https://myserver.com/missing.pdf";
            
            _mockStorageService.Setup(x => x.DownloadFileAsync(It.IsAny<string>()))
                .ThrowsAsync(new Exception("File not found"));

            var result = await _pdfService.DownloadPdfAsync(url);
            result.Should().BeEmpty();
        }

        #endregion
    }
}
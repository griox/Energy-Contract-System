// File: Shared.Tests/TestBase.cs
using Microsoft.Extensions.Configuration;
using Serilog;

namespace Shared.Tests // Namespace chung
{
    public class TestBase : IDisposable
    {
        public TestBase()
        {
            // Code cấu hình y hệt như cũ
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory()) // Nó sẽ trỏ về thư mục bin của project đang chạy
                .AddJsonFile("appsettings.tests.json", optional: false, reloadOnChange: true)
                .Build();

            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(configuration)
                .CreateLogger();
        }

        public void Dispose()
        {
            Log.CloseAndFlush();
        }
    }
}
using Api.Infrastructures.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration; // Thêm
using Microsoft.Extensions.Logging;       // Thêm
using Serilog;                            // Thêm
using Serilog.Extensions.Logging;         // Thêm
using System;
using System.IO;

namespace AuthService.Tests.Base 
{
    public class BaseTest : IDisposable
    {
        protected readonly AuthDBContext _dbContext;

        public BaseTest()
        {
            // --- 1. CẤU HÌNH DB (Giữ nguyên code cũ của bạn) ---
            var options = new DbContextOptionsBuilder<AuthDBContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _dbContext = new AuthDBContext(options);
            _dbContext.Database.EnsureCreated();

            // --- 2. CẤU HÌNH SERILOG (Thêm mới vào đây) ---
            // Đọc file appsettings.test.json để lấy URL của Seq/Elasticsearch
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.tests.json", optional: false, reloadOnChange: true)
                .Build();

            // Khởi tạo Serilog Global
            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(configuration)
                .Enrich.FromLogContext()
                .CreateLogger();
        }

        // --- 3. HÀM HELPER ĐỂ TẠO LOGGER (Thêm mới) ---
        // Hàm này giúp các class con tạo ILogger<T> thật để truyền vào Service
        protected Microsoft.Extensions.Logging.ILogger<T> CreateSerilogLogger<T>()
        {
            var factory = new SerilogLoggerFactory(Log.Logger);
            return factory.CreateLogger<T>();
        }

        public void Dispose()
        {
            // Dispose DB
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();

            // Dispose Serilog (Đẩy nốt log còn sót lên server)
            Log.CloseAndFlush();
        }
    }
}
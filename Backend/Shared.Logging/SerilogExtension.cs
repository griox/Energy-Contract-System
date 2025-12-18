using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Events;
using Serilog.Sinks.SystemConsole.Themes;
using Microsoft.Extensions.Configuration;

namespace Shared.Logging;

public static class SerilogExtensions
{
    public static void ConfigureSerilog(this IHostBuilder hostBuilder, string applicationName)
    {
        hostBuilder.UseSerilog((context, services, configuration) =>
        {
            // 1. Cấu hình mặc định (Code cứng)
            configuration
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .MinimumLevel.Override("System", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
                
                .Enrich.FromLogContext()
                .Enrich.WithMachineName()
                .Enrich.WithThreadId()
                .Enrich.WithProperty("Application", applicationName)
                
                // Lọc log rác Health Check
                .Filter.ByExcluding(logEvent =>
                {
                    if (logEvent.Properties.TryGetValue("RequestPath", out var value))
                    {
                        var path = value.ToString();
                        return path.Contains("/health") || path.Contains("/liveness") || path.Contains("/metrics");
                    }
                    return false;
                })

                // Console màu
                .WriteTo.Console(
                    theme: AnsiConsoleTheme.Code,
                    outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} <s:{SourceContext}>{NewLine}{Exception}"
                );
            
            var seqUrl = Environment.GetEnvironmentVariable("SEQ_URL") // 👈 Render sẽ điền vào đây
                         ?? context.Configuration["Serilog:WriteTo:0:Args:serverUrl"] 
                         ?? "http://localhost:5341";

            // Nếu tìm thấy URL hợp lệ thì mới cấu hình bắn log
            if (!string.IsNullOrEmpty(seqUrl))
            {
                configuration.WriteTo.Seq(seqUrl);
            }
            
            // 3. Cho phép ghi đè thêm từ appsettings (nếu có)
            configuration.ReadFrom.Configuration(context.Configuration);
        });
    }
}
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Api.Infrastructures.Data;

public class PdfContextFactory : IDesignTimeDbContextFactory<PdfDbContext>
{
    public PdfDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<PdfDbContext>();

        // Connection string for design-time only
        optionsBuilder.UseNpgsql(
            "Host=localhost;Port=5432;Database=PdfServiceDb;Username=postgres;Password=admin",
            npgsqlOptions =>
            {
                npgsqlOptions.MigrationsHistoryTable("__ef_migrations_history");
            });

        return new PdfDbContext(optionsBuilder.Options);
    }
}

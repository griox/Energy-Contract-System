using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Infrastructures.Persistence;

public class ContractHistoryDbContext : DbContext
{
    public ContractHistoryDbContext(DbContextOptions<ContractHistoryDbContext> options) : base(options) { }

    public DbSet<ContractHistory> ContractHistories => Set<ContractHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ContractHistory>(e =>
        {
            e.ToTable("contract_history");
            e.HasKey(x => x.Id);

            e.Property(x => x.ContractId)
                .HasColumnName("contract_id")
                .IsRequired();

            e.Property(x => x.OldValue)
                .HasColumnName("old_value")
                .HasColumnType("jsonb");

            e.Property(x => x.NewValue)
                .HasColumnName("new_value")
                .HasColumnType("jsonb");

            e.Property(x => x.Timestamp)
                .HasColumnName("timestamp")
                .IsRequired();

            e.HasIndex(x => x.ContractId);
            e.HasIndex(x => x.Timestamp);
        });
    }
}
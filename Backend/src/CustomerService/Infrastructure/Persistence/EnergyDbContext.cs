using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;
// Tạo data base cho bảng
public class EnergyDbContext : DbContext
{
    public EnergyDbContext(DbContextOptions<EnergyDbContext> options)
        : base(options)
    {
    }
    public DbSet<Address> Addresses { get; set; }
    public DbSet<Contract> Contracts { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<Reseller> Resellers { get; set; }
    public DbSet<ContractHistory> ContractHistories { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // CONTRACT
        modelBuilder.Entity<Contract>()
            .HasIndex(c => c.ContractNumber);
        modelBuilder.Entity<Contract>()
            .HasIndex(c => c.Email);
        modelBuilder.Entity<Contract>()
            .HasIndex(c => c.StartDate);
        modelBuilder.Entity<Contract>()
            .HasIndex(c => c.ResellerId);

        // ORDER
        modelBuilder.Entity<Order>()
            .HasIndex(o => o.OrderNumber);
        modelBuilder.Entity<Order>()
            .HasIndex(o => o.Status);
        modelBuilder.Entity<Order>()
            .HasIndex(o => o.OrderType);
        modelBuilder.Entity<Order>()
            .HasIndex(o => o.StartDate);

        // RESELLER
        modelBuilder.Entity<Reseller>()
            .HasIndex(r => r.Name);
        modelBuilder.Entity<Reseller>()
            .HasIndex(r => r.Type);

        // ADDRESS
        modelBuilder.Entity<Address>()
            .HasIndex(a => a.ZipCode);
        modelBuilder.Entity<Address>()
            .HasIndex(a => a.HouseNumber);

        // CONTRACT HISTORY
        modelBuilder.Entity<ContractHistory>()
            .HasIndex(h => h.ContractId);
        modelBuilder.Entity<ContractHistory>()
            .HasIndex(h => h.Timestamp);
    }
}
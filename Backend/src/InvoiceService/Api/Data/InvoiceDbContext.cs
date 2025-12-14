using Microsoft.EntityFrameworkCore;
using Api.Models; // Nơi chứa ContractSubscription

namespace InvoiceService.Api.Infrastructures.Data;

public class InvoiceDbContext : DbContext
{
    public InvoiceDbContext(DbContextOptions<InvoiceDbContext> options) : base(options)
    {
    }

    // Khai báo bảng Subscriptions
    public DbSet<ContractSubscription> Subscriptions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Cấu hình thêm (nếu cần)
        modelBuilder.Entity<ContractSubscription>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ContractNumber).IsRequired();
            entity.Property(e => e.Email).IsRequired();
            
        });
    }
}
using Microsoft.EntityFrameworkCore;
using Api.Models;

namespace Api.Data;

public class InvoiceDbContext : DbContext
{
    public InvoiceDbContext(DbContextOptions<InvoiceDbContext> options) : base(options)
    {
    }

    // Đổi từ Subscriptions sang InvoiceOrders
    public DbSet<InvoiceOrder> InvoiceOrders { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<InvoiceOrder>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OriginalOrderId).IsRequired();
            entity.Property(e => e.Email).IsRequired();
            entity.HasIndex(e => e.EndDate); // Đánh index để Job quét nhanh hơn
        });
    }
}
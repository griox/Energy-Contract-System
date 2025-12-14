using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Infrastructures.Data;

public class AuthDBContext : DbContext
{
    public AuthDBContext(DbContextOptions<AuthDBContext> options) : base(options) { }
    
    public DbSet<User> Users { get; set; }
    public DbSet<Session> Sessions { get; set; }
}
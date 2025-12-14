using System.ComponentModel.DataAnnotations;

namespace Api.Models;

public class Session
{
    [Key]
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
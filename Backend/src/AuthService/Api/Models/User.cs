using System.ComponentModel.DataAnnotations;

namespace Api.Models;

public class User
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string Username { get; set; } = string.Empty;
    
    [Required]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string PasswordHash { get; set; } = string.Empty; // Lưu Hash, không lưu pass thật
    
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    
    public string Role { get; set; } = "User"; // "Admin" hoặc "User"
}
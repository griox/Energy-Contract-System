using System.ComponentModel.DataAnnotations;

namespace Api.VMs;

public class LoginRequest
{
    [Required]
    public string Username { get; set; }
    [Required]
    public string Password { get; set; }
}
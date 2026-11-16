
namespace AbsensiAsrama.Models;

public class User
{
    public int IdUser { get; set; }
    public string Nama { get; set; } = string.Empty;
    public string Nim { get; set; } = string.Empty;
    public string Asal { get; set; } = string.Empty;
    public string? NomorKamar { get; set; }
    public string JenisKelamin { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
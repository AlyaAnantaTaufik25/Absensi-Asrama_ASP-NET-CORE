
namespace AbsensiAsrama.Models;

public class Presensi
{
    public int IdPresensi { get; set; }
    public DateTime Waktu { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? FotoWajah { get; set; }
    public string? Keterangan { get; set; }
    public DateTime Tanggal { get; set; }
    public int IdUser { get; set; }
}
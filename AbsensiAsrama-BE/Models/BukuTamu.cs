namespace AbsensiAsrama.Models;

public class BukuTamu
{
    public int IdTamu { get; set; }
    public string NamaTamu { get; set; } = string.Empty;
    public string Relasi { get; set; } = string.Empty;
    public string NamaPenghuni { get; set; } = string.Empty;
    public string WaktuMasuk { get; set; } = string.Empty;
    public string WaktuKeluar { get; set; } = "—";
    public string Status { get; set; } = "Sedang berkunjung";
    public string? Catatan { get; set; }
    public DateTime Tanggal { get; set; } = DateTime.Today;
}

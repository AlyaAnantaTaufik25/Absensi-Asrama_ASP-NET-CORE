namespace AbsensiAsrama.Models;

public class KeluarMasuk
{
    public int IdLog { get; set; }
    public string NamaSantri { get; set; } = string.Empty;
    public string Kamar { get; set; } = string.Empty;
    public string Alasan { get; set; } = string.Empty;
    public string JamKeluar { get; set; } = string.Empty;
    public string JamKembali { get; set; } = "—";
    public string Status { get; set; } = "Belum kembali";
    public DateTime Tanggal { get; set; } = DateTime.Today;
}

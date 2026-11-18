namespace AbsensiAsrama.Models;

public class LaporanKejadian
{
    public int IdLaporan { get; set; }
    public string Judul { get; set; } = string.Empty;
    public string Tipe { get; set; } = string.Empty;
    public string Lokasi { get; set; } = string.Empty;
    public string TingkatKeparahan { get; set; } = "Ringan";
    public string Tanggal { get; set; } = string.Empty;
    public string Kronologi { get; set; } = string.Empty;
    public string Status { get; set; } = "Menunggu tindak lanjut";
    public DateTime DibuatPada { get; set; } = DateTime.Now;
}

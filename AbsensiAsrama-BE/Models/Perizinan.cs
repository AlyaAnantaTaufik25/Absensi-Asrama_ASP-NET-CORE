namespace AbsensiAsrama.Models;

public class Perizinan
{
    public int IdIzin { get; set; }
    public string Nim { get; set; } = string.Empty;
    public DateTime Tanggal { get; set; }
    public string Alasan { get; set; } = string.Empty;
    public string? FileBukti { get; set; }
    public string Status { get; set; } = "Menunggu";
}

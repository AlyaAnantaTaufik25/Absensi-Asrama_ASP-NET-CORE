namespace AbsensiAsrama.Models;

public class EventKegiatan
{
    public int IdEvent { get; set; }
    public string Judul { get; set; } = string.Empty;
    public string Kategori { get; set; } = "Umum";
    public string Lokasi { get; set; } = string.Empty;
    public string Tanggal { get; set; } = string.Empty;
    public string Waktu { get; set; } = string.Empty;
    public string Deskripsi { get; set; } = string.Empty;
    public string Penyelenggara { get; set; } = "Pengelola Asrama";
    public string Status { get; set; } = "Akan Datang";
    public DateTime DibuatPada { get; set; } = DateTime.Now;
}


namespace AbsensiAsrama.Models;

public class Gedung
{
    public int IdGedung { get; set; }
    public string NamaGedung { get; set; } = string.Empty;
    public int IdUser { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public int Radius { get; set; } = 150; // radius geofencing dalam meter
}

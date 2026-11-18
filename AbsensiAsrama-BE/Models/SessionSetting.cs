namespace AbsensiAsrama.Models;

public class SessionSetting
{
    public int Id { get; set; } = 1;
    public string SubuhStart { get; set; } = "04:00";
    public string SubuhEnd { get; set; } = "06:00";
    public string MalamStart { get; set; } = "18:00";
    public string MalamEnd { get; set; } = "20:30";
    public string UpdatedBy { get; set; } = "Fasilitator";
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}

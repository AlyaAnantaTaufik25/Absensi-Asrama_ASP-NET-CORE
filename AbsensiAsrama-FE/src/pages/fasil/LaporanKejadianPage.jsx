import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { getLaporanKejadian, createLaporanKejadian, updateLaporanKejadianStatus } from "../../services/api";
import { showToast } from "../../utils/toast";

export default function LaporanKejadianPage() {
  const [incidentType, setIncidentType] = useState("Fasilitas rusak");
  const [location, setLocation] = useState("Koridor Lt. 3");
  const [severity, setSeverity] = useState("Ringan");
  const [chronology, setChronology] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incidentTypes = [
    "Fasilitas rusak",
    "Kehilangan",
    "Pelanggaran",
    "Kesehatan / darurat",
    "Lainnya"
  ];

  const severityLevels = ["Ringan", "Sedang", "Mendesak"];

  const locations = [
    "Koridor Lt. 3",
    "Kamar mandi Lt. 3",
    "Pantry Lt. 3",
    "Tangga darurat Lt. 3",
    "Balkon Lt. 3",
    "Kamar B-301",
    "Kamar B-302",
    "Kamar B-303",
    "Kamar B-304",
    "Kamar B-305",
    "Kamar B-306",
    "Kamar B-307",
    "Kamar B-308",
    "Kamar B-309",
    "Kamar B-310",
    "Kamar B-311",
    "Kamar B-312"
  ];

  const [reports, setReports] = useState([]);

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await getLaporanKejadian();
        if (Array.isArray(data) && data.length > 0) {
          setReports(
            data.map((item) => ({
              id: item.idLaporan ? `LK-${String(item.idLaporan).padStart(3, "0")}` : item.id,
              rawId: item.idLaporan,
              title: item.judul,
              type: item.tipe,
              location: item.lokasi,
              severity: item.tingkatKeparahan,
              date: item.tanggal,
              status: item.status || "Dibuka",
              statusType: item.tingkatKeparahan === "Mendesak" ? "forwarded" : "open"
            }))
          );
        }
      } catch (err) {
        console.warn("Gagal memuat laporan kejadian:", err);
      }
    }
    loadReports();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chronology || chronology.trim().length < 10) {
      showToast("Mohon isi kronologi kejadian secara jelas.", "warning");
      return;
    }

    setIsSubmitting(true);
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    const derivedTitle =
      chronology.length > 35 ? chronology.substring(0, 35) + "..." : chronology;

    const payload = {
      judul: derivedTitle,
      tipe: incidentType,
      lokasi: location,
      tingkatKeparahan: severity,
      tanggal: today,
      kronologi: chronology
    };

    try {
      const res = await createLaporanKejadian(payload);
      const newId = res?.idLaporan || Date.now();
      const newReport = {
        id: `LK-${String(newId).padStart(3, "0")}`,
        rawId: newId,
        title: derivedTitle,
        type: incidentType,
        location: location,
        severity: severity,
        date: today,
        status: severity === "Mendesak" ? "Diteruskan ke pembina" : "Dibuka",
        statusType: severity === "Mendesak" ? "forwarded" : "open"
      };

      setReports((prev) => [newReport, ...prev]);
      setChronology("");
      setToastMessage("Laporan kejadian berhasil disimpan!");
      setTimeout(() => setToastMessage(""), 4000);
    } catch (err) {
      alert("Gagal menyimpan laporan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: fontStack }}>
      {/* 1. Header */}
      <div>
        <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1c1c1e", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
          Laporan Kejadian
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "#8e8e93" }}>
          Catat kejadian di lantai 3 agar dapat segera ditindaklanjuti pembina gedung.
        </p>
      </div>

      {toastMessage && (
        <div
          style={{
            backgroundColor: "rgba(52, 199, 89, 0.12)",
            border: "1px solid rgba(52, 199, 89, 0.25)",
            color: "#34c759",
            padding: "12px 18px",
            borderRadius: "12px",
            fontSize: "13.5px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* 2. Main 2-Column Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.3fr", gap: "24px", alignItems: "flex-start" }}>
        {/* Left Column: Form */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            padding: "26px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)"
          }}
        >
          <h2 style={{ fontSize: "17px", fontWeight: "700", color: "#1c1c1e", margin: "0 0 20px 0" }}>
            Buat Laporan Baru
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Jenis Kejadian */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1c1c1e", marginBottom: "10px" }}>
                Jenis Kejadian
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {incidentTypes.map((t) => {
                  const isSelected = incidentType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setIncidentType(t)}
                      style={{
                        padding: "7px 16px",
                        borderRadius: "10px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        border: isSelected ? "1.5px solid #007aff" : "1px solid #e5e5ea",
                        backgroundColor: isSelected ? "rgba(0, 122, 255, 0.1)" : "#f2f2f7",
                        color: isSelected ? "#007aff" : "#8e8e93",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        fontFamily: fontStack
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lokasi & Tingkat */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
              {/* Lokasi */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1c1c1e", marginBottom: "8px" }}>
                  Lokasi
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "12px",
                    border: "1px solid #e5e5ea",
                    fontSize: "13px",
                    color: "#1c1c1e",
                    backgroundColor: "#f2f2f7",
                    cursor: "pointer",
                    outline: "none",
                    fontFamily: fontStack
                  }}
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tingkat Keparahan */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1c1c1e", marginBottom: "8px" }}>
                  Tingkat Keparahan
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {severityLevels.map((lvl) => {
                    const isSelected = severity === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSeverity(lvl)}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          textAlign: "center",
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: "600",
                          border: isSelected ? "1.5px solid #007aff" : "1px solid #e5e5ea",
                          backgroundColor: isSelected ? "rgba(0, 122, 255, 0.1)" : "#f2f2f7",
                          color: isSelected ? "#007aff" : "#8e8e93",
                          cursor: "pointer",
                          fontFamily: fontStack,
                          transition: "all 0.15s ease"
                        }}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Kronologi */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1c1c1e", marginBottom: "8px" }}>
                Kronologi Kejadian
              </label>
              <textarea
                rows={4}
                value={chronology}
                onChange={(e) => setChronology(e.target.value)}
                placeholder="Jelaskan apa yang terjadi, waktu kejadian, dan pihak yang terlibat..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid #e5e5ea",
                  fontSize: "13.5px",
                  fontFamily: fontStack,
                  resize: "none",
                  outline: "none",
                  backgroundColor: "#f2f2f7",
                  color: "#1c1c1e",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Submit and Notice Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
              <span style={{ fontSize: "12.5px", color: "#8e8e93" }}>
                Laporan mendesak langsung diteruskan ke pembina gedung.
              </span>

              <button
                type="submit"
                style={{
                  backgroundColor: "#007aff",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 22px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 8px rgba(0, 122, 255, 0.3)",
                  fontFamily: fontStack
                }}
              >
                <Send size={14} />
                Kirim Laporan
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Riwayat Laporan */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            padding: "26px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)"
          }}
        >
          <h2 style={{ fontSize: "17px", fontWeight: "700", color: "#1c1c1e", margin: "0 0 16px 0" }}>
            Riwayat Kejadian Terbaru
          </h2>

          {reports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "#8e8e93", fontSize: "13.5px" }}>
              Belum ada laporan kejadian yang dicatat hari ini.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {reports.map((r) => (
                <div
                  key={r.id}
                  style={{
                    backgroundColor: "#f2f2f7",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    border: "1px solid #e5e5ea"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#007aff" }}>{r.id}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        backgroundColor: r.severity === "Mendesak" ? "rgba(255, 59, 48, 0.12)" : "rgba(255, 149, 0, 0.12)",
                        color: r.severity === "Mendesak" ? "#ff3b30" : "#ff9500"
                      }}
                    >
                      {r.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                    {r.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#8e8e93" }}>
                    {r.location} · {r.date}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

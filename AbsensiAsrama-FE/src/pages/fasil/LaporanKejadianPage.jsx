import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, Send } from "lucide-react";

export default function LaporanKejadianPage() {
  const [incidentType, setIncidentType] = useState("Fasilitas rusak");
  const [location, setLocation] = useState("Koridor Lt. 3");
  const [severity, setSeverity] = useState("Ringan");
  const [chronology, setChronology] = useState("");
  const [toastMessage, setToastMessage] = useState("");

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chronology || chronology.trim().length < 10) {
      alert("Mohon isi kronologi kejadian secara jelas.");
      return;
    }

    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" });

    // Derive a concise title from the chronology or type
    const derivedTitle =
      chronology.length > 35 ? chronology.substring(0, 35) + "..." : chronology;

    const newReport = {
      id: `LK-0${reports.length + 1}`,
      title: derivedTitle,
      type: incidentType,
      location: location,
      severity: severity,
      date: today,
      status: severity === "Mendesak" ? "Diteruskan ke pembina" : "Dibuka",
      statusType: severity === "Mendesak" ? "forwarded" : "open"
    };

    setReports([newReport, ...reports]);
    setChronology("");
    setToastMessage("Laporan berhasil dikirim dan dicatat!");
    setTimeout(() => setToastMessage(""), 4000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
          Laporan kejadian
        </h1>
        <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
          Catat kejadian di lantai 3 agar bisa ditindaklanjuti pembina gedung.
        </p>
      </div>

      {toastMessage && (
        <div
          style={{
            backgroundColor: "#dcfce7",
            border: "1px solid #bbf7d0",
            color: "#15803d",
            padding: "12px 18px",
            borderRadius: "10px",
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
        {/* Left Column: Buat Laporan Baru Form */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 20px 0" }}>
            Buat laporan baru
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Jenis Kejadian */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#0f172a", marginBottom: "10px" }}>
                Jenis kejadian
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
                        borderRadius: "999px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        border: isSelected ? "1px solid #2563eb" : "1px solid #e2e8f0",
                        backgroundColor: isSelected ? "#2563eb" : "#ffffff",
                        color: isSelected ? "#ffffff" : "#475569",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
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
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
                  Lokasi
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    color: "#0f172a",
                    backgroundColor: "#ffffff",
                    cursor: "pointer"
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
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
                  Tingkat
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
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "600",
                          border: isSelected ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                          backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
                          color: isSelected ? "#1d4ed8" : "#64748b",
                          cursor: "pointer"
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
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
                Kronologi (minimal 20 karakter)
              </label>
              <textarea
                rows={4}
                value={chronology}
                onChange={(e) => setChronology(e.target.value)}
                placeholder="Apa yang terjadi, kapan, dan siapa yang terlibat..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  resize: "none"
                }}
              />
            </div>

            {/* Submit and Notice Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Laporan mendesak langsung diteruskan ke pembina gedung.
              </span>

              <button
                type="submit"
                style={{
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 24px",
                  fontSize: "13.5px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
              >
                Kirim laporan
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Laporan Lantai 3 Cards */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 16px 0" }}>
            Laporan lantai 3
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {reports.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "#94a3b8", fontSize: "13px" }}>
                Belum ada laporan kejadian tercatat.
              </div>
            ) : (
              reports.map((rep) => {
              let badgeBg = "#fef3c7";
              let badgeColor = "#b45309";

              if (rep.statusType === "forwarded") {
                badgeBg = "#dbeafe";
                badgeColor = "#1d4ed8";
              } else if (rep.statusType === "resolved") {
                badgeBg = "#dcfce7";
                badgeColor = "#15803d";
              }

              return (
                <div
                  key={rep.id}
                  style={{
                    padding: "16px 18px",
                    borderRadius: "12px",
                    border: "1px solid #f1f5f9",
                    backgroundColor: "#fafafa"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "6px" }}>
                    <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>
                      {rep.title}
                    </div>

                    <span
                      style={{
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        whiteSpace: "nowrap",
                        flexShrink: 0
                      }}
                    >
                      {rep.status}
                    </span>
                  </div>

                  <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                    {rep.type} · {rep.location} · {rep.severity} · {rep.date}
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
      </div>
    </div>
  );
}


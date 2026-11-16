import React from "react";
import { ChevronRight } from "lucide-react";

export default function FasilDashboardPage({ setActiveTab }) {
  const scheduleItems = [
    {
      time: "04:00",
      title: "Verifikasi presensi Subuh",
      desc: "12 penghuni terverifikasi",
      status: "Selesai",
      statusType: "success"
    },
    {
      time: "19:00",
      title: "Verifikasi presensi Maghrib & Isya",
      desc: "1 penghuni belum tercatat",
      status: "Selesai",
      statusType: "success"
    },
    {
      time: "20:30",
      title: "Rekapitulasi kehadiran lantai 3",
      desc: "Sesi Maghrib & Isya ditutup",
      status: "Berlangsung",
      statusType: "active"
    },
    {
      time: "22:00",
      title: "Pengecekan jam malam",
      desc: "Gerbang asrama ditutup pukul 22:00",
      status: "Menunggu",
      statusType: "waiting"
    },
    {
      time: "23:30",
      title: "Verifikasi izin darurat malam",
      desc: "Log kepulangan santri & toleransi waktu",
      status: "Menunggu",
      statusType: "waiting"
    },
    {
      time: "03:30",
      title: "Persiapan presensi Subuh",
      desc: "Pengaturan sesi sholat berjamaah",
      status: "Menunggu",
      statusType: "waiting"
    }
  ];

  const actionItems = [
    {
      id: "presensi",
      title: "1 penghuni belum presensi",
      desc: "Wahyu Setiawan (B-312), sesi Maghrib & Isya sudah ditutup.",
      actionLabel: "Catat manual",
      targetTab: "presensi"
    },
    {
      id: "izin",
      title: "2 izin darurat menunggu",
      desc: "Taufik (B-303) dan Gilang (B-309) meminta keluar malam ini.",
      actionLabel: "Tinjau",
      targetTab: "izin"
    },
    {
      id: "keluar-masuk",
      title: "1 penghuni masih di luar",
      desc: "Farid Ramli (B-311), estimasi kembali 23:45.",
      actionLabel: "Lihat catatan",
      targetTab: "keluar-masuk"
    },
    {
      id: "laporan",
      title: "1 laporan masih terbuka",
      desc: "Suara bising setelah jam malam, lorong Lt. 3.",
      actionLabel: "Buka laporan",
      targetTab: "laporan"
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
              Selamat malam, Kak Alif
            </h1>
            <span
              style={{
                backgroundColor: "#dcfce7",
                color: "#15803d",
                fontSize: "12px",
                fontWeight: "600",
                padding: "3px 10px",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              Sedang bertugas
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
            Lantai 3 · Gedung Al-Farabi &nbsp;&nbsp; 12 penghuni · Jumat, 24 Mei 2024 · 21:10 WIB
          </p>
        </div>

        <button
          onClick={() => setActiveTab("rekap")}
          style={{
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 22px",
            fontSize: "13.5px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
        >
          Rekap kehadiran
        </button>
      </div>

      {/* 2. Top 4 Stat Cards in 1 Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "20px 24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
        }}
      >
        {/* Stat 1 */}
        <div style={{ borderRight: "1px solid #f1f5f9", paddingRight: "16px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748b", marginBottom: "6px", fontWeight: "500" }}>
            Hadir Maghrib & Isya
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: "#15803d" }}>10</span>
            <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "600" }}>/12</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div style={{ borderRight: "1px solid #f1f5f9", paddingRight: "16px", paddingLeft: "8px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748b", marginBottom: "6px", fontWeight: "500" }}>
            Izin
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#2563eb" }}>
            1
          </div>
        </div>

        {/* Stat 3 */}
        <div style={{ borderRight: "1px solid #f1f5f9", paddingRight: "16px", paddingLeft: "8px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748b", marginBottom: "6px", fontWeight: "500" }}>
            Belum presensi
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#ea580c" }}>
            1
          </div>
        </div>

        {/* Stat 4 */}
        <div style={{ paddingLeft: "8px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748b", marginBottom: "6px", fontWeight: "500" }}>
            Tingkat Kepatuhan
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: "#15803d" }}>91.7%</span>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.3fr", gap: "20px" }}>
        {/* Left Column: Tugas Jaga Hari Ini */}
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
            Tugas jaga hari ini
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {scheduleItems.map((item, idx) => {
              let badgeBg = "#f1f5f9";
              let badgeColor = "#64748b";
              if (item.statusType === "success") {
                badgeBg = "#dcfce7";
                badgeColor = "#15803d";
              } else if (item.statusType === "active") {
                badgeBg = "#dbeafe";
                badgeColor = "#1d4ed8";
              }

              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: idx === scheduleItems.length - 1 ? "0" : "16px",
                    borderBottom: idx === scheduleItems.length - 1 ? "none" : "1px solid #f1f5f9"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#0f172a",
                        minWidth: "48px",
                        paddingTop: "2px"
                      }}
                    >
                      {item.time}
                    </span>
                    <div>
                      <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      backgroundColor: badgeBg,
                      color: badgeColor,
                      fontSize: "11.5px",
                      fontWeight: "600",
                      padding: "4px 12px",
                      borderRadius: "6px"
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Perlu Tindakan */}
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
            Perlu tindakan
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {actionItems.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  paddingBottom: idx === actionItems.length - 1 ? "0" : "18px",
                  borderBottom: idx === actionItems.length - 1 ? "none" : "1px solid #f1f5f9"
                }}
              >
                <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a", marginBottom: "3px" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "12.5px", color: "#64748b", marginBottom: "8px", lineHeight: "1.4" }}>
                  {item.desc}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(item.targetTab)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "12.5px",
                    fontWeight: "700",
                    cursor: "pointer",
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  {item.actionLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


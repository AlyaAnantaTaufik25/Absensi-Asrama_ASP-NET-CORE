import React, { useState, useEffect } from "react";
import {
  Camera,
  MapPin,
  Sun,
  Moon,
  CheckCircle2,
  Plus,
  ChevronRight,
  FileText
} from "lucide-react";
import { getPresensi, getPerizinan } from "../services/api";

export default function DashboardPage({ user, setActiveTab }) {
  const [presensiList, setPresensiList] = useState([]);
  const [izinList, setIzinList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [presensiData, izinData] = await Promise.all([
          getPresensi(),
          getPerizinan()
        ]);
        if (Array.isArray(presensiData)) {
          const userPresensi = user?.id ? presensiData.filter((p) => p.idUser === user.id) : presensiData;
          setPresensiList(userPresensi);
        }
        if (Array.isArray(izinData)) {
          const userIzin = user?.nim ? izinData.filter((i) => i.nim === user.nim) : izinData;
          setIzinList(userIzin);
        }
      } catch (err) {
        console.warn("Gagal memuat data dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Hitung statistik riil dari database (KOSONG jika belum ada presensi di DB)
  const totalHadir = presensiList.filter((p) => p.status?.toLowerCase() === "hadir").length;
  const totalIzin = izinList.length;
  const totalAlpha = presensiList.filter((p) => p.status?.toLowerCase() === "alpha").length;
  const totalSesi = totalHadir + totalIzin + totalAlpha;
  const percentage = totalSesi > 0 ? ((totalHadir / totalSesi) * 100).toFixed(1) + " %" : "0 %";


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Greeting Row */}
      <div className="greeting-section">
        <div>
          <div className="greeting-title-wrap">
            <h1 className="greeting-name">Selamat Datang, {user?.displayName || user?.name || "Penghuni"}</h1>
            <span className="nim-badge">{user?.nim || "-"}</span>
          </div>
          <p className="greeting-subtitle">{user?.room || "Kamar Asrama"}</p>
        </div>

        <div className="greeting-date-info">
          {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Semester Ganjil
        </div>
      </div>

      {/* 2. Top 4 Stat Cards */}
      <div className="stat-cards-grid">
        {/* Card 1 */}
        <div className="stat-box-card">
          <div className="stat-box-label">Kehadiran semester ini</div>
          <div className="stat-box-val">{percentage}</div>
        </div>

        {/* Card 2 */}
        <div className="stat-box-card">
          <div className="stat-box-label">Total Sesi Hadir</div>
          <div className="stat-box-val">
            {totalHadir} <span className="stat-box-unit">sesi</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="stat-box-card">
          <div className="stat-box-label">Izin disetujui</div>
          <div className="stat-box-val">
            {totalIzin} <span className="stat-box-unit">sesi</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="stat-box-card">
          <div className="stat-box-label">Alpha</div>
          <div className="stat-box-val">
            {totalAlpha} <span className="stat-box-unit">sesi</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Active Session Banner + Sesi Hari Ini */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px" }}>
        {/* Left: Deep Blue Banner */}
        <div
          style={{
            backgroundColor: "#2349d4",
            background: "linear-gradient(135deg, #2349d4 0%, #1e3fae 100%)",
            borderRadius: "20px",
            padding: "28px 32px",
            color: "#ffffff",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 10px 25px -5px rgba(35, 73, 212, 0.3)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "180px"
          }}
        >
          {/* Subtle background circle decoration */}
          <div
            style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              pointerEvents: "none"
            }}
          />

          {/* Top row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
            <span
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(4px)",
                padding: "4px 12px",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#4ade80"
                }}
              />
              Sesi dibuka - sisa 42 menit
            </span>

            <button
              onClick={() => setActiveTab("presensi")}
              style={{
                backgroundColor: "#ffffff",
                color: "#2349d4",
                border: "none",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "12.5px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "transform 0.15s ease"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <Camera size={15} />
              Ambil Presensi
            </button>
          </div>

          {/* Middle: Title & description */}
          <div style={{ position: "relative", zIndex: 1, marginTop: "14px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 6px 0", letterSpacing: "-0.3px" }}>
              Presensi Subuh
            </h2>
            <p style={{ fontSize: "13px", opacity: 0.9, margin: 0, lineHeight: 1.5, maxWidth: "480px" }}>
              Sesi presensi pukul 04:00 - 06:00 WIB. Lakukan verifikasi wajah dari dalam area asrama.
            </p>
          </div>

          {/* Bottom: Location */}
          <div style={{ position: "relative", zIndex: 1, marginTop: "16px", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", opacity: 0.85 }}>
            <MapPin size={13} />
            <span>14 m dari titik pusat Asrama Hijau</span>
          </div>
        </div>

        {/* Right: Sesi Hari Ini Card */}
        <div className="content-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "14px" }}>
            Sesi hari ini
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Subuh */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #f1f5f9"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    backgroundColor: "#e8effe",
                    color: "#2349d4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Sun size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>Subuh</div>
                  <div style={{ fontSize: "11.5px", color: "#64748b" }}>04:00 - 06:00 WIB sedang berlangsung</div>
                </div>
              </div>

              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #bfdbfe",
                  color: "#2349d4"
                }}
              >
                Belum Absen
              </span>
            </div>

            {/* Magrib & Isya */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #f1f5f9"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Moon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>Magrib & Isya</div>
                  <div style={{ fontSize: "11.5px", color: "#64748b" }}>18:00 - 20:30 WIB mulai dalam 12 jam</div>
                </div>
              </div>

              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  backgroundColor: "#f1f5f9",
                  color: "#64748b"
                }}
              >
                Menunggu
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Aktivitas Terakhir (Left) + Status Izin & Pengumuman (Right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr", gap: "20px" }}>
        {/* Left: Aktivitas Terakhir */}
        <div className="content-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14.5px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Aktivitas terakhir
            </h3>
            <button
              onClick={() => setActiveTab("riwayat")}
              style={{
                background: "none",
                border: "none",
                color: "#2349d4",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Lihat semua
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {presensiList.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "36px 16px",
                  color: "#94a3b8",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px dashed #cbd5e1"
                }}
              >
                <CheckCircle2 size={30} style={{ margin: "0 auto 8px", color: "#cbd5e1" }} />
                <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#64748b" }}>
                  Belum Ada Riwayat Presensi
                </div>
                <div style={{ fontSize: "11.5px", marginTop: "4px", color: "#94a3b8" }}>
                  Presensi yang Anda lakukan di aplikasi akan otomatis tersimpan ke database MySQL dan tampil di sini.
                </div>
              </div>
            ) : (
              presensiList.slice(0, 5).map((item, idx) => (
                <div
                  key={item.idPresensi || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #f1f5f9"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        backgroundColor: item.status === "Izin" ? "#fef3c7" : "#dcfce7",
                        color: item.status === "Izin" ? "#b45309" : "#15803d",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                        Presensi Harian
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                        {item.waktu ? new Date(item.waktu).toLocaleString("id-ID") : "-"}
                      </div>
                    </div>
                  </div>

                  <span className={item.status === "Izin" ? "badge-status-yellow" : "badge-status-green"}>
                    {item.status || "Hadir"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Status Izin + Pengumuman */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Status Izin Box */}
          <div className="content-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Status Izin</span>
                <button
                  onClick={() => setActiveTab("izin")}
                  style={{
                    border: "none",
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    width: "22px",
                    height: "22px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer"
                  }}
                  title="Ajukan Izin"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {izinList.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px 12px",
                  color: "#94a3b8",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px dashed #cbd5e1"
                }}
              >
                <div style={{ fontSize: "12.5px", fontWeight: "600", color: "#64748b" }}>
                  Belum Ada Pengajuan Izin
                </div>
                <div style={{ fontSize: "11px", marginTop: "3px", color: "#94a3b8" }}>
                  Gunakan tombol (+) di atas untuk mengajukan surat izin.
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                {izinList.slice(0, 2).map((item, idx) => (
                  <div
                    key={item.idIzin || idx}
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #eef2f6",
                      borderRadius: "12px",
                      padding: "12px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px"
                    }}
                  >
                    <div
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        backgroundColor: "#fef3c7",
                        color: "#b45309",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <FileText size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0f172a" }}>
                        {item.alasan || "Izin Santri"}
                      </div>
                      <div style={{ fontSize: "10.5px", color: "#64748b", margin: "2px 0 6px 0" }}>
                        {item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID") : "-"}
                      </div>
                      <span className="badge-status-yellow" style={{ fontSize: "10px", padding: "2px 8px" }}>
                        Tercatat di Database
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pengumuman Box */}
          <div className="content-card" style={{ padding: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "14px" }}>
              Pengumuman
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Item 1 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #f8fafc",
                  paddingBottom: "10px"
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#2349d4", marginBottom: "2px" }}>
                    Kajian Rutin
                  </div>
                  <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0f172a" }}>
                    Kajian Akhlak bersama Fasil
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    Wajib bagi penghuni Gedung Asrama Hijau
                  </div>
                </div>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "#475569", whiteSpace: "nowrap" }}>
                  Sabtu, 24 Oktober 2026
                </div>
              </div>

              {/* Item 2 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#2349d4", marginBottom: "2px" }}>
                    Piket Bersama
                  </div>
                  <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0f172a" }}>
                    Gotong Royong Asrama Hijau
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    Wajib bagi penghuni Gedung Asrama Hijau
                  </div>
                </div>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "#475569", whiteSpace: "nowrap" }}>
                  Minggu, 25 Oktober 2026
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

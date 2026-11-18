import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ClipboardCheck,
  ShieldAlert,
  Phone,
  Calendar,
  Sparkles
} from "lucide-react";
import { getUsers, getPresensi, getPerizinan } from "../../services/api";

export default function FasilDashboardPage({ user, setActiveTab, sessionConfig }) {
  const [fasilStats, setFasilStats] = useState({
    hadir: 0,
    izin: 0,
    belum: 0,
    total: 0,
    kepatuhan: "0%"
  });
  const [unmarkedStudents, setUnmarkedStudents] = useState([]);
  const [pendingIzinCount, setPendingIzinCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [users, presensi, izin] = await Promise.all([
          getUsers(),
          getPresensi(),
          getPerizinan()
        ]);

        const mahasiswaList = Array.isArray(users)
          ? users.filter(
              (u) =>
                u.role?.toLowerCase() === "penghuni" ||
                u.role?.toLowerCase() === "mahasiswa"
            )
          : [];

        const presensiList = Array.isArray(presensi) ? presensi : [];
        const hadirCount = presensiList.filter((p) => p.status === "Hadir").length;
        const rawIzinCount = Array.isArray(izin) ? izin.length : 0;
        const total = mahasiswaList.length;
        const cappedIzin = Math.min(rawIzinCount, Math.max(0, total - hadirCount));
        const belumCount = Math.max(0, total - hadirCount - cappedIzin);

        const rate =
          total > 0 ? ((hadirCount / total) * 100).toFixed(1) + "%" : "0%";

        setFasilStats({
          hadir: hadirCount,
          izin: cappedIzin,
          belum: belumCount,
          total,
          kepatuhan: rate
        });

        // Filter mahasiswa yang belum ada di presensi
        const unmarked = mahasiswaList.filter(
          (u) => !presensiList.some((p) => p.idUser === u.idUser)
        );
        setUnmarkedStudents(unmarked.slice(0, 8));
        setPendingIzinCount(izinCount);
      } catch (err) {
        console.warn("Gagal memuat data dashboard fasil:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [sessionConfig]);

  const hadirPercent =
    fasilStats.total > 0
      ? Math.round((fasilStats.hadir / fasilStats.total) * 100)
      : 0;
  const izinPercent =
    fasilStats.total > 0
      ? Math.round((fasilStats.izin / fasilStats.total) * 100)
      : 0;
  const belumPercent = Math.max(0, 100 - hadirPercent - izinPercent);

  // Tanggal saat ini
  const todayFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif',
        color: "#1c1c1e"
      }}
    >
      {/* 1. iOS-Style Minimalist Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          padding: "4px 2px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1
              style={{
                fontSize: "26px",
                fontWeight: "700",
                color: "#1c1c1e",
                letterSpacing: "-0.5px",
                margin: 0
              }}
            >
              Selamat Datang, {user?.displayName || user?.name || "Kak Alif Rahman"}
            </h1>
            <span
              style={{
                backgroundColor: "#e5e5ea",
                color: "#636366",
                fontSize: "12px",
                fontWeight: "600",
                padding: "3px 10px",
                borderRadius: "20px"
              }}
            >
              Fasilitator Bertugas
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "#8e8e93", margin: "4px 0 0 0" }}>
            {todayFormatted}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveTab("presensi")}
            style={{
              backgroundColor: "#007aff",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "9px 18px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: "0 2px 8px rgba(0,122,255,0.25)",
              transition: "opacity 0.15s ease"
            }}
          >
            <ClipboardCheck size={16} />
            <span>Presensi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rekap")}
            style={{
              backgroundColor: "#ffffff",
              color: "#1c1c1e",
              border: "1px solid #e5e5ea",
              borderRadius: "12px",
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              transition: "background-color 0.15s ease"
            }}
          >
            Rekap Kehadiran
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (Apple HIG Minimalist Style - keterangan deskriptif dihapus sesuai revisi) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px"
        }}
      >
        {/* Card 1: Total Mahasiswa */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "20px 22px",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              TOTAL MAHASISWA
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#1c1c1e", marginTop: "8px", letterSpacing: "-0.5px" }}>
              {fasilStats.total}
            </div>
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f2f2f7", borderRadius: "9999px", marginTop: "16px", overflow: "hidden" }}>
            <div style={{ width: "100%", height: "100%", backgroundColor: "#007aff", borderRadius: "9999px" }} />
          </div>
        </div>

        {/* Card 2: Hadir */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "20px 22px",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              HADIR TERVERIFIKASI
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#34c759", marginTop: "8px", letterSpacing: "-0.5px" }}>
              {fasilStats.hadir}
            </div>
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f2f2f7", borderRadius: "9999px", marginTop: "16px", overflow: "hidden" }}>
            <div style={{ width: `${hadirPercent}%`, height: "100%", backgroundColor: "#34c759", borderRadius: "9999px" }} />
          </div>
        </div>

        {/* Card 3: Izin Tercatat */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "20px 22px",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              IZIN / SAKIT
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#007aff", marginTop: "8px", letterSpacing: "-0.5px" }}>
              {fasilStats.izin}
            </div>
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f2f2f7", borderRadius: "9999px", marginTop: "16px", overflow: "hidden" }}>
            <div style={{ width: `${izinPercent}%`, height: "100%", backgroundColor: "#007aff", borderRadius: "9999px" }} />
          </div>
        </div>

        {/* Card 4: Belum Presensi */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "20px 22px",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              BELUM PRESENSI
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#ff9500", marginTop: "8px", letterSpacing: "-0.5px" }}>
              {fasilStats.belum}
            </div>
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f2f2f7", borderRadius: "9999px", marginTop: "16px", overflow: "hidden" }}>
            <div style={{ width: `${belumPercent}%`, height: "100%", backgroundColor: "#ff9500", borderRadius: "9999px" }} />
          </div>
        </div>
      </div>

      {/* 3. Main Grid (2 Columns: Left 1.8fr, Right 1.2fr - Tabel Tindakan Cepat Dihapus Sesuai Revisi) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "20px", alignItems: "flex-start" }}>
        {/* Left Column: Progress & Mahasiswa Belum Presensi */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Attendance Progress Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "18px",
              border: "1px solid rgba(0,0,0,0.04)",
              padding: "24px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#1c1c1e", margin: 0, letterSpacing: "-0.3px" }}>
                Ringkasan Kepatuhan Presensi Hari Ini
              </h2>
              <span
                style={{
                  backgroundColor: "rgba(52, 199, 89, 0.12)",
                  color: "#34c759",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700"
                }}
              >
                {fasilStats.kepatuhan} Tercapai
              </span>
            </div>

            {/* Visual Multi-Segment Bar */}
            <div
              style={{
                width: "100%",
                height: "10px",
                borderRadius: "999px",
                backgroundColor: "#f2f2f7",
                overflow: "hidden",
                display: "flex",
                marginBottom: "16px"
              }}
            >
              <div
                style={{
                  width: `${hadirPercent}%`,
                  backgroundColor: "#34c759",
                  transition: "width 0.4s ease"
                }}
                title={`Hadir: ${hadirPercent}%`}
              />
              <div
                style={{
                  width: `${izinPercent}%`,
                  backgroundColor: "#007aff",
                  transition: "width 0.4s ease"
                }}
                title={`Izin: ${izinPercent}%`}
              />
              <div
                style={{
                  width: `${belumPercent}%`,
                  backgroundColor: "#ff9500",
                  transition: "width 0.4s ease"
                }}
                title={`Belum: ${belumPercent}%`}
              />
            </div>

            {/* Legend Pills */}
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#34c759" }} />
                <span style={{ color: "#1c1c1e", fontWeight: "600" }}>Hadir: {fasilStats.hadir} ({hadirPercent}%)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#007aff" }} />
                <span style={{ color: "#1c1c1e", fontWeight: "600" }}>Izin / Sakit: {fasilStats.izin} ({izinPercent}%)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ff9500" }} />
                <span style={{ color: "#1c1c1e", fontWeight: "600" }}>Belum: {fasilStats.belum} ({belumPercent}%)</span>
              </div>
            </div>
          </div>

          {/* Mahasiswa Belum Presensi */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "18px",
              border: "1px solid rgba(0,0,0,0.04)",
              padding: "24px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#1c1c1e", margin: 0, letterSpacing: "-0.3px" }}>
                Mahasiswa Belum Presensi
              </h2>

              <button
                type="button"
                onClick={() => setActiveTab("presensi")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#007aff",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                Lihat Semua <ArrowRight size={14} />
              </button>
            </div>

            {unmarkedStudents.length === 0 ? (
              <div
                style={{
                  padding: "36px 16px",
                  textAlign: "center",
                  backgroundColor: "#f9fafb",
                  borderRadius: "12px",
                  border: "1px dashed #e5e5ea"
                }}
              >
                <Sparkles size={28} style={{ color: "#34c759", margin: "0 auto 8px" }} />
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#1c1c1e" }}>
                  Semua Mahasiswa Telah Terverifikasi
                </div>
                <div style={{ fontSize: "12px", color: "#8e8e93", marginTop: "2px" }}>
                  Tidak ada mahasiswa yang berstatus belum presensi saat ini.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {unmarkedStudents.map((st) => (
                  <div
                    key={st.idUser}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      backgroundColor: "#f9fafb",
                      border: "1px solid #f2f2f7"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        style={{
                          backgroundColor: "rgba(255, 59, 48, 0.1)",
                          color: "#ff3b30",
                          fontSize: "12px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "6px"
                        }}
                      >
                        {st.nomorKamar || "Kamar —"}
                      </span>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#1c1c1e" }}>
                          {st.nama}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#8e8e93" }}>
                          NIM: {st.nim} · {st.asal || "Mahasiswa Asrama"}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("presensi")}
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#007aff",
                        border: "1px solid #e5e5ea",
                        borderRadius: "8px",
                        padding: "5px 12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Verifikasi
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Informasi & Jadwal Presensi */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Jam Malam & Jadwal Presensi */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "18px",
              border: "1px solid rgba(0,0,0,0.04)",
              padding: "24px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <ShieldAlert size={18} color="#1c1c1e" />
              <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#1c1c1e", margin: 0 }}>
                Informasi & Jam Malam
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px" }}>
              <div
                style={{
                  padding: "12px 14px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "12px",
                  border: "1px solid #f2f2f7"
                }}
              >
                <div style={{ fontWeight: "700", color: "#1c1c1e", marginBottom: "2px" }}>
                  Jam Malam: 22:00 WIB
                </div>
                <div style={{ color: "#8e8e93", fontSize: "11.5px" }}>
                  Gerbang asrama ditutup tepat waktu. Mahasiswa yang berada di luar wajib memiliki surat izin resmi.
                </div>
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "12px",
                  border: "1px solid #f2f2f7"
                }}
              >
                <div style={{ fontWeight: "700", color: "#1c1c1e", marginBottom: "2px" }}>
                  Jadwal Sesi Presensi Rutin
                </div>
                <div style={{ color: "#8e8e93", fontSize: "11.5px" }}>
                  • Sesi Subuh: 04:00 - 06:00 WIB<br />
                  • Sesi Malam: 18:00 - 20:30 WIB
                </div>
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "12px",
                  border: "1px solid #f2f2f7"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", color: "#1c1c1e", marginBottom: "2px" }}>
                  <Phone size={13} color="#007aff" /> Kontak Penting
                </div>
                <div style={{ color: "#8e8e93", fontSize: "11.5px" }}>
                  • Pos Keamanan / Satpam: (021) 789-001<br />
                  • Klinik & Darurat Medis: (021) 789-119
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

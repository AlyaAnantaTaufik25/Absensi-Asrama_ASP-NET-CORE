import React, { useState, useEffect } from "react";
import {
  Camera,
  MapPin,
  Clock,
  ChevronRight,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { getPresensi, getPerizinan, getSessionSettings } from "../services/api";
import { checkPresensiSession, getActiveSessionConfig } from "../utils/asramaConfig";

export default function DashboardPage({ user, setActiveTab }) {
  const [presensiList, setPresensiList] = useState([]);
  const [izinList, setIzinList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionConfig, setSessionConfig] = useState(getActiveSessionConfig());

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [presensiData, izinData, sessionData] = await Promise.all([
          getPresensi(),
          getPerizinan(),
          getSessionSettings()
        ]);

        const currentUserId = user?.idUser || user?.id;
        const currentNim = user?.nim;

        if (Array.isArray(presensiData)) {
          const userPresensi = currentUserId
            ? presensiData.filter((p) => p.idUser === currentUserId)
            : presensiData;
          setPresensiList(userPresensi);
        }

        if (Array.isArray(izinData)) {
          const userIzin = currentNim
            ? izinData.filter((i) => i.nim === currentNim)
            : izinData;
          setIzinList(userIzin);
        }

        if (sessionData) {
          setSessionConfig(sessionData);
        }
      } catch (err) {
        console.warn("Gagal memuat data dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    // Listen for live session schedule changes by Fasilitator (in-app & cross-tab)
    const handleSessionUpdated = (e) => {
      if (e.detail) {
        setSessionConfig(e.detail);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === "mynava_session_settings" && e.newValue) {
        try {
          setSessionConfig(JSON.parse(e.newValue));
        } catch {}
      }
    };

    const handleWindowFocus = async () => {
      try {
        const latest = await getSessionSettings();
        if (latest) setSessionConfig(latest);
      } catch {}
    };

    // Periodic sync poll every 8 seconds
    const intervalId = setInterval(async () => {
      try {
        const latest = await getSessionSettings();
        if (latest) setSessionConfig(latest);
      } catch {}
    }, 8000);

    window.addEventListener("mynava_session_updated", handleSessionUpdated);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("mynava_session_updated", handleSessionUpdated);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [user]);

  // Helper cek tanggal hari ini
  const isToday = (dateSource) => {
    if (!dateSource) return false;
    const d = new Date(dateSource);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  // Cek riwayat kehadiran & izin hari ini dari database
  const todayPresensi = presensiList.find((p) => isToday(p.waktu || p.tanggal));
  const todayIzin = izinList.find((i) => isToday(i.tanggal));

  // Hitungan riil statistik murni dari database
  const totalHadir = presensiList.filter((p) => p.status?.toLowerCase() === "hadir").length;
  const totalIzin = izinList.length;
  const totalAlpha = presensiList.filter((p) => p.status?.toLowerCase() === "alpha").length;
  const totalPresensi = presensiList.length;

  const sessionInfo = checkPresensiSession(sessionConfig);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif',
        maxWidth: "1180px",
        margin: "0 auto",
        paddingBottom: "40px",
        color: "#1c1c1e"
      }}
    >
      {/* 1. iOS-Style Header */}
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
                margin: 0,
                letterSpacing: "-0.5px"
              }}
            >
              Selamat Datang, {user?.displayName || user?.name || "Penghuni Asrama"}
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
              {user?.nim || "2311523005"}
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "#8e8e93", margin: "4px 0 0 0" }}>
            {user?.room || "Kamar B-302"} • {user?.asrama || "Gedung Asrama Terdaftar"}
          </p>
        </div>

        {/* Date & Session Status Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#ffffff",
            padding: "8px 16px",
            borderRadius: "30px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: sessionInfo.isActive ? "#10b981" : "#f59e0b"
            }}
          />
          <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#1e293b" }}>
            {sessionInfo.isActive ? sessionInfo.session : "Sesi Ditutup"}
          </span>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>•</span>
          <span style={{ fontSize: "12.5px", color: "#64748b" }}>
            {new Date().toLocaleDateString("id-ID", {
              weekday: "short",
              day: "numeric",
              month: "short"
            })}
          </span>
        </div>
      </div>

      {/* 2. Top 4 Clean Stat Cards (Tanpa 'Tingkat Kedisiplinan' & Fluff, Murni Data Database) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px"
        }}
      >
        {/* Card 1: Total Riwayat Presensi */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "18px 20px",
            border: "1px solid #f1f5f9",
            boxShadow: "0 4px 16px -4px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}
        >
          <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Total Catatan Presensi
          </div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
            {totalPresensi} <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Sesi</span>
          </div>
        </div>

        {/* Card 2: Total Hadir */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "18px 20px",
            border: "1px solid #f1f5f9",
            boxShadow: "0 4px 16px -4px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}
        >
          <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Hadir
          </div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#059669", marginTop: "2px" }}>
            {totalHadir} <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Sesi</span>
          </div>
        </div>

        {/* Card 3: Izin Tercatat */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "18px 20px",
            border: "1px solid #f1f5f9",
            boxShadow: "0 4px 16px -4px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}
        >
          <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Izin / Dispensasi
          </div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#2563eb", marginTop: "2px" }}>
            {totalIzin} <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Permohonan</span>
          </div>
        </div>

        {/* Card 4: Alpha / Tanpa Keterangan */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "18px 20px",
            border: "1px solid #f1f5f9",
            boxShadow: "0 4px 16px -4px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}
        >
          <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Alpha / Terlewat
          </div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: totalAlpha > 0 ? "#dc2626" : "#64748b", marginTop: "2px" }}>
            {totalAlpha} <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Sesi</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Dynamic Status Banner Sesuai Realita Database + Sesi Hari Ini */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "20px", alignItems: "stretch" }}>
        {/* Left: Dynamic Banner Sesuai Database */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "22px",
            padding: "26px 28px",
            border: "1px solid #f1f5f9",
            boxShadow: "0 6px 24px -6px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Skenario 1: Pengguna SUDAH Melakukan Presensi Hari Ini */}
          {todayPresensi ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#ecfdf5",
                    color: "#059669",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                >
                  <CheckCircle2 size={14} color="#10b981" />
                  Presensi Hari Ini Terverifikasi
                </span>
              </div>

              <div style={{ marginTop: "16px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.4px" }}>
                  Anda Telah Melakukan Presensi Hari Ini
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5, maxWidth: "500px" }}>
                  Presensi Anda telah berhasil dicatat pada pukul{" "}
                  <strong>
                    {todayPresensi.waktu
                      ? new Date(todayPresensi.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                      : "05.15"}{" "}
                    WIB
                  </strong>{" "}
                  dengan status <strong style={{ color: "#059669" }}>{todayPresensi.status || "Hadir"}</strong>.
                </p>
              </div>
            </div>
          ) : todayIzin ? (
            /* Skenario 2: Pengguna Memiliki Izin Aktif Hari Ini */
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#eff6ff",
                    color: "#2563eb",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                >
                  <FileText size={14} color="#2563eb" />
                  Izin / Sakit Terdaftar
                </span>
              </div>

              <div style={{ marginTop: "16px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.4px" }}>
                  Status Kehadiran Hari Ini: Dispensasi Izin
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5, maxWidth: "500px" }}>
                  Pengajuan izin Anda (<strong>{todayIzin.alasan || "Dispensasi"}</strong>) telah tercatat di sistem. Anda dibebaskan dari kewajiban presensi mandiri untuk hari ini.
                </p>
              </div>
            </div>
          ) : sessionInfo.isActive ? (
            /* Skenario 3: Belum Presensi & Jam Sesi Sedang Dibuka */
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#ecfdf5",
                    color: "#059669",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                  Sesi Presensi Aktif ({sessionInfo.session})
                </span>
              </div>

              <div style={{ marginTop: "16px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.4px" }}>
                  Presensi Mandiri Dibuka
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5, maxWidth: "480px" }}>
                  Sesi {sessionInfo.session} sedang berlangsung. Silakan lakukan pengambilan foto wajah biometrik sekarang untuk mencatat kehadiran Anda.
                </p>
              </div>
            </div>
          ) : (
            /* Skenario 4: Belum Presensi & Di Luar Jam Sesi */
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#fef3c7",
                    color: "#b45309",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                >
                  <Clock size={13} color="#b45309" />
                  Di Luar Jam Sesi Presensi
                </span>
              </div>

              <div style={{ marginTop: "16px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.4px" }}>
                  Sesi Presensi Belum Dibuka
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5, maxWidth: "480px" }}>
                  Presensi mandiri dibuka otomatis sesuai jadwal asrama. Pastikan Anda berada dalam radius gedung saat waktu sesi dimulai.
                </p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid #f8fafc",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#64748b" }}>
              <MapPin size={14} color="#007aff" />
              <span>Gedung Asrama Terdaftar: {user?.asrama || "Asrama Mahasiswa"}</span>
            </div>

            {todayPresensi ? (
              <button
                type="button"
                onClick={() => setActiveTab("riwayat")}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#059669",
                  border: "1px solid #a7f3d0",
                  borderRadius: "12px",
                  padding: "9px 18px",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(5,150,105,0.12)"
                }}
              >
                <CheckCircle2 size={15} />
                <span>Lihat Riwayat Presensi</span>
              </button>
            ) : todayIzin ? (
              <button
                type="button"
                onClick={() => setActiveTab("izin")}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#2563eb",
                  border: "1px solid #bfdbfe",
                  borderRadius: "12px",
                  padding: "9px 18px",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(37,99,235,0.12)"
                }}
              >
                <FileText size={15} />
                <span>Lihat Status Perizinan</span>
              </button>
            ) : sessionInfo.isActive ? (
              <button
                type="button"
                onClick={() => setActiveTab("presensi")}
                style={{
                  backgroundColor: "#007aff",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(0,122,255,0.25)"
                }}
              >
                <Camera size={15} />
                <span>Ambil Presensi Sekarang</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab("riwayat")}
                style={{
                  backgroundColor: "#f8fafc",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "9px 18px",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  cursor: "pointer"
                }}
              >
                <Calendar size={15} />
                <span>Cek Riwayat Presensi</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Sesi Hari Ini Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "22px",
            padding: "22px",
            border: "1px solid #f1f5f9",
            boxShadow: "0 6px 24px -6px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "12px" }}>
            Jadwal Sesi Hari Ini
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Subuh */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                backgroundColor: "#f8fafc",
                borderRadius: "14px",
                border: "1px solid #f1f5f9"
              }}
            >
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>Sesi Subuh / Pagi</div>
                <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                  {sessionConfig.subuhStart || "04:00"} - {sessionConfig.subuhEnd || "06:00"} WIB
                </div>
              </div>

              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  backgroundColor: "#eff6ff",
                  color: "#007aff",
                  border: "1px solid #dbeafe"
                }}
              >
                Pagi
              </span>
            </div>

            {/* Magrib & Isya */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                backgroundColor: "#f8fafc",
                borderRadius: "14px",
                border: "1px solid #f1f5f9"
              }}
            >
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>Sesi Malam (Magrib & Isya)</div>
                <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                  {sessionConfig.malamStart || "18:00"} - {sessionConfig.malamEnd || "20:30"} WIB
                </div>
              </div>

              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  backgroundColor: "#eff6ff",
                  color: "#007aff",
                  border: "1px solid #dbeafe"
                }}
              >
                Malam
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: "14px",
              paddingTop: "12px",
              borderTop: "1px solid #f8fafc",
              fontSize: "11.5px",
              color: "#94a3b8"
            }}
          >
            Absensi dibuka otomatis sesuai jam resmi yang diatur oleh Fasilitator
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Aktivitas Presensi (Left) + Status Perizinan (Right) Sesuai Database */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* Left: Aktivitas Terakhir */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "22px",
            padding: "22px",
            border: "1px solid #f1f5f9",
            boxShadow: "0 6px 24px -6px rgba(0,0,0,0.05)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Aktivitas Presensi Terakhir
            </h3>
            <button
              onClick={() => setActiveTab("riwayat")}
              style={{
                background: "none",
                border: "none",
                color: "#007aff",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer",
                padding: 0
              }}
            >
              Lihat semua
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {presensiList.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "36px 16px",
                  color: "#94a3b8",
                  backgroundColor: "#f8fafc",
                  borderRadius: "14px",
                  border: "1px dashed #e2e8f0"
                }}
              >
                <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#475569" }}>
                  Belum Ada Riwayat Presensi
                </div>
                <div style={{ fontSize: "11.5px", marginTop: "4px", color: "#94a3b8" }}>
                  Data kehadiran Anda akan otomatis tersimpan setelah presensi dilakukan.
                </div>
              </div>
            ) : (
              presensiList.slice(0, 4).map((item, idx) => (
                <div
                  key={item.idPresensi || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #f1f5f9"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>
                      {item.keterangan || "Presensi Mandiri"}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                      {item.waktu ? new Date(item.waktu).toLocaleString("id-ID") : "-"}
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: "600",
                      backgroundColor: item.status?.toLowerCase() === "hadir" ? "#ecfdf5" : "#eff6ff",
                      color: item.status?.toLowerCase() === "hadir" ? "#059669" : "#007aff",
                      border: item.status?.toLowerCase() === "hadir" ? "1px solid #a7f3d0" : "1px solid #bfdbfe"
                    }}
                  >
                    {item.status || "Hadir"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Status Perizinan */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "22px",
            padding: "22px",
            border: "1px solid #f1f5f9",
            boxShadow: "0 6px 24px -6px rgba(0,0,0,0.05)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Status Perizinan
            </h3>
            <button
              onClick={() => setActiveTab("izin")}
              style={{
                background: "none",
                border: "none",
                color: "#007aff",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer",
                padding: 0
              }}
            >
              Lihat semua
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {izinList.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "36px 16px",
                  color: "#94a3b8",
                  backgroundColor: "#f8fafc",
                  borderRadius: "14px",
                  border: "1px dashed #e2e8f0"
                }}
              >
                <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#475569" }}>
                  Belum Ada Permohonan Izin
                </div>
                <div style={{ fontSize: "11.5px", marginTop: "4px", color: "#94a3b8" }}>
                  Ajukan izin atau surat sakit jika berhalangan hadir pada jam presensi.
                </div>
              </div>
            ) : (
              izinList.slice(0, 4).map((item, idx) => (
                <div
                  key={item.idIzin || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #f1f5f9"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>
                      {item.alasan || "Pengajuan Izin"}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                      {item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID") : "-"}
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: "600",
                      backgroundColor: "#ecfdf5",
                      color: "#059669",
                      border: "1px solid #a7f3d0"
                    }}
                  >
                    Disetujui
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  Info,
  Calendar,
  Sparkles
} from "lucide-react";
import { getUsers, getPresensi, getPerizinan } from "../../services/api";

export default function FasilDashboardPage({ user, setActiveTab }) {
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

        const penghuniList = Array.isArray(users)
          ? users.filter(
              (u) =>
                u.role?.toLowerCase() === "penghuni" ||
                u.role?.toLowerCase() === "mahasiswa"
            )
          : [];

        const presensiList = Array.isArray(presensi) ? presensi : [];
        const hadirCount = presensiList.filter((p) => p.status === "Hadir").length;
        const izinCount = Array.isArray(izin) ? izin.length : 0;
        const total = penghuniList.length;
        const belumCount = Math.max(0, total - hadirCount - (izinCount > total ? 0 : izinCount));

        const rate =
          total > 0 ? ((hadirCount / total) * 100).toFixed(1) + "%" : "0%";

        setFasilStats({
          hadir: hadirCount,
          izin: izinCount,
          belum: belumCount,
          total,
          kepatuhan: rate
        });

        // Filter penghuni yang belum ada di presensi
        const unmarked = penghuniList.filter(
          (u) => !presensiList.some((p) => p.idUser === u.idUser)
        );
        setUnmarkedStudents(unmarked.slice(0, 5));
        setPendingIzinCount(izinCount);
      } catch (err) {
        console.warn("Gagal memuat data dashboard fasil:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const hadirPercent =
    fasilStats.total > 0
      ? Math.round((fasilStats.hadir / fasilStats.total) * 100)
      : 0;
  const izinPercent =
    fasilStats.total > 0
      ? Math.round((fasilStats.izin / fasilStats.total) * 100)
      : 0;
  const belumPercent = Math.max(0, 100 - hadirPercent - izinPercent);

  // Tanggal dan waktu saat ini
  const todayFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* 1. Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e3fae 0%, #2563eb 60%, #3b82f6 100%)",
          borderRadius: "20px",
          padding: "30px 32px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.25)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(4px)",
                padding: "4px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "0.5px",
                textTransform: "uppercase"
              }}
            >
              Fasilitator Bertugas
            </span>
            <span style={{ fontSize: "13px", opacity: 0.85, display: "flex", alignItems: "center", gap: "5px" }}>
              <Calendar size={14} /> {todayFormatted}
            </span>
          </div>

          <h1
            style={{
              fontSize: "26px",
              fontWeight: "800",
              margin: "0 0 6px 0",
              letterSpacing: "-0.5px"
            }}
          >
            Selamat Datang, {user?.name || "Fasilitator"}
          </h1>
          <p style={{ margin: 0, fontSize: "14px", opacity: 0.9, maxWidth: "600px", lineHeight: "1.5" }}>
            Pantau dan verifikasi kehadiran penghuni asrama di lantai binaan Anda secara real-time.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveTab("presensi")}
            style={{
              backgroundColor: "#ffffff",
              color: "#1e3fae",
              border: "none",
              borderRadius: "12px",
              padding: "11px 20px",
              fontSize: "13.5px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <ClipboardCheck size={17} />
            Presensi Lantai
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rekap")}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.18)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              backdropFilter: "blur(4px)",
              borderRadius: "12px",
              padding: "11px 20px",
              fontSize: "13.5px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.28)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.18)")}
          >
            Rekap Kehadiran
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px"
        }}
      >
        {/* Total Penghuni */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px 22px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Total Penghuni</span>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Users size={19} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
            {fasilStats.total}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
            Terdaftar di binaan lantai
          </div>
        </div>

        {/* Hadir */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px 22px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Hadir Terverifikasi</span>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "#dcfce7",
                color: "#15803d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <CheckCircle2 size={19} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#15803d" }}>
            {fasilStats.hadir}
          </div>
          <div style={{ fontSize: "12px", color: "#16a34a", marginTop: "4px", fontWeight: "600" }}>
            {hadirPercent}% dari total penghuni
          </div>
        </div>

        {/* Izin Tercatat */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px 22px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Izin / Sakit</span>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "#dbeafe",
                color: "#1d4ed8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <AlertCircle size={19} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#2563eb" }}>
            {fasilStats.izin}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            Pengajuan tercatat
          </div>
        </div>

        {/* Belum Presensi */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px 22px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Belum Presensi</span>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "#ffedd5",
                color: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Clock size={19} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#ea580c" }}>
            {fasilStats.belum}
          </div>
          <div style={{ fontSize: "12px", color: "#ea580c", marginTop: "4px", fontWeight: "600" }}>
            Perlu verifikasi manual
          </div>
        </div>
      </div>

      {/* 3. Main Grid (2 Columns: Left 1.8fr, Right 1.2fr) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.75fr 1.25fr", gap: "24px", alignItems: "flex-start" }}>
        {/* Left Column: Progress & Penghuni Butuh Perhatian */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Attendance Progress Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0" }}>
                  Ringkasan Kepatuhan Presensi Hari Ini
                </h2>
                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                  Tingkat kehadiran santri berdasarkan sesi waktu terkini
                </p>
              </div>
              <span
                style={{
                  backgroundColor: "#f0fdf4",
                  color: "#166534",
                  border: "1px solid #bbf7d0",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: "700"
                }}
              >
                {fasilStats.kepatuhan} Tercapai
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div
              style={{
                width: "100%",
                height: "12px",
                borderRadius: "999px",
                backgroundColor: "#f1f5f9",
                overflow: "hidden",
                display: "flex",
                marginBottom: "16px"
              }}
            >
              <div
                style={{
                  width: `${hadirPercent}%`,
                  backgroundColor: "#22c55e",
                  transition: "width 0.4s ease"
                }}
                title={`Hadir: ${hadirPercent}%`}
              />
              <div
                style={{
                  width: `${izinPercent}%`,
                  backgroundColor: "#3b82f6",
                  transition: "width 0.4s ease"
                }}
                title={`Izin: ${izinPercent}%`}
              />
              <div
                style={{
                  width: `${belumPercent}%`,
                  backgroundColor: "#f97316",
                  transition: "width 0.4s ease"
                }}
                title={`Belum: ${belumPercent}%`}
              />
            </div>

            {/* Legend Pills */}
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "12.5px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
                <span style={{ color: "#334155", fontWeight: "600" }}>Hadir: {fasilStats.hadir} ({hadirPercent}%)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#3b82f6" }} />
                <span style={{ color: "#334155", fontWeight: "600" }}>Izin / Sakit: {fasilStats.izin} ({izinPercent}%)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#f97316" }} />
                <span style={{ color: "#334155", fontWeight: "600" }}>Belum Presensi: {fasilStats.belum} ({belumPercent}%)</span>
              </div>
            </div>
          </div>

          {/* Penghuni Belum Presensi */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0" }}>
                  Penghuni Belum Presensi
                </h2>
                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                  Daftar santri yang belum melakukan presensi mandiri
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("presensi")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: "13px",
                  fontWeight: "700",
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
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px dashed #cbd5e1"
                }}
              >
                <Sparkles size={28} style={{ color: "#16a34a", margin: "0 auto 8px" }} />
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                  Semua Penghuni Telah Terverifikasi
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  Tidak ada santri yang berstatus belum presensi saat ini.
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
                      backgroundColor: "#f8fafc",
                      border: "1px solid #f1f5f9"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        style={{
                          backgroundColor: "#fee2e2",
                          color: "#b91c1c",
                          fontSize: "12px",
                          fontWeight: "700",
                          padding: "4px 8px",
                          borderRadius: "6px"
                        }}
                      >
                        {st.nomorKamar || "Kamar —"}
                      </span>
                      <div>
                        <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>
                          {st.nama}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                          NIM: {st.nim} · {st.asal || "Santri Asrama"}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("presensi")}
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                        borderRadius: "8px",
                        padding: "6px 12px",
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

        {/* Right Column: Tindakan Cepat & Informasi Penting */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Tindakan Cepat */}
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
              Tindakan Cepat
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "12px",
                  backgroundColor: "#eff6ff",
                  border: "1px solid #dbeafe"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <ClipboardCheck size={16} color="#2563eb" />
                  <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#1e40af" }}>
                    Presensi Lantai Binaan
                  </span>
                </div>
                <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>
                  Lakukan pengecekan kehadiran langsung atau catat manual santri di kamar.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("presensi")}
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Buka Presensi Lantai
                </button>
              </div>

              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "12px",
                  backgroundColor: "#fef3c7",
                  border: "1px solid #fde68a"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <AlertCircle size={16} color="#d97706" />
                  <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#92400e" }}>
                    Pengajuan Izin Darurat
                  </span>
                </div>
                <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#78350f", lineHeight: "1.4" }}>
                  Terdapat pengajuan izin santri yang memerlukan verifikasi dan persetujuan fasilitator.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("izin")}
                  style={{
                    backgroundColor: "#d97706",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Tinjau Izin Darurat
                </button>
              </div>
            </div>
          </div>

          {/* Jam Malam & Kontak Darurat */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "24px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <ShieldAlert size={18} color="#0f172a" />
              <h2 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                Informasi & Jam Malam
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12.5px" }}>
              <div
                style={{
                  padding: "10px 12px",
                  backgroundColor: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0"
                }}
              >
                <div style={{ fontWeight: "700", color: "#0f172a", marginBottom: "2px" }}>
                  Jam Malam: 22:00 WIB
                </div>
                <div style={{ color: "#64748b", fontSize: "11.5px" }}>
                  Gerbang asrama dikunci tepat waktu. Santri yang berada di luar wajib memiliki izin darurat.
                </div>
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  backgroundColor: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0"
                }}
              >
                <div style={{ fontWeight: "700", color: "#0f172a", marginBottom: "2px" }}>
                  Jadwal Presensi Rutin
                </div>
                <div style={{ color: "#64748b", fontSize: "11.5px" }}>
                  • Sesi Subuh: 04:30 - 06:00 WIB<br />
                  • Sesi Maghrib & Isya: 18:00 - 20:30 WIB
                </div>
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  backgroundColor: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", color: "#0f172a", marginBottom: "2px" }}>
                  <Phone size={13} color="#2563eb" /> Kontak Penting
                </div>
                <div style={{ color: "#64748b", fontSize: "11.5px" }}>
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

import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  Building2,
  DoorClosed,
  Percent,
  RotateCw,
  ChevronRight,
  Clock
} from "lucide-react";
import { getStats, getPresensi, getSessionSettings } from "../../services/api";
import { getActiveSessionConfig } from "../../utils/asramaConfig";

export default function AdminDashboardPage({ setActiveTab, user }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionConfig, setSessionConfig] = useState(getActiveSessionConfig());
  const [stats, setStats] = useState({
    totalPenghuni: 0,
    totalFasil: 0,
    totalGedung: 0,
    totalKamar: 0,
    attendanceRate: 0
  });

  const [trendData, setTrendData] = useState([
    { day: "Min", val: 0 },
    { day: "Sen", val: 0 },
    { day: "Sel", val: 0 },
    { day: "Rab", val: 0 },
    { day: "Kam", val: 0 },
    { day: "Jum", val: 0 },
    { day: "Sab", val: 0 }
  ]);

  const loadStats = async () => {
    try {
      const [data, presensi] = await Promise.all([getStats(), getPresensi()]);
      if (data) {
        setStats(data);
      }
      if (Array.isArray(presensi)) {
        const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
        const counts = [0, 0, 0, 0, 0, 0, 0];
        const totals = [0, 0, 0, 0, 0, 0, 0];
        presensi.forEach((p) => {
          const d = new Date(p.waktu || p.tanggal).getDay();
          totals[d]++;
          if (p.status === "Hadir") counts[d]++;
        });
        setTrendData(
          days.map((day, idx) => ({
            day,
            val: totals[idx] > 0 ? Math.round((counts[idx] / totals[idx]) * 100) : 0
          }))
        );
      }
    } catch (err) {
      console.warn("Gagal memuat statistik admin:", err);
    }
  };

  useEffect(() => {
    loadStats();

    // Load active session hours
    async function loadSession() {
      try {
        const settings = await getSessionSettings();
        if (settings) setSessionConfig(settings);
      } catch {}
    }
    loadSession();

    // Listen for live updates from Fasil & cross-tab changes
    const handleSessionUpdated = (e) => {
      if (e?.detail) setSessionConfig(e.detail);
    };

    const handleStorageChange = (e) => {
      if (e.key === "mynava_session_settings" && e.newValue) {
        try {
          setSessionConfig(JSON.parse(e.newValue));
        } catch {}
      }
    };

    const handleFocus = async () => {
      try {
        const latest = await getSessionSettings();
        if (latest) setSessionConfig(latest);
      } catch {}
    };

    const intervalId = setInterval(async () => {
      try {
        const latest = await getSessionSettings();
        if (latest) setSessionConfig(latest);
      } catch {}
    }, 8000);

    window.addEventListener("mynava_session_updated", handleSessionUpdated);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("mynava_session_updated", handleSessionUpdated);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadStats(),
      getSessionSettings().then((s) => s && setSessionConfig(s))
    ]);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const statCards = [
    {
      id: "penghuni",
      label: "MAHASISWA AKTIF",
      value: String(stats.totalPenghuni),
      icon: Users,
      tab: "data-penghuni",
      color: "#007aff"
    },
    {
      id: "fasil",
      label: "FASIL AKTIF",
      value: String(stats.totalFasil),
      icon: UserCheck,
      tab: "data-fasil",
      color: "#34c759"
    },
    {
      id: "gedung",
      label: "TOTAL GEDUNG",
      value: String(stats.totalGedung),
      icon: Building2,
      tab: "master-data",
      color: "#5856d6"
    },
    {
      id: "kamar",
      label: "TOTAL KAMAR",
      value: String(stats.totalKamar),
      icon: DoorClosed,
      tab: "master-data",
      color: "#ff9500"
    },
    {
      id: "kehadiran",
      label: "KEHADIRAN HARI INI",
      value: `${stats.attendanceRate}%`,
      icon: Percent,
      tab: "rekapitulasi",
      color: "#007aff"
    }
  ];

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
      {/* 1. Header Row */}
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
              Dashboard Administrator
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
              Pusat Kontrol
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e5ea",
            borderRadius: "12px",
            padding: "9px 16px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#1c1c1e",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease"
          }}
        >
          <RotateCw size={14} className={isRefreshing ? "animate-spin" : ""} color="#007aff" />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Real-Time Synchronized Presensi Session Schedule Card */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          padding: "16px 22px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)",
          flexWrap: "wrap",
          gap: "14px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              backgroundColor: "rgba(0, 122, 255, 0.1)",
              color: "#007aff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: "14.5px",
                fontWeight: "700",
                color: "#1c1c1e",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap"
              }}
            >
              <span>Jadwal Sesi Presensi Asrama (Tersinkronisasi)</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(52, 199, 89, 0.12)",
                  color: "#34c759"
                }}
              >
                Real-Time Aktif
              </span>
            </div>
            <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px" }}>
              Sesi Subuh / Pagi:{" "}
              <strong style={{ color: "#007aff" }}>
                {sessionConfig.subuhStart} - {sessionConfig.subuhEnd} WIB
              </strong>
              {" • "}
              Sesi Malam (Magrib & Isya):{" "}
              <strong style={{ color: "#007aff" }}>
                {sessionConfig.malamStart} - {sessionConfig.malamEnd} WIB
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stat Cards (Apple HIG Style) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "14px"
        }}
      >
        {statCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.id}
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
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#8e8e93",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase"
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: "700",
                    color: "#1c1c1e",
                    letterSpacing: "-0.5px",
                    marginTop: "6px"
                  }}
                >
                  {card.value}
                </div>
              </div>

              <div
                onClick={() => setActiveTab(card.tab)}
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#007aff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  borderTop: "1px solid #f2f2f7",
                  paddingTop: "10px",
                  marginTop: "14px",
                  transition: "opacity 0.15s ease"
                }}
              >
                <span>Lihat detail</span>
                <ChevronRight size={13} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Chart Card: Tren Kehadiran 7 Hari */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          padding: "24px 28px",
          border: "1px solid rgba(0,0,0,0.04)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1c1c1e", margin: 0, letterSpacing: "-0.3px" }}>
            Tren Kehadiran 7 Hari
          </h3>
        </div>

        {/* Bar Chart Visualization (Apple iOS Tint) */}
        <div
          style={{
            height: "220px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            padding: "0 30px",
            position: "relative"
          }}
        >
          {/* Grid lines */}
          <div style={{ position: "absolute", left: "20px", right: "20px", top: "25%", height: "1px", backgroundColor: "#f2f2f7" }} />
          <div style={{ position: "absolute", left: "20px", right: "20px", top: "50%", height: "1px", backgroundColor: "#f2f2f7" }} />
          <div style={{ position: "absolute", left: "20px", right: "20px", top: "75%", height: "1px", backgroundColor: "#f2f2f7" }} />

          {trendData.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                flex: "0 0 54px",
                position: "relative",
                zIndex: 2
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#007aff"
                }}
              >
                {item.val}%
              </span>

              {/* Bar */}
              <div
                style={{
                  width: "44px",
                  height: `${Math.max(6, item.val * 1.6)}px`,
                  backgroundColor: "#007aff",
                  borderRadius: "8px 8px 3px 3px",
                  transition: "all 0.2s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0056b3")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#007aff")}
              />

              {/* Day label */}
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#8e8e93" }}>
                {item.day}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

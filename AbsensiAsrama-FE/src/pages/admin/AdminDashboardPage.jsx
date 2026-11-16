import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  Building2,
  DoorClosed,
  Percent,
  RotateCw,
  ChevronRight
} from "lucide-react";
import { getStats, getPresensi } from "../../services/api";

export default function AdminDashboardPage({ setActiveTab }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
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
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const statCards = [
    {
      id: "penghuni",
      label: "Penghuni Aktif",
      value: String(stats.totalPenghuni),
      icon: Users,
      tab: "data-penghuni"
    },
    {
      id: "fasil",
      label: "Fasil Aktif",
      value: String(stats.totalFasil),
      icon: UserCheck,
      tab: "data-fasil"
    },
    {
      id: "gedung",
      label: "Gedung",
      value: String(stats.totalGedung),
      icon: Building2,
      tab: "master-data"
    },
    {
      id: "kamar",
      label: "Kamar",
      value: String(stats.totalKamar),
      icon: DoorClosed,
      tab: "master-data"
    },
    {
      id: "kehadiran",
      label: "Kehadiran Hari Ini",
      value: `${stats.attendanceRate}%`,
      icon: Percent,
      tab: "rekapitulasi"
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "800",
              color: "#2349d4",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              marginBottom: "4px"
            }}
          >
            RINGKASAN SISTEM
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#0f172a",
              letterSpacing: "-0.4px",
              margin: "0 0 4px 0"
            }}
          >
            Dashboard Admin
          </h1>
          <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
            Pantau operasional seluruh asrama dalam satu tampilan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "8px 16px",
            fontSize: "12.5px",
            fontWeight: "600",
            color: "#334155",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
          }}
        >
          <RotateCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* 5 Stat Cards in a row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
        {statCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.id}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "18px 20px",
                border: "1px solid #eef2f8",
                boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    backgroundColor: "#e8effe",
                    color: "#2349d4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <IconComponent size={17} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
                    {card.value}
                  </div>
                </div>
              </div>

              <div
                onClick={() => setActiveTab(card.tab)}
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#94a3b8",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                  borderTop: "1px solid #f8fafc",
                  paddingTop: "8px",
                  transition: "color 0.15s ease"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#2349d4")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                <span>Lihat detail</span>
                <ChevronRight size={13} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Card: Tren Kehadiran 7 Hari */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          padding: "24px 28px",
          border: "1px solid #eef2f8",
          boxShadow: "0 2px 10px -2px rgba(15, 23, 42, 0.04)"
        }}
      >
        <div style={{ marginBottom: "28px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0" }}>
            Tren Kehadiran 7 Hari
          </h3>
          <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
            Rata-rata kehadiran semua gedung
          </p>
        </div>

        {/* Bar Chart Visualization */}
        <div
          style={{
            height: "240px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            padding: "0 40px",
            position: "relative"
          }}
        >
          {/* Subtle horizontal grid lines */}
          <div style={{ position: "absolute", left: "20px", right: "20px", top: "25%", height: "1px", backgroundColor: "#f8fafc" }} />
          <div style={{ position: "absolute", left: "20px", right: "20px", top: "50%", height: "1px", backgroundColor: "#f8fafc" }} />
          <div style={{ position: "absolute", left: "20px", right: "20px", top: "75%", height: "1px", backgroundColor: "#f8fafc" }} />

          {trendData.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                flex: "0 0 54px",
                position: "relative",
                zIndex: 2
              }}
            >
              {/* Value indicator badge on hover */}
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: "700",
                  color: "#2349d4",
                  opacity: 0.9
                }}
              >
                {item.val}%
              </span>

              {/* Bar */}
              <div
                style={{
                  width: "48px",
                  height: `${item.val * 1.8}px`,
                  backgroundColor: "#2349d4",
                  borderRadius: "10px 10px 4px 4px",
                  transition: "all 0.2s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1b3bb8")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2349d4")}
              />

              {/* Day label */}
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>
                {item.day}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

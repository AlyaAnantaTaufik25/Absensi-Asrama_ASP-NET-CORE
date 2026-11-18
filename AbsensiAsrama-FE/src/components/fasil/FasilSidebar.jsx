import React from "react";
import {
  LayoutDashboard,
  ClipboardCheck,
  AlertCircle,
  BarChart3,
  FileText,
  DoorOpen,
  User,
  Power
} from "lucide-react";
import "../penghuni/PenghuniSidebar.css";

export default function FasilSidebar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  emergencyCount = 2
}) {
  const menuItems = [
    { id: "beranda", label: "Beranda", icon: LayoutDashboard },
    { id: "presensi", label: "Presensi", icon: ClipboardCheck },
    { id: "izin", label: "Izin", icon: AlertCircle, badge: emergencyCount },
    { id: "keluar-masuk", label: "Keluar Masuk", icon: DoorOpen },
    { id: "rekap", label: "Rekap Kehadiran", icon: BarChart3 },
    { id: "laporan", label: "Event / Acara", icon: FileText },
    { id: "profil", label: "Profil Saya", icon: User }
  ];

  return (
    <aside className="penghuni-sidebar">
      {/* 1. Bagian Atas: Logo Aplikasi & Navigasi */}
      <div className="penghuni-sidebar-top">
        {/* Logo Aplikasi MyNAVA (Sebelah Kiri Atas Sesuai Revisi) */}
        <div
          className="penghuni-logo-brand"
          style={{
            padding: "0 22px 24px 22px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            marginBottom: "16px",
            cursor: "pointer"
          }}
          onClick={() => setActiveTab("beranda")}
          title="MyNAVA - Presensi Asrama"
        >
          <img
            src="/logo-mynava-white.png"
            alt="MyNAVA"
            style={{
              height: "40px",
              width: "auto",
              objectFit: "contain"
            }}
          />
        </div>

        {/* Menu Navigasi */}
        <nav style={{ width: "100%" }}>
          <ul className="penghuni-nav-list">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;

              return (
                <li key={item.id} style={{ width: "100%" }}>
                  <div
                    className={`penghuni-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <IconComponent
                      size={18}
                      className="penghuni-nav-icon"
                      strokeWidth={isActive ? 2.3 : 1.8}
                    />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{
                          marginLeft: "auto",
                          backgroundColor: "#ff3b30",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 7px",
                          borderRadius: "10px",
                          lineHeight: 1
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

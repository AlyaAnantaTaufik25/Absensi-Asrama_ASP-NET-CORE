import React from "react";
import {
  LayoutDashboard,
  Camera,
  FileText,
  Calendar,
  User,
  Power
} from "lucide-react";
import "./PenghuniSidebar.css";

export default function PenghuniSidebar({ activeTab, setActiveTab, user, onLogout }) {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      id: "presensi",
      label: "Presensi",
      icon: Camera
    },
    {
      id: "izin",
      label: "Perizinan",
      icon: FileText
    },
    {
      id: "riwayat",
      label: "Riwayat",
      icon: Calendar
    },
    {
      id: "profil",
      label: "Profil Saya",
      icon: User
    }
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
          onClick={() => setActiveTab("dashboard")}
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

import React from "react";
import {
  LayoutDashboard,
  Database,
  Users,
  UserCheck,
  KeyRound,
  ShieldCheck,
  BarChart3,
  User,
  Power
} from "lucide-react";
import "../penghuni/PenghuniSidebar.css";

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  user,
  onLogout
}) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "master-data", label: "Data Gedung", icon: Database },
    { id: "data-penghuni", label: "Data Mahasiswa", icon: Users },
    { id: "data-fasil", label: "Data Fasil", icon: UserCheck },
    { id: "akun-pengguna", label: "Akun Pengguna", icon: KeyRound },
    { id: "rekapitulasi", label: "Rekapitulasi Presensi", icon: BarChart3 },
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
              const isActive =
                activeTab === item.id ||
                (item.id === "master-data" && (activeTab === "data-gedung" || activeTab === "master")) ||
                (item.id === "data-penghuni" && activeTab === "penghuni") ||
                (item.id === "data-fasil" && activeTab === "fasil") ||
                (item.id === "akun-pengguna" && (activeTab === "akun" || activeTab === "hak-akses" || activeTab === "akses")) ||
                (item.id === "rekapitulasi" && activeTab === "rekap");

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

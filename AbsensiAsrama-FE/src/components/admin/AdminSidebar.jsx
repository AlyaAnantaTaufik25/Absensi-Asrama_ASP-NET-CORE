import React from "react";
import Logo from "../Logo";
import {
  LayoutDashboard,
  Database,
  Users,
  UserCheck,
  KeyRound,
  BarChart3,
  LogOut
} from "lucide-react";

export default function AdminSidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "data-gedung", label: "Data Gedung", icon: Database },
    { id: "data-penghuni", label: "Data Penghuni", icon: Users },
    { id: "data-fasil", label: "Data Fasil", icon: UserCheck },
    { id: "akun-pengguna", label: "Akun Pengguna", icon: KeyRound },
    { id: "rekapitulasi", label: "Rekapitulasi Presensi", icon: BarChart3 },
  ];

  return (
    <aside
      style={{
        width: "250px",
        backgroundColor: "#1e3fae",
        background: "linear-gradient(180deg, #1e3fae 0%, #173294 100%)",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "100vh",
        padding: "24px 16px",
        position: "sticky",
        top: 0,
        height: "100vh",
        flexShrink: 0,
        boxSizing: "border-box",
        zIndex: 30
      }}
    >
      <div>
        {/* Brand Logo */}
        <div style={{ padding: "0 10px 24px 10px" }}>
          <Logo variant="yellow" />
        </div>

        {/* Section Tag */}
        <div
          style={{
            fontSize: "10.5px",
            fontWeight: "700",
            color: "rgba(255, 255, 255, 0.55)",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            padding: "0 14px",
            marginBottom: "12px"
          }}
        >
          ADMINISTRATOR
        </div>

        {/* Navigation Items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "none",
                  backgroundColor: isActive ? "#ffffff" : "transparent",
                  color: isActive ? "#1e3fae" : "rgba(255, 255, 255, 0.85)",
                  fontSize: "13px",
                  fontWeight: isActive ? "700" : "500",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  boxShadow: isActive ? "0 4px 14px rgba(0, 0, 0, 0.12)" : "none"
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
                  }
                }}
              >
                <IconComponent size={18} strokeWidth={isActive ? 2.3 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <button
        type="button"
        onClick={onLogout}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 14px",
          borderRadius: "10px",
          border: "none",
          background: "transparent",
          color: "rgba(255, 255, 255, 0.75)",
          fontSize: "13px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.15s ease"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
          e.currentTarget.style.color = "#fca5a5";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)";
        }}
      >
        <LogOut size={16} />
        <span>Keluar</span>
      </button>
    </aside>
  );
}

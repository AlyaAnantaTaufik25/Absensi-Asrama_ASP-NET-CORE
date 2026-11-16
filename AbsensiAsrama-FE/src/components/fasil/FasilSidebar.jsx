import React from "react";
import Logo from "../Logo";
import {
  LayoutDashboard,
  ClipboardCheck,
  AlertCircle,
  BarChart3,
  FileText,
  LogOut
} from "lucide-react";

export default function FasilSidebar({ activeTab, setActiveTab, user, onLogout, emergencyCount = 2 }) {
  const menuItems = [
    { id: "beranda", label: "Beranda", icon: LayoutDashboard },
    { id: "presensi", label: "Presensi lantai", icon: ClipboardCheck },
    { id: "izin", label: "Izin darurat", icon: AlertCircle, badge: emergencyCount },
    { id: "rekap", label: "Rekap kehadiran", icon: BarChart3 },
    { id: "laporan", label: "Laporan kejadian", icon: FileText }
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
        zIndex: 30,
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif"
      }}
    >
      <div>
        {/* Brand Logo */}
        <div style={{ padding: "4px 14px 24px 14px" }}>
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
          FASILITATOR
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
                  justifyContent: "space-between",
                  width: "100%",
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
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <IconComponent size={18} strokeWidth={isActive ? 2.3 : 1.8} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span
                    style={{
                      backgroundColor: isActive ? "#1e3fae" : "#f59e0b",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: "700",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile Footer */}
      <div
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.12)",
          paddingTop: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.18)",
              border: "1.5px solid rgba(255, 255, 255, 0.3)",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            {user?.initials || "AR"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#ffffff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {user?.name || "Kak Alif Rahman"}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255, 255, 255, 0.65)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              Fasilitator · Lt. 3 Al-Farabi
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          title="Keluar"
          style={{
            background: "none",
            border: "none",
            color: "rgba(255, 255, 255, 0.75)",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#fca5a5";
            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

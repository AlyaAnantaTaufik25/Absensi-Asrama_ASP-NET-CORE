import React, { useState, useEffect } from "react";
import Logo from "./Logo";
import { LogOut, ChevronDown } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const [timeString, setTimeString] = useState("05:18:09 WIB");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setTimeString(`${hours}:${minutes}:${seconds} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "presensi", label: "Presensi" },
    { id: "izin", label: "Izin" },
    { id: "riwayat", label: "Riwayat" }
  ];

  return (
    <header className="asrama-navbar">
      <div className="navbar-inner-content">
        {/* Left: Brand Logo */}
        <div
          onClick={() => setActiveTab("dashboard")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <Logo variant="dark" />
        </div>

        {/* Center: Nav Pills */}
        <nav className="nav-links-group">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link-btn ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Clock & User Avatar */}
        <div className="navbar-right-user">
          <div className="navbar-clock">
            {timeString}
          </div>

          <div style={{ position: "relative" }}>
            <div
              className="user-profile-chip"
              onClick={() => setShowDropdown(!showDropdown)}
              title="Menu Pengguna"
            >
              <div className="user-avatar-blue">
                {user?.initials || "AA"}
              </div>
              <span className="user-display-name">
                {user?.displayName || "ALYA ANANTA"}
              </span>
              <ChevronDown size={14} color="#64748b" />
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "42px",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                  border: "1px solid #e2e8f0",
                  padding: "8px",
                  minWidth: "200px",
                  zIndex: 50
                }}
              >
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0f172a" }}>
                    {user?.name || "Alya Ananta"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    NIM: {user?.nim || "2311523005"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    {user?.room || "Asrama Hijau, B-302"}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onLogout();
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    border: "none",
                    background: "none",
                    borderRadius: "8px",
                    color: "#ef4444",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fee2e2")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <LogOut size={15} />
                  Keluar dari Akun
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

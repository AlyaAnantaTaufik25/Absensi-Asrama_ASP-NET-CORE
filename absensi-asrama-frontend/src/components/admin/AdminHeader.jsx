import React, { useState, useEffect } from "react";
import { ChevronDown, LogOut } from "lucide-react";

export default function AdminHeader({ user, onLogout }) {
  const [timeString, setTimeString] = useState("05:24 WIB");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setTimeString(`${hours}:${minutes} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 36px",
        backgroundColor: "transparent",
        position: "relative"
      }}
    >
      {/* Left: Date & Time */}
      <div>
        <div style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>
          Selasa, 20 Oktober 2026
        </div>
        <div style={{ fontSize: "11.5px", color: "#64748b" }}>
          {timeString}
        </div>
      </div>

      {/* Right: Administrator badge & User chip */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative" }}>
        {/* Administrator Badge */}
        <span
          style={{
            backgroundColor: "#fef3c7",
            color: "#b45309",
            fontSize: "11px",
            fontWeight: "700",
            padding: "4px 12px",
            borderRadius: "9999px",
            letterSpacing: "0.2px"
          }}
        >
          Administrator
        </span>

        {/* Profile Chip */}
        <div
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: "9999px",
            transition: "background-color 0.15s ease"
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#2349d4",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {user?.initials || "AR"}
          </div>

          <span style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
            {user?.name || "Andi Rahman"}
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
              minWidth: "180px",
              zIndex: 50
            }}
          >
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0f172a" }}>
                {user?.name || "Andi Rahman"}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                admin@demo.com
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
                padding: "9px 12px",
                border: "none",
                background: "none",
                borderRadius: "8px",
                color: "#ef4444",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer",
                textAlign: "left"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fee2e2")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <LogOut size={14} />
              Keluar dari Akun
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

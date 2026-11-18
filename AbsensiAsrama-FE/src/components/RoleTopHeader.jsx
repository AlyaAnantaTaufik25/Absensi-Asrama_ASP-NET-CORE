import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, User, Lock, LogOut, ShieldCheck, Camera, Sparkles } from "lucide-react";

export default function RoleTopHeader({ user, setActiveTab, onLogout, currentTabLabel }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [timeString, setTimeString] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short"
      });
      const timePart = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
      }) + " WIB";
      setTimeString(`${datePart} • ${timePart}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user?.displayName || user?.name || "Pengguna MyNAVA";
  const userRole = (user?.role || "penghuni").toLowerCase();
  const userNim = user?.nim || "";
  const userEmail = user?.email || (userNim ? `${userNim.toLowerCase()}@mahasiswa.ac.id` : "user@mynava.ac.id");

  const roleBadge =
    userRole === "admin"
      ? { label: userNim ? `Admin • NIP ${userNim}` : "Administrator", bg: "#fef3c7", text: "#b45309", border: "#fde68a" }
      : userRole === "fasil"
      ? { label: "Fasilitator", bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" }
      : { label: userNim ? `Mahasiswa • ${userNim}` : "Mahasiswa", bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "US";

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 36px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
      }}
    >
      {/* Kiri: Indikator Waktu / Sesi Real-Time */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#10b981",
            boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)"
          }}
        />
        <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#475569" }}>
          {timeString || "Sinkron Sistem"}
        </span>
        {currentTabLabel && (
          <>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "500" }}>
              {currentTabLabel}
            </span>
          </>
        )}
      </div>

      {/* Kanan Atas: Widget Profil Pengguna (Sesuai Permintaan Revisi) */}
      <div style={{ position: "relative" }} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: showDropdown ? "#f8fafc" : "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "30px",
            padding: "5px 14px 5px 6px",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease"
          }}
          title="Klik untuk membuka menu profil"
        >
          {/* Avatar Ring */}
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              backgroundColor: userRole === "admin" ? "#2349d4" : userRole === "fasil" ? "#059669" : "#007aff",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12.5px",
              fontWeight: "700",
              overflow: "hidden",
              flexShrink: 0
            }}
          >
            {user?.foto ? (
              <img
                src={user.foto}
                alt={displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* User Name & Role Pill */}
          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "1px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#0f172a",
                lineHeight: 1.2,
                maxWidth: "160px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {displayName}
            </span>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: "600",
                color: roleBadge.text
              }}
            >
              {roleBadge.label}
            </span>
          </div>

          <ChevronDown
            size={14}
            color="#64748b"
            style={{
              transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
              marginLeft: "2px"
            }}
          />
        </button>

        {/* Apple HIG Profile Dropdown */}
        {showDropdown && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "48px",
              width: "260px",
              backgroundColor: "#ffffff",
              borderRadius: "18px",
              boxShadow: "0 12px 36px -4px rgba(0,0,0,0.12), 0 2px 10px rgba(0,0,0,0.06)",
              border: "1px solid rgba(0,0,0,0.08)",
              padding: "10px",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              gap: "4px"
            }}
          >
            {/* User Overview */}
            <div
              style={{
                padding: "10px 12px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #f1f5f9"
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                {displayName}
              </div>
              <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px", wordBreak: "break-all" }}>
                {userEmail}
              </div>
              {user?.room && (
                <div style={{ fontSize: "11px", color: "#007aff", fontWeight: "600", marginTop: "4px" }}>
                  Kamar {user.room}
                </div>
              )}
            </div>

            {/* Menu Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => {
                  setShowDropdown(false);
                  if (setActiveTab) setActiveTab("profil");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 12px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "10px",
                  color: "#1e293b",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.12s ease"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <User size={15} color="#007aff" />
                <span>Profil & Kata Sandi</span>
              </button>

              {userRole === "penghuni" && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false);
                    if (setActiveTab) setActiveTab("profil");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 12px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "10px",
                    color: "#1e293b",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background-color 0.12s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Camera size={15} color="#10b981" />
                  <span>Pengaturan Biometrik Wajah</span>
                </button>
              )}

              <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "4px 0" }} />

              <button
                type="button"
                onClick={() => {
                  setShowDropdown(false);
                  if (onLogout) onLogout();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 12px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "10px",
                  color: "#ef4444",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.12s ease"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <LogOut size={15} color="#ef4444" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

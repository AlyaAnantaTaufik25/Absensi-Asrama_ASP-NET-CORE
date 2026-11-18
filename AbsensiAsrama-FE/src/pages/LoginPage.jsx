import React, { useState, useEffect } from "react";
import Logo from "../components/Logo";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Wifi,
  WifiOff,
  AlertCircle,
  GraduationCap,
  UserCheck,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { loginUser, checkBackendStatus, seedDemoAccounts } from "../services/api";
import { showToast } from "../utils/toast";

export default function LoginPage({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState("penghuni");
  const [email, setEmail] = useState("penghuni@demo.com");
  const [password, setPassword] = useState("asrama");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [backendStatus, setBackendStatus] = useState({ checked: false, online: false, message: "" });

  const [inputFocused, setInputFocused] = useState("");

  const demoAccounts = [
    {
      roleKey: "penghuni",
      roleLabel: "Mahasiswa",
      fullName: "Alya Ananta",
      email: "penghuni@demo.com",
      subtitle: "Mahasiswa Asrama",
      icon: GraduationCap,
      user: {
        id: 1,
        name: "Alya Ananta",
        displayName: "ALYA ANANTA",
        initials: "AA",
        nim: "2311523005",
        room: "Asrama Hijau · Kamar B-302",
        asrama: "Asrama Hijau",
        role: "penghuni",
        email: "penghuni@demo.com"
      }
    },
    {
      roleKey: "fasil",
      roleLabel: "Fasilitator",
      fullName: "Kak Alif Rahman",
      email: "fasil@demo.com",
      subtitle: "Fasilitator Lantai",
      icon: UserCheck,
      user: {
        id: 2,
        name: "Kak Alif Rahman",
        displayName: "KAK ALIF RAHMAN",
        initials: "AR",
        nim: "FASIL-01",
        room: "Lantai 3 · Asrama Hijau",
        asrama: "Asrama Hijau",
        role: "fasil",
        email: "fasil@demo.com"
      }
    },
    {
      roleKey: "admin",
      roleLabel: "Admin",
      fullName: "Admin Pusat",
      email: "admin@demo.com",
      subtitle: "Administrator",
      icon: ShieldCheck,
      user: {
        id: 3,
        name: "Admin Pusat",
        displayName: "ADMIN PUSAT",
        initials: "AP",
        nim: "ADM-001",
        room: "Kantor Pengelola",
        asrama: "Pusat Pengelola Asrama",
        role: "admin",
        email: "admin@demo.com"
      }
    }
  ];

  const currentAccount = demoAccounts.find((a) => a.roleKey === selectedRole) || demoAccounts[0];

  useEffect(() => {
    async function verifyBackend() {
      const status = await checkBackendStatus();
      setBackendStatus({ checked: true, ...status });
    }
    verifyBackend();
  }, []);

  const handleRoleSelect = (acc) => {
    setSelectedRole(acc.roleKey);
    setEmail(acc.email);
    setPassword("asrama");
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 1. Coba login ke API backend
      const res = await loginUser(email, password);

      if (res.ok && res.data?.user) {
        onLogin(res.data.user);
        return;
      }

      // 2. Jika email dan password cocok dengan akun demo (password: 'asrama')
      const demoMatch = demoAccounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
      if (demoMatch && (password === "asrama" || !res.ok)) {
        onLogin(demoMatch.user);
        return;
      }

      if (res.status === 401) {
        const isDemoEmail = demoAccounts.some((a) => a.email.toLowerCase() === email.toLowerCase());
        if (isDemoEmail && res.data?.message?.includes("tidak terdaftar")) {
          try {
            const seedRes = await seedDemoAccounts();
            if (seedRes.ok) {
              const retryRes = await loginUser(email, password);
              if (retryRes.ok && retryRes.data?.user) {
                onLogin(retryRes.data.user);
                return;
              }
            }
          } catch {}
          if (demoMatch) {
            onLogin(demoMatch.user);
            return;
          }
        }

        setErrorMessage(res.data?.message || "Email atau password salah.");
        return;
      }

      // 3. Fallback jika backend offline / database error
      if (demoMatch) {
        onLogin(demoMatch.user);
        return;
      }

      setErrorMessage(res.data?.message || "Tidak dapat login. Pastikan akun terdaftar di sistem.");
    } catch (err) {
      const demoMatch = demoAccounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
        || demoAccounts.find((a) => a.roleKey === selectedRole)
        || demoAccounts[0];
      if (password === "asrama" || !password) {
        onLogin(demoMatch.user);
      } else {
        setErrorMessage("Gagal terhubung ke backend: " + (err.message || "Server offline"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", -apple-system-body, system-ui, sans-serif';

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#f4f6fa",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: fontStack,
        position: "relative",
        boxSizing: "border-box",
        overflowX: "hidden"
      }}
    >
      {/* 1. Header Banner - Scenic Half-Screen Header (48vh) */}
      <div
        style={{
          width: "100%",
          height: "48vh",
          minHeight: "280px",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0
        }}
      >
        <img
          src="/unand-banner.jpg"
          alt="Universitas Andalas"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 44%"
          }}
        />

        {/* Apple iOS Smooth Frosted Vignette Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(15, 23, 42, 0.42) 0%, rgba(15, 23, 42, 0.12) 40%, rgba(244, 246, 250, 0.72) 80%, #f4f6fa 100%)"
          }}
        />

        {/* Logo Unand / MyNAVA di Kanan Atas - Tanpa Background */}
        <div
          style={{
            position: "absolute",
            top: "24px",
            right: "32px",
            zIndex: 30,
            filter: "drop-shadow(0 2px 10px rgba(0, 0, 0, 0.45))",
            transition: "transform 0.2s ease"
          }}
        >
          <Logo variant="white-on-blue" size="large" />
        </div>
      </div>

      {/* 2. Middle Content Area: Floating Frosted Glass Card */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "clamp(-165px, -18vh, -135px)",
          position: "relative",
          zIndex: 10,
          padding: "0 16px",
          boxSizing: "border-box",
          flex: 1
        }}
      >
        {/* Welcome Text with subtle Apple drop glow */}
        <div style={{ textAlign: "center", marginBottom: "14px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1c1c1e",
              margin: "0 0 5px 0",
              letterSpacing: "-0.6px",
              textShadow: "0 2px 14px rgba(255, 255, 255, 0.95)"
            }}
          >
            Welcome Back
          </h1>
          <p
            style={{
              fontSize: "13.5px",
              color: "#6e6e73",
              fontWeight: "500",
              margin: 0,
              maxWidth: "420px",
              lineHeight: 1.45,
              textShadow: "0 1px 10px rgba(255, 255, 255, 0.9)"
            }}
          >
            Sign in to access your dashboard and continue where you left off.
          </p>
        </div>

        {/* Floating iOS Glass Card */}
        <div
          style={{
            width: "100%",
            maxWidth: "392px",
            backgroundColor: "rgba(255, 255, 255, 0.88)",
            backdropFilter: "blur(28px) saturate(190%)",
            WebkitBackdropFilter: "blur(28px) saturate(190%)",
            borderRadius: "28px",
            border: "1px solid rgba(255, 255, 255, 0.9)",
            boxShadow:
              "0 20px 48px -12px rgba(15, 23, 42, 0.12), 0 4px 16px rgba(0, 0, 0, 0.03), inset 0 1px 1px rgba(255, 255, 255, 0.9)",
            padding: "24px 26px 22px 26px",
            boxSizing: "border-box"
          }}
        >
          {/* Error Alert Box */}
          {errorMessage && (
            <div
              style={{
                backgroundColor: "rgba(255, 59, 48, 0.1)",
                border: "1px solid rgba(255, 59, 48, 0.22)",
                color: "#ff3b30",
                padding: "9px 12px",
                borderRadius: "14px",
                fontSize: "12px",
                fontWeight: "600",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Apple iOS Segmented Control (Role Switcher) */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "3px",
                backgroundColor: "rgba(120, 120, 128, 0.12)",
                padding: "3px",
                borderRadius: "14px"
              }}
            >
              {demoAccounts.map((acc) => {
                const isSelected = selectedRole === acc.roleKey;
                return (
                  <button
                    key={acc.roleKey}
                    type="button"
                    onClick={() => handleRoleSelect(acc)}
                    style={{
                      padding: "7px 2px",
                      borderRadius: "11px",
                      border: "none",
                      backgroundColor: isSelected ? "#ffffff" : "transparent",
                      color: isSelected ? "#1c1c1e" : "#8e8e93",
                      fontSize: "12.5px",
                      fontWeight: isSelected ? "600" : "500",
                      cursor: "pointer",
                      boxShadow: isSelected
                        ? "0 3px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)"
                        : "none",
                      transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                      textAlign: "center",
                      fontFamily: fontStack,
                      userSelect: "none"
                    }}
                  >
                    {acc.roleLabel}
                  </button>
                );
              })}
            </div>

            {/* Micro pill: Target user info */}
            <div
              style={{
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 2px"
              }}
            >
              <span style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "500" }}>
                Login sebagai: <strong style={{ color: "#1c1c1e" }}>{currentAccount.fullName}</strong>
              </span>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: "600",
                  color: "#007aff",
                  backgroundColor: "rgba(0, 122, 255, 0.08)",
                  padding: "1px 7px",
                  borderRadius: "8px"
                }}
              >
                {currentAccount.subtitle}
              </span>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Email Address */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#1c1c1e",
                  marginBottom: "5px"
                }}
              >
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: inputFocused === "email" ? "#007aff" : "#8e8e93",
                    transition: "color 0.15s ease"
                  }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onFocus={() => setInputFocused("email")}
                  onBlur={() => setInputFocused("")}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 14px 0 38px",
                    borderRadius: "14px",
                    border:
                      inputFocused === "email"
                        ? "1.5px solid #007aff"
                        : "1px solid rgba(0, 0, 0, 0.08)",
                    backgroundColor: inputFocused === "email" ? "#ffffff" : "rgba(242, 242, 247, 0.85)",
                    boxShadow:
                      inputFocused === "email"
                        ? "0 0 0 3.5px rgba(0, 122, 255, 0.15)"
                        : "none",
                    fontSize: "13px",
                    color: "#1c1c1e",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: fontStack,
                    transition: "all 0.15s ease"
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "5px"
                }}
              >
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#1c1c1e" }}>
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast("Kata sandi default akun demo adalah 'asrama'. Hubungi admin jika membutuhkan bantuan.", "warning");
                  }}
                  style={{
                    fontSize: "11.5px",
                    color: "#007aff",
                    textDecoration: "none",
                    fontWeight: "500"
                  }}
                >
                  Forgot?
                </a>
              </div>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: inputFocused === "password" ? "#007aff" : "#8e8e93",
                    transition: "color 0.15s ease"
                  }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onFocus={() => setInputFocused("password")}
                  onBlur={() => setInputFocused("")}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 38px 0 38px",
                    borderRadius: "14px",
                    border:
                      inputFocused === "password"
                        ? "1.5px solid #007aff"
                        : "1px solid rgba(0, 0, 0, 0.08)",
                    backgroundColor: inputFocused === "password" ? "#ffffff" : "rgba(242, 242, 247, 0.85)",
                    boxShadow:
                      inputFocused === "password"
                        ? "0 0 0 3.5px rgba(0, 122, 255, 0.15)"
                        : "none",
                    fontSize: "13px",
                    color: "#1c1c1e",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: fontStack,
                    transition: "all 0.15s ease"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#8e8e93",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "6px"
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Apple Style Meta Row: Password Hint & Connection Status Dot */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "2px 2px 4px 2px"
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#8e8e93",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <span>Default:</span>
                <span
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.05)",
                    padding: "2px 6px",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                    fontWeight: "600",
                    color: "#1c1c1e"
                  }}
                >
                  asrama
                </span>
              </div>

              {backendStatus.checked && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "11px",
                    fontWeight: "600",
                    color: backendStatus.online ? "#34c759" : "#ff9500"
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: backendStatus.online ? "#34c759" : "#ff9500",
                      boxShadow: backendStatus.online
                        ? "0 0 6px rgba(52, 199, 89, 0.6)"
                        : "0 0 6px rgba(255, 149, 0, 0.6)"
                    }}
                  />
                  <span>{backendStatus.online ? "Online" : "Demo"}</span>
                </div>
              )}
            </div>

            {/* Submit Sign In Button (Apple Dark Slate Teal Pill) */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                height: "44px",
                background: "linear-gradient(180deg, #173847 0%, #102732 100%)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                borderRadius: "14px",
                border: "none",
                cursor: isLoading ? "default" : "pointer",
                boxShadow: "0 4px 14px rgba(23, 56, 71, 0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "4px",
                transition: "all 0.18s ease",
                fontFamily: fontStack,
                letterSpacing: "-0.2px"
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.filter = "brightness(1.08)";
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.currentTarget.style.filter = "brightness(1)";
              }}
              onMouseDown={(e) => {
                if (!isLoading) e.currentTarget.style.transform = "scale(0.985)";
              }}
              onMouseUp={(e) => {
                if (!isLoading) e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <span>{isLoading ? "Signing in..." : "Sign in"}</span>
              {!isLoading && <ArrowRight size={15} />}
            </button>
          </form>
        </div>
      </div>

      {/* 3. Footer Institution Label */}
      <div
        style={{
          padding: "20px 0 16px 0",
          fontSize: "12px",
          color: "#8e8e93",
          textAlign: "center",
          flexShrink: 0,
          fontWeight: "500",
          letterSpacing: "0.2px"
        }}
      >
        MyNAVA • Universitas Andalas
      </div>
    </div>
  );
}

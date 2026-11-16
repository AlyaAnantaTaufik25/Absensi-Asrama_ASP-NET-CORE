import React, { useState, useEffect } from "react";
import Logo from "../components/Logo";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  GraduationCap,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { loginUser, checkBackendStatus, seedDemoAccounts } from "../services/api";

export default function LoginPage({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState("penghuni");
  const [email, setEmail] = useState("penghuni@demo.com");
  const [password, setPassword] = useState("asrama");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [backendStatus, setBackendStatus] = useState({ checked: false, online: false, message: "" });

  const demoAccounts = [
    {
      roleKey: "penghuni",
      roleLabel: "Penghuni",
      fullName: "Alya Ananta",
      idNumber: "2311523005",
      roomInfo: "Asrama Hijau · Kamar B-302",
      email: "penghuni@demo.com",
      icon: GraduationCap,
      user: {
        name: "Alya Ananta",
        displayName: "ALYA ANANTA",
        initials: "AA",
        nim: "2311523005",
        room: "Asrama Hijau, Kamar B-302 Lantai 2",
        asrama: "Asrama Hijau",
        role: "penghuni"
      }
    },
    {
      roleKey: "fasil",
      roleLabel: "Fasilitator",
      fullName: "Kak Alif Rahman",
      idNumber: "FASIL-01",
      roomInfo: "Lantai 3 · Gedung Al-Farabi",
      email: "fasil@demo.com",
      icon: UserCheck,
      user: {
        name: "Kak Alif Rahman",
        displayName: "KAK ALIF RAHMAN",
        initials: "AR",
        nim: "FASIL-01",
        room: "Lantai 3 · Gedung Al-Farabi",
        asrama: "Gedung Al-Farabi",
        role: "fasil"
      }
    },
    {
      roleKey: "admin",
      roleLabel: "Admin",
      fullName: "Admin Pusat",
      idNumber: "ADM-99",
      roomInfo: "Pusat Pengelola Asrama",
      email: "admin@demo.com",
      icon: ShieldCheck,
      user: {
        name: "Admin Pusat",
        displayName: "ADMIN PUSAT",
        initials: "AP",
        nim: "ADM-99",
        room: "Pusat Pengelola Asrama",
        asrama: "Universitas Andalas",
        role: "admin"
      }
    }
  ];

  // Cek status backend saat halaman dimuat
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
      // 1. Coba login ke API Backend (http://localhost:5250/api/auth/login)
      const res = await loginUser(email, password);

      if (res.ok && res.data?.user) {
        // Berhasil login dari backend
        onLogin(res.data.user);
        return;
      }

      // Jika backend merespon error validasi dari DB
      if (res.status === 401) {
        // Jika akun demo belum ada di DB, kita otomatis coba buatkan via seed API
        const isDemoEmail = demoAccounts.some((a) => a.email.toLowerCase() === email.toLowerCase());
        if (isDemoEmail && res.data?.message?.includes("tidak terdaftar")) {
          try {
            const seedRes = await seedDemoAccounts();
            if (seedRes.ok) {
              // Coba login ulang
              const retryRes = await loginUser(email, password);
              if (retryRes.ok && retryRes.data?.user) {
                onLogin(retryRes.data.user);
                return;
              }
            }
          } catch { }
        }

        setErrorMessage(res.data?.message || "Email atau password salah.");
        return;
      }

      setErrorMessage(res.data?.message || "Tidak dapat login. Pastikan akun terdaftar di database MySQL.");
    } catch (err) {
      setErrorMessage("Gagal terhubung ke backend: " + (err.message || "Server offline"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f6fa",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
      }}
    >
      {/* Brand Header on Top */}
      <div style={{ marginBottom: "24px", textAlign: "center" }}>
        <Logo variant="dark" size="large" />
      </div>

      {/* Main Single Login Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 30px -10px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.02)",
          padding: "36px 32px"
        }}
      >
        <div style={{ marginBottom: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: "800",
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-0.3px"
              }}
            >
              Masuk ke Akun
            </h1>

            {/* Backend Connection Indicator */}
            {backendStatus.checked && (
              <span
                title={backendStatus.message}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "3px 9px",
                  borderRadius: "999px",
                  backgroundColor: backendStatus.online ? "#dcfce7" : "#fef3c7",
                  color: backendStatus.online ? "#15803d" : "#b45309"
                }}
              >
                {backendStatus.online ? <Wifi size={12} /> : <WifiOff size={12} />}
                {backendStatus.online ? "Backend Aktif" : "Mode Demo"}
              </span>
            )}
          </div>

          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Pilih peran akun atau masukkan email Anda.
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #fca5a5",
              color: "#b91c1c",
              padding: "10px 14px",
              borderRadius: "10px",
              fontSize: "12.5px",
              fontWeight: "600",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div style={{ marginBottom: "18px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "6px",
              backgroundColor: "#f8fafc",
              padding: "4px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0"
            }}
          >
            {demoAccounts.map((acc) => {
              const isSelected = selectedRole === acc.roleKey;
              const IconComponent = acc.icon;
              return (
                <button
                  key={acc.roleKey}
                  type="button"
                  onClick={() => handleRoleSelect(acc)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px 4px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: isSelected ? "#ffffff" : "transparent",
                    color: isSelected ? "#1e3fae" : "#64748b",
                    fontSize: "12px",
                    fontWeight: isSelected ? "700" : "500",
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 1px 4px rgba(0, 0, 0, 0.08)" : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  <IconComponent size={14} strokeWidth={isSelected ? 2.3 : 1.8} />
                  <span>{acc.roleLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Email Field */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "600",
                color: "#334155",
                marginBottom: "5px"
              }}
            >
              Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8"
                }}
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px 0 36px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  fontSize: "13px",
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>
                Kata Sandi
              </label>
              <a
                href="#lupa-password"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Silakan hubungi pengelola asrama untuk mereset kata sandi.");
                }}
                style={{ fontSize: "11.5px", color: "#2563eb", textDecoration: "none", fontWeight: "600" }}
              >
                Lupa kata sandi?
              </a>
            </div>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8"
                }}
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 36px 0 36px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  fontSize: "13px",
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Remember me & default password hint */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#64748b" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: "#1e3fae", cursor: "pointer" }}
              />
              Ingat saya
            </label>

            <span style={{ color: "#64748b" }}>
              Kata sandi: <strong style={{ color: "#0f172a" }}>asrama</strong>
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              height: "42px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontSize: "13.5px",
              fontWeight: "700",
              borderRadius: "8px",
              border: "none",
              cursor: isLoading ? "default" : "pointer",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "4px",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = "#1d4ed8";
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = "#2563eb";
            }}
          >
            <span>{isLoading ? "Menghubungkan..." : "Masuk"}</span>
            {!isLoading && <ArrowRight size={15} />}
          </button>
        </form>
      </div>

      {/* Footer Institution Label */}
      <div style={{ marginTop: "24px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>
        © 2026 MyNAVA · Universitas Andalas
      </div>
    </div>
  );
}

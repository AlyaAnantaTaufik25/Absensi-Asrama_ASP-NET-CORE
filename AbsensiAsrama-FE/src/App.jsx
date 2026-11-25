import React, { useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PresensiPage from "./pages/PresensiPage";
import PengajuanIzinPage from "./pages/PengajuanIzinPage";
import RiwayatPresensiPage from "./pages/RiwayatPresensiPage";
import ProfilePage from "./pages/ProfilePage";
import PenghuniSidebar from "./components/penghuni/PenghuniSidebar";
import AdminContainer from "./pages/admin/AdminContainer";
import FasilContainer from "./pages/fasil/FasilContainer";
import RoleTopHeader from "./components/RoleTopHeader";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("mynava_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem("mynava_user", JSON.stringify(userData));
    } catch {}
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    try {
      localStorage.setItem("mynava_user", JSON.stringify(updatedUser));
    } catch {}
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem("mynava_user");
    } catch {}
    setActiveTab("dashboard");
  };

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Admin Portal View
  if (user.role === "admin") {
    return (
      <AdminContainer
        user={user}
        onLogout={handleLogout}
        onUpdateUser={handleUpdateUser}
      />
    );
  }

  // Fasilitator Portal View
  if (user.role === "fasil") {
    return (
      <FasilContainer
        user={user}
        onLogout={handleLogout}
        onUpdateUser={handleUpdateUser}
      />
    );
  }

  const tabLabels = {
    dashboard: "Dashboard",
    presensi: "Presensi Mandiri",
    izin: "Perizinan Mahasiswa",
    riwayat: "Riwayat Presensi",
    profil: "Pengaturan Profil"
  };

  // Penghuni Portal View with Curved Scooped Sidebar
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f4f6fa",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif'
      }}
    >
      {/* 1. Left Sticky Penghuni Sidebar (Logo Aplikasi di Kiri Atas) */}
      <PenghuniSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflowY: "auto",
          height: "100vh"
        }}
      >
        {/* Top Header: Profil Pengguna di Kanan Atas */}
        <RoleTopHeader
          user={user}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          currentTabLabel={tabLabels[activeTab]}
        />

        <main
          style={{
            flex: 1,
            padding: "28px 36px 60px 36px",
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box"
          }}
        >
          {activeTab === "dashboard" && (
            <DashboardPage user={user} setActiveTab={setActiveTab} />
          )}
          {activeTab === "presensi" && (
            <PresensiPage user={user} setActiveTab={setActiveTab} />
          )}
          {activeTab === "izin" && (
            <PengajuanIzinPage user={user} setActiveTab={setActiveTab} />
          )}
          {activeTab === "riwayat" && (
            <RiwayatPresensiPage user={user} setActiveTab={setActiveTab} />
          )}
          {activeTab === "profil" && (
            <ProfilePage user={user} onUpdateUser={handleUpdateUser} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

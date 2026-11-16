import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PresensiPage from "./pages/PresensiPage";
import PengajuanIzinPage from "./pages/PengajuanIzinPage";
import RiwayatPresensiPage from "./pages/RiwayatPresensiPage";
import "./App.css";

import AdminContainer from "./pages/admin/AdminContainer";
import FasilContainer from "./pages/fasil/FasilContainer";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab("dashboard");
  };

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Admin Portal View
  if (user.role === "admin") {
    return <AdminContainer user={user} onLogout={handleLogout} />;
  }

  // Fasilitator Portal View
  if (user.role === "fasil") {
    return <FasilContainer user={user} onLogout={handleLogout} />;
  }

  // Penghuni Portal View
  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-content-layout">
        {activeTab === "dashboard" && <DashboardPage user={user} setActiveTab={setActiveTab} />}
        {activeTab === "presensi" && <PresensiPage user={user} setActiveTab={setActiveTab} />}
        {activeTab === "izin" && <PengajuanIzinPage user={user} setActiveTab={setActiveTab} />}
        {activeTab === "riwayat" && <RiwayatPresensiPage user={user} setActiveTab={setActiveTab} />}
      </main>
    </div>
  );
}

export default App;
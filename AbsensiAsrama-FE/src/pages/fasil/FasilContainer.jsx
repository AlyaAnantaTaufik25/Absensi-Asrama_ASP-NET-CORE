import React, { useState } from "react";
import FasilSidebar from "../../components/fasil/FasilSidebar";
import FasilDashboardPage from "./FasilDashboardPage";
import PresensiLantaiPage from "./PresensiLantaiPage";
import IzinDaruratPage from "./IzinDaruratPage";
import KeluarMasukPage from "./KeluarMasukPage";
import RekapKehadiranPage from "./RekapKehadiranPage";
import LaporanKejadianPage from "./LaporanKejadianPage";

export default function FasilContainer({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("beranda");

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f4f6fa",
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
      }}
    >
      {/* 1. Left Sticky Sidebar */}
      <FasilSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={onLogout}
        emergencyCount={2}
      />

      {/* 2. Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto" }}>
        <main
          style={{
            flex: 1,
            padding: "36px 40px 60px 40px",
            maxWidth: "1400px",
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box"
          }}
        >
          {activeTab === "beranda" && (
            <FasilDashboardPage setActiveTab={setActiveTab} user={user} />
          )}

          {activeTab === "presensi" && (
            <PresensiLantaiPage />
          )}

          {activeTab === "izin" && (
            <IzinDaruratPage />
          )}

          {activeTab === "keluar-masuk" && (
            <KeluarMasukPage />
          )}

          {activeTab === "rekap" && (
            <RekapKehadiranPage />
          )}

          {activeTab === "laporan" && (
            <LaporanKejadianPage />
          )}
        </main>
      </div>
    </div>
  );
}


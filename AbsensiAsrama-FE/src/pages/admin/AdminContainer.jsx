import React, { useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminDashboardPage from "./AdminDashboardPage";
import MasterDataPage from "./MasterDataPage";
import DataPenghuniPage from "./DataPenghuniPage";
import DataFasilPage from "./DataFasilPage";
import AkunPenggunaPage from "./AkunPenggunaPage";
import RekapitulasiPresensiAdminPage from "./RekapitulasiPresensiAdminPage";
import ProfilePage from "../ProfilePage";
import RoleTopHeader from "../../components/RoleTopHeader";

export default function AdminContainer({ user, onLogout, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabLabels = {
    dashboard: "Dashboard Utama",
    "master-data": "Data Gedung & Kamar",
    "data-penghuni": "Data Mahasiswa",
    "data-fasil": "Data Fasilitator Asrama",
    "akun-pengguna": "Akun Pengguna & Hak Akses",
    rekapitulasi: "Rekapitulasi Presensi",
    profil: "Pengaturan Profil"
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f4f6fa",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Inter', system-ui, sans-serif"
      }}
    >
      {/* 1. Left Sticky Sidebar (Logo Aplikasi di Kiri Atas) */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={onLogout}
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
        {/* Top Header: Profil Administrator di Kanan Atas */}
        <RoleTopHeader
          user={user}
          setActiveTab={setActiveTab}
          onLogout={onLogout}
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
            <AdminDashboardPage setActiveTab={setActiveTab} user={user} />
          )}

          {(activeTab === "master-data" || activeTab === "data-gedung" || activeTab === "master") && (
            <MasterDataPage />
          )}

          {(activeTab === "data-penghuni" || activeTab === "penghuni") && (
            <DataPenghuniPage />
          )}

          {(activeTab === "data-fasil" || activeTab === "fasil") && (
            <DataFasilPage />
          )}

          {(activeTab === "akun-pengguna" || activeTab === "akun" || activeTab === "hak-akses" || activeTab === "akses") && (
            <AkunPenggunaPage />
          )}

          {(activeTab === "rekapitulasi" || activeTab === "rekap") && (
            <RekapitulasiPresensiAdminPage />
          )}

          {activeTab === "profil" && (
            <ProfilePage user={user} onUpdateUser={onUpdateUser} />
          )}
        </main>
      </div>
    </div>
  );
}

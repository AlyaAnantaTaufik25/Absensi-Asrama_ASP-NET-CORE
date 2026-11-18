import React, { useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminDashboardPage from "./AdminDashboardPage";
import MasterDataPage from "./MasterDataPage";
import DataPenghuniPage from "./DataPenghuniPage";
import DataFasilPage from "./DataFasilPage";
import AkunPenggunaPage from "./AkunPenggunaPage";
import RekapitulasiPresensiAdminPage from "./RekapitulasiPresensiAdminPage";

export default function AdminContainer({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f2f1ed" }}>
      {/* 1. Left Sticky Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={onLogout}
      />

      {/* 2. Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Header */}
        <AdminHeader user={user} onLogout={onLogout} />

        {/* Content Body */}
        <main style={{ flex: 1, padding: "0 36px 48px 36px" }}>
          {activeTab === "dashboard" && (
            <AdminDashboardPage setActiveTab={setActiveTab} />
          )}

          {activeTab === "data-gedung" && (
            <MasterDataPage />
          )}

          {activeTab === "data-penghuni" && (
            <DataPenghuniPage />
          )}

          {activeTab === "data-fasil" && (
            <DataFasilPage />
          )}

          {activeTab === "akun-pengguna" && (
            <AkunPenggunaPage />
          )}

          {activeTab === "rekapitulasi" && (
            <RekapitulasiPresensiAdminPage />
          )}
        </main>
      </div>
    </div>
  );
}

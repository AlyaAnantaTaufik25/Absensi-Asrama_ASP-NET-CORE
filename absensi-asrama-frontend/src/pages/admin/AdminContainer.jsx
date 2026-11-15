import React, { useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminDashboardPage from "./AdminDashboardPage";
import MasterDataPage from "./MasterDataPage";
import DataPenghuniPage from "./DataPenghuniPage";
import DataFasilPage from "./DataFasilPage";
import AkunPenggunaPage from "./AkunPenggunaPage";
import HakAksesPage from "./HakAksesPage";
import RekapitulasiPresensiAdminPage from "./RekapitulasiPresensiAdminPage";
import { ShieldCheck, BarChart3, TrendingUp } from "lucide-react";

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

          {activeTab === "master-data" && (
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

          {activeTab === "hak-akses" && (
            <HakAksesPage />
          )}

          {activeTab === "rekapitulasi" && (
            <RekapitulasiPresensiAdminPage />
          )}

          {activeTab === "analytics" && (
            <div className="content-card" style={{ padding: "32px", textAlign: "center" }}>
              <TrendingUp size={48} color="#2349d4" style={{ margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Analytics & Export Laporan</h2>
              <p style={{ color: "#64748b", maxWidth: "480px", margin: "8px auto 24px" }}>
                Analisis statistik komprehensif tingkat kepatuhan santri dan fasilitas ekspor data laporan rektorat.
              </p>
              <button
                onClick={() => alert("Mengekspor laporan analytics...")}
                style={{
                  backgroundColor: "#2349d4",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Ekspor Laporan Lengkap (.pdf)
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

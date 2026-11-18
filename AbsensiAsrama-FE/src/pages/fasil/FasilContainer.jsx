import React, { useState, useEffect } from "react";
import FasilSidebar from "../../components/fasil/FasilSidebar";
import FasilDashboardPage from "./FasilDashboardPage";
import PresensiLantaiPage from "./PresensiLantaiPage";
import IzinDaruratPage from "./IzinDaruratPage";
import KeluarMasukPage from "./KeluarMasukPage";
import RekapKehadiranPage from "./RekapKehadiranPage";
import EventAcaraPage from "./EventAcaraPage";
import ProfilePage from "../ProfilePage";
import RoleTopHeader from "../../components/RoleTopHeader";
import SessionSettingModal from "../../components/fasil/SessionSettingModal";
import { getSessionSettings, updateSessionSettings } from "../../services/api";
import { CheckCircle2 } from "lucide-react";
import { showToast } from "../../utils/toast";

export default function FasilContainer({ user, onLogout, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState("beranda");
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionConfig, setSessionConfig] = useState({
    subuhStart: "04:00",
    subuhEnd: "06:00",
    malamStart: "18:00",
    malamEnd: "20:30"
  });
  const [sessionToast, setSessionToast] = useState("");
  const [isSavingSession, setIsSavingSession] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSessionSettings();
        if (settings) {
          setSessionConfig(settings);
        }
      } catch (err) {
        console.warn("Gagal memuat setting jam:", err);
      }
    }
    loadSettings();

    const handleSessionUpdated = (event) => {
      if (event?.detail) {
        setSessionConfig(event.detail);
      }
    };
    window.addEventListener("mynava_session_updated", handleSessionUpdated);
    return () => {
      window.removeEventListener("mynava_session_updated", handleSessionUpdated);
    };
  }, []);

  const handleSaveSession = async (newSession) => {
    setIsSavingSession(true);
    try {
      await updateSessionSettings({
        ...newSession,
        updatedBy: user?.displayName || user?.name || "Kak Alif Rahman"
      });
      setSessionConfig(newSession);
      setSessionToast("Jadwal sesi presensi berhasil disimpan!");
      setTimeout(() => setSessionToast(""), 3500);
      setSessionModalOpen(false);
    } catch (err) {
      showToast("Gagal menyimpan jam sesi: " + err.message, "error");
    } finally {
      setIsSavingSession(false);
    }
  };

  const tabLabels = {
    beranda: "Beranda Utama",
    presensi: "Presensi Mahasiswa",
    izin: "Izin Mahasiswa",
    "keluar-masuk": "Log Keluar Masuk",
    rekap: "Rekapitulasi Kehadiran",
    laporan: "Event / Acara Kegiatan",
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
      <FasilSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={onLogout}
        emergencyCount={2}
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
        {/* Top Header: Profil Fasilitator di Kanan Atas */}
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
          {/* Notification Toast */}
          {sessionToast && (
            <div
              style={{
                marginBottom: "20px",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#059669",
                padding: "12px 18px",
                borderRadius: "14px",
                fontSize: "13px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.08)"
              }}
            >
              <CheckCircle2 size={16} />
              <span>{sessionToast}</span>
            </div>
          )}

          {activeTab === "beranda" && (
            <FasilDashboardPage setActiveTab={setActiveTab} user={user} sessionConfig={sessionConfig} />
          )}

          {activeTab === "presensi" && (
            <PresensiLantaiPage
              user={user}
              sessionConfig={sessionConfig}
              onOpenSessionModal={() => setSessionModalOpen(true)}
            />
          )}

          {activeTab === "izin" && (
            <IzinDaruratPage />
          )}

          {activeTab === "keluar-masuk" && (
            <KeluarMasukPage />
          )}

          {activeTab === "rekap" && (
            <RekapKehadiranPage user={user} />
          )}

          {activeTab === "laporan" && (
            <EventAcaraPage />
          )}

          {activeTab === "profil" && (
            <ProfilePage user={user} onUpdateUser={onUpdateUser} />
          )}
        </main>
      </div>

      {/* Modal Edit Jam Sesi */}
      <SessionSettingModal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        initialConfig={sessionConfig}
        onSave={handleSaveSession}
        isSaving={isSavingSession}
      />
    </div>
  );
}

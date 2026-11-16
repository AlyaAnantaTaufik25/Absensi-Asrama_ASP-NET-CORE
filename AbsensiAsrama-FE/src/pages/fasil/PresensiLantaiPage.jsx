import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { getUsers, getPresensi } from "../../services/api";

export default function PresensiLantaiPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [manualStatus, setManualStatus] = useState("Hadir");
  const [manualNote, setManualNote] = useState("");
  const [attendanceList, setAttendanceList] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [users, presensi] = await Promise.all([getUsers(), getPresensi()]);
        if (Array.isArray(users) && users.length > 0) {
          const penghuni = users.filter((u) => u.role?.toLowerCase() === "penghuni" || u.role?.toLowerCase() === "mahasiswa");
          setAttendanceList(
            penghuni.map((u) => {
              const uPresensi = Array.isArray(presensi) ? presensi.find((p) => p.idUser === u.idUser) : null;
              return {
                room: u.nomorKamar || "B-300",
                name: u.nama,
                time: uPresensi?.waktu
                  ? new Date(uPresensi.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                  : "—",
                radius: uPresensi ? "10 m" : "—",
                status: uPresensi?.status || "Belum presensi"
              };
            })
          );
        } else {
          setAttendanceList([]);
        }
      } catch (err) {
        console.warn("Gagal memuat presensi lantai:", err);
      }
    }
    loadData();
  }, []);

  const countHadir = attendanceList.filter((a) => a.status === "Hadir").length;
  const countIzin = attendanceList.filter((a) => a.status === "Izin").length;
  const countBelum = attendanceList.filter((a) => a.status === "Belum presensi").length;

  const handleOpenManual = (item) => {
    setSelectedStudent(item);
    setManualStatus("Hadir");
    setManualNote("");
    setModalOpen(true);
  };

  const handleSaveManual = (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const currentTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    setAttendanceList((prev) =>
      prev.map((item) =>
        item.room === selectedStudent.room
          ? {
              ...item,
              status: manualStatus,
              time: manualStatus === "Hadir" ? `${currentTime} (Manual)` : "—",
              radius: manualStatus === "Hadir" ? "Verifikasi Fasil" : "—"
            }
          : item
      )
    );

    setModalOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Presensi lantai 3
          </h1>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
            Maghrib & Isya · 18:00 - 20:30 WIB (sudah ditutup) · 24 Mei 2024
          </p>
        </div>

        {/* Attendance Counter on Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "capitalize" }}>
              Hadir
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#15803d" }}>
              {countHadir}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "capitalize" }}>
              Izin
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#2563eb" }}>
              {countIzin}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "capitalize" }}>
              Belum
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#ea580c" }}>
              {countBelum}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Table Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          overflow: "hidden"
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "11.5px", fontWeight: "600" }}>
                <th style={{ padding: "16px 20px" }}>Kamar</th>
                <th style={{ padding: "16px 20px" }}>Penghuni</th>
                <th style={{ padding: "16px 20px" }}>Waktu</th>
                <th style={{ padding: "16px 20px" }}>Radius</th>
                <th style={{ padding: "16px 20px" }}>Status</th>
                <th style={{ padding: "16px 20px", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {attendanceList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                      Belum Ada Penghuni di Database
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "4px", color: "#94a3b8" }}>
                      Data penghuni yang masuk ke MySQL akan otomatis muncul di tabel pemantauan ini.
                    </div>
                  </td>
                </tr>
              ) : (
                attendanceList.map((row, index) => {
                  let badgeBg = "#f1f5f9";
                  let badgeColor = "#475569";

                  if (row.status === "Hadir") {
                    badgeBg = "#dcfce7";
                    badgeColor = "#15803d";
                  } else if (row.status === "Izin") {
                    badgeBg = "#dbeafe";
                    badgeColor = "#1d4ed8";
                  } else if (row.status === "Belum presensi") {
                    badgeBg = "#fef3c7";
                    badgeColor = "#b45309";
                  }

                  return (
                    <tr
                      key={row.room}
                      style={{
                        borderBottom: index === attendanceList.length - 1 ? "none" : "1px solid #f8fafc",
                        transition: "background-color 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "14px 20px", fontWeight: "700", color: "#0f172a" }}>
                        {row.room}
                      </td>
                      <td style={{ padding: "14px 20px", fontWeight: "600", color: "#1e293b" }}>
                        {row.name}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#64748b" }}>
                        {row.time}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#64748b" }}>
                        {row.radius}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            backgroundColor: badgeBg,
                            color: badgeColor,
                            fontSize: "11px",
                            fontWeight: "600",
                            padding: "3px 10px",
                            borderRadius: "6px",
                            display: "inline-block"
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        {row.status === "Belum presensi" && (
                          <button
                            type="button"
                            onClick={() => handleOpenManual(row)}
                            style={{
                              backgroundColor: "#ffffff",
                              color: "#2563eb",
                              border: "1px solid #bfdbfe",
                              borderRadius: "8px",
                              padding: "6px 14px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#eff6ff";
                              e.currentTarget.style.borderColor = "#2563eb";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#ffffff";
                              e.currentTarget.style.borderColor = "#bfdbfe";
                            }}
                          >
                            Catat manual
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {modalOpen && selectedStudent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "460px",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                Catat Presensi Manual
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "10px", marginBottom: "18px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                {selectedStudent.name}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Kamar: {selectedStudent.room} · Gedung Al-Farabi Lt. 3
              </div>
            </div>

            <form onSubmit={handleSaveManual} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Status Kehadiran
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["Hadir", "Izin", "Sakit"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setManualStatus(st)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        border: manualStatus === st ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                        backgroundColor: manualStatus === st ? "#eff6ff" : "#ffffff",
                        color: manualStatus === st ? "#1d4ed8" : "#475569",
                        cursor: "pointer"
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Keterangan / Alasan Manual
                </label>
                <textarea
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="Contoh: Sudah berada di kamar, kendala jaringan HP saat presensi."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    resize: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 20px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Simpan Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


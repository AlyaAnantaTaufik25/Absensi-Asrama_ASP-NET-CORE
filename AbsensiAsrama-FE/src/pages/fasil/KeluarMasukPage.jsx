import React, { useState, useEffect } from "react";
import { Plus, UserPlus, Clock, CheckCircle, X, Check, LogOut, Moon } from "lucide-react";
import {
  getKeluarMasuk,
  createKeluarMasuk,
  returnKeluarMasuk,
  getBukuTamu,
  createBukuTamu,
  checkoutBukuTamu
} from "../../services/api";

export default function KeluarMasukPage() {
  const [subTab, setSubTab] = useState("keluar-masuk"); // "keluar-masuk" | "buku-tamu"

  // Keluar-masuk malam records
  const [nightLogs, setNightLogs] = useState([]);

  // Buku tamu records
  const [guestLogs, setGuestLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [nightModalOpen, setNightModalOpen] = useState(false);

  const [newGuest, setNewGuest] = useState({
    guestName: "",
    relation: "",
    residentName: "",
    nimMahasiswa: "",
    notes: ""
  });

  const [newNightLog, setNewNightLog] = useState({
    namaSantri: "",
    kamar: "B-302",
    alasan: "Keperluan mendesak / kegiatan kampus",
    jamKeluar: ""
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [kmList, guestList] = await Promise.all([
          getKeluarMasuk(),
          getBukuTamu()
        ]);
        if (Array.isArray(kmList)) {
          setNightLogs(
            kmList.map((item) => ({
              id: item.idLog,
              name: item.namaSantri,
              room: item.kamar || "B-302",
              reason: item.alasan,
              timeOut: item.jamKeluar,
              timeIn: item.jamKembali || "—",
              status: item.status === "Sudah kembali" ? "Sudah kembali" : "Di luar"
            }))
          );
        }
        if (Array.isArray(guestList)) {
          setGuestLogs(
            guestList.map((item) => ({
              id: item.idTamu,
              code: `TM-${String(item.idTamu).padStart(3, "0")}`,
              guestName: item.namaTamu,
              relation: item.relasi || "Teman",
              residentName: item.namaPenghuni || "Mahasiswa Asrama",
              timeIn: item.waktuMasuk || "—",
              timeOut: item.waktuKeluar || "—",
              status: item.status || "Sedang berkunjung",
              notes: item.catatan || "Kunjungan"
            }))
          );
        }
      } catch (err) {
        console.warn("Gagal memuat keluar-masuk / buku tamu:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleMarkReturned = async (id) => {
    const currentTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
    setNightLogs((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
            ...item,
            timeIn: currentTime,
            status: "Sudah kembali"
          }
          : item
      )
    );
    try {
      await returnKeluarMasuk(id);
    } catch (err) {
      console.warn("Gagal update status kembali ke backend:", err);
    }
  };

  const handleAddNightLog = async (e) => {
    e.preventDefault();
    if (!newNightLog.namaSantri) return;

    const currentTime = newNightLog.jamKeluar || (new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB");

    const payload = {
      namaSantri: newNightLog.namaSantri,
      kamar: newNightLog.kamar,
      alasan: newNightLog.alasan,
      jamKeluar: currentTime
    };

    try {
      const res = await createKeluarMasuk(payload);
      const newId = res?.idLog || Date.now();
      setNightLogs((prev) => [
        {
          id: newId,
          name: newNightLog.namaSantri,
          room: newNightLog.kamar,
          reason: newNightLog.alasan,
          timeOut: currentTime,
          timeIn: "—",
          status: "Di luar"
        },
        ...prev
      ]);
    } catch (err) {
      console.warn("Gagal simpan keluar masuk:", err);
    }

    setNewNightLog({
      namaSantri: "",
      kamar: "B-302",
      alasan: "Keperluan mendesak / kegiatan kampus",
      jamKeluar: ""
    });
    setNightModalOpen(false);
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newGuest.guestName) return;

    const currentTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";

    const payload = {
      namaTamu: newGuest.guestName,
      relasi: newGuest.relation || "Teman",
      namaPenghuni: newGuest.residentName,
      nimMahasiswa: newGuest.nimMahasiswa,
      waktuMasuk: currentTime,
      catatan: newGuest.notes || "Kunjungan"
    };

    try {
      const res = await createBukuTamu(payload);
      const newId = res?.idTamu || Date.now();
      setGuestLogs((prev) => [
        {
          id: newId,
          code: `TM-${String(newId).padStart(3, "0")}`,
          guestName: newGuest.guestName,
          relation: newGuest.relation || "Teman",
          residentName: newGuest.residentName,
          timeIn: currentTime,
          timeOut: "—",
          status: "Sedang berkunjung",
          notes: newGuest.notes || "Kunjungan"
        },
        ...prev
      ]);
    } catch (err) {
      console.warn("Gagal simpan buku tamu:", err);
    }

    setNewGuest({
      guestName: "",
      relation: "",
      residentName: "",
      nimMahasiswa: "",
      notes: ""
    });
    setGuestModalOpen(false);
  };

  const handleCheckoutGuest = async (idTamu) => {
    const timeOut = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
    setGuestLogs((prev) =>
      prev.map((item) =>
        item.id === idTamu
          ? { ...item, status: "Selesai berkunjung", timeOut }
          : item
      )
    );
    try {
      await checkoutBukuTamu(idTamu);
    } catch (err) {
      console.warn("Gagal checkout tamu:", err);
    }
  };

  const fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: fontStack }}>
      {/* 1. Header & Sub-tabs */}
      <div>
        <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1c1c1e", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
          Keluar-Masuk & Buku Tamu
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "#8e8e93" }}>
          Gerbang ditutup pukul 22:00 WIB. Jam kunjungan tamu 08:00 - 21:00 WIB, tanpa menginap.
        </p>

        {/* Apple HIG Segmented Control Switcher */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "#e5e5ea",
              padding: "3px",
              borderRadius: "12px",
              gap: "2px"
            }}
          >
            <button
              type="button"
              onClick={() => setSubTab("keluar-masuk")}
              style={{
                padding: "7px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                backgroundColor: subTab === "keluar-masuk" ? "#ffffff" : "transparent",
                color: subTab === "keluar-masuk" ? "#1c1c1e" : "#8e8e93",
                boxShadow: subTab === "keluar-masuk" ? "0 2px 6px rgba(0, 0, 0, 0.08)" : "none",
                transition: "all 0.15s ease",
                fontFamily: fontStack
              }}
            >
              Keluar-Masuk Malam
            </button>
            <button
              type="button"
              onClick={() => setSubTab("buku-tamu")}
              style={{
                padding: "7px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                backgroundColor: subTab === "buku-tamu" ? "#ffffff" : "transparent",
                color: subTab === "buku-tamu" ? "#1c1c1e" : "#8e8e93",
                boxShadow: subTab === "buku-tamu" ? "0 2px 6px rgba(0, 0, 0, 0.08)" : "none",
                transition: "all 0.15s ease",
                fontFamily: fontStack
              }}
            >
              Buku Tamu
            </button>
          </div>

          {subTab === "keluar-masuk" && (
            <button
              type="button"
              onClick={() => setNightModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#007aff",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0, 122, 255, 0.25)",
                fontFamily: fontStack
              }}
            >
              <Moon size={15} />
              Catat Keluar Malam
            </button>
          )}

          {subTab === "buku-tamu" && (
            <button
              type="button"
              onClick={() => setGuestModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#007aff",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0, 122, 255, 0.25)",
                fontFamily: fontStack
              }}
            >
              <UserPlus size={15} />
              Catat Tamu
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Table Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          overflow: "hidden"
        }}
      >
        {subTab === "keluar-masuk" ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "#fafafc", borderBottom: "1px solid #e5e5ea", color: "#8e8e93", fontSize: "11.5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "16px 20px" }}>Penghuni</th>
                  <th style={{ padding: "16px 20px" }}>Keperluan</th>
                  <th style={{ padding: "16px 20px" }}>Keluar</th>
                  <th style={{ padding: "16px 20px" }}>Kembali</th>
                  <th style={{ padding: "16px 20px" }}>Status</th>
                  <th style={{ padding: "16px 20px", textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {nightLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px", color: "#8e8e93", fontSize: "13.5px" }}>
                      Belum ada catatan keluar-masuk malam tercatat.
                    </td>
                  </tr>
                ) : (
                  nightLogs.map((row, index) => {
                    const isOut = row.status === "Di luar";
                    return (
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: index === nightLogs.length - 1 ? "none" : "1px solid #f2f2f7",
                          transition: "background-color 0.1s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ fontWeight: "600", color: "#1c1c1e" }}>{row.name}</div>
                          <div style={{ fontSize: "12px", color: "#8e8e93" }}>{row.room}</div>
                        </td>
                        <td style={{ padding: "14px 20px", color: "#1c1c1e", fontWeight: "500" }}>
                          {row.purpose}
                        </td>
                        <td style={{ padding: "14px 20px", color: "#8e8e93" }}>
                          {row.timeOut}
                        </td>
                        <td style={{ padding: "14px 20px", color: "#8e8e93" }}>
                          {row.timeIn}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span
                            style={{
                              backgroundColor: isOut ? "rgba(255, 149, 0, 0.12)" : "rgba(52, 199, 89, 0.12)",
                              color: isOut ? "#ff9500" : "#34c759",
                              fontSize: "12px",
                              fontWeight: "600",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              display: "inline-block"
                            }}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          {isOut && (
                            <button
                              type="button"
                              onClick={() => handleMarkReturned(row.id)}
                              style={{
                                backgroundColor: "rgba(0, 122, 255, 0.08)",
                                color: "#007aff",
                                border: "1px solid rgba(0, 122, 255, 0.2)",
                                borderRadius: "8px",
                                padding: "6px 14px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                fontFamily: fontStack
                              }}
                            >
                              Catat kembali
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
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "#fafafc", borderBottom: "1px solid #e5e5ea", color: "#8e8e93", fontSize: "11.5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "16px 20px" }}>ID Tamu</th>
                  <th style={{ padding: "16px 20px" }}>Nama Tamu</th>
                  <th style={{ padding: "16px 20px" }}>Hubungan</th>
                  <th style={{ padding: "16px 20px" }}>Mahasiswa Dikunjungi</th>
                  <th style={{ padding: "16px 20px" }}>Masuk</th>
                  <th style={{ padding: "16px 20px" }}>Keluar</th>
                  <th style={{ padding: "16px 20px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {guestLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "48px 16px", color: "#8e8e93", fontSize: "13.5px" }}>
                      Belum ada catatan buku tamu tercatat hari ini.
                    </td>
                  </tr>
                ) : (
                  guestLogs.map((row, index) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: index === guestLogs.length - 1 ? "none" : "1px solid #f2f2f7",
                        transition: "background-color 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontWeight: "600", color: "#007aff", backgroundColor: "rgba(0, 122, 255, 0.08)", padding: "3px 8px", borderRadius: "6px", fontSize: "12px" }}>
                          {row.id}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", fontWeight: "600", color: "#1c1c1e" }}>
                        {row.guestName}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#8e8e93" }}>
                        {row.relation}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#1c1c1e" }}>
                        {row.residentName}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#8e8e93" }}>
                        {row.timeIn}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#8e8e93" }}>
                        {row.timeOut}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            backgroundColor: row.status === "Sedang berkunjung" ? "rgba(0, 122, 255, 0.12)" : "rgba(52, 199, 89, 0.12)",
                            color: row.status === "Sedang berkunjung" ? "#007aff" : "#34c759",
                            fontSize: "12px",
                            fontWeight: "600",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            display: "inline-block"
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guest Modal */}
      {guestModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
            fontFamily: fontStack
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "460px",
              padding: "26px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              border: "1px solid rgba(0, 0, 0, 0.05)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1c1c1e", margin: 0 }}>
                Catat Tamu Masuk
              </h2>
              <button
                type="button"
                onClick={() => setGuestModalOpen(false)}
                style={{ background: "none", border: "none", color: "#8e8e93", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddGuest} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1c1c1e", marginBottom: "6px" }}>
                  Nama Lengkap Tamu
                </label>
                <input
                  type="text"
                  required
                  value={newGuest.guestName}
                  onChange={(e) => setNewGuest({ ...newGuest, guestName: e.target.value })}
                  placeholder="Contoh: Hendra Kurniawan"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    border: "1px solid #e5e5ea",
                    fontSize: "13.5px",
                    fontFamily: fontStack,
                    outline: "none",
                    backgroundColor: "#f2f2f7",
                    color: "#1c1c1e",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1c1c1e", marginBottom: "6px" }}>
                  Hubungan
                </label>
                <input
                  type="text"
                  value={newGuest.relation}
                  onChange={(e) => setNewGuest({ ...newGuest, relation: e.target.value })}
                  placeholder="Contoh: Orang Tua / Teman Kuliah"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    border: "1px solid #e5e5ea",
                    fontSize: "13.5px",
                    fontFamily: fontStack,
                    outline: "none",
                    backgroundColor: "#f2f2f7",
                    color: "#1c1c1e",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1c1c1e", marginBottom: "6px" }}>
                  NIM Mahasiswa yang Dikunjungi
                </label>
                <input
                  type="text"
                  value={newGuest.nimMahasiswa}
                  onChange={(e) => setNewGuest({ ...newGuest, nimMahasiswa: e.target.value })}
                  placeholder="Contoh: 2311523005"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    border: "1px solid #e5e5ea",
                    fontSize: "13.5px",
                    fontFamily: fontStack,
                    outline: "none",
                    backgroundColor: "#f2f2f7",
                    color: "#1c1c1e",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1c1c1e", marginBottom: "6px" }}>
                  Nama Mahasiswa yang Dikunjungi
                </label>
                <input
                  type="text"
                  value={newGuest.residentName}
                  onChange={(e) => setNewGuest({ ...newGuest, residentName: e.target.value })}
                  placeholder="Contoh: Fikri Ramadhan - Kamar B-301"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    border: "1px solid #e5e5ea",
                    fontSize: "13.5px",
                    fontFamily: fontStack,
                    outline: "none",
                    backgroundColor: "#f2f2f7",
                    color: "#1c1c1e",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1c1c1e", marginBottom: "6px" }}>
                  Keperluan / Catatan
                </label>
                <textarea
                  value={newGuest.notes}
                  onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                  placeholder="Keterangan keperluan kunjungan..."
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    border: "1px solid #e5e5ea",
                    fontSize: "13.5px",
                    fontFamily: fontStack,
                    resize: "none",
                    outline: "none",
                    backgroundColor: "#f2f2f7",
                    color: "#1c1c1e",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setGuestModalOpen(false)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "600",
                    backgroundColor: "#f2f2f7",
                    color: "#8e8e93",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: fontStack
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "9px 22px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "600",
                    backgroundColor: "#007aff",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: fontStack,
                    boxShadow: "0 2px 8px rgba(0, 122, 255, 0.3)"
                  }}
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Night Exit Modal */}
      {nightModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
            fontFamily: fontStack
          }}
          onClick={() => setNightModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              padding: "28px",
              width: "100%",
              maxWidth: "440px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              border: "1px solid rgba(0, 0, 0, 0.05)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Moon size={18} color="#007aff" />
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#1c1c1e" }}>
                  Catat Keluar-Masuk Malam
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNightModalOpen(false)}
                style={{
                  border: "none",
                  backgroundColor: "#f2f2f7",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#8e8e93"
                }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleAddNightLog} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1c1c1e", marginBottom: "6px" }}>
                  Nama Mahasiswa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap mahasiswa"
                  value={newNightLog.namaSantri}
                  onChange={(e) => setNewNightLog({ ...newNightLog, namaSantri: e.target.value })}
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 14px",
                    borderRadius: "12px",
                    border: "1px solid #e5e5ea",
                    fontSize: "13.5px",
                    fontFamily: fontStack,
                    outline: "none",
                    backgroundColor: "#f2f2f7",
                    color: "#1c1c1e",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1c1c1e", marginBottom: "6px" }}>
                    Kamar
                  </label>
                  <input
                    type="text"
                    required
                    value={newNightLog.kamar}
                    onChange={(e) => setNewNightLog({ ...newNightLog, kamar: e.target.value })}
                    style={{
                      width: "100%",
                      height: "42px",
                      padding: "0 14px",
                      borderRadius: "12px",
                      border: "1px solid #e5e5ea",
                      fontSize: "13.5px",
                      fontFamily: fontStack,
                      outline: "none",
                      backgroundColor: "#f2f2f7",
                      color: "#1c1c1e",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1c1c1e", marginBottom: "6px" }}>
                    Jam Keluar
                  </label>
                  <input
                    type="time"
                    value={newNightLog.jamKeluar}
                    onChange={(e) => setNewNightLog({ ...newNightLog, jamKeluar: e.target.value })}
                    style={{
                      width: "100%",
                      height: "42px",
                      padding: "0 14px",
                      borderRadius: "12px",
                      border: "1px solid #e5e5ea",
                      fontSize: "13.5px",
                      fontFamily: fontStack,
                      outline: "none",
                      backgroundColor: "#f2f2f7",
                      color: "#1c1c1e",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1c1c1e", marginBottom: "6px" }}>
                  Alasan / Keperluan Keluar
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Beli obat ke apotek / Tugas kelompok"
                  value={newNightLog.alasan}
                  onChange={(e) => setNewNightLog({ ...newNightLog, alasan: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    border: "1px solid #e5e5ea",
                    fontSize: "13.5px",
                    fontFamily: fontStack,
                    resize: "none",
                    outline: "none",
                    backgroundColor: "#f2f2f7",
                    color: "#1c1c1e",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setNightModalOpen(false)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "600",
                    backgroundColor: "#f2f2f7",
                    color: "#8e8e93",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: fontStack
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "9px 22px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "600",
                    backgroundColor: "#007aff",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: fontStack,
                    boxShadow: "0 2px 8px rgba(0, 122, 255, 0.3)"
                  }}
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

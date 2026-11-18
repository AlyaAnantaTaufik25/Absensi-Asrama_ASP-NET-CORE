import React, { useState } from "react";
import { Plus, UserPlus, Clock, CheckCircle } from "lucide-react";

export default function KeluarMasukPage() {
  const [subTab, setSubTab] = useState("keluar-masuk"); // "keluar-masuk" | "buku-tamu"

  // Keluar-masuk malam records
  const [nightLogs, setNightLogs] = useState([]);

  // Buku tamu records
  const [guestLogs, setGuestLogs] = useState([]);

  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [newGuest, setNewGuest] = useState({
    guestName: "",
    relation: "",
    residentName: "B-301 - Fikri Ramadhan",
    notes: ""
  });

  const handleMarkReturned = (id) => {
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
  };

  const handleAddGuest = (e) => {
    e.preventDefault();
    if (!newGuest.guestName) return;

    const currentTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    setGuestLogs((prev) => [
      {
        id: `TM-0${prev.length + 1}`,
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

    setNewGuest({
      guestName: "",
      relation: "",
      residentName: "B-301 - Fikri Ramadhan",
      notes: ""
    });
    setGuestModalOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header & Sub-tabs */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
          Keluar-masuk & tamu
        </h1>
        <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
          Gerbang ditutup pukul 22:00 WIB. Jam kunjungan tamu 08:00 - 21:00 WIB, tanpa menginap.
        </p>

        {/* Tab Switcher */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setSubTab("keluar-masuk")}
              style={{
                padding: "7px 18px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                backgroundColor: subTab === "keluar-masuk" ? "#2563eb" : "#f1f5f9",
                color: subTab === "keluar-masuk" ? "#ffffff" : "#475569",
                transition: "all 0.15s ease"
              }}
            >
              Keluar-masuk malam
            </button>
            <button
              type="button"
              onClick={() => setSubTab("buku-tamu")}
              style={{
                padding: "7px 18px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                backgroundColor: subTab === "buku-tamu" ? "#2563eb" : "#f1f5f9",
                color: subTab === "buku-tamu" ? "#ffffff" : "#475569",
                transition: "all 0.15s ease"
              }}
            >
              Buku tamu
            </button>
          </div>

          {subTab === "buku-tamu" && (
            <button
              type="button"
              onClick={() => setGuestModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer"
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
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          overflow: "hidden"
        }}
      >
        {subTab === "keluar-masuk" ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "11.5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
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
                    <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "#94a3b8", fontSize: "13px" }}>
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
                        borderBottom: index === nightLogs.length - 1 ? "none" : "1px solid #f8fafc",
                        transition: "background-color 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: "700", color: "#0f172a" }}>{row.name}</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{row.room}</div>
                      </td>
                      <td style={{ padding: "14px 20px", color: "#1e293b", fontWeight: "500" }}>
                        {row.purpose}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#64748b" }}>
                        {row.timeOut}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#64748b" }}>
                        {row.timeIn}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            backgroundColor: isOut ? "#fef3c7" : "#dcfce7",
                            color: isOut ? "#b45309" : "#15803d",
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
                        {isOut && (
                          <button
                            type="button"
                            onClick={() => handleMarkReturned(row.id)}
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
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "11.5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "16px 20px" }}>Nama Tamu</th>
                  <th style={{ padding: "16px 20px" }}>Hubungan</th>
                  <th style={{ padding: "16px 20px" }}>Menemui Penghuni</th>
                  <th style={{ padding: "16px 20px" }}>Masuk</th>
                  <th style={{ padding: "16px 20px" }}>Keluar</th>
                  <th style={{ padding: "16px 20px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {guestLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "#94a3b8", fontSize: "13px" }}>
                      Belum ada tamu yang tercatat hari ini.
                    </td>
                  </tr>
                ) : (
                  guestLogs.map((row, index) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: index === guestLogs.length - 1 ? "none" : "1px solid #f8fafc"
                      }}
                    >
                      <td style={{ padding: "14px 20px", fontWeight: "700", color: "#0f172a" }}>
                        {row.guestName}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#64748b" }}>
                        {row.relation}
                      </td>
                      <td style={{ padding: "14px 20px", fontWeight: "600", color: "#1e293b" }}>
                        {row.residentName}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#64748b" }}>
                        {row.timeIn}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#64748b" }}>
                        {row.timeOut}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            backgroundColor: row.status === "Selesai" ? "#dcfce7" : "#dbeafe",
                            color: row.status === "Selesai" ? "#15803d" : "#1d4ed8",
                            fontSize: "11px",
                            fontWeight: "600",
                            padding: "3px 10px",
                            borderRadius: "6px"
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
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
            }}
          >
            <h2 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: "0 0 16px 0" }}>
              Catat Buku Tamu
            </h2>

            <form onSubmit={handleAddGuest} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Nama Tamu
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hendra Kusuma"
                  value={newGuest.guestName}
                  onChange={(e) => setNewGuest({ ...newGuest, guestName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Hubungan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Orang tua / Kakak / Teman Kuliah"
                  value={newGuest.relation}
                  onChange={(e) => setNewGuest({ ...newGuest, relation: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Penghuni yang Dikunjungi
                </label>
                <select
                  value={newGuest.residentName}
                  onChange={(e) => setNewGuest({ ...newGuest, residentName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px"
                  }}
                >
                  <option value="B-301 - Fikri Ramadhan">B-301 - Fikri Ramadhan</option>
                  <option value="B-302 - Yoga Prasetyo">B-302 - Yoga Prasetyo</option>
                  <option value="B-303 - Taufik Hidayat">B-303 - Taufik Hidayat</option>
                  <option value="B-304 - Rayhan Pratama">B-304 - Rayhan Pratama</option>
                  <option value="B-305 - Alvin Syahputra">B-305 - Alvin Syahputra</option>
                  <option value="B-308 - Dimas Aditya">B-308 - Dimas Aditya</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Keperluan / Catatan
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan kunjungan..."
                  value={newGuest.notes}
                  onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    resize: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setGuestModalOpen(false)}
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
                  Simpan Kunjungan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


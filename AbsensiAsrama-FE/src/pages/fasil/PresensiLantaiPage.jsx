import React, { useState, useEffect, useMemo } from "react";
import { Check, X, Search, Filter, RotateCcw, UserCheck, AlertCircle, Clock } from "lucide-react";
import { getUsers, getPresensi, recordPresensi } from "../../services/api";

export default function PresensiLantaiPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [manualStatus, setManualStatus] = useState("Hadir");
  const [manualNote, setManualNote] = useState("");
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterRoom, setFilterRoom] = useState("semua");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [users, presensi] = await Promise.all([getUsers(), getPresensi()]);
        if (Array.isArray(users) && users.length > 0) {
          const penghuni = users.filter(
            (u) =>
              u.role?.toLowerCase() === "penghuni" ||
              u.role?.toLowerCase() === "mahasiswa"
          );
          setAttendanceList(
            penghuni.map((u) => {
              const uPresensi = Array.isArray(presensi)
                ? presensi.find((p) => p.idUser === u.idUser)
                : null;
              return {
                idUser: u.idUser,
                room: u.nomorKamar || "B-301",
                name: u.nama,
                nim: u.nim || "-",
                gender: u.jenisKelamin || "-",
                time: uPresensi?.waktu
                  ? new Date(uPresensi.waktu).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : "—",
                radius: uPresensi ? "10 m" : "—",
                status: uPresensi?.status || "Belum presensi",
                keterangan: uPresensi?.keterangan || "-"
              };
            })
          );
        } else {
          setAttendanceList([]);
        }
      } catch (err) {
        console.warn("Gagal memuat presensi lantai:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Summary counts
  const countHadir = attendanceList.filter((a) => a.status === "Hadir").length;
  const countIzin = attendanceList.filter((a) => a.status === "Izin" || a.status === "Sakit").length;
  const countBelum = attendanceList.filter((a) => a.status === "Belum presensi").length;

  // Unique rooms for dropdown
  const uniqueRooms = useMemo(() => {
    const rooms = Array.from(new Set(attendanceList.map((a) => a.room).filter(Boolean)));
    return rooms.sort();
  }, [attendanceList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return attendanceList.filter((item) => {
      // Search check
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.nim.toLowerCase().includes(query) ||
        item.room.toLowerCase().includes(query);

      // Status check
      let matchesStatus = true;
      if (filterStatus !== "semua") {
        if (filterStatus === "hadir") {
          matchesStatus = item.status === "Hadir";
        } else if (filterStatus === "izin") {
          matchesStatus = item.status === "Izin" || item.status === "Sakit";
        } else if (filterStatus === "belum") {
          matchesStatus = item.status === "Belum presensi";
        }
      }

      // Room check
      let matchesRoom = true;
      if (filterRoom !== "semua") {
        matchesRoom = item.room === filterRoom;
      }

      return matchesSearch && matchesStatus && matchesRoom;
    });
  }, [attendanceList, searchQuery, filterStatus, filterRoom]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterStatus("semua");
    setFilterRoom("semua");
  };

  const handleOpenManual = (item) => {
    setSelectedStudent(item);
    setManualStatus("Hadir");
    setManualNote("");
    setModalOpen(true);
  };

  const handleSaveManual = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const currentTime = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    });

    if (selectedStudent.idUser) {
      try {
        await recordPresensi({
          idUser: selectedStudent.idUser,
          status: manualStatus,
          keterangan: manualNote || "Verifikasi manual oleh Fasilitator"
        });
      } catch (err) {
        console.warn("Gagal menyimpan presensi manual:", err);
      }
    }

    setAttendanceList((prev) =>
      prev.map((item) =>
        item.idUser === selectedStudent.idUser || item.room === selectedStudent.room
          ? {
              ...item,
              status: manualStatus,
              time: manualStatus === "Hadir" ? `${currentTime} (Manual)` : "—",
              radius: manualStatus === "Hadir" ? "Verifikasi Fasil" : "—",
              keterangan: manualNote || "Verifikasi manual oleh Fasilitator"
            }
          : item
      )
    );

    setModalOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#0f172a",
              margin: "0 0 6px 0",
              letterSpacing: "-0.5px"
            }}
          >
            Presensi Lantai Binaan
          </h1>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
            Pemantauan kehadiran seluruh santri per lantai secara akurat dan real-time.
          </p>
        </div>

        {/* Attendance Counter on Right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            backgroundColor: "#ffffff",
            padding: "10px 18px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
          }}
        >
          <div style={{ textAlign: "center", minWidth: "55px" }}>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>
              Hadir
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#15803d" }}>
              {countHadir}
            </div>
          </div>
          <div style={{ width: "1px", height: "28px", backgroundColor: "#e2e8f0" }} />
          <div style={{ textAlign: "center", minWidth: "55px" }}>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>
              Izin/Sakit
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#2563eb" }}>
              {countIzin}
            </div>
          </div>
          <div style={{ width: "1px", height: "28px", backgroundColor: "#e2e8f0" }} />
          <div style={{ textAlign: "center", minWidth: "55px" }}>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>
              Belum
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#ea580c" }}>
              {countBelum}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Toolbar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "18px 20px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexWrap: "wrap",
          gap: "14px",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", flex: "1 1 500px" }}>
          {/* Search Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "8px 14px",
              flex: "1 1 240px",
              minWidth: "220px"
            }}
          >
            <Search size={16} color="#64748b" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama penghuni, NIM, atau nomor kamar..."
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "13px",
                width: "100%",
                color: "#0f172a"
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#64748b" }}>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                fontSize: "13px",
                color: "#0f172a",
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="semua">Semua Status</option>
              <option value="hadir">Hadir</option>
              <option value="izin">Izin / Sakit</option>
              <option value="belum">Belum Presensi</option>
            </select>
          </div>

          {/* Filter Kamar */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#64748b" }}>Kamar:</span>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                fontSize: "13px",
                color: "#0f172a",
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="semua">Semua Kamar</option>
              {uniqueRooms.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset / Result Count */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "600" }}>
            Menampilkan <strong style={{ color: "#0f172a" }}>{filteredList.length}</strong> dari {attendanceList.length}
          </span>
          {(searchQuery || filterStatus !== "semua" || filterRoom !== "semua") && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "7px 12px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <RotateCcw size={13} /> Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Table Card */}
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
              <tr
                style={{
                  backgroundColor: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  color: "#64748b",
                  fontSize: "11.5px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                <th style={{ padding: "16px 20px" }}>No. Kamar</th>
                <th style={{ padding: "16px 20px" }}>Nama Penghuni</th>
                <th style={{ padding: "16px 20px" }}>NIM</th>
                <th style={{ padding: "16px 20px" }}>Waktu Presensi</th>
                <th style={{ padding: "16px 20px" }}>Jarak / Radius</th>
                <th style={{ padding: "16px 20px" }}>Status</th>
                <th style={{ padding: "16px 20px", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#475569" }}>
                      Tidak Ada Data Penghuni yang Cocok
                    </div>
                    <div style={{ fontSize: "12.5px", marginTop: "4px", color: "#94a3b8" }}>
                      {searchQuery || filterStatus !== "semua" || filterRoom !== "semua"
                        ? "Coba ubah kata kunci pencarian atau reset filter yang sedang aktif."
                        : "Belum ada penghuni asrama terdaftar di database."}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((row, index) => {
                  let badgeBg = "#f1f5f9";
                  let badgeColor = "#475569";

                  if (row.status === "Hadir") {
                    badgeBg = "#dcfce7";
                    badgeColor = "#15803d";
                  } else if (row.status === "Izin" || row.status === "Sakit") {
                    badgeBg = "#dbeafe";
                    badgeColor = "#1d4ed8";
                  } else if (row.status === "Belum presensi") {
                    badgeBg = "#fef3c7";
                    badgeColor = "#b45309";
                  }

                  return (
                    <tr
                      key={row.idUser || index}
                      style={{
                        borderBottom: index === filteredList.length - 1 ? "none" : "1px solid #f1f5f9",
                        transition: "background-color 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            fontWeight: "700",
                            color: "#1e3fae",
                            backgroundColor: "#eff6ff",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "12px"
                          }}
                        >
                          {row.room}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", fontWeight: "600", color: "#0f172a" }}>
                        {row.name}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#64748b", fontFamily: "monospace", fontSize: "12.5px" }}>
                        {row.nim}
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
                            fontSize: "11.5px",
                            fontWeight: "700",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            display: "inline-block"
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        {row.status === "Belum presensi" ? (
                          <button
                            type="button"
                            onClick={() => handleOpenManual(row)}
                            style={{
                              backgroundColor: "#2563eb",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "8px",
                              padding: "6px 14px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
                          >
                            Catat manual
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenManual(row)}
                            style={{
                              backgroundColor: "transparent",
                              color: "#64748b",
                              border: "1px solid #cbd5e1",
                              borderRadius: "8px",
                              padding: "5px 12px",
                              fontSize: "11.5px",
                              fontWeight: "600",
                              cursor: "pointer"
                            }}
                          >
                            Ubah
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

            <div style={{ backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "10px", marginBottom: "18px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                {selectedStudent.name}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                NIM: {selectedStudent.nim} · Kamar: {selectedStudent.room}
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
                  placeholder="Contoh: Sudah berada di kamar, verifikasi langsung oleh fasilitator."
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

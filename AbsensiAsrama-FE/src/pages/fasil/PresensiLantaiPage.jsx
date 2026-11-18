import React, { useState, useEffect, useMemo } from "react";
import { Check, X, Search, Filter, RotateCcw, UserCheck, AlertCircle, Clock } from "lucide-react";
import { getUsers, getPresensi, recordPresensi, getKamar, getGedung } from "../../services/api";

export default function PresensiLantaiPage({ user, sessionConfig, onOpenSessionModal }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [manualStatus, setManualStatus] = useState("Hadir");
  const [manualNote, setManualNote] = useState("");
  const [attendanceList, setAttendanceList] = useState([]);
  const [kamarList, setKamarList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterFloor, setFilterFloor] = useState("semua");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [users, presensi, kamars] = await Promise.all([
          getUsers(),
          getPresensi(),
          getKamar()
        ]);

        const dbKamars = Array.isArray(kamars) ? kamars : [];
        setKamarList(dbKamars);

        if (Array.isArray(users) && users.length > 0) {
          const mahasiswaList = users.filter(
            (u) =>
              u.role?.toLowerCase() === "penghuni" ||
              u.role?.toLowerCase() === "mahasiswa"
          );

          setAttendanceList(
            mahasiswaList.map((u) => {
              const uPresensi = Array.isArray(presensi)
                ? presensi.find((p) => p.idUser === u.idUser)
                : null;

              // Tentukan lantai dari kamar database atau format nomor kamar
              const kInfo = dbKamars.find((k) => k.noKamar === u.nomorKamar);
              let floor = kInfo?.lantai;
              if (!floor && u.nomorKamar) {
                const match = u.nomorKamar.match(/-?([1-9])\d{2}/);
                if (match) floor = parseInt(match[1]);
              }
              floor = floor || 1;

              return {
                idUser: u.idUser,
                floor,
                room: u.nomorKamar || `B-${floor}01`,
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
        console.warn("Gagal memuat presensi:", err);
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

  // Unique floors for dropdown
  const uniqueFloors = useMemo(() => {
    const floorsFromList = attendanceList.map((a) => a.floor).filter(Boolean);
    const floorsFromKamar = kamarList.map((k) => k.lantai).filter(Boolean);
    const all = Array.from(new Set([...floorsFromList, ...floorsFromKamar]));
    if (all.length === 0) return [1, 2, 3];
    return all.sort((a, b) => a - b);
  }, [attendanceList, kamarList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return attendanceList.filter((item) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.nim.toLowerCase().includes(query) ||
        item.room.toLowerCase().includes(query);

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

      let matchesFloor = true;
      if (filterFloor !== "semua") {
        matchesFloor = String(item.floor) === String(filterFloor);
      }

      return matchesSearch && matchesStatus && matchesFloor;
    });
  }, [attendanceList, searchQuery, filterStatus, filterFloor]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterStatus("semua");
    setFilterFloor("semua");
  };

  const handleExportCSV = () => {
    if (filteredAttendance.length === 0) {
      alert("Tidak ada data presensi lantai untuk diunduh.");
      return;
    }
    const headers = ["No", "Kamar", "Nama Penghuni", "NIM", "Jenis Kelamin", "Waktu Absen", "Radius", "Status Presensi", "Keterangan"];
    const rows = filteredAttendance.map((item, idx) => [
      idx + 1,
      item.room,
      item.name,
      item.nim,
      item.gender,
      item.time,
      item.radius,
      item.status,
      item.keterangan
    ]);
    downloadCSV(`Rekap_Presensi_Lantai_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const handlePrintPDF = () => {
    if (filteredAttendance.length === 0) {
      alert("Tidak ada data presensi lantai untuk dicetak.");
      return;
    }
    const headers = ["Kamar", "Nama Penghuni", "NIM", "Waktu", "Status", "Keterangan"];
    const rows = filteredAttendance.map((item) => [
      item.room,
      item.name,
      item.nim,
      item.time,
      item.status,
      item.keterangan
    ]);
    printOfficialDocument({
      title: "REKAPITULASI PRESENSI LANTAI BINAAN ASRAMA",
      subtitle: "Monitoring Kehadiran Mahasiswa Penghuni Lantai Asrama Universitas Andalas",
      metaInfo: [
        { label: "Unit Fasilitator", value: "Fasilitator Lantai Binaan Asrama Unand" },
        { label: "Ringkasan Kehadiran", value: `${countHadir} Hadir · ${countIzin} Izin/Sakit · ${countBelum} Belum Absen` },
        { label: "Tanggal Pencatatan", value: new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) }
      ],
      headers,
      rows,
      signerName: "Fasilitator Lantai",
      signerRole: "Fasilitator Pendamping Asrama"
    });
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

  const fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: fontStack }}>
      {/* 1. Header Row (Keterangan deskripsi dihapus sesuai revisi) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <h1
          style={{
            fontSize: "26px",
            fontWeight: "700",
            color: "#1c1c1e",
            margin: 0,
            letterSpacing: "-0.5px"
          }}
        >
          Presensi
        </h1>

        {/* Attendance Counter on Right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            backgroundColor: "#ffffff",
            padding: "10px 22px",
            borderRadius: "16px",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)"
          }}
        >
          <div style={{ textAlign: "center", minWidth: "55px" }}>
            <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Hadir
            </div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#34c759", marginTop: "2px" }}>
              {countHadir}
            </div>
          </div>
          <div style={{ width: "1px", height: "26px", backgroundColor: "#e5e5ea" }} />
          <div style={{ textAlign: "center", minWidth: "55px" }}>
            <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Izin/Sakit
            </div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#007aff", marginTop: "2px" }}>
              {countIzin}
            </div>
          </div>
          <div style={{ width: "1px", height: "26px", backgroundColor: "#e5e5ea" }} />
          <div style={{ textAlign: "center", minWidth: "55px" }}>
            <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Belum
            </div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#ff9500", marginTop: "2px" }}>
              {countBelum}
            </div>
          </div>
        </div>
      </div>

      {/* Jadwal Sesi Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "12px 20px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
          gap: "12px",
          flexWrap: "wrap"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "rgba(0, 122, 255, 0.1)",
              color: "#007aff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#1c1c1e" }}>
              Jadwal Sesi Presensi Aktif
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              Sesi Subuh / Pagi:{" "}
              <strong style={{ color: "#007aff" }}>
                {sessionConfig?.subuhStart || "04:00"} - {sessionConfig?.subuhEnd || "06:00"} WIB
              </strong>
              {" • "}
              Sesi Malam (Magrib & Isya):{" "}
              <strong style={{ color: "#007aff" }}>
                {sessionConfig?.malamStart || "18:00"} - {sessionConfig?.malamEnd || "20:30"} WIB
              </strong>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenSessionModal && onOpenSessionModal()}
          style={{
            backgroundColor: "rgba(0, 122, 255, 0.08)",
            color: "#007aff",
            border: "1px solid rgba(0, 122, 255, 0.25)",
            borderRadius: "10px",
            padding: "8px 16px",
            fontSize: "12.5px",
            fontWeight: "600",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease"
          }}
        >
          <Clock size={14} />
          <span>Edit Jam Sesi</span>
        </button>
      </div>

      {/* 2. Filter & Search Toolbar (Filter Kamar diganti Lantai sesuai revisi) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          padding: "16px 20px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
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
              backgroundColor: "#f2f2f7",
              border: "1px solid #e5e5ea",
              borderRadius: "12px",
              padding: "8px 14px",
              flex: "1 1 240px",
              minWidth: "220px"
            }}
          >
            <Search size={16} color="#8e8e93" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama mahasiswa, NIM, atau nomor kamar..."
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "13.5px",
                width: "100%",
                color: "#1c1c1e",
                fontFamily: fontStack
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8e8e93", padding: 0 }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#8e8e93" }}>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "12px",
                border: "1px solid #e5e5ea",
                backgroundColor: "#f2f2f7",
                fontSize: "13px",
                color: "#1c1c1e",
                cursor: "pointer",
                outline: "none",
                fontFamily: fontStack
              }}
            >
              <option value="semua">Semua Status</option>
              <option value="hadir">Hadir</option>
              <option value="izin">Izin / Sakit</option>
              <option value="belum">Belum Presensi</option>
            </select>
          </div>

          {/* Filter Lantai (Sesuai database gedung/kamar) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#8e8e93" }}>Lantai:</span>
            <select
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "12px",
                border: "1px solid #e5e5ea",
                backgroundColor: "#f2f2f7",
                fontSize: "13px",
                color: "#1c1c1e",
                cursor: "pointer",
                outline: "none",
                fontFamily: fontStack
              }}
            >
              <option value="semua">Semua Lantai</option>
              {uniqueFloors.map((fl) => (
                <option key={fl} value={fl}>
                  Lantai {fl}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter & Reset Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "#8e8e93" }}>
            Menampilkan <strong style={{ color: "#1c1c1e" }}>{filteredList.length}</strong> dari {attendanceList.length} mahasiswa
          </span>
          {(searchQuery || filterStatus !== "semua" || filterFloor !== "semua") && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                backgroundColor: "#f2f2f7",
                color: "#1c1c1e",
                border: "1px solid #e5e5ea",
                borderRadius: "10px",
                padding: "7px 12px",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: fontStack
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
          borderRadius: "18px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          overflow: "hidden"
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
            <thead>
              <tr
                style={{
                  backgroundColor: "#fafafc",
                  borderBottom: "1px solid #e5e5ea",
                  color: "#8e8e93",
                  fontSize: "11.5px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                <th style={{ padding: "16px 20px" }}>No</th>
                <th style={{ padding: "16px 20px" }}>Nama Mahasiswa</th>
                <th style={{ padding: "16px 20px" }}>NIM</th>
                <th style={{ padding: "16px 20px" }}>Lantai</th>
                <th style={{ padding: "16px 20px" }}>Kamar</th>
                <th style={{ padding: "16px 20px" }}>Waktu Presensi</th>
                <th style={{ padding: "16px 20px" }}>Jarak / Radius</th>
                <th style={{ padding: "16px 20px" }}>Status</th>
                <th style={{ padding: "16px 20px", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "48px 16px", color: "#8e8e93" }}>
                    <div style={{ fontSize: "15px", fontWeight: "600", color: "#1c1c1e" }}>
                      Tidak Ada Data Mahasiswa yang Cocok
                    </div>
                    <div style={{ fontSize: "13px", marginTop: "4px", color: "#8e8e93" }}>
                      {searchQuery || filterStatus !== "semua" || filterFloor !== "semua"
                        ? "Coba ubah kata kunci pencarian atau reset filter yang sedang aktif."
                        : "Belum ada mahasiswa asrama terdaftar di database."}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((row, index) => {
                  let badgeBg = "rgba(142, 142, 147, 0.12)";
                  let badgeColor = "#8e8e93";

                  if (row.status === "Hadir") {
                    badgeBg = "rgba(52, 199, 89, 0.12)";
                    badgeColor = "#34c759";
                  } else if (row.status === "Izin" || row.status === "Sakit") {
                    badgeBg = "rgba(0, 122, 255, 0.12)";
                    badgeColor = "#007aff";
                  } else if (row.status === "Belum presensi") {
                    badgeBg = "rgba(255, 149, 0, 0.12)";
                    badgeColor = "#ff9500";
                  }

                  return (
                    <tr
                      key={row.idUser || index}
                      style={{
                        borderBottom: index === filteredList.length - 1 ? "none" : "1px solid #f2f2f7",
                        transition: "background-color 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "14px 20px", color: "#8e8e93", fontWeight: "600", fontSize: "12.5px" }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: "14px 20px", fontWeight: "600", color: "#1c1c1e" }}>
                        {row.name}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#8e8e93", fontSize: "12.5px" }}>
                        {row.nim}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            fontWeight: "600",
                            color: "#1c1c1e",
                            backgroundColor: "#f2f2f7",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "12px"
                          }}
                        >
                          Lantai {row.floor}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            fontWeight: "600",
                            color: "#007aff",
                            backgroundColor: "rgba(0, 122, 255, 0.08)",
                            padding: "4px 8px",
                            borderRadius: "8px",
                            fontSize: "12px"
                          }}
                        >
                          {row.room}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", color: "#8e8e93" }}>
                        {row.time}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#8e8e93" }}>
                        {row.radius}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            backgroundColor: badgeBg,
                            color: badgeColor,
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
                        {row.status === "Belum presensi" ? (
                          <button
                            type="button"
                            onClick={() => handleOpenManual(row)}
                            style={{
                              backgroundColor: "#007aff",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "10px",
                              padding: "6px 14px",
                              fontSize: "12.5px",
                              fontWeight: "600",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              boxShadow: "0 2px 6px rgba(0, 122, 255, 0.25)",
                              fontFamily: fontStack
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0062cc")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#007aff")}
                          >
                            Catat manual
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenManual(row)}
                            style={{
                              backgroundColor: "transparent",
                              color: "#8e8e93",
                              border: "1px solid #e5e5ea",
                              borderRadius: "10px",
                              padding: "5px 12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              fontFamily: fontStack
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
                Catat Presensi Manual
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: "none", border: "none", color: "#8e8e93", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: "#f2f2f7", padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #e5e5ea" }}>
              <div style={{ fontSize: "14.5px", fontWeight: "700", color: "#1c1c1e" }}>
                {selectedStudent.name}
              </div>
              <div style={{ fontSize: "12.5px", color: "#8e8e93", marginTop: "2px" }}>
                NIM: {selectedStudent.nim} · Lantai {selectedStudent.floor} · Kamar: {selectedStudent.room}
              </div>
            </div>

            <form onSubmit={handleSaveManual} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1c1c1e", marginBottom: "8px" }}>
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
                        padding: "9px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: "600",
                        border: manualStatus === st ? "1.5px solid #007aff" : "1px solid #e5e5ea",
                        backgroundColor: manualStatus === st ? "rgba(0, 122, 255, 0.1)" : "#ffffff",
                        color: manualStatus === st ? "#007aff" : "#8e8e93",
                        cursor: "pointer",
                        fontFamily: fontStack,
                        transition: "all 0.15s ease"
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1c1c1e", marginBottom: "8px" }}>
                  Keterangan / Alasan Manual
                </label>
                <textarea
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="Contoh: Sudah berada di kamar, verifikasi langsung oleh fasilitator."
                  rows={3}
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
                  onClick={() => setModalOpen(false)}
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

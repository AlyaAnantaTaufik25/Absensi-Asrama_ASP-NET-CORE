import React, { useState, useEffect, useRef } from "react";
import {
  Calendar as CalendarIcon,
  Download,
  Search,
  CheckCircle2,
  MapPin,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  RotateCcw
} from "lucide-react";
import { getPresensi } from "../services/api";
import { showToast } from "../utils/toast";

export default function RiwayatPresensiPage({ user }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [sessionFilter, setSessionFilter] = useState("Semua"); // "Semua" | "pagi" | "malam"
  const [selectedDate, setSelectedDate] = useState(null); // ISO string "YYYY-MM-DD" atau null
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date(2026, 10, 1)); // Default November 2026
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const calendarRef = useRef(null);

  // Helper untuk menentukan sesi presensi berdasarkan jam atau keterangan
  const parseSessionType = (item) => {
    const ket = (item.keterangan || "").toLowerCase();
    if (ket.includes("subuh") || ket.includes("pagi")) return "pagi";
    if (ket.includes("malam") || ket.includes("maghrib") || ket.includes("isya")) return "malam";

    const dateSource = item.waktu || item.tanggal;
    if (dateSource) {
      const d = new Date(dateSource);
      if (!isNaN(d.getTime())) {
        return d.getHours() < 12 ? "pagi" : "malam";
      }
    }
    return "pagi";
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getPresensi();
        if (Array.isArray(data) && data.length > 0) {
          const currentUserId = user?.idUser || user?.id;
          const userRecords = currentUserId ? data.filter((d) => d.idUser === currentUserId) : data;
          const liveList = userRecords.map((item, idx) => {
            const sesiType = parseSessionType(item);
            const rawDate = item.tanggal || item.waktu || new Date();
            const dObj = new Date(rawDate);
            const dateKey = !isNaN(dObj.getTime())
              ? `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${String(dObj.getDate()).padStart(2, "0")}`
              : "2026-11-18";

            return {
              id: item.idPresensi || `live-${idx + 1}`,
              dateKey,
              tanggal: item.tanggal
                ? new Date(item.tanggal).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })
                : "Hari Ini",
              waktu: item.waktu
                ? new Date(item.waktu).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit"
                  }) + " WIB"
                : "-",
              sesi: sesiType === "pagi" ? "Absen Pagi" : "Absen Malam",
              sesiType,
              lokasi: item.latitude
                ? `Area Asrama (${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)})`
                : "Area Asrama",
              status: item.status || "Hadir",
              keterangan: item.keterangan || (sesiType === "pagi" ? "Sesi Subuh tepat waktu" : "Sesi Malam tepat waktu")
            };
          });

          setRecords(liveList);
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.warn("Gagal memuat presensi:", err);
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Statistik Murni Berdasarkan Data Riil Database
  const totalHadirStat = records.filter((r) => r.status?.toLowerCase() === "hadir").length;
  const totalIzinStat = records.filter((r) => r.status?.toLowerCase() === "izin").length;
  const totalAlphaStat = records.filter((r) => r.status?.toLowerCase() === "alpha").length;
  const totalRecords = records.length;
  const kepatuhanPctStat = totalRecords > 0 ? ((totalHadirStat / totalRecords) * 100).toFixed(1) : "0.0";

  // Kalender Helpers
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth(); // 0-indexed

  const monthNamesIndo = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const handlePrevMonth = () => {
    setCalendarViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarViewDate(new Date(year, month + 1, 1));
  };

  // Hitung jumlah hari dan hari pertama dalam bulan
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Minggu

  // Daftar tanggal yang memiliki data presensi
  const datesWithRecords = new Set(records.map((r) => r.dateKey));

  // Handler memilih tanggal di kalender
  const handleSelectDay = (dayNum) => {
    const isoString = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    if (selectedDate === isoString) {
      setSelectedDate(null); // toggle off jika diklik ulang
    } else {
      setSelectedDate(isoString);
    }
  };

  // Format tanggal untuk tampilan UI
  const formatDisplayDate = (isoStr) => {
    if (!isoStr) return "";
    const parts = isoStr.split("-");
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  // Filter Data
  const filteredRecords = records.filter((rec) => {
    const matchSearch =
      rec.tanggal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.sesi.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus =
      statusFilter === "Semua Status" || rec.status.toLowerCase() === statusFilter.toLowerCase();

    const matchSession =
      sessionFilter === "Semua" || rec.sesiType === sessionFilter;

    const matchDate = !selectedDate || rec.dateKey === selectedDate;

    return matchSearch && matchStatus && matchSession && matchDate;
  });

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      showToast("Tidak ada data presensi untuk diunduh.", "warning");
      return;
    }
    const headers = ["No", "Tanggal", "Waktu", "Sesi", "Status", "Lokasi", "Keterangan"];
    const rows = filteredRecords.map((r, i) => [
      i + 1,
      r.tanggal,
      r.waktu,
      r.sesi,
      r.status,
      r.lokasi,
      r.keterangan
    ]);
    const cleanName = (user?.displayName || user?.name || "Mahasiswa").replace(/\s+/g, "_");
    downloadCSV(`Rekap_Presensi_${cleanName}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    setShowExportMenu(false);
  };

  const handlePrintPDF = () => {
    if (filteredRecords.length === 0) {
      showToast("Tidak ada data presensi untuk dicetak.", "warning");
      return;
    }
    const headers = ["Tanggal", "Waktu", "Sesi", "Status Kehadiran", "Keterangan"];
    const rows = filteredRecords.map((r) => [
      r.tanggal,
      r.waktu,
      r.sesi,
      r.status,
      r.keterangan
    ]);
    printOfficialDocument({
      title: "REKAPITULASI PRESENSI MAHASISWA ASRAMA",
      subtitle: "Laporan Kehadiran Harian Santri / Penghuni Asrama Universitas Andalas",
      metaInfo: [
        { label: "Nama Mahasiswa", value: user?.displayName || user?.name || "Alya Ananta" },
        { label: "NIM / ID", value: user?.nim || "2311523005" },
        { label: "Gedung Asrama / Kamar", value: `${user?.building || "Asrama Putri"} · ${user?.room || "Kamar 302"}` },
        { label: "Ringkasan Kehadiran", value: `${countHadir} Sesi Hadir · ${countIzin} Izin · ${countAlpha} Alpha` }
      ],
      headers,
      rows,
      signerName: "Fasilitator / Pembina Asrama",
      signerRole: "Pengelola Asrama Mahasiswa"
    });
    setShowExportMenu(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif',
        maxWidth: "1180px",
        margin: "0 auto",
        paddingBottom: "40px",
        color: "#1c1c1e"
      }}
    >
      {/* 1. iOS Minimalist Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          padding: "4px 2px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1
              style={{
                fontSize: "26px",
                fontWeight: "700",
                color: "#1c1c1e",
                margin: 0,
                letterSpacing: "-0.5px"
              }}
            >
              Riwayat Presensi
            </h1>
            <span
              style={{
                backgroundColor: "#e5e5ea",
                color: "#636366",
                fontSize: "12px",
                fontWeight: "600",
                padding: "3px 10px",
                borderRadius: "20px"
              }}
            >
              {user?.nim || "2311523005"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => showToast("Mengunduh rekap riwayat presensi (PDF/Excel)...", "info")}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5ea",
              color: "#1c1c1e",
              fontWeight: "600",
              fontSize: "13px",
              padding: "9px 16px",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              transition: "background-color 0.15s ease"
            }}
          >
            <Download size={15} color="#007aff" />
            <span>Unduh Laporan</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Stat Card (Satu Kartu Lebar Sesuai Desain Referensi Apple HIG) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          padding: "24px 28px",
          border: "1px solid rgba(0,0,0,0.04)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "28px"
        }}
      >
        {/* Kolom 1: Total Hadir */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            TOTAL HADIR
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#1c1c1e", marginTop: "6px", display: "flex", alignItems: "baseline", gap: "6px", letterSpacing: "-0.5px" }}>
            <span>{totalHadirStat}</span>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#8e8e93", letterSpacing: "normal" }}>Sesi</span>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: totalHadirStat > 0 ? "#34c759" : "#8e8e93", fontSize: "11.5px", fontWeight: "600", marginTop: "6px" }}>
            {totalHadirStat > 0 ? <CheckCircle2 size={13} color="#34c759" /> : null}
            <span>{totalHadirStat > 0 ? "Catatan kehadiran terverifikasi" : "Belum ada riwayat hadir"}</span>
          </div>
        </div>

        {/* Kolom 2: Dispensasi / Izin */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            DISPENSASI / IZIN
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#007aff", marginTop: "6px", display: "flex", alignItems: "baseline", gap: "6px", letterSpacing: "-0.5px" }}>
            <span>{totalIzinStat}</span>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#8e8e93", letterSpacing: "normal" }}>Sesi</span>
          </div>
          <div style={{ color: "#8e8e93", fontSize: "11.5px", marginTop: "6px" }}>
            {totalIzinStat > 0 ? "Dispensasi izin resmi" : "Tidak ada catatan izin"}
          </div>
        </div>

        {/* Kolom 3: Alpha / Terlewat */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            ALPHA / TERLEWAT
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: totalAlphaStat > 0 ? "#ff3b30" : "#1c1c1e", marginTop: "6px", display: "flex", alignItems: "baseline", gap: "6px", letterSpacing: "-0.5px" }}>
            <span>{totalAlphaStat}</span>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#8e8e93", letterSpacing: "normal" }}>Sesi</span>
          </div>
          <div style={{ color: "#8e8e93", fontSize: "11.5px", marginTop: "6px" }}>
            {totalAlphaStat > 0 ? "Perlu konfirmasi fasilitator" : "Tidak ada catatan alpha"}
          </div>
        </div>

        {/* Kolom 4: Persentase Kehadiran */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            PERSENTASE KEHADIRAN
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#007aff", marginTop: "6px", display: "flex", alignItems: "baseline", gap: "4px", letterSpacing: "-0.5px" }}>
            <span>{kepatuhanPctStat}</span>
            <span style={{ fontSize: "15px", fontWeight: "700", color: "#007aff", letterSpacing: "normal" }}>%</span>
          </div>
          <div style={{ color: "#8e8e93", fontSize: "11.5px", marginTop: "6px" }}>
            {totalRecords > 0 ? "Dihitung dari seluruh sesi aktif" : "Belum ada persentase"}
          </div>
        </div>
      </div>

      {/* 3. Main Card with Search, Kalender, Filter Sesi & Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          padding: "22px",
          border: "1px solid rgba(0,0,0,0.04)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          position: "relative"
        }}
      >
        {/* Search & Filter Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          {/* Search Field */}
          <div style={{ position: "relative", minWidth: "220px", flex: 1 }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8e8e93"
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tanggal atau keterangan..."
              style={{
                width: "100%",
                height: "38px",
                paddingLeft: "36px",
                paddingRight: "14px",
                borderRadius: "10px",
                border: "1px solid #e5e5ea",
                backgroundColor: "#f2f2f7",
                fontSize: "13px",
                color: "#1c1c1e",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Tombol Kalender Popover (iOS Style) */}
          <div style={{ position: "relative" }} ref={calendarRef}>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              style={{
                height: "38px",
                padding: "0 14px",
                borderRadius: "10px",
                border: selectedDate ? "1.5px solid #007aff" : "1px solid #e5e5ea",
                backgroundColor: selectedDate ? "rgba(0, 122, 255, 0.08)" : "#ffffff",
                color: selectedDate ? "#007aff" : "#1c1c1e",
                fontSize: "12.5px",
                fontWeight: selectedDate ? "600" : "500",
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                transition: "all 0.15s ease"
              }}
            >
              <CalendarIcon size={15} color={selectedDate ? "#007aff" : "#8e8e93"} />
              <span>{selectedDate ? formatDisplayDate(selectedDate) : "Kalender / Tanggal"}</span>
              <ChevronDown
                size={14}
                style={{
                  transform: showCalendar ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease"
                }}
              />
            </button>

            {/* Widget Kalender iOS (Interactive Popover) */}
            {showCalendar && (
              <div
                style={{
                  position: "absolute",
                  top: "46px",
                  right: 0,
                  width: "300px",
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e5e5ea",
                  boxShadow: "0 14px 34px -6px rgba(0,0,0,0.15)",
                  padding: "16px",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                {/* Header Kalender: Bulan, Tahun & Navigasi */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#1c1c1e" }}>
                    {monthNamesIndo[month]} {year}
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "none",
                        backgroundColor: "#f2f2f7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#1c1c1e"
                      }}
                      title="Bulan sebelumnya"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "none",
                        backgroundColor: "#f2f2f7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#1c1c1e"
                      }}
                      title="Bulan berikutnya"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Nama Hari (Min, Sen, Sel, Rab, Kam, Jum, Sab) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    textAlign: "center",
                    gap: "2px"
                  }}
                >
                  {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
                    <span
                      key={d}
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#8e8e93",
                        padding: "4px 0"
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {/* Grid Tanggal */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "3px"
                  }}
                >
                  {/* Slot kosong sebelum hari pertama bulan */}
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} style={{ height: "34px" }} />
                  ))}

                  {/* Sel tanggal */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                    const hasAttendance = datesWithRecords.has(iso);
                    const isSelected = selectedDate === iso;

                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => handleSelectDay(dayNum)}
                        style={{
                          height: "34px",
                          width: "34px",
                          margin: "0 auto",
                          borderRadius: "50%",
                          border: "none",
                          backgroundColor: isSelected
                            ? "#007aff"
                            : "transparent",
                          color: isSelected
                            ? "#ffffff"
                            : hasAttendance
                            ? "#1c1c1e"
                            : "#8e8e93",
                          fontWeight: isSelected || hasAttendance ? "700" : "400",
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          transition: "background-color 0.15s ease"
                        }}
                      >
                        <span>{dayNum}</span>
                        {/* Dot penanda bahwa di tanggal ini ada absen */}
                        {hasAttendance && !isSelected && (
                          <span
                            style={{
                              position: "absolute",
                              bottom: "3px",
                              width: "4px",
                              height: "4px",
                              borderRadius: "50%",
                              backgroundColor: "#34c759"
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Footer Kalender: Tombol Reset / Pilih Semua Tanggal */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #f2f2f7",
                    paddingTop: "10px",
                    marginTop: "4px"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(null);
                      setShowCalendar(false);
                    }}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#007aff",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      padding: "2px 4px"
                    }}
                  >
                    Semua Tanggal
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCalendar(false)}
                    style={{
                      border: "none",
                      backgroundColor: "#007aff",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "600",
                      borderRadius: "8px",
                      padding: "5px 12px",
                      cursor: "pointer"
                    }}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filter Sesi (Segmented Control iOS Asli) */}
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "#e5e5ea",
              padding: "2px",
              borderRadius: "9px"
            }}
          >
            {[
              { key: "Semua", label: "Semua Sesi" },
              { key: "pagi", label: "Absen Pagi" },
              { key: "malam", label: "Absen Malam" }
            ].map((tab) => {
              const active = sessionFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSessionFilter(tab.key)}
                  style={{
                    border: "none",
                    backgroundColor: active ? "#ffffff" : "transparent",
                    color: active ? "#1c1c1e" : "#8e8e93",
                    fontWeight: active ? "600" : "500",
                    fontSize: "12.5px",
                    padding: "6px 14px",
                    borderRadius: "7px",
                    cursor: "pointer",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Status Dropdown */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                height: "38px",
                padding: "0 14px",
                borderRadius: "10px",
                border: "1px solid #e5e5ea",
                backgroundColor: "#ffffff",
                fontSize: "12.5px",
                fontWeight: "500",
                color: "#1c1c1e",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Izin">Izin</option>
            </select>
          </div>
        </div>

        {/* Info Banner saat Filter Tanggal Aktif */}
        {selectedDate && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "rgba(0, 122, 255, 0.08)",
              border: "1px solid rgba(0, 122, 255, 0.2)",
              borderRadius: "10px",
              padding: "7px 14px",
              fontSize: "12px",
              color: "#007aff",
              fontWeight: "600",
              gap: "10px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CalendarIcon size={14} />
              <span>Menampilkan presensi tanggal: {formatDisplayDate(selectedDate)} ({filteredRecords.length} rekaman)</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              style={{
                border: "none",
                background: "none",
                color: "#007aff",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center"
              }}
              title="Hapus filter tanggal"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Clean iOS Table (Tanpa Kolom Detail, Sesi Pill Harmonis) */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f2f2f7" }}>
                <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  TANGGAL & WAKTU
                </th>
                <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  SESI
                </th>
                <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  LOKASI / GEOFENCE
                </th>
                <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  KETERANGAN
                </th>
                <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "48px 16px", color: "#8e8e93" }}>
                    <CalendarIcon size={36} style={{ margin: "0 auto 10px", color: "#c7c7cc" }} />
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#1c1c1e" }}>
                      {records.length === 0 ? "Belum Ada Catatan Presensi" : "Tidak Ada Data Riwayat Sesuai Filter"}
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "4px", color: "#8e8e93" }}>
                      {records.length === 0
                        ? "Anda belum memiliki catatan presensi yang tersimpan di sistem."
                        : selectedDate
                        ? `Tidak ditemukan presensi pada tanggal ${formatDisplayDate(selectedDate)}.`
                        : "Coba ganti filter sesi (Semua, Absen Pagi, Absen Malam) atau kata kunci pencarian."}
                    </div>
                    {selectedDate && (
                      <button
                        type="button"
                        onClick={() => setSelectedDate(null)}
                        style={{
                          marginTop: "12px",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          backgroundColor: "#f2f2f7",
                          border: "1px solid #e5e5ea",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#007aff",
                          cursor: "pointer"
                        }}
                      >
                        Reset Filter Tanggal
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: "1px solid #f2f2f7",
                      transition: "background-color 0.1s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Tanggal & Waktu */}
                    <td style={{ padding: "14px" }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#1c1c1e" }}>
                        {item.tanggal}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93" }}>{item.waktu}</div>
                    </td>

                    {/* Sesi Pill (Harmonis: Blue untuk Pagi, Indigo untuk Malam) */}
                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "11.5px",
                          fontWeight: "600",
                          backgroundColor:
                            item.sesiType === "pagi"
                              ? "rgba(0, 122, 255, 0.08)"
                              : "rgba(88, 86, 214, 0.08)",
                          color: item.sesiType === "pagi" ? "#007aff" : "#5856d6"
                        }}
                      >
                        {item.sesi}
                      </span>
                    </td>

                    {/* Lokasi */}
                    <td style={{ padding: "14px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#3a3a3c" }}>
                        <MapPin size={13} color="#007aff" />
                        <span>{item.lokasi}</span>
                      </div>
                    </td>

                    {/* Keterangan */}
                    <td style={{ padding: "14px" }}>
                      <span style={{ fontSize: "13px", color: "#636366" }}>{item.keterangan}</span>
                    </td>

                    {/* Status Pill (Apple Green / Apple Blue) */}
                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "11.5px",
                          fontWeight: "600",
                          backgroundColor:
                            item.status?.toLowerCase() === "hadir"
                              ? "rgba(52, 199, 89, 0.12)"
                              : "rgba(0, 122, 255, 0.1)",
                          color:
                            item.status?.toLowerCase() === "hadir" ? "#34c759" : "#007aff"
                        }}
                      >
                        <CheckCircle2 size={12} />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

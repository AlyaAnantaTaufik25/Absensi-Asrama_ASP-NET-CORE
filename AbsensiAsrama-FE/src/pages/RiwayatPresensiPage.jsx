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
import { downloadCSV, printOfficialDocument } from "../utils/exportUtils";
import { showToast } from "../utils/toast";

export default function RiwayatPresensiPage({ user }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [sessionFilter, setSessionFilter] = useState("Semua"); // "Semua" | "pagi" | "malam"
  const [periodFilter, setPeriodFilter] = useState("Semua Waktu");
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getPresensi();
      if (Array.isArray(data) && data.length > 0) {
        const currentUserId = user?.idUser || user?.id;
        const currentNim = user?.nim;

        // Filter data milik user yang sedang aktif
        const userRecords = (currentUserId || currentNim)
          ? data.filter((d) => (currentUserId && d.idUser === currentUserId) || (currentNim && d.nim === currentNim))
          : data;

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
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Statistik Murni Berdasarkan Data Riil Database
  const totalHadirStat = records.filter((r) => r.status?.toLowerCase() === "hadir").length;
  const totalIzinStat = records.filter((r) => r.status?.toLowerCase() === "izin").length;
  const totalSakitStat = records.filter((r) => r.status?.toLowerCase() === "sakit").length;
  const totalAlphaStat = records.filter((r) => r.status?.toLowerCase() === "alpha").length;
  const totalRecords = records.length;
  const kepatuhanPctStat = totalRecords > 0 ? ((totalHadirStat / totalRecords) * 100).toFixed(1) : "0.0";

  // Handler klik pada kartu KPI untuk memfilter baris tabel secara interaktif
  const handleCardClick = (status) => {
    if (statusFilter.toLowerCase() === status.toLowerCase()) {
      setStatusFilter("Semua Status");
      showToast("Menampilkan semua riwayat presensi", "info");
    } else {
      setStatusFilter(status);
      showToast(`Menyaring presensi status: ${status.toUpperCase()}`, "info");
    }
  };

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

  // Tanggal & Periode Helpers
  const todayStr = new Date().toISOString().split("T")[0];
  const getNDaysAgoStr = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split("T")[0];
  };
  const sevenDaysAgoStr = getNDaysAgoStr(7);
  const thirtyDaysAgoStr = getNDaysAgoStr(30);

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

    let matchPeriod = true;
    if (periodFilter === "Hari ini") {
      matchPeriod = rec.dateKey === todayStr;
    } else if (periodFilter === "7 Hari Terakhir") {
      matchPeriod = rec.dateKey >= sevenDaysAgoStr && rec.dateKey <= todayStr;
    } else if (periodFilter === "1 Bulan Terakhir") {
      matchPeriod = rec.dateKey >= thirtyDaysAgoStr && rec.dateKey <= todayStr;
    }

    return matchSearch && matchStatus && matchSession && matchDate && matchPeriod;
  });

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
    const cleanName = (user?.displayName || user?.nama || user?.name || "Mahasiswa").replace(/\s+/g, "_");
    downloadCSV(`Riwayat_Presensi_${cleanName}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
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
      title: "REKAPITULASI RIWAYAT PRESENSI MAHASISWA",
      subtitle: "Laporan Riwayat Kehadiran Mandiri Penghuni Asrama Universitas Andalas",
      metaInfo: [
        { label: "Nama Mahasiswa", value: user?.displayName || user?.nama || user?.name || "Alya Ananta" },
        { label: "NIM", value: user?.nim || "2311523005" },
        { label: "Gedung Asrama / Kamar", value: `${user?.building || user?.namaGedung || "Asrama Hijau"} · ${user?.room || user?.nomorKamar || "HJ-302"}` },
        { label: "Ringkasan Kehadiran", value: `${totalHadirStat} Hadir · ${totalIzinStat} Izin · ${totalSakitStat} Sakit · ${totalAlphaStat} Alpha (Kepatuhan: ${kepatuhanPctStat}%)` }
      ],
      headers,
      rows,
      signerName: "Fasilitator Asrama",
      signerRole: "Pengelola Asrama Mahasiswa Unand"
    });
  };

  const fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif';

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        fontFamily: fontStack,
        maxWidth: "1180px",
        margin: "0 auto",
        paddingBottom: "40px",
        color: "#1c1c1e"
      }}
    >
      {/* 1. Header with Actions */}
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
            onClick={handleExportCSV}
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

      {/* 2. Top 5 KPI Summary Cards (Interaktif: Klik untuk Filter Baris Tabel) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px"
        }}
      >
        {/* KARTU TOTAL HADIR */}
        <div
          onClick={() => handleCardClick("Hadir")}
          style={{
            backgroundColor: statusFilter === "Hadir" ? "#f0fdf4" : "#ffffff",
            borderRadius: "18px",
            padding: "18px 20px",
            border: statusFilter === "Hadir" ? "2px solid #34c759" : "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: statusFilter === "Hadir" ? "0 4px 14px rgba(52, 199, 89, 0.2)" : "0 2px 10px rgba(0, 0, 0, 0.02)",
            cursor: "pointer",
            transition: "all 0.18s ease",
            transform: statusFilter === "Hadir" ? "translateY(-2px)" : "none",
            userSelect: "none"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: statusFilter === "Hadir" ? "#166534" : "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              TOTAL HADIR
            </span>
            {statusFilter === "Hadir" && (
              <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "#34c759", color: "#ffffff", padding: "2px 6px", borderRadius: "10px" }}>
                Filter Aktif
              </span>
            )}
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#34c759", display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span>{totalHadirStat}</span>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#8e8e93" }}>Sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginTop: "4px" }}>
            {statusFilter === "Hadir" ? "Klik untuk batalkan filter" : "Catatan kehadiran terverifikasi"}
          </div>
        </div>

        {/* KARTU DISPENSASI / IZIN */}
        <div
          onClick={() => handleCardClick("Izin")}
          style={{
            backgroundColor: statusFilter === "Izin" ? "#eff6ff" : "#ffffff",
            borderRadius: "18px",
            padding: "18px 20px",
            border: statusFilter === "Izin" ? "2px solid #007aff" : "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: statusFilter === "Izin" ? "0 4px 14px rgba(0, 122, 255, 0.2)" : "0 2px 10px rgba(0, 0, 0, 0.02)",
            cursor: "pointer",
            transition: "all 0.18s ease",
            transform: statusFilter === "Izin" ? "translateY(-2px)" : "none",
            userSelect: "none"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: statusFilter === "Izin" ? "#1e40af" : "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              DISPENSASI / IZIN
            </span>
            {statusFilter === "Izin" && (
              <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "#007aff", color: "#ffffff", padding: "2px 6px", borderRadius: "10px" }}>
                Filter Aktif
              </span>
            )}
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#007aff", display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span>{totalIzinStat}</span>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#8e8e93" }}>Sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginTop: "4px" }}>
            {statusFilter === "Izin" ? "Klik untuk batalkan filter" : totalIzinStat > 0 ? "Dispensasi izin disetujui" : "Tidak ada catatan izin"}
          </div>
        </div>

        {/* KARTU SAKIT */}
        <div
          onClick={() => handleCardClick("Sakit")}
          style={{
            backgroundColor: statusFilter === "Sakit" ? "#fefce8" : "#ffffff",
            borderRadius: "18px",
            padding: "18px 20px",
            border: statusFilter === "Sakit" ? "2px solid #eab308" : "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: statusFilter === "Sakit" ? "0 4px 14px rgba(234, 179, 8, 0.2)" : "0 2px 10px rgba(0, 0, 0, 0.02)",
            cursor: "pointer",
            transition: "all 0.18s ease",
            transform: statusFilter === "Sakit" ? "translateY(-2px)" : "none",
            userSelect: "none"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: statusFilter === "Sakit" ? "#854d0e" : "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              SAKIT
            </span>
            {statusFilter === "Sakit" && (
              <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "#eab308", color: "#ffffff", padding: "2px 6px", borderRadius: "10px" }}>
                Filter Aktif
              </span>
            )}
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#eab308", display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span>{totalSakitStat}</span>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#8e8e93" }}>Sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginTop: "4px" }}>
            {statusFilter === "Sakit" ? "Klik untuk batalkan filter" : totalSakitStat > 0 ? "Izin sakit disetujui" : "Tidak ada catatan sakit"}
          </div>
        </div>

        {/* KARTU ALPHA / TERLEWAT */}
        <div
          onClick={() => handleCardClick("Alpha")}
          style={{
            backgroundColor: statusFilter === "Alpha" ? "#fef2f2" : "#ffffff",
            borderRadius: "18px",
            padding: "18px 20px",
            border: statusFilter === "Alpha" ? "2px solid #ff3b30" : "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: statusFilter === "Alpha" ? "0 4px 14px rgba(255, 59, 48, 0.2)" : "0 2px 10px rgba(0, 0, 0, 0.02)",
            cursor: "pointer",
            transition: "all 0.18s ease",
            transform: statusFilter === "Alpha" ? "translateY(-2px)" : "none",
            userSelect: "none"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: statusFilter === "Alpha" ? "#991b1b" : "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              ALPHA / TERLEWAT
            </span>
            {statusFilter === "Alpha" && (
              <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "#ff3b30", color: "#ffffff", padding: "2px 6px", borderRadius: "10px" }}>
                Filter Aktif
              </span>
            )}
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: totalAlphaStat > 0 ? "#ff3b30" : "#1c1c1e", display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span>{totalAlphaStat}</span>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#8e8e93" }}>Sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginTop: "4px" }}>
            {statusFilter === "Alpha" ? "Klik untuk batalkan filter" : totalAlphaStat > 0 ? "Perlu konfirmasi fasilitator" : "Tidak ada catatan alpha"}
          </div>
        </div>

        {/* KARTU PERSENTASE KEHADIRAN (Klik untuk Reset Filter) */}
        <div
          onClick={() => {
            setStatusFilter("Semua Status");
            showToast("Menampilkan semua riwayat presensi", "info");
          }}
          style={{
            backgroundColor: statusFilter === "Semua Status" ? "#fafafc" : "#ffffff",
            borderRadius: "18px",
            padding: "18px 20px",
            border: statusFilter === "Semua Status" ? "2px solid #007aff" : "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)",
            cursor: "pointer",
            transition: "all 0.18s ease",
            userSelect: "none"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              PERSENTASE KEHADIRAN
            </span>
            {statusFilter === "Semua Status" && (
              <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "#007aff", color: "#ffffff", padding: "2px 6px", borderRadius: "10px" }}>
                Semua
              </span>
            )}
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: parseFloat(kepatuhanPctStat) >= 80 ? "#34c759" : "#ff9500", display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span>{kepatuhanPctStat}</span>
            <span style={{ fontSize: "15px", fontWeight: "700" }}>%</span>
          </div>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginTop: "4px" }}>
            Klik untuk tampilkan semua
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
                boxSizing: "border-box",
                fontFamily: fontStack
              }}
            />
          </div>

          {/* Tombol Kalender Popover */}
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
                transition: "all 0.15s ease",
                fontFamily: fontStack
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

            {/* Widget Kalender */}
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
                  gap: "12px",
                  fontFamily: fontStack
                }}
              >
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
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", gap: "2px" }}>
                  {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
                    <span key={d} style={{ fontSize: "11px", fontWeight: "600", color: "#8e8e93", padding: "4px 0" }}>
                      {d}
                    </span>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} style={{ height: "34px" }} />
                  ))}
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
                          backgroundColor: isSelected ? "#007aff" : "transparent",
                          color: isSelected ? "#ffffff" : hasAttendance ? "#1c1c1e" : "#8e8e93",
                          fontWeight: isSelected || hasAttendance ? "700" : "400",
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative"
                        }}
                      >
                        <span>{dayNum}</span>
                        {hasAttendance && !isSelected && (
                          <span style={{ position: "absolute", bottom: "3px", width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#34c759" }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f2f2f7", paddingTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(null);
                      setShowCalendar(false);
                    }}
                    style={{ border: "none", background: "none", color: "#007aff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Semua Tanggal
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(false)}
                    style={{ border: "none", backgroundColor: "#007aff", color: "#ffffff", fontSize: "12px", fontWeight: "600", borderRadius: "8px", padding: "5px 12px", cursor: "pointer" }}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filter Sesi */}
          <div style={{ display: "inline-flex", backgroundColor: "#e5e5ea", padding: "2px", borderRadius: "9px" }}>
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
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                    transition: "all 0.15s ease",
                    fontFamily: fontStack
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Periode & Status Dropdowns */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
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
                cursor: "pointer",
                fontFamily: fontStack
              }}
            >
              <option value="Semua Waktu">Semua Waktu</option>
              <option value="Hari ini">Hari ini</option>
              <option value="7 Hari Terakhir">7 Hari Terakhir</option>
              <option value="1 Bulan Terakhir">1 Bulan Terakhir</option>
            </select>

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
                cursor: "pointer",
                fontFamily: fontStack
              }}
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Izin">Izin</option>
              <option value="Sakit">Sakit</option>
              <option value="Alpha">Alpha</option>
            </select>
          </div>
        </div>

        {/* Info Banner saat Filter Status atau Tanggal Aktif */}
        {statusFilter !== "Semua Status" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor:
                statusFilter === "Hadir"
                  ? "rgba(52, 199, 89, 0.1)"
                  : statusFilter === "Izin"
                  ? "rgba(0, 122, 255, 0.1)"
                  : statusFilter === "Sakit"
                  ? "rgba(234, 179, 8, 0.1)"
                  : "rgba(255, 59, 48, 0.1)",
              border: `1px solid ${
                statusFilter === "Hadir"
                  ? "#34c759"
                  : statusFilter === "Izin"
                  ? "#007aff"
                  : statusFilter === "Sakit"
                  ? "#eab308"
                  : "#ff3b30"
              }`,
              padding: "10px 16px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: "600",
              color:
                statusFilter === "Hadir"
                  ? "#166534"
                  : statusFilter === "Izin"
                  ? "#1e40af"
                  : statusFilter === "Sakit"
                  ? "#854d0e"
                  : "#991b1b"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter size={15} />
              <span>
                Menyaring presensi dengan status: <strong>{statusFilter.toUpperCase()}</strong> ({filteredRecords.length} rekaman ditemukan)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter("Semua Status")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: "#ffffff",
                border: "1px solid #d1d5db",
                color: "#374151",
                padding: "4px 10px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <X size={13} />
              Tampilkan Semua
            </button>
          </div>
        )}

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

        {/* Table */}
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
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "48px 16px", color: "#8e8e93" }}>
                    Memuat riwayat presensi...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
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
                        : "Coba ganti filter status atau sesi presensi."}
                    </div>
                    {(selectedDate || statusFilter !== "Semua Status") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(null);
                          setStatusFilter("Semua Status");
                        }}
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
                        Reset Semua Filter
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

                    {/* Sesi Pill */}
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

                    {/* Status Pill */}
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
                              : item.status?.toLowerCase() === "alpha"
                              ? "rgba(255, 59, 48, 0.12)"
                              : item.status?.toLowerCase() === "sakit"
                              ? "rgba(234, 179, 8, 0.12)"
                              : item.status?.toLowerCase() === "terlambat"
                              ? "rgba(192, 57, 43, 0.1)"
                              : "rgba(0, 122, 255, 0.12)",
                          color:
                            item.status?.toLowerCase() === "hadir"
                              ? "#34c759"
                              : item.status?.toLowerCase() === "alpha"
                              ? "#ff3b30"
                              : item.status?.toLowerCase() === "sakit"
                              ? "#eab308"
                              : item.status?.toLowerCase() === "terlambat"
                              ? "#c0392b"
                              : "#007aff"
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

import React, { useState, useEffect, useMemo } from "react";
import {
  Download,
  Printer,
  Search,
  RefreshCw,
  Building2,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileSpreadsheet,
  X,
  UserCheck,
  TrendingUp,
  Shield,
  Filter
} from "lucide-react";
import { getRekapPresensi, getGedungFasil } from "../../services/api";
import { downloadExcelHtml, downloadCSV, printOfficialDocument } from "../../utils/exportUtils";
import { showToast } from "../../utils/toast";

export default function RekapKehadiranPage({ user }) {
  // Gedung & Data states
  const [gedungInfo, setGedungInfo] = useState({
    idGedung: 1,
    namaGedung: "Asrama",
    totalPenghuni: 0,
    daftarLantai: []
  });
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Filter status aktif dari KPI Cards: "semua" | "hadir" | "izin" | "sakit" | "alpha"
  const [activeStatusCard, setActiveStatusCard] = useState("semua");

  // Tanggal & Periode Helpers
  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const getNDaysAgoStr = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split("T")[0];
  };

  // Filters
  const [selectedFloor, setSelectedFloor] = useState("all"); // "all" or number string (e.g. "1", "2", "3")
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("1 Bulan Terakhir");
  const [fromDate, setFromDate] = useState(() => getNDaysAgoStr(30));
  const [toDate, setToDate] = useState(getTodayStr);

  const handlePeriodChange = (val) => {
    setPeriodFilter(val);
    const today = getTodayStr();
    if (val === "Hari ini") {
      setFromDate(today);
      setToDate(today);
    } else if (val === "7 Hari Terakhir") {
      setFromDate(getNDaysAgoStr(7));
      setToDate(today);
    } else if (val === "1 Bulan Terakhir") {
      setFromDate(getNDaysAgoStr(30));
      setToDate(today);
    }
  };

  // Load building info and attendance data
  const loadData = async () => {
    try {
      setLoading(true);
      const fasilUserId = user?.idUser || user?.id || 3;
      
      // 1. Ambil info gedung binaan Fasil
      let currentGedung = gedungInfo;
      try {
        const gRes = await getGedungFasil(fasilUserId);
        if (gRes && gRes.idGedung) {
          currentGedung = gRes;
          setGedungInfo(gRes);
        }
      } catch (err) {
        console.warn("Gagal memuat info gedung fasil:", err);
      }

      // 2. Ambil data rekapitulasi satu gedung penuh untuk role penghuni (mahasiswa)
      const rekapRes = await getRekapPresensi({
        gedungId: currentGedung.idGedung,
        role: "penghuni",
        fromDate,
        toDate
      });

      if (rekapRes && rekapRes.success && Array.isArray(rekapRes.data) && rekapRes.data.length > 0) {
        const mapped = rekapRes.data.map((item, idx) => ({
          ...item,
          idUser: item.idUser || idx + 1,
          room: item.nomorKamar || item.room || `Kamar ${(item.lantai || 1) * 100 + idx + 1}`,
          nomorKamar: item.nomorKamar || item.room || `Kamar ${(item.lantai || 1) * 100 + idx + 1}`,
          name: item.nama || item.name || "Mahasiswa",
          nama: item.nama || item.name || "Mahasiswa",
          nim: item.nim || "-",
          lantai: item.lantai || 1,
          complianceRate: item.percentage || 0,
          percentage: item.percentage || 0,
          hadir: item.hadir || 0,
          totalPresent: item.hadir || 0,
          izin: item.izin || 0,
          totalPermit: item.izin || 0,
          sakit: item.sakit || 0,
          alpha: item.alpha || 0,
          totalAlpha: item.alpha || 0,
          statusNote: item.keterangan || (item.hadir > 0 ? "Tepat waktu" : "Perlu perhatian"),
          keterangan: item.keterangan || "Tepat waktu",
          terakhirStatus: item.terakhirStatus || (item.hadir > 0 ? "Hadir" : item.izin > 0 ? "Izin" : item.sakit > 0 ? "Sakit" : "Alpha"),
          terakhirWaktu: item.terakhirWaktu || new Date().toISOString()
        }));
        setAttendanceData(mapped);
      } else {
        setAttendanceData([]);
      }
    } catch (err) {
      console.error("Gagal memuat rekap presensi gedung fasil:", err);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, fromDate, toDate]);

  // Ringkasan KPI dihitung dari SELURUH mahasiswa binaan pada periode yang dipilih
  const totalHadir = useMemo(() => attendanceData.reduce((acc, curr) => acc + (curr.hadir || 0), 0), [attendanceData]);
  const totalIzin = useMemo(() => attendanceData.reduce((acc, curr) => acc + (curr.izin || 0), 0), [attendanceData]);
  const totalSakit = useMemo(() => attendanceData.reduce((acc, curr) => acc + (curr.sakit || 0), 0), [attendanceData]);
  const totalAlpha = useMemo(() => attendanceData.reduce((acc, curr) => acc + (curr.alpha || 0), 0), [attendanceData]);
  const avgPercentage = useMemo(() => {
    if (attendanceData.length === 0) return 0;
    return Math.round(
      attendanceData.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / attendanceData.length
    );
  }, [attendanceData]);

  // Handler klik kartu KPI untuk filter interaktif
  const handleCardClick = (status) => {
    if (activeStatusCard === status) {
      setActiveStatusCard("semua");
      showToast("Menampilkan seluruh mahasiswa", "info");
    } else {
      setActiveStatusCard(status);
      showToast(`Menyaring mahasiswa dengan status: ${status.toUpperCase()}`, "info");
    }
  };

  // Filtered List berdasarkan klik kartu status, lantai, dan pencarian
  const filteredList = useMemo(() => {
    return attendanceData.filter((item) => {
      // 1. Filter Klik Kartu KPI (Hadir, Izin, Sakit, Alpha)
      if (activeStatusCard === "hadir" && (item.hadir || 0) === 0) return false;
      if (activeStatusCard === "izin" && (item.izin || 0) === 0) return false;
      if (activeStatusCard === "sakit" && (item.sakit || 0) === 0) return false;
      if (activeStatusCard === "alpha" && (item.alpha || 0) === 0) return false;

      // 2. Filter Lantai
      if (selectedFloor !== "all" && String(item.lantai) !== String(selectedFloor)) {
        return false;
      }

      // 3. Search query (Nama, NIM, Nomor Kamar)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (item.nama || item.name)?.toLowerCase().includes(q);
        const matchNim = item.nim?.toLowerCase().includes(q);
        const matchKamar = (item.nomorKamar || item.room)?.toLowerCase().includes(q);
        if (!matchName && !matchNim && !matchKamar) return false;
      }

      return true;
    });
  }, [attendanceData, activeStatusCard, selectedFloor, searchQuery]);

  // Daftar lantai unik yang tersedia dari data mahasiswa
  const availableFloors = useMemo(() => {
    const floors = new Set(attendanceData.map((d) => d.lantai).filter(Boolean));
    return Array.from(floors).sort((a, b) => a - b);
  }, [attendanceData]);

  // Ekspor Excel (.xls)
  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      showToast("Tidak ada data kehadiran untuk diunduh.", "warning");
      return;
    }

    const headers = [
      "No",
      "Lantai",
      "Kamar",
      "Nama Mahasiswa",
      "NIM",
      "Gedung Binaan",
      "Total Hadir",
      "Izin",
      "Sakit",
      "Alpha",
      "% Kepatuhan",
      "Status Terakhir",
      "Catatan / Keterangan"
    ];

    const rows = filteredList.map((s, idx) => [
      idx + 1,
      `Lantai ${s.lantai}`,
      s.nomorKamar || s.room,
      s.nama || s.name,
      s.nim,
      gedungInfo.namaGedung,
      s.hadir || 0,
      s.izin || 0,
      s.sakit || 0,
      s.alpha || 0,
      `${s.percentage || 0}%`,
      s.terakhirStatus || "Hadir",
      s.statusNote || s.keterangan || "-"
    ]);

    const cleanBuildingName = (gedungInfo.namaGedung || "Asrama").replace(/\s+/g, "_");
    const floorLabel = selectedFloor === "all" ? "Semua_Lantai" : `Lantai_${selectedFloor}`;
    const filterTag = activeStatusCard !== "semua" ? `_${activeStatusCard.toUpperCase()}` : "";
    const filename = `Rekap_Kehadiran_${cleanBuildingName}_${floorLabel}${filterTag}_${new Date().toISOString().slice(0, 10)}.xls`;
    const title = `REKAPITULASI KEHADIRAN MAHASISWA ${gedungInfo.namaGedung.toUpperCase()} (BINAAN FASILITATOR)`;

    const success = downloadExcelHtml(filename, title, headers, rows);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    }
  };

  // Ekspor CSV (.csv)
  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      showToast("Tidak ada data kehadiran untuk diunduh.", "warning");
      return;
    }

    const headers = [
      "No",
      "Lantai",
      "Nomor Kamar",
      "Nama Mahasiswa",
      "NIM",
      "Gedung",
      "Hadir",
      "Izin",
      "Sakit",
      "Alpha",
      "Kepatuhan (%)"
    ];

    const rows = filteredList.map((s, idx) => [
      idx + 1,
      s.lantai,
      s.nomorKamar || s.room,
      s.nama || s.name,
      s.nim,
      gedungInfo.namaGedung,
      s.hadir || 0,
      s.izin || 0,
      s.sakit || 0,
      s.alpha || 0,
      `${s.percentage || 0}%`
    ]);

    const cleanBuildingName = (gedungInfo.namaGedung || "Asrama").replace(/\s+/g, "_");
    const filterTag = activeStatusCard !== "semua" ? `_${activeStatusCard.toUpperCase()}` : "";
    downloadCSV(`Rekap_${cleanBuildingName}${filterTag}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // Cetak Dokumen Resmi PDF
  const handlePrintPDF = () => {
    if (filteredList.length === 0) {
      showToast("Tidak ada data kehadiran untuk dicetak.", "warning");
      return;
    }

    const headers = [
      "No",
      "Lantai & Kamar",
      "Nama Mahasiswa",
      "NIM",
      "Hadir",
      "Izin",
      "Sakit",
      "Alpha",
      "Kepatuhan"
    ];

    const rows = filteredList.map((s, idx) => [
      idx + 1,
      `Lt. ${s.lantai} · ${s.nomorKamar || s.room}`,
      s.nama || s.name,
      s.nim,
      s.hadir || 0,
      s.izin || 0,
      s.sakit || 0,
      s.alpha || 0,
      `${s.percentage || 0}%`
    ]);

    const floorText = selectedFloor === "all" ? "Semua Lantai (1 Gedung Penuh)" : `Lantai ${selectedFloor}`;

    printOfficialDocument({
      title: `REKAPITULASI KEHADIRAN PENGHUNI ${gedungInfo.namaGedung.toUpperCase()}`,
      subtitle: `Laporan Monitoring Kehadiran Mahasiswa Binaan Fasilitator Asrama Universitas Andalas`,
      metaInfo: [
        { label: "Gedung Asrama Binaan", value: `${gedungInfo.namaGedung} (Cakupan 1 Gedung Penuh)` },
        { label: "Cakupan Lantai", value: floorText },
        { label: "Fasilitator Penanggung Jawab", value: user?.nama || "Fasilitator Asrama" },
        { label: "Total Mahasiswa Ditampilkan", value: `${filteredList.length} Orang (Filter: ${activeStatusCard.toUpperCase()})` },
        { label: "Ringkasan Kehadiran Periode Ini", value: `${totalHadir} Hadir · ${totalIzin} Izin · ${totalSakit} Sakit · ${totalAlpha} Alpha (Rata-rata: ${avgPercentage}%)` },
        { label: "Tanggal Cetak", value: new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) }
      ],
      headers,
      rows,
      signerName: user?.nama || "Fasilitator Gedung",
      signerRole: `Fasilitator Pendamping ${gedungInfo.namaGedung}`
    });
  };

  const fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: fontStack }}>
      {/* 1. Header & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1c1c1e", margin: 0, letterSpacing: "-0.5px" }}>
            Rekap Kehadiran Mahasiswa
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "13.5px", color: "#8e8e93" }}>
            Laporan monitoring presensi mahasiswa binaan gedung <strong>{gedungInfo.namaGedung}</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={loadData}
            title="Segarkan Data"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#f8fafc",
              color: "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "9px 14px",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#007aff",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0, 122, 255, 0.25)",
              transition: "all 0.15s ease",
              fontFamily: fontStack
            }}
          >
            <Download size={16} />
            <span>Unduh Excel (.xls)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#ffffff",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            <FileSpreadsheet size={15} color="#059669" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPDF}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#ffffff",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              transition: "all 0.15s ease"
            }}
          >
            <Printer size={16} color="#2563eb" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Download Alert Toast */}
      {downloadSuccess && (
        <div
          style={{
            backgroundColor: "rgba(52, 199, 89, 0.12)",
            border: "1px solid rgba(52, 199, 89, 0.25)",
            color: "#34c759",
            padding: "12px 18px",
            borderRadius: "12px",
            fontSize: "13.5px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <CheckCircle2 size={18} />
          <span>Laporan rekapitulasi kehadiran {gedungInfo.namaGedung} berhasil diunduh.</span>
        </div>
      )}

      {/* 2. Top 5 KPI Summary Cards (Interaktif: Klik untuk Memfilter Baris Tabel) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px"
        }}
      >
        {/* KARTU TOTAL HADIR */}
        <div
          onClick={() => handleCardClick("hadir")}
          style={{
            backgroundColor: activeStatusCard === "hadir" ? "#f0fdf4" : "#ffffff",
            borderRadius: "18px",
            padding: "18px 20px",
            border: activeStatusCard === "hadir" ? "2px solid #34c759" : "1px solid rgba(0, 0, 0, 0.06)",
            boxShadow: activeStatusCard === "hadir" ? "0 4px 14px rgba(52, 199, 89, 0.2)" : "0 2px 10px rgba(0, 0, 0, 0.03)",
            cursor: "pointer",
            transition: "all 0.18s ease",
            transform: activeStatusCard === "hadir" ? "translateY(-2px)" : "none",
            userSelect: "none"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", color: activeStatusCard === "hadir" ? "#166534" : "#8e8e93", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Hadir
            </span>
            {activeStatusCard === "hadir" && (
              <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "#34c759", color: "#ffffff", padding: "2px 6px", borderRadius: "10px" }}>
                Filter Aktif
              </span>
            )}
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#34c759" }}>
            {totalHadir} <span style={{ fontSize: "12px", fontWeight: "500", color: "#8e8e93" }}>sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginTop: "4px" }}>
            {activeStatusCard === "hadir" ? "Klik untuk batalkan filter" : "Klik untuk filter data Hadir"}
          </div>
        </div>

        {/* KARTU IZIN */}
        <div
          onClick={() => handleCardClick("izin")}
          style={{
            backgroundColor: activeStatusCard === "izin" ? "#eff6ff" : "#ffffff",
            borderRadius: "18px",
            padding: "18px 20px",
            border: activeStatusCard === "izin" ? "2px solid #007aff" : "1px solid rgba(0, 0, 0, 0.06)",
            boxShadow: activeStatusCard === "izin" ? "0 4px 14px rgba(0, 122, 255, 0.2)" : "0 2px 10px rgba(0, 0, 0, 0.03)",
            cursor: "pointer",
            transition: "all 0.18s ease",
            transform: activeStatusCard === "izin" ? "translateY(-2px)" : "none",
            userSelect: "none"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", color: activeStatusCard === "izin" ? "#1e40af" : "#8e8e93", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Izin
            </span>
            {activeStatusCard === "izin" && (
              <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "#007aff", color: "#ffffff", padding: "2px 6px", borderRadius: "10px" }}>
                Filter Aktif
              </span>
            )}
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#007aff" }}>
            {totalIzin} <span style={{ fontSize: "12px", fontWeight: "500", color: "#8e8e93" }}>sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginTop: "4px" }}>
            {activeStatusCard === "izin" ? "Klik untuk batalkan filter" : "Klik untuk filter data Izin"}
          </div>
        </div>

        {/* KARTU SAKIT */}
        <div
          onClick={() => handleCardClick("sakit")}
          style={{
            backgroundColor: activeStatusCard === "sakit" ? "#fefce8" : "#ffffff",
            borderRadius: "18px",
            padding: "18px 20px",
            border: activeStatusCard === "sakit" ? "2px solid #eab308" : "1px solid rgba(0, 0, 0, 0.06)",
            boxShadow: activeStatusCard === "sakit" ? "0 4px 14px rgba(234, 179, 8, 0.2)" : "0 2px 10px rgba(0, 0, 0, 0.03)",
            cursor: "pointer",
            transition: "all 0.18s ease",
            transform: activeStatusCard === "sakit" ? "translateY(-2px)" : "none",
            userSelect: "none"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", color: activeStatusCard === "sakit" ? "#854d0e" : "#8e8e93", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Sakit
            </span>
            {activeStatusCard === "sakit" && (
              <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "#eab308", color: "#ffffff", padding: "2px 6px", borderRadius: "10px" }}>
                Filter Aktif
              </span>
            )}
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#eab308" }}>
            {totalSakit} <span style={{ fontSize: "12px", fontWeight: "500", color: "#8e8e93" }}>sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginTop: "4px" }}>
            {activeStatusCard === "sakit" ? "Klik untuk batalkan filter" : "Klik untuk filter data Sakit"}
          </div>
        </div>

        {/* KARTU ALPHA */}
        <div
          onClick={() => handleCardClick("alpha")}
          style={{
            backgroundColor: activeStatusCard === "alpha" ? "#fef2f2" : "#ffffff",
            borderRadius: "18px",
            padding: "18px 20px",
            border: activeStatusCard === "alpha" ? "2px solid #ff3b30" : "1px solid rgba(0, 0, 0, 0.06)",
            boxShadow: activeStatusCard === "alpha" ? "0 4px 14px rgba(255, 59, 48, 0.2)" : "0 2px 10px rgba(0, 0, 0, 0.03)",
            cursor: "pointer",
            transition: "all 0.18s ease",
            transform: activeStatusCard === "alpha" ? "translateY(-2px)" : "none",
            userSelect: "none"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", color: activeStatusCard === "alpha" ? "#991b1b" : "#8e8e93", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Alpha
            </span>
            {activeStatusCard === "alpha" && (
              <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "#ff3b30", color: "#ffffff", padding: "2px 6px", borderRadius: "10px" }}>
                Filter Aktif
              </span>
            )}
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#ff3b30" }}>
            {totalAlpha} <span style={{ fontSize: "12px", fontWeight: "500", color: "#8e8e93" }}>sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginTop: "4px" }}>
            {activeStatusCard === "alpha" ? "Klik untuk batalkan filter" : "Klik untuk filter data Alpha"}
          </div>
        </div>

        {/* KARTU TINGKAT KEPATUHAN (Klik untuk Tampilkan Semua) */}
        <div
          onClick={() => {
            setActiveStatusCard("semua");
            showToast("Menampilkan seluruh mahasiswa", "info");
          }}
          style={{
            backgroundColor: activeStatusCard === "semua" ? "#fafafc" : "#ffffff",
            borderRadius: "18px",
            padding: "18px 20px",
            border: activeStatusCard === "semua" ? "2px solid #007aff" : "1px solid rgba(0, 0, 0, 0.06)",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
            cursor: "pointer",
            transition: "all 0.18s ease",
            userSelect: "none"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Tingkat Kepatuhan
            </span>
            {activeStatusCard === "semua" && (
              <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "#007aff", color: "#ffffff", padding: "2px 6px", borderRadius: "10px" }}>
                Semua
              </span>
            )}
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: avgPercentage >= 80 ? "#34c759" : "#ff9500" }}>
            {avgPercentage}%
          </div>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginTop: "4px" }}>
            Klik untuk tampilkan semua
          </div>
        </div>
      </div>

      {/* 3. Filter Controls Bar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {/* Periode Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "#8e8e93", fontWeight: "500" }}>
              Periode:
            </span>
            <select
              value={periodFilter}
              onChange={(e) => handlePeriodChange(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "10px",
                border: "1px solid #e5e5ea",
                backgroundColor: "#f2f2f7",
                fontSize: "12.5px",
                fontWeight: "600",
                color: "#1c1c1e",
                outline: "none",
                cursor: "pointer",
                fontFamily: fontStack
              }}
            >
              <option value="Hari ini">Hari ini</option>
              <option value="7 Hari Terakhir">7 Hari Terakhir</option>
              <option value="1 Bulan Terakhir">1 Bulan Terakhir</option>
            </select>
          </div>

          {/* Filter Lantai */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "#8e8e93", fontWeight: "500" }}>
              Lantai:
            </span>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "10px",
                border: "1px solid #e5e5ea",
                backgroundColor: "#f2f2f7",
                fontSize: "12.5px",
                fontWeight: "600",
                color: "#1c1c1e",
                outline: "none",
                cursor: "pointer",
                fontFamily: fontStack
              }}
            >
              <option value="all">Semua Lantai (1 Gedung Penuh)</option>
              {availableFloors.length > 0 ? (
                availableFloors.map((fl) => (
                  <option key={fl} value={String(fl)}>
                    Lantai {fl}
                  </option>
                ))
              ) : (
                <>
                  <option value="1">Lantai 1</option>
                  <option value="2">Lantai 2</option>
                  <option value="3">Lantai 3</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Right: Search Box */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#f2f2f7",
            border: "1px solid #e5e5ea",
            borderRadius: "12px",
            padding: "8px 14px",
            width: "280px"
          }}
        >
          <Search size={16} color="#8e8e93" />
          <input
            type="text"
            placeholder="Cari kamar, NIM, mahasiswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              fontSize: "13px",
              outline: "none",
              color: "#1c1c1e",
              fontFamily: fontStack
            }}
          />
        </div>
      </div>

      {/* Banner Filter Aktif (Jika mengklik kartu Hadir, Izin, Sakit, Alpha) */}
      {activeStatusCard !== "semua" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor:
              activeStatusCard === "hadir"
                ? "rgba(52, 199, 89, 0.1)"
                : activeStatusCard === "izin"
                ? "rgba(0, 122, 255, 0.1)"
                : activeStatusCard === "sakit"
                ? "rgba(234, 179, 8, 0.1)"
                : "rgba(255, 59, 48, 0.1)",
            border: `1px solid ${
              activeStatusCard === "hadir"
                ? "#34c759"
                : activeStatusCard === "izin"
                ? "#007aff"
                : activeStatusCard === "sakit"
                ? "#eab308"
                : "#ff3b30"
            }`,
            padding: "12px 18px",
            borderRadius: "14px",
            fontSize: "13.5px",
            fontWeight: "600",
            color:
              activeStatusCard === "hadir"
                ? "#166534"
                : activeStatusCard === "izin"
                ? "#1e40af"
                : activeStatusCard === "sakit"
                ? "#854d0e"
                : "#991b1b"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={16} />
            <span>
              Menyaring mahasiswa dengan status: <strong>{activeStatusCard.toUpperCase()}</strong> ({filteredList.length} mahasiswa ditemukan)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveStatusCard("semua")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              color: "#374151",
              padding: "5px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            <X size={14} />
            Tampilkan Semua
          </button>
        </div>
      )}

      {/* 4. Main Attendance Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          overflow: "hidden"
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>
            Daftar Mahasiswa {gedungInfo.namaGedung}
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", marginLeft: "8px" }}>
              (Menampilkan {filteredList.length} mahasiswa)
            </span>
          </div>

          <div style={{ fontSize: "12px", color: "#64748b" }}>
            Filter Lantai: <strong>{selectedFloor === "all" ? "Seluruh Lantai (1 Gedung Penuh)" : `Lantai ${selectedFloor}`}</strong>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
            <thead>
              <tr style={{ backgroundColor: "#fafafc", borderBottom: "1px solid #e5e5ea", color: "#8e8e93", fontSize: "11.5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "16px 20px" }}>Kamar & Lantai</th>
                <th style={{ padding: "16px 20px" }}>Nama Mahasiswa</th>
                <th
                  onClick={() => handleCardClick("hadir")}
                  style={{
                    padding: "16px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: activeStatusCard === "hadir" ? "rgba(52, 199, 89, 0.08)" : "transparent",
                    color: activeStatusCard === "hadir" ? "#166534" : "#8e8e93"
                  }}
                  title="Klik untuk filter Hadir"
                >
                  Hadir {activeStatusCard === "hadir" ? "▼" : ""}
                </th>
                <th
                  onClick={() => handleCardClick("izin")}
                  style={{
                    padding: "16px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: activeStatusCard === "izin" ? "rgba(0, 122, 255, 0.08)" : "transparent",
                    color: activeStatusCard === "izin" ? "#1e40af" : "#8e8e93"
                  }}
                  title="Klik untuk filter Izin"
                >
                  Izin {activeStatusCard === "izin" ? "▼" : ""}
                </th>
                <th
                  onClick={() => handleCardClick("sakit")}
                  style={{
                    padding: "16px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: activeStatusCard === "sakit" ? "rgba(234, 179, 8, 0.08)" : "transparent",
                    color: activeStatusCard === "sakit" ? "#854d0e" : "#8e8e93"
                  }}
                  title="Klik untuk filter Sakit"
                >
                  Sakit {activeStatusCard === "sakit" ? "▼" : ""}
                </th>
                <th
                  onClick={() => handleCardClick("alpha")}
                  style={{
                    padding: "16px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: activeStatusCard === "alpha" ? "rgba(255, 59, 48, 0.08)" : "transparent",
                    color: activeStatusCard === "alpha" ? "#991b1b" : "#8e8e93"
                  }}
                  title="Klik untuk filter Alpha"
                >
                  Alpha {activeStatusCard === "alpha" ? "▼" : ""}
                </th>
                <th style={{ padding: "16px 20px", textAlign: "right" }}>Kepatuhan</th>
                <th style={{ padding: "16px 20px", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px 16px", color: "#8e8e93", fontSize: "13.5px" }}>
                    Memuat data rekapitulasi kehadiran...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px 16px", color: "#8e8e93", fontSize: "13.5px" }}>
                    Tidak ada data kehadiran mahasiswa yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((row, index) => {
                  return (
                    <tr
                      key={row.idUser || row.room || index}
                      style={{
                        borderBottom: index === filteredList.length - 1 ? "none" : "1px solid #f2f2f7",
                        transition: "background-color 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontWeight: "600", color: "#007aff", backgroundColor: "rgba(0, 122, 255, 0.08)", padding: "3px 8px", borderRadius: "6px", fontSize: "12px" }}>
                          {row.nomorKamar || row.room}
                        </span>
                        <div style={{ fontSize: "11px", color: "#8e8e93", marginTop: "2px" }}>
                          Lantai {row.lantai}
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: "600", color: "#1c1c1e" }}>{row.nama || row.name}</div>
                        <div style={{ fontSize: "12px", color: "#8e8e93", fontFamily: "monospace" }}>{row.nim}</div>
                      </td>

                      {/* Hadir */}
                      <td
                        style={{
                          padding: "14px 20px",
                          textAlign: "center",
                          fontWeight: "600",
                          color: "#34c759",
                          backgroundColor: activeStatusCard === "hadir" ? "rgba(52, 199, 89, 0.05)" : "transparent"
                        }}
                      >
                        {row.hadir || 0}
                      </td>

                      {/* Izin */}
                      <td
                        style={{
                          padding: "14px 20px",
                          textAlign: "center",
                          fontWeight: "600",
                          color: "#007aff",
                          backgroundColor: activeStatusCard === "izin" ? "rgba(0, 122, 255, 0.05)" : "transparent"
                        }}
                      >
                        {row.izin || 0}
                      </td>

                      {/* Sakit */}
                      <td
                        style={{
                          padding: "14px 20px",
                          textAlign: "center",
                          fontWeight: "600",
                          color: "#eab308",
                          backgroundColor: activeStatusCard === "sakit" ? "rgba(234, 179, 8, 0.05)" : "transparent"
                        }}
                      >
                        {row.sakit || 0}
                      </td>

                      {/* Alpha */}
                      <td
                        style={{
                          padding: "14px 20px",
                          textAlign: "center",
                          fontWeight: "600",
                          color: "#ff3b30",
                          backgroundColor: activeStatusCard === "alpha" ? "rgba(255, 59, 48, 0.05)" : "transparent"
                        }}
                      >
                        {row.alpha || 0}
                      </td>

                      {/* Compliance */}
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
                          <span style={{ fontWeight: "700", color: (row.percentage || 0) >= 80 ? "#34c759" : "#ff9500" }}>
                            {row.percentage || 0}%
                          </span>
                          <div style={{ width: "50px", height: "4px", backgroundColor: "#f2f2f7", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ width: `${row.percentage || 0}%`, height: "100%", backgroundColor: (row.percentage || 0) >= 80 ? "#34c759" : "#ff9500", borderRadius: "2px" }} />
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(row)}
                          style={{
                            backgroundColor: "#f2f2f7",
                            color: "#1c1c1e",
                            border: "1px solid #e5e5ea",
                            borderRadius: "8px",
                            padding: "5px 12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontFamily: fontStack
                          }}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
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
              maxWidth: "480px",
              padding: "26px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              border: "1px solid rgba(0, 0, 0, 0.05)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1c1c1e", margin: 0 }}>
                Detail Kehadiran Mahasiswa
              </h2>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                style={{ background: "none", border: "none", color: "#8e8e93", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: "#f2f2f7", padding: "14px 18px", borderRadius: "14px", marginBottom: "18px", border: "1px solid #e5e5ea" }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#1c1c1e" }}>
                {selectedStudent.nama || selectedStudent.name}
              </div>
              <div style={{ fontSize: "12.5px", color: "#8e8e93", marginTop: "2px" }}>
                NIM: {selectedStudent.nim} · Kamar: {selectedStudent.nomorKamar || selectedStudent.room} · Lt. {selectedStudent.lantai}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "20px" }}>
              <div style={{ backgroundColor: "#fafafc", padding: "10px 6px", borderRadius: "12px", border: "1px solid #e5e5ea", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#8e8e93", fontWeight: "700" }}>HADIR</div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#34c759", marginTop: "2px" }}>
                  {selectedStudent.hadir || 0}
                </div>
              </div>
              <div style={{ backgroundColor: "#fafafc", padding: "10px 6px", borderRadius: "12px", border: "1px solid #e5e5ea", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#8e8e93", fontWeight: "700" }}>IZIN</div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#007aff", marginTop: "2px" }}>
                  {selectedStudent.izin || 0}
                </div>
              </div>
              <div style={{ backgroundColor: "#fafafc", padding: "10px 6px", borderRadius: "12px", border: "1px solid #e5e5ea", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#8e8e93", fontWeight: "700" }}>SAKIT</div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#eab308", marginTop: "2px" }}>
                  {selectedStudent.sakit || 0}
                </div>
              </div>
              <div style={{ backgroundColor: "#fafafc", padding: "10px 6px", borderRadius: "12px", border: "1px solid #e5e5ea", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#8e8e93", fontWeight: "700" }}>ALPHA</div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#ff3b30", marginTop: "2px" }}>
                  {selectedStudent.alpha || 0}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Tingkat Kepatuhan:</span>
              <span style={{ fontSize: "15px", fontWeight: "700", color: (selectedStudent.percentage || 0) >= 80 ? "#34c759" : "#ff9500" }}>
                {selectedStudent.percentage || 0}%
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                style={{
                  padding: "9px 20px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  backgroundColor: "#007aff",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: fontStack
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

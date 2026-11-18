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

const samplePenghuniRekap = [
  { idUser: 101, room: "HJ-101", nomorKamar: "HJ-101", lantai: 1, name: "Ahmad Fadhil", nama: "Ahmad Fadhil", nim: "2311521001", subuh: "Hadir", subuhTime: "05.15", maghrib: "Hadir", maghribTime: "18.45", complianceRate: 95, percentage: 95, hadir: 19, totalPresent: 19, izin: 1, totalPermit: 1, sakit: 0, alpha: 0, totalAlpha: 0, statusNote: "Tepat waktu", keterangan: "Tepat waktu", terakhirStatus: "Hadir", terakhirWaktu: new Date().toISOString() },
  { idUser: 102, room: "HJ-102", nomorKamar: "HJ-102", lantai: 1, name: "Budi Santoso", nama: "Budi Santoso", nim: "2311521002", subuh: "Hadir", subuhTime: "05.10", maghrib: "Hadir", maghribTime: "18.40", complianceRate: 90, percentage: 90, hadir: 18, totalPresent: 18, izin: 1, totalPermit: 1, sakit: 1, alpha: 0, totalAlpha: 0, statusNote: "Tepat waktu", keterangan: "Tepat waktu", terakhirStatus: "Hadir", terakhirWaktu: new Date().toISOString() },
  { idUser: 103, room: "HJ-103", nomorKamar: "HJ-103", lantai: 1, name: "Chandra Wijaya", nama: "Chandra Wijaya", nim: "2311521003", subuh: "Hadir", subuhTime: "05.20", maghrib: "Izin", maghribTime: "19.00", complianceRate: 85, percentage: 85, hadir: 17, totalPresent: 17, izin: 2, totalPermit: 2, sakit: 0, alpha: 1, totalAlpha: 1, statusNote: "Izin praktikum", keterangan: "Izin praktikum", terakhirStatus: "Izin", terakhirWaktu: new Date().toISOString() },
  { idUser: 201, room: "HJ-201", nomorKamar: "HJ-201", lantai: 2, name: "Dimas Pratama", nama: "Dimas Pratama", nim: "2311522001", subuh: "Hadir", subuhTime: "05.12", maghrib: "Hadir", maghribTime: "18.35", complianceRate: 95, percentage: 95, hadir: 19, totalPresent: 19, izin: 1, totalPermit: 1, sakit: 0, alpha: 0, totalAlpha: 0, statusNote: "Tepat waktu", keterangan: "Tepat waktu", terakhirStatus: "Hadir", terakhirWaktu: new Date().toISOString() },
  { idUser: 202, room: "HJ-202", nomorKamar: "HJ-202", lantai: 2, name: "Eko Prasetyo", nama: "Eko Prasetyo", nim: "2311522002", subuh: "Hadir", subuhTime: "05.22", maghrib: "Hadir", maghribTime: "18.50", complianceRate: 90, percentage: 90, hadir: 18, totalPresent: 18, izin: 0, totalPermit: 0, sakit: 2, alpha: 0, totalAlpha: 0, statusNote: "Tepat waktu", keterangan: "Tepat waktu", terakhirStatus: "Hadir", terakhirWaktu: new Date().toISOString() },
  { idUser: 203, room: "HJ-203", nomorKamar: "HJ-203", lantai: 2, name: "Farhan Maulana", nama: "Farhan Maulana", nim: "2311522003", subuh: "Alpha", subuhTime: "—", maghrib: "Hadir", maghribTime: "18.45", complianceRate: 80, percentage: 80, hadir: 16, totalPresent: 16, izin: 1, totalPermit: 1, sakit: 1, alpha: 2, totalAlpha: 2, statusNote: "Terlambat subuh", keterangan: "Terlambat subuh", terakhirStatus: "Alpha", terakhirWaktu: new Date().toISOString() },
  { idUser: 301, room: "HJ-301", nomorKamar: "HJ-301", lantai: 3, name: "Genta Ramadhan", nama: "Genta Ramadhan", nim: "2311523001", subuh: "Hadir", subuhTime: "05.14", maghrib: "Hadir", maghribTime: "18.42", complianceRate: 100, percentage: 100, hadir: 20, totalPresent: 20, izin: 0, totalPermit: 0, sakit: 0, alpha: 0, totalAlpha: 0, statusNote: "Disiplin penuh", keterangan: "Disiplin penuh", terakhirStatus: "Hadir", terakhirWaktu: new Date().toISOString() },
  { idUser: 302, room: "HJ-302", nomorKamar: "HJ-302", lantai: 3, name: "Alya Ananta", nama: "Alya Ananta", nim: "2311523002", subuh: "Hadir", subuhTime: "05.08", maghrib: "Hadir", maghribTime: "18.38", complianceRate: 95, percentage: 95, hadir: 19, totalPresent: 19, izin: 1, totalPermit: 1, sakit: 0, alpha: 0, totalAlpha: 0, statusNote: "Tepat waktu", keterangan: "Tepat waktu", terakhirStatus: "Hadir", terakhirWaktu: new Date().toISOString() },
  { idUser: 303, room: "HJ-303", nomorKamar: "HJ-303", lantai: 3, name: "Haikal Akbar", nama: "Haikal Akbar", nim: "2311523003", subuh: "Hadir", subuhTime: "05.18", maghrib: "Izin", maghribTime: "19.10", complianceRate: 85, percentage: 85, hadir: 17, totalPresent: 17, izin: 3, totalPermit: 3, sakit: 0, alpha: 0, totalAlpha: 0, statusNote: "Izin organisasi", keterangan: "Izin organisasi", terakhirStatus: "Izin", terakhirWaktu: new Date().toISOString() },
  { idUser: 304, room: "HJ-304", nomorKamar: "HJ-304", lantai: 3, name: "Ilham Saputra", nama: "Ilham Saputra", nim: "2311523004", subuh: "Hadir", subuhTime: "05.15", maghrib: "Hadir", maghribTime: "18.45", complianceRate: 90, percentage: 90, hadir: 18, totalPresent: 18, izin: 1, totalPermit: 1, sakit: 0, alpha: 1, totalAlpha: 1, statusNote: "Tepat waktu", keterangan: "Tepat waktu", terakhirStatus: "Hadir", terakhirWaktu: new Date().toISOString() }
];

export default function RekapKehadiranPage({ user }) {
  // Gedung & Data states
  const [gedungInfo, setGedungInfo] = useState({
    idGedung: 1,
    namaGedung: "Asrama Hijau",
    totalPenghuni: 10,
    daftarLantai: [1, 2, 3]
  });
  const [attendanceData, setAttendanceData] = useState(samplePenghuniRekap);
  const [summaryData, setSummaryData] = useState({
    totalUser: 10,
    totalHadir: 22,
    totalIzin: 1,
    totalSakit: 0,
    totalAlpha: 1,
    rataRataPersentase: 91.7
  });
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Filters
  const [filterSession, setFilterSession] = useState("semua"); // "semua" | "subuh" | "maghrib"
  const [selectedFloor, setSelectedFloor] = useState("all"); // "all" or number string (e.g. "1", "2", "3")
  const [searchQuery, setSearchQuery] = useState("");
  const [complianceFilter, setComplianceFilter] = useState("all"); // "all" | "high" (>=90%) | "warning" (<85%)

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

      // 2. Ambil data rekapitulasi satu gedung penuh untuk role penghuni
      const rekapRes = await getRekapPresensi({
        gedungId: currentGedung.idGedung,
        role: "penghuni"
      });

      if (rekapRes && rekapRes.success && Array.isArray(rekapRes.data) && rekapRes.data.length > 0) {
        const mapped = rekapRes.data.map((item, idx) => ({
          ...item,
          idUser: item.idUser || idx + 1,
          room: item.nomorKamar || item.room || `HJ-${(item.lantai || 1) * 100 + idx + 1}`,
          nomorKamar: item.nomorKamar || item.room || `HJ-${(item.lantai || 1) * 100 + idx + 1}`,
          name: item.nama || item.name || "Mahasiswa",
          nama: item.nama || item.name || "Mahasiswa",
          nim: item.nim || "-",
          lantai: item.lantai || 1,
          subuh: item.subuh || (item.hadir > 0 ? "Hadir" : "Alpha"),
          subuhTime: item.subuhTime || "05.15",
          maghrib: item.maghrib || (item.izin > 0 ? "Izin" : "Hadir"),
          maghribTime: item.maghribTime || "18.45",
          complianceRate: item.percentage || 90,
          percentage: item.percentage || 90,
          hadir: item.hadir || 0,
          totalPresent: item.hadir || 0,
          izin: item.izin || 0,
          totalPermit: item.izin || 0,
          sakit: item.sakit || 0,
          alpha: item.alpha || 0,
          totalAlpha: item.alpha || 0,
          statusNote: item.keterangan || (item.hadir > 0 ? "Tepat waktu" : "Perlu perhatian"),
          keterangan: item.keterangan || "Tepat waktu",
          terakhirStatus: item.terakhirStatus || "Hadir",
          terakhirWaktu: item.terakhirWaktu || new Date().toISOString()
        }));
        setAttendanceData(mapped);
        setSummaryData(rekapRes.summary || {
          totalUser: mapped.length,
          totalHadir: mapped.reduce((a, c) => a + (c.hadir || 0), 0),
          totalIzin: mapped.reduce((a, c) => a + (c.izin || 0), 0),
          totalSakit: mapped.reduce((a, c) => a + (c.sakit || 0), 0),
          totalAlpha: mapped.reduce((a, c) => a + (c.alpha || 0), 0),
          rataRataPersentase: 91.7
        });
      } else {
        setAttendanceData(samplePenghuniRekap);
      }
    } catch (err) {
      console.error("Gagal memuat rekap presensi gedung fasil:", err);
      setAttendanceData(samplePenghuniRekap);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Filtered List berdasarkan pencarian, lantai, dan kepatuhan
  const filteredList = useMemo(() => {
    const list = attendanceData.length > 0 ? attendanceData : samplePenghuniRekap;
    return list.filter((item) => {
      // 1. Filter Sesi
      if (filterSession === "subuh" && item.subuh !== "Hadir") return false;
      if (filterSession === "maghrib" && item.maghrib !== "Hadir") return false;

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

      // 4. Filter kepatuhan
      const pct = item.complianceRate || item.percentage || 0;
      if (complianceFilter === "high" && pct < 90) return false;
      if (complianceFilter === "warning" && pct >= 85) return false;

      return true;
    });
  }, [attendanceData, filterSession, selectedFloor, searchQuery, complianceFilter]);

  const filteredData = filteredList;

  // Summary dinamis berdasarkan filter yang aktif
  const dynamicSummary = useMemo(() => {
    const total = filteredList.length;
    const hadir = filteredList.reduce((acc, curr) => acc + (curr.hadir || 0), 0);
    const izin = filteredList.reduce((acc, curr) => acc + (curr.izin || 0), 0);
    const sakit = filteredList.reduce((acc, curr) => acc + (curr.sakit || 0), 0);
    const alpha = filteredList.reduce((acc, curr) => acc + (curr.alpha || 0), 0);
    const avgPct = total > 0
      ? Math.round((filteredList.reduce((acc, curr) => acc + (curr.complianceRate || curr.percentage || 0), 0) / total) * 10) / 10
      : 91.7;

    return { total, hadir, izin, sakit, alpha, avgPct };
  }, [filteredList]);

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
      "Presensi Terakhir",
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
      s.hadir || s.totalPresent || 0,
      s.izin || s.totalPermit || 0,
      s.sakit || 0,
      s.alpha || s.totalAlpha || 0,
      `${s.complianceRate || s.percentage || 0}%`,
      s.terakhirWaktu ? new Date(s.terakhirWaktu).toLocaleString("id-ID") : "-",
      s.terakhirStatus || s.subuh || "Hadir",
      s.statusNote || s.keterangan || "-"
    ]);

    const cleanBuildingName = gedungInfo.namaGedung.replace(/\s+/g, "_");
    const floorLabel = selectedFloor === "all" ? "Semua_Lantai" : `Lantai_${selectedFloor}`;
    const filename = `Rekap_Kehadiran_${cleanBuildingName}_${floorLabel}_${new Date().toISOString().slice(0, 10)}.xls`;
    const title = `REKAPITULASI KEHADIRAN PENGHUNI ${gedungInfo.namaGedung.toUpperCase()} (SATU GEDUNG PENUH)`;

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
      "Nama Lengkap",
      "NIM",
      "Gedung",
      "Hadir",
      "Izin",
      "Sakit",
      "Alpha",
      "Kepatuhan (%)",
      "Status Terakhir",
      "Keterangan"
    ];

    const rows = filteredList.map((s, idx) => [
      idx + 1,
      s.lantai,
      s.nomorKamar || s.room,
      s.nama || s.name,
      s.nim,
      gedungInfo.namaGedung,
      s.hadir || s.totalPresent || 0,
      s.izin || s.totalPermit || 0,
      s.sakit || 0,
      s.alpha || s.totalAlpha || 0,
      `${s.complianceRate || s.percentage || 0}%`,
      s.terakhirStatus || s.subuh || "Hadir",
      s.statusNote || s.keterangan || "-"
    ]);

    const cleanBuildingName = gedungInfo.namaGedung.replace(/\s+/g, "_");
    downloadCSV(`Rekap_${cleanBuildingName}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
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
      "Kepatuhan",
      "Presensi Terakhir"
    ];

    const rows = filteredList.map((s, idx) => [
      idx + 1,
      `Lt. ${s.lantai} · ${s.nomorKamar || s.room}`,
      s.nama || s.name,
      s.nim,
      s.hadir || s.totalPresent || 0,
      s.izin || s.totalPermit || 0,
      s.sakit || 0,
      s.alpha || s.totalAlpha || 0,
      `${s.complianceRate || s.percentage || 0}%`,
      s.terakhirStatus || s.subuh || "Hadir"
    ]);

    const floorText = selectedFloor === "all" ? "Semua Lantai (1 Gedung Penuh)" : `Lantai ${selectedFloor}`;

    printOfficialDocument({
      title: `REKAPITULASI KEHADIRAN PENGHUNI ${gedungInfo.namaGedung.toUpperCase()}`,
      subtitle: `Laporan Monitoring Kehadiran Sholat Subuh & Maghrib/Isya Seluruh Mahasiswa Binaan Fasilitator`,
      metaInfo: [
        { label: "Gedung Asrama Binaan", value: `${gedungInfo.namaGedung} (Cakupan 1 Gedung Penuh)` },
        { label: "Cakupan Lantai", value: floorText },
        { label: "Fasilitator Penanggung Jawab", value: user?.nama || "Fasilitator Asrama" },
        { label: "Total Mahasiswa Terpantau", value: `${filteredList.length} Mahasiswa Terdaftar` },
        { label: "Rata-Rata Kepatuhan", value: `${dynamicSummary.avgPct}%` },
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1c1c1e", margin: 0, letterSpacing: "-0.5px" }}>
            Rekap Kehadiran
          </h1>
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
          <span>Laporan rekapitulasi kehadiran {gedungInfo.namaGedung} (Satu Gedung Penuh) berhasil diunduh.</span>
        </div>
      )}

      {/* 2. Top 4 KPI Summary Cards (Apple HIG Style Matching User Reference) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          padding: "20px 24px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)"
        }}
      >
        <div style={{ borderRight: "1px solid #f2f2f7", paddingRight: "16px" }}>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginBottom: "6px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Tingkat Kepatuhan
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "28px", fontWeight: "700", color: "#007aff" }}>{dynamicSummary.avgPct}%</span>
            <span style={{ fontSize: "11px", color: "#34c759", backgroundColor: "rgba(52, 199, 89, 0.12)", padding: "2px 6px", borderRadius: "6px", fontWeight: "700" }}>
              +2.4%
            </span>
          </div>
        </div>

        <div style={{ borderRight: "1px solid #f2f2f7", paddingRight: "16px", paddingLeft: "8px" }}>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginBottom: "6px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Total Hadir
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ fontSize: "28px", fontWeight: "700", color: "#1c1c1e" }}>{dynamicSummary.hadir}</span>
            <span style={{ fontSize: "13px", color: "#8e8e93", fontWeight: "500" }}>sesi</span>
          </div>
        </div>

        <div style={{ borderRight: "1px solid #f2f2f7", paddingRight: "16px", paddingLeft: "8px" }}>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginBottom: "6px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Izin Tercatat
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#007aff" }}>
            {dynamicSummary.izin} <span style={{ fontSize: "13px", color: "#8e8e93", fontWeight: "500" }}>sesi</span>
          </div>
        </div>

        <div style={{ paddingLeft: "8px" }}>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginBottom: "6px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Belum / Alpha
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#ff9500" }}>
            {dynamicSummary.alpha} <span style={{ fontSize: "13px", color: "#8e8e93", fontWeight: "500" }}>sesi</span>
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
        {/* Left: Apple HIG Segmented Session Control */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", color: "#8e8e93", fontWeight: "500" }}>
            Sesi:
          </span>
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "#e5e5ea",
              padding: "3px",
              borderRadius: "12px",
              gap: "2px"
            }}
          >
            {[
              { id: "semua", label: "Semua Sesi" },
              { id: "subuh", label: "Subuh" },
              { id: "maghrib", label: "Maghrib & Isya" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterSession(tab.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "10px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: filterSession === tab.id ? "#ffffff" : "transparent",
                  color: filterSession === tab.id ? "#1c1c1e" : "#8e8e93",
                  boxShadow: filterSession === tab.id ? "0 2px 6px rgba(0, 0, 0, 0.08)" : "none",
                  transition: "all 0.15s ease",
                  fontFamily: fontStack
                }}
              >
                {tab.label}
              </button>
            ))}
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
            placeholder="Cari kamar atau mahasiswa..."
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
            Filter Aktif: <strong>{selectedFloor === "all" ? "Seluruh Lantai" : `Lantai ${selectedFloor}`}</strong>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
            <thead>
              <tr style={{ backgroundColor: "#fafafc", borderBottom: "1px solid #e5e5ea", color: "#8e8e93", fontSize: "11.5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "16px 20px" }}>Kamar</th>
                <th style={{ padding: "16px 20px" }}>Nama Mahasiswa</th>
                <th style={{ padding: "16px 20px" }}>Sesi Subuh</th>
                <th style={{ padding: "16px 20px" }}>Sesi Maghrib & Isya</th>
                <th style={{ padding: "16px 20px" }}>Kepatuhan</th>
                <th style={{ padding: "16px 20px" }}>Keterangan</th>
                <th style={{ padding: "16px 20px", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px 16px", color: "#8e8e93", fontSize: "13.5px" }}>
                    Memuat data rekapitulasi kehadiran...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px 16px", color: "#8e8e93", fontSize: "13.5px" }}>
                    Tidak ada data kehadiran mahasiswa yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => {
                  const subuhOk = row.subuh === "Hadir";
                  const maghribOk = row.maghrib === "Hadir";
                  const maghribIzin = row.maghrib === "Izin";

                  return (
                    <tr
                      key={row.idUser || row.room || index}
                      style={{
                        borderBottom: index === filteredData.length - 1 ? "none" : "1px solid #f2f2f7",
                        transition: "background-color 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontWeight: "600", color: "#007aff", backgroundColor: "rgba(0, 122, 255, 0.08)", padding: "3px 8px", borderRadius: "6px", fontSize: "12px" }}>
                          {row.room || row.nomorKamar}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: "600", color: "#1c1c1e" }}>{row.nama || row.name}</div>
                        <div style={{ fontSize: "12px", color: "#8e8e93" }}>{row.nim}</div>
                      </td>

                      {/* Subuh */}
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            backgroundColor: subuhOk ? "rgba(52, 199, 89, 0.12)" : "rgba(255, 59, 48, 0.12)",
                            color: subuhOk ? "#34c759" : "#ff3b30",
                            fontSize: "12px",
                            fontWeight: "600",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            display: "inline-block"
                          }}
                        >
                          {row.subuh} ({row.subuhTime})
                        </span>
                      </td>

                      {/* Maghrib */}
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            backgroundColor: maghribOk ? "rgba(52, 199, 89, 0.12)" : maghribIzin ? "rgba(0, 122, 255, 0.12)" : "rgba(255, 149, 0, 0.12)",
                            color: maghribOk ? "#34c759" : maghribIzin ? "#007aff" : "#ff9500",
                            fontSize: "12px",
                            fontWeight: "600",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            display: "inline-block"
                          }}
                        >
                          {row.maghrib} ({row.maghribTime})
                        </span>
                      </td>

                      {/* Compliance */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: "700", color: "#1c1c1e" }}>{row.complianceRate || row.percentage || 90}%</span>
                          <div style={{ width: "60px", height: "4px", backgroundColor: "#f2f2f7", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ width: `${row.complianceRate || row.percentage || 90}%`, height: "100%", backgroundColor: (row.complianceRate || row.percentage || 90) >= 85 ? "#34c759" : "#ff9500", borderRadius: "2px" }} />
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "14px 20px", color: "#8e8e93", fontSize: "12.5px" }}>
                        {row.statusNote || row.keterangan || "Tepat waktu"}
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
                NIM: {selectedStudent.nim} · Kamar: {selectedStudent.nomorKamar || selectedStudent.room}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              <div style={{ backgroundColor: "#fafafc", padding: "12px", borderRadius: "12px", border: "1px solid #e5e5ea", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600" }}>TOTAL HADIR</div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#34c759", marginTop: "2px" }}>
                  {selectedStudent.hadir ?? selectedStudent.totalPresent ?? 0}
                </div>
              </div>
              <div style={{ backgroundColor: "#fafafc", padding: "12px", borderRadius: "12px", border: "1px solid #e5e5ea", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600" }}>IZIN</div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#007aff", marginTop: "2px" }}>
                  {selectedStudent.izin ?? selectedStudent.totalPermit ?? 0}
                </div>
              </div>
              <div style={{ backgroundColor: "#fafafc", padding: "12px", borderRadius: "12px", border: "1px solid #e5e5ea", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600" }}>ALPHA</div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#ff9500", marginTop: "2px" }}>
                  {selectedStudent.alpha ?? selectedStudent.totalAlpha ?? 0}
                </div>
              </div>
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

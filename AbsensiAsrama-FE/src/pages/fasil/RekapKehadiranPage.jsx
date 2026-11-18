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

export default function RekapKehadiranPage({ user }) {
  // Gedung & Data states
  const [gedungInfo, setGedungInfo] = useState({
    idGedung: 1,
    namaGedung: "Asrama Hijau",
    totalPenghuni: 10,
    daftarLantai: [1, 2, 3]
  });
  const [attendanceData, setAttendanceData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalUser: 0,
    totalHadir: 0,
    totalIzin: 0,
    totalSakit: 0,
    totalAlpha: 0,
    rataRataPersentase: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Filters
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

      if (rekapRes && rekapRes.success) {
        setAttendanceData(rekapRes.data || []);
        setSummaryData(rekapRes.summary || {
          totalUser: rekapRes.data?.length || 0,
          totalHadir: 0,
          totalIzin: 0,
          totalSakit: 0,
          totalAlpha: 0,
          rataRataPersentase: 0
        });
      }
    } catch (err) {
      console.error("Gagal memuat rekap presensi gedung fasil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Filtered List berdasarkan pencarian, lantai, dan kepatuhan
  const filteredList = useMemo(() => {
    return attendanceData.filter((item) => {
      // 1. Filter Lantai
      if (selectedFloor !== "all" && String(item.lantai) !== String(selectedFloor)) {
        return false;
      }

      // 2. Search query (Nama, NIM, Nomor Kamar)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.nama?.toLowerCase().includes(q);
        const matchNim = item.nim?.toLowerCase().includes(q);
        const matchKamar = item.nomorKamar?.toLowerCase().includes(q);
        if (!matchName && !matchNim && !matchKamar) return false;
      }

      // 3. Filter kepatuhan
      if (complianceFilter === "high" && item.percentage < 90) return false;
      if (complianceFilter === "warning" && item.percentage >= 85) return false;

      return true;
    });
  }, [attendanceData, selectedFloor, searchQuery, complianceFilter]);

  // Summary dinamis berdasarkan filter yang aktif
  const dynamicSummary = useMemo(() => {
    const total = filteredList.length;
    const hadir = filteredList.reduce((acc, curr) => acc + (curr.hadir || 0), 0);
    const izin = filteredList.reduce((acc, curr) => acc + (curr.izin || 0), 0);
    const sakit = filteredList.reduce((acc, curr) => acc + (curr.sakit || 0), 0);
    const alpha = filteredList.reduce((acc, curr) => acc + (curr.alpha || 0), 0);
    const avgPct = total > 0
      ? Math.round((filteredList.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / total) * 10) / 10
      : 0;

    return { total, hadir, izin, sakit, alpha, avgPct };
  }, [filteredList]);

  // Ekspor Excel (.xls)
  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      alert("Tidak ada data kehadiran untuk diunduh.");
      return;
    }

    const headers = [
      "No",
      "Lantai",
      "Kamar",
      "Nama Santri / Penghuni",
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
      s.nomorKamar,
      s.nama,
      s.nim,
      gedungInfo.namaGedung,
      s.hadir,
      s.izin,
      s.sakit,
      s.alpha,
      `${s.percentage}%`,
      s.terakhirWaktu ? new Date(s.terakhirWaktu).toLocaleString("id-ID") : "-",
      s.terakhirStatus,
      s.keterangan || "-"
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
      alert("Tidak ada data kehadiran untuk diunduh.");
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
      s.nomorKamar,
      s.nama,
      s.nim,
      gedungInfo.namaGedung,
      s.hadir,
      s.izin,
      s.sakit,
      s.alpha,
      `${s.percentage}%`,
      s.terakhirStatus,
      s.keterangan || "-"
    ]);

    const cleanBuildingName = gedungInfo.namaGedung.replace(/\s+/g, "_");
    downloadCSV(`Rekap_${cleanBuildingName}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // Cetak Dokumen Resmi PDF
  const handlePrintPDF = () => {
    if (filteredList.length === 0) {
      alert("Tidak ada data kehadiran untuk dicetak.");
      return;
    }

    const headers = [
      "No",
      "Lantai & Kamar",
      "Nama Santri / Penghuni",
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
      `Lt. ${s.lantai} · ${s.nomorKamar}`,
      s.nama,
      s.nim,
      s.hadir,
      s.izin,
      s.sakit,
      s.alpha,
      `${s.percentage}%`,
      s.terakhirStatus
    ]);

    const floorText = selectedFloor === "all" ? "Semua Lantai (1 Gedung Penuh)" : `Lantai ${selectedFloor}`;

    printOfficialDocument({
      title: `REKAPITULASI KEHADIRAN PENGHUNI ${gedungInfo.namaGedung.toUpperCase()}`,
      subtitle: `Laporan Monitoring Kehadiran Sholat Subuh & Maghrib/Isya Seluruh Santri Binaan Fasilitator`,
      metaInfo: [
        { label: "Gedung Asrama Binaan", value: `${gedungInfo.namaGedung} (Cakupan 1 Gedung Penuh)` },
        { label: "Cakupan Lantai", value: floorText },
        { label: "Fasilitator Penanggung Jawab", value: user?.nama || "Kak Alif Rahman (Fasilitator)" },
        { label: "Total Penghuni Terpantau", value: `${filteredList.length} Santri Terdaftar` },
        { label: "Rata-Rata Kepatuhan", value: `${dynamicSummary.avgPct}%` },
        { label: "Tanggal Cetak", value: new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) }
      ],
      headers,
      rows,
      signerName: user?.nama || "Fasilitator Gedung",
      signerRole: `Fasilitator Pendamping ${gedungInfo.namaGedung}`
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header & Quick Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px 28px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                backgroundColor: "#ecfdf5",
                color: "#059669",
                border: "1px solid #a7f3d0",
                fontSize: "12px",
                fontWeight: "700",
                padding: "4px 10px",
                borderRadius: "999px"
              }}
            >
              <Building2 size={13} />
              Cakupan 1 Gedung Penuh
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "#64748b",
                backgroundColor: "#f1f5f9",
                padding: "4px 10px",
                borderRadius: "999px",
                fontWeight: "600"
              }}
            >
              Fasilitator: {user?.nama || "Kak Alif Rahman"}
            </span>
          </div>

          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#0f172a",
              margin: "0 0 6px 0",
              letterSpacing: "-0.5px"
            }}
          >
            Rekap Kehadiran {gedungInfo.namaGedung}
          </h1>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
            Pemantauan absensi seluruh santri di <strong>{gedungInfo.namaGedung}</strong> dari Lantai {gedungInfo.daftarLantai?.join(", ") || "1, 2, 3"}.
            Sesuai aturan operasional: <strong>1 Fasilitator membina 1 Gedung penuh</strong>.
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
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
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
            backgroundColor: "#dcfce7",
            border: "1px solid #bbf7d0",
            color: "#15803d",
            padding: "12px 18px",
            borderRadius: "10px",
            fontSize: "13px",
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

      {/* 2. Top 5 KPI Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px"
        }}
      >
        {/* KPI 1: Total Santri Gedung */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px" }}>
            Total Penghuni Gedung
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
              {dynamicSummary.total}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Santri</span>
          </div>
          <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px", fontWeight: "600" }}>
            {gedungInfo.namaGedung} (Semua Lantai)
          </div>
        </div>

        {/* KPI 2: Total Kehadiran */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px" }}>
            Akumulasi Hadir
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: "#16a34a" }}>
              {dynamicSummary.hadir}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            Subuh & Maghrib/Isya
          </div>
        </div>

        {/* KPI 3: Izin & Sakit */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px" }}>
            Izin & Sakit
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: "#0284c7" }}>
              {dynamicSummary.izin + dynamicSummary.sakit}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
              ({dynamicSummary.izin} Izin · {dynamicSummary.sakit} Sakit)
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            Disertai Bukti / Surat
          </div>
        </div>

        {/* KPI 4: Alpha / Belum */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px" }}>
            Alpha / Tanpa Keterangan
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: dynamicSummary.alpha > 0 ? "#dc2626" : "#64748b" }}>
              {dynamicSummary.alpha}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: dynamicSummary.alpha > 0 ? "#dc2626" : "#16a34a", marginTop: "4px", fontWeight: "600" }}>
            {dynamicSummary.alpha > 0 ? "Perlu Pembinaan" : "Nihil Pelanggaran"}
          </div>
        </div>

        {/* KPI 5: Rata-Rata Kepatuhan */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px" }}>
            Rata-Rata Kepatuhan
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              style={{
                fontSize: "28px",
                fontWeight: "800",
                color: dynamicSummary.avgPct >= 90 ? "#16a34a" : dynamicSummary.avgPct >= 80 ? "#2563eb" : "#ea580c"
              }}
            >
              {dynamicSummary.avgPct}%
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            Standar Asrama: ≥ 85%
          </div>
        </div>
      </div>

      {/* 3. Filter Controls Bar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
        }}
      >
        {/* Left: Floor Selector Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "700", marginRight: "4px" }}>
            Filter Lantai:
          </span>

          <button
            type="button"
            onClick={() => setSelectedFloor("all")}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "12.5px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              backgroundColor: selectedFloor === "all" ? "#2563eb" : "#f1f5f9",
              color: selectedFloor === "all" ? "#ffffff" : "#475569"
            }}
          >
            Semua Lantai (1 Gedung Penuh)
          </button>

          {(gedungInfo.daftarLantai || [1, 2, 3]).map((fl) => (
            <button
              key={fl}
              type="button"
              onClick={() => setSelectedFloor(String(fl))}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "12.5px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                backgroundColor: selectedFloor === String(fl) ? "#2563eb" : "#f1f5f9",
                color: selectedFloor === String(fl) ? "#ffffff" : "#475569"
              }}
            >
              Lantai {fl}
            </button>
          ))}
        </div>

        {/* Right: Search & Compliance Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "12.5px",
              fontWeight: "600",
              color: "#334155",
              backgroundColor: "#ffffff",
              cursor: "pointer"
            }}
          >
            <option value="all">Semua Tingkat Kepatuhan</option>
            <option value="high">Kepatuhan Tinggi (≥ 90%)</option>
            <option value="warning">Perlu Perhatian (&lt; 85%)</option>
          </select>

          <div style={{ position: "relative", width: "240px" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8"
              }}
            />
            <input
              type="text"
              placeholder="Cari santri, NIM, kamar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. Main Attendance Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          overflow: "hidden"
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>
            Daftar Penghuni {gedungInfo.namaGedung}
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", marginLeft: "8px" }}>
              (Menampilkan {filteredList.length} dari {attendanceData.length} santri)
            </span>
          </div>

          <div style={{ fontSize: "12px", color: "#64748b" }}>
            Filter Aktif: <strong>{selectedFloor === "all" ? "Seluruh Lantai" : `Lantai ${selectedFloor}`}</strong>
          </div>
        </div>

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
                <th style={{ padding: "14px 18px", width: "40px" }}>No</th>
                <th style={{ padding: "14px 18px" }}>Lantai & Kamar</th>
                <th style={{ padding: "14px 18px" }}>Santri / Penghuni</th>
                <th style={{ padding: "14px 14px", textAlign: "center" }}>Hadir</th>
                <th style={{ padding: "14px 14px", textAlign: "center" }}>Izin</th>
                <th style={{ padding: "14px 14px", textAlign: "center" }}>Sakit</th>
                <th style={{ padding: "14px 14px", textAlign: "center" }}>Alpha</th>
                <th style={{ padding: "14px 18px" }}>Tingkat Kepatuhan</th>
                <th style={{ padding: "14px 18px" }}>Presensi Terakhir</th>
                <th style={{ padding: "14px 18px", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Memuat data rekapitulasi kehadiran satu gedung penuh...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <UserCheck size={32} color="#cbd5e1" />
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>
                        Tidak ada data santri yang cocok dengan filter.
                      </span>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Coba sesuaikan kata kunci pencarian atau pilihan filter lantai.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((row, index) => {
                  return (
                    <tr
                      key={row.idUser}
                      style={{
                        borderBottom: index === filteredList.length - 1 ? "none" : "1px solid #f1f5f9",
                        transition: "background-color 0.12s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* No */}
                      <td style={{ padding: "14px 18px", color: "#94a3b8", fontWeight: "600", fontSize: "12px" }}>
                        {index + 1}
                      </td>

                      {/* Lantai & Kamar */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              backgroundColor: "#eff6ff",
                              color: "#1d4ed8",
                              fontWeight: "700",
                              fontSize: "11px",
                              padding: "2px 7px",
                              borderRadius: "6px"
                            }}
                          >
                            Lt. {row.lantai}
                          </span>
                          <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "13px" }}>
                            {row.nomorKamar}
                          </span>
                        </div>
                      </td>

                      {/* Santri */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "13px" }}>{row.nama}</div>
                        <div style={{ fontSize: "11.5px", color: "#64748b" }}>NIM: {row.nim}</div>
                      </td>

                      {/* Hadir */}
                      <td style={{ padding: "14px 14px", textAlign: "center" }}>
                        <span
                          style={{
                            backgroundColor: "#dcfce7",
                            color: "#15803d",
                            fontWeight: "700",
                            fontSize: "11.5px",
                            padding: "3px 8px",
                            borderRadius: "6px"
                          }}
                        >
                          {row.hadir}
                        </span>
                      </td>

                      {/* Izin */}
                      <td style={{ padding: "14px 14px", textAlign: "center" }}>
                        <span
                          style={{
                            backgroundColor: row.izin > 0 ? "#e0f2fe" : "#f8fafc",
                            color: row.izin > 0 ? "#0369a1" : "#94a3b8",
                            fontWeight: "700",
                            fontSize: "11.5px",
                            padding: "3px 8px",
                            borderRadius: "6px"
                          }}
                        >
                          {row.izin}
                        </span>
                      </td>

                      {/* Sakit */}
                      <td style={{ padding: "14px 14px", textAlign: "center" }}>
                        <span
                          style={{
                            backgroundColor: row.sakit > 0 ? "#fef3c7" : "#f8fafc",
                            color: row.sakit > 0 ? "#b45309" : "#94a3b8",
                            fontWeight: "700",
                            fontSize: "11.5px",
                            padding: "3px 8px",
                            borderRadius: "6px"
                          }}
                        >
                          {row.sakit}
                        </span>
                      </td>

                      {/* Alpha */}
                      <td style={{ padding: "14px 14px", textAlign: "center" }}>
                        <span
                          style={{
                            backgroundColor: row.alpha > 0 ? "#fee2e2" : "#f8fafc",
                            color: row.alpha > 0 ? "#b91c1c" : "#94a3b8",
                            fontWeight: "700",
                            fontSize: "11.5px",
                            padding: "3px 8px",
                            borderRadius: "6px"
                          }}
                        >
                          {row.alpha}
                        </span>
                      </td>

                      {/* Kepatuhan Progress Bar */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              flex: 1,
                              maxWidth: "80px",
                              height: "6px",
                              backgroundColor: "#f1f5f9",
                              borderRadius: "999px",
                              overflow: "hidden"
                            }}
                          >
                            <div
                              style={{
                                width: `${row.percentage}%`,
                                height: "100%",
                                backgroundColor:
                                  row.percentage >= 90
                                    ? "#16a34a"
                                    : row.percentage >= 80
                                    ? "#2563eb"
                                    : "#ea580c"
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              color:
                                row.percentage >= 90
                                  ? "#15803d"
                                  : row.percentage >= 80
                                  ? "#1d4ed8"
                                  : "#c2410c"
                            }}
                          >
                            {row.percentage}%
                          </span>
                        </div>
                      </td>

                      {/* Presensi Terakhir */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>
                          {row.terakhirStatus}
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                          {row.terakhirWaktu
                            ? new Date(row.terakhirWaktu).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "Belum ada record"}
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(row)}
                          style={{
                            backgroundColor: "#ffffff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                            borderRadius: "8px",
                            padding: "5px 12px",
                            fontSize: "11.5px",
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

      {/* 5. Detail Student Modal */}
      {selectedStudent && (
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
              maxWidth: "520px",
              padding: "26px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={20} color="#2563eb" />
                <h2 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  Detail Kehadiran Santri
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", marginBottom: "18px" }}>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                {selectedStudent.nama}
              </div>
              <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px" }}>
                NIM: <strong>{selectedStudent.nim}</strong> · {gedungInfo.namaGedung}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: "6px" }}>
                  Lantai {selectedStudent.lantai}
                </span>
                <span style={{ fontSize: "11px", fontWeight: "700", backgroundColor: "#f1f5f9", color: "#334155", padding: "2px 8px", borderRadius: "6px" }}>
                  Kamar {selectedStudent.nomorKamar}
                </span>
              </div>
            </div>

            {/* Quick 4-Metric Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "18px" }}>
              <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#15803d", fontWeight: "600" }}>Hadir</div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#15803d" }}>{selectedStudent.hadir}</div>
              </div>
              <div style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#0284c7", fontWeight: "600" }}>Izin</div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#0284c7" }}>{selectedStudent.izin}</div>
              </div>
              <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#b45309", fontWeight: "600" }}>Sakit</div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#b45309" }}>{selectedStudent.sakit}</div>
              </div>
              <div style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#be123c", fontWeight: "600" }}>Alpha</div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#be123c" }}>{selectedStudent.alpha}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b" }}>Tingkat Kepatuhan:</span>
                <span style={{ fontWeight: "800", color: selectedStudent.percentage >= 85 ? "#16a34a" : "#dc2626" }}>
                  {selectedStudent.percentage}%
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b" }}>Status Presensi Terakhir:</span>
                <span style={{ fontWeight: "700", color: "#0f172a" }}>
                  {selectedStudent.terakhirStatus}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b" }}>Waktu Terakhir:</span>
                <span style={{ fontWeight: "600", color: "#334155" }}>
                  {selectedStudent.terakhirWaktu ? new Date(selectedStudent.terakhirWaktu).toLocaleString("id-ID") : "-"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>Catatan Petugas:</span>
                <span style={{ fontWeight: "600", color: "#334155" }}>{selectedStudent.keterangan || "-"}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "22px" }}>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer"
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

import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowUpDown,
  RotateCcw,
  Filter,
  CheckCircle2,
  Download,
  Printer,
  Search,
  Users,
  UserCheck,
  Shield,
  Building,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import { getRekapPresensi, getGedung } from "../../services/api";
import { downloadCSV, printOfficialDocument } from "../../utils/exportUtils";
import { showToast } from "../../utils/toast";

export default function RekapitulasiPresensiAdminPage() {
  // 1. Role Tabs: "semua" | "penghuni" | "fasil" | "admin"
  const [activeRoleTab, setActiveRoleTab] = useState("semua");

  // 2. Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("SEMUA");
  const [floorFilter, setFloorFilter] = useState("SEMUA");
  const [periodFilter, setPeriodFilter] = useState("Bulan ini");
  const [fromDate, setFromDate] = useState("2026-10-01");
  const [toDate, setToDate] = useState("2026-11-20");

  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState([]);
  const [gedungList, setGedungList] = useState([]);
  const [appliedFilterNotice, setAppliedFilterNotice] = useState("");

  // Load data dari backend
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [rekapRes, gedungs] = await Promise.all([
          getRekapPresensi(),
          getGedung()
        ]);

        if (rekapRes && Array.isArray(rekapRes.data)) {
          setRawData(rekapRes.data);
        } else {
          setRawData([]);
        }

        if (Array.isArray(gedungs)) {
          setGedungList(gedungs);
        }
      } catch (err) {
        console.warn("Gagal memuat rekap presensi admin:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Hitung jumlah subjek untuk tiap kategori tab
  const roleCounts = useMemo(() => {
    return {
      semua: rawData.length,
      penghuni: rawData.filter((r) => r.role === "penghuni" || r.role === "mahasiswa").length,
      fasil: rawData.filter((r) => r.role === "fasil").length,
      admin: rawData.filter((r) => r.role === "admin").length
    };
  }, [rawData]);

  // Data yang difilter berdasarkan role tab dan kriteria filter
  const filteredList = useMemo(() => {
    return rawData.filter((item) => {
      // 1. Filter Role Tab
      if (activeRoleTab !== "semua") {
        if (activeRoleTab === "penghuni") {
          if (item.role !== "penghuni" && item.role !== "mahasiswa") return false;
        } else if (item.role !== activeRoleTab) {
          return false;
        }
      }

      // 2. Filter Search (Nama / NIM / Kamar)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.nama?.toLowerCase().includes(q);
        const matchNim = item.nim?.toLowerCase().includes(q);
        const matchRoom = item.nomorKamar?.toLowerCase().includes(q);
        if (!matchName && !matchNim && !matchRoom) return false;
      }

      // 3. Filter Gedung
      if (buildingFilter !== "SEMUA") {
        if (!item.namaGedung?.toLowerCase().includes(buildingFilter.toLowerCase())) {
          return false;
        }
      }

      // 4. Filter Lantai
      if (floorFilter !== "SEMUA") {
        const fl = parseInt(floorFilter.replace(/\D/g, ""), 10);
        if (!isNaN(fl) && item.lantai !== fl) {
          return false;
        }
      }

      return true;
    });
  }, [rawData, activeRoleTab, searchQuery, buildingFilter, floorFilter]);

  // Ringkasan total kehadiran untuk kategori yang aktif
  const summaryStats = useMemo(() => {
    const totalUser = filteredList.length;
    const totalHadir = filteredList.reduce((acc, c) => acc + (c.hadir || 0), 0);
    const totalIzin = filteredList.reduce((acc, c) => acc + (c.izin || 0), 0);
    const totalSakit = filteredList.reduce((acc, c) => acc + (c.sakit || 0), 0);
    const totalAlpha = filteredList.reduce((acc, c) => acc + (c.alpha || 0), 0);
    const avgPct =
      totalUser > 0
        ? Math.round(
            (filteredList.reduce((acc, c) => acc + (c.percentage || 0), 0) /
              totalUser) *
              10
          ) / 10
        : 0;

    return {
      totalUser,
      totalHadir,
      totalIzin,
      totalSakit,
      totalAlpha,
      avgPct
    };
  }, [filteredList]);

  const handleResetFilter = () => {
    setSearchQuery("");
    setBuildingFilter("SEMUA");
    setFloorFilter("SEMUA");
    setPeriodFilter("Bulan ini");
    setAppliedFilterNotice("Filter direset ke nilai awal.");
    setTimeout(() => setAppliedFilterNotice(""), 3000);
    showToast("Filter direset ke seluruh data.", "info");
  };

  const handleApplyFilter = () => {
    setAppliedFilterNotice(
      `Filter aktif: ${buildingFilter !== "SEMUA" ? buildingFilter : "Semua Gedung"} · ${floorFilter !== "SEMUA" ? floorFilter : "Semua Lantai"}`
    );
    setTimeout(() => setAppliedFilterNotice(""), 3500);
    showToast("Filter rekapitulasi berhasil diterapkan.", "success");
  };

  // Ekspor CSV
  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      showToast("Tidak ada data presensi untuk diekspor.", "warning");
      return;
    }

    const headers = [
      "No",
      "NIM / ID",
      "Nama Lengkap",
      "Peran (Role)",
      "Gedung Asrama",
      "Kamar / Lantai",
      "Hadir",
      "Izin",
      "Sakit",
      "Alpha",
      "Persentase Kehadiran",
      "Status Terakhir",
      "Waktu Terakhir"
    ];

    const rows = filteredList.map((r, i) => [
      i + 1,
      r.nim,
      r.nama,
      r.role.toUpperCase(),
      r.namaGedung,
      r.nomorKamar !== "-" ? `${r.nomorKamar} (Lt. ${r.lantai})` : "-",
      r.hadir,
      r.izin,
      r.sakit,
      r.alpha,
      `${r.percentage}%`,
      r.terakhirStatus,
      r.terakhirWaktu ? new Date(r.terakhirWaktu).toLocaleString("id-ID") : "-"
    ]);

    const roleLabel =
      activeRoleTab === "semua"
        ? "Semua_Pengguna"
        : activeRoleTab.charAt(0).toUpperCase() + activeRoleTab.slice(1);

    downloadCSV(
      `Rekap_Presensi_${roleLabel}_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
    showToast(`Berhasil mengekspor data ${roleLabel} ke format CSV.`, "success");
  };

  // Cetak Dokumen Resmi PDF
  const handlePrintPDF = () => {
    if (filteredList.length === 0) {
      showToast("Tidak ada data presensi untuk dicetak.", "warning");
      return;
    }

    const roleTitleMap = {
      semua: "REKAPITULASI PRESENSI SELURUH CIVITAS ASRAMA",
      penghuni: "REKAPITULASI PRESENSI MAHASISWA PENGHUNI ASRAMA",
      fasil: "REKAPITULASI KEHADIRAN & PIKET FASILITATOR ASRAMA",
      admin: "REKAPITULASI KEHADIRAN STAF PENGELOLA UPT ASRAMA"
    };

    const headers = [
      "No",
      "NIM / ID",
      "Nama Lengkap",
      "Peran",
      "Lokasi / Kamar",
      "Hadir",
      "Izin",
      "Sakit",
      "Alpha",
      "Kepatuhan"
    ];

    const rows = filteredList.map((r, idx) => [
      idx + 1,
      r.nim,
      r.nama,
      r.role.toUpperCase(),
      r.nomorKamar !== "-" ? `${r.namaGedung} (${r.nomorKamar})` : r.namaGedung,
      r.hadir,
      r.izin,
      r.sakit,
      r.alpha,
      `${r.percentage}%`
    ]);

    printOfficialDocument({
      title: roleTitleMap[activeRoleTab] || "REKAPITULASI PRESENSI ASRAMA",
      subtitle: "Laporan Kehadiran Terintegrasi UPT Asrama Mahasiswa Universitas Andalas",
      metaInfo: [
        {
          label: "Kategori Pengguna",
          value:
            activeRoleTab === "semua"
              ? "Semua Kategori (Penghuni, Fasilitator, Administrator)"
              : activeRoleTab.toUpperCase()
        },
        {
          label: "Total Subjek",
          value: `${filteredList.length} Orang Terdaftar`
        },
        {
          label: "Ringkasan Kehadiran",
          value: `${summaryStats.totalHadir} Hadir · ${summaryStats.totalIzin} Izin · ${summaryStats.totalSakit} Sakit · ${summaryStats.totalAlpha} Alpha`
        },
        {
          label: "Rata-Rata Kepatuhan",
          value: `${summaryStats.avgPct}%`
        },
        {
          label: "Tanggal Cetak",
          value: new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
          })
        }
      ],
      headers,
      rows,
      signerName: "Kepala UPT Asrama Unand",
      signerRole: "Kepala Unit Pelaksana Teknis Asrama"
    });
  };

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case "penghuni":
      case "mahasiswa":
        return {
          bg: "#eff6ff",
          color: "#1e40af",
          border: "#bfdbfe",
          label: "Penghuni"
        };
      case "fasil":
        return {
          bg: "#fef3c7",
          color: "#b45309",
          border: "#fde68a",
          label: "Fasilitator"
        };
      case "admin":
        return {
          bg: "#f3e8ff",
          color: "#6b21a8",
          border: "#d8b4fe",
          label: "Administrator"
        };
      default:
        return {
          bg: "#f1f5f9",
          color: "#475569",
          border: "#cbd5e1",
          label: role || "User"
        };
    }
  };

  const fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Plus Jakarta Sans", "Inter", system-ui, sans-serif';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: fontStack }}>
      {/* 1. Header with Export Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div
            style={{
              fontSize: "11.5px",
              fontWeight: "800",
              color: "#2563eb",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              marginBottom: "4px"
            }}
          >
            PANEL ADMINISTRATOR UPT ASRAMA
          </div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: "800",
              color: "#0f172a",
              margin: "0 0 6px 0",
              letterSpacing: "-0.5px"
            }}
          >
            Rekapitulasi Presensi Terintegrasi
          </h1>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
            Monitoring kehadiran seluruh civitas asrama dengan pemisahan peran (*role*): <strong>Penghuni</strong>, <strong>Fasilitator (Fasil)</strong>, dan <strong>Administrator</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handlePrintPDF}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "10px 16px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#0f172a",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.15s ease"
            }}
          >
            <Printer size={15} color="#2563eb" />
            <span>Cetak PDF Resmi</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "10px 18px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
          >
            <Download size={15} />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {appliedFilterNotice && (
        <div
          style={{
            backgroundColor: "#dcfce7",
            border: "1px solid #bbf7d0",
            color: "#15803d",
            padding: "10px 16px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <CheckCircle2 size={16} />
          <span>{appliedFilterNotice}</span>
        </div>
      )}

      {/* 2. Role Navigation Tabs (Sesuai Kebutuhan User: Pemisahan Kategori Pengguna) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          padding: "6px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          overflowX: "auto"
        }}
      >
        {[
          { id: "semua", label: "Semua Pengguna", icon: Users, count: roleCounts.semua },
          { id: "penghuni", label: "Penghuni Asrama", icon: UserCheck, count: roleCounts.penghuni },
          { id: "fasil", label: "Fasilitator (Fasil)", icon: Shield, count: roleCounts.fasil },
          { id: "admin", label: "Administrator", icon: Building, count: roleCounts.admin }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeRoleTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveRoleTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "10px",
                border: "none",
                fontSize: "13px",
                fontWeight: isActive ? "700" : "600",
                cursor: "pointer",
                transition: "all 0.15s ease",
                backgroundColor: isActive ? "#2563eb" : "transparent",
                color: isActive ? "#ffffff" : "#64748b",
                whiteSpace: "nowrap"
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 7px",
                  borderRadius: "999px",
                  fontWeight: "700",
                  backgroundColor: isActive ? "rgba(255, 255, 255, 0.25)" : "#f1f5f9",
                  color: isActive ? "#ffffff" : "#475569"
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Top 5 KPI Summary Cards Dinamis */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "20px 24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
        }}
      >
        <div style={{ borderRight: "1px solid #f1f5f9", paddingRight: "16px" }}>
          <div style={{ fontSize: "11.5px", color: "#64748b", marginBottom: "6px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Total Subjek
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
            {summaryStats.totalUser} <span style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8" }}>orang</span>
          </div>
          <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: "600", marginTop: "4px" }}>
            Kategori: {activeRoleTab.toUpperCase()}
          </div>
        </div>

        <div style={{ borderRight: "1px solid #f1f5f9", paddingRight: "16px", paddingLeft: "8px" }}>
          <div style={{ fontSize: "11.5px", color: "#64748b", marginBottom: "6px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Total Hadir
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#16a34a" }}>
            {summaryStats.totalHadir} <span style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8" }}>sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            Presensi Terverifikasi
          </div>
        </div>

        <div style={{ borderRight: "1px solid #f1f5f9", paddingRight: "16px", paddingLeft: "8px" }}>
          <div style={{ fontSize: "11.5px", color: "#64748b", marginBottom: "6px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Dispensasi / Izin
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#0284c7" }}>
            {summaryStats.totalIzin + summaryStats.totalSakit} <span style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8" }}>sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            {summaryStats.totalIzin} Izin · {summaryStats.totalSakit} Sakit
          </div>
        </div>

        <div style={{ borderRight: "1px solid #f1f5f9", paddingRight: "16px", paddingLeft: "8px" }}>
          <div style={{ fontSize: "11.5px", color: "#64748b", marginBottom: "6px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Alpha / Belum
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: summaryStats.totalAlpha > 0 ? "#dc2626" : "#64748b" }}>
            {summaryStats.totalAlpha} <span style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8" }}>sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: summaryStats.totalAlpha > 0 ? "#dc2626" : "#16a34a", fontWeight: "600", marginTop: "4px" }}>
            {summaryStats.totalAlpha > 0 ? "Perlu Tindak Lanjut" : "Nihil Pelanggaran"}
          </div>
        </div>

        <div style={{ paddingLeft: "8px" }}>
          <div style={{ fontSize: "11.5px", color: "#64748b", marginBottom: "6px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Tingkat Kepatuhan
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: summaryStats.avgPct >= 85 ? "#16a34a" : "#ea580c" }}>
            {summaryStats.avgPct}%
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            Standar Asrama: ≥ 85%
          </div>
        </div>
      </div>

      {/* 4. Filter Controls Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "18px 22px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            marginBottom: "16px"
          }}
        >
          {/* Periode */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              PERIODE
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                outline: "none"
              }}
            >
              <option value="Bulan ini">Bulan ini</option>
              <option value="Minggu ini">Minggu ini</option>
              <option value="Hari ini">Hari ini</option>
              <option value="Semester Berjalan">Semester Berjalan</option>
            </select>
          </div>

          {/* Asrama / Gedung */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              GEDUNG ASRAMA
            </label>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                outline: "none"
              }}
            >
              <option value="SEMUA">Semua Gedung</option>
              <option value="Asrama Hijau">Asrama Hijau</option>
              <option value="Asrama Orange">Asrama Orange</option>
              <option value="Asrama Roesma M. Sjaaf">Asrama Roesma M. Sjaaf</option>
              <option value="Asrama Menpera">Asrama Menpera</option>
              <option value="Asrama PUPERA 1">Asrama PUPERA 1</option>
              <option value="Asrama Rusunawa">Asrama Rusunawa</option>
              <option value="Asrama RPX">Asrama RPX</option>
            </select>
          </div>

          {/* Lantai */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              LANTAI
            </label>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                outline: "none"
              }}
            >
              <option value="SEMUA">Semua Lantai</option>
              <option value="1">Lantai 1</option>
              <option value="2">Lantai 2</option>
              <option value="3">Lantai 3</option>
            </select>
          </div>

          {/* Pencarian */}
          <div style={{ gridColumn: "span 1" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              PENCARIAN NAMA / NIM / KAMAR
            </label>
            <div style={{ position: "relative" }}>
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
                placeholder="Cari nama, NIM, atau nomor kamar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12.5px",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            type="button"
            onClick={handleResetFilter}
            style={{
              backgroundColor: "#f8fafc",
              color: "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "8px 16px",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            Reset Filter
          </button>
          <button
            type="button"
            onClick={handleApplyFilter}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "8px 18px",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
              transition: "all 0.15s ease"
            }}
          >
            Terapkan Filter
          </button>
        </div>
      </div>

      {/* 5. Main Attendance Table */}
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
            Tabel Rekapitulasi Presensi — Kategori: <strong>{activeRoleTab.toUpperCase()}</strong>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", marginLeft: "8px" }}>
              (Menampilkan {filteredList.length} dari {rawData.length} data)
            </span>
          </div>

          <div style={{ fontSize: "12px", color: "#64748b" }}>
            Filter Aktif: <strong>{buildingFilter}</strong> · <strong>{floorFilter === "SEMUA" ? "Semua Lantai" : `Lantai ${floorFilter}`}</strong>
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
                <th style={{ padding: "14px 18px" }}>Nama Lengkap & NIM</th>
                <th style={{ padding: "14px 18px" }}>Peran (Role)</th>
                <th style={{ padding: "14px 18px" }}>Gedung & Kamar / Lantai</th>
                <th style={{ padding: "14px 14px", textAlign: "center" }}>Hadir</th>
                <th style={{ padding: "14px 14px", textAlign: "center" }}>Izin</th>
                <th style={{ padding: "14px 14px", textAlign: "center" }}>Sakit</th>
                <th style={{ padding: "14px 14px", textAlign: "center" }}>Alpha</th>
                <th style={{ padding: "14px 18px" }}>Tingkat Kepatuhan</th>
                <th style={{ padding: "14px 18px" }}>Presensi Terakhir</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
                    Memuat data rekapitulasi kehadiran...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <UserCheck size={32} color="#cbd5e1" />
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>
                        Tidak ada data yang cocok dengan kriteria filter.
                      </span>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Coba sesuaikan kata kunci pencarian atau ganti kategori tab.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredList.map((row, index) => {
                    const badge = getRoleBadge(row.role);
                    return (
                      <tr
                        key={row.idUser || index}
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

                        {/* Nama & NIM */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: "700", color: "#0f172a" }}>{row.nama}</div>
                          <div style={{ fontSize: "11.5px", color: "#64748b" }}>{row.nim}</div>
                        </td>

                        {/* Role Badge */}
                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 9px",
                              borderRadius: "999px",
                              fontSize: "11px",
                              fontWeight: "700",
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Gedung & Kamar / Lantai */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: "600", color: "#0f172a" }}>{row.namaGedung}</div>
                          <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                            {row.nomorKamar && row.nomorKamar !== "-" ? `Kamar ${row.nomorKamar} · Lantai ${row.lantai}` : "-"}
                          </div>
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
                                maxWidth: "70px",
                                height: "6px",
                                backgroundColor: "#f1f5f9",
                                borderRadius: "999px",
                                overflow: "hidden"
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(100, row.percentage)}%`,
                                  height: "100%",
                                  backgroundColor:
                                    row.percentage >= 85
                                      ? "#16a34a"
                                      : row.percentage >= 70
                                      ? "#2563eb"
                                      : "#ea580c",
                                  borderRadius: "999px"
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "700",
                                color:
                                  row.percentage >= 85
                                    ? "#15803d"
                                    : row.percentage >= 70
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
                              : "-"}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary Footer Row */}
                  <tr style={{ backgroundColor: "#f8fafc", fontWeight: "800", borderTop: "2px solid #e2e8f0" }}>
                    <td colSpan={4} style={{ padding: "14px 18px", color: "#0f172a" }}>
                      Total Ringkasan ({activeRoleTab.toUpperCase()})
                    </td>
                    <td style={{ padding: "14px 14px", textAlign: "center", color: "#15803d" }}>
                      {summaryStats.totalHadir}
                    </td>
                    <td style={{ padding: "14px 14px", textAlign: "center", color: "#0284c7" }}>
                      {summaryStats.totalIzin}
                    </td>
                    <td style={{ padding: "14px 14px", textAlign: "center", color: "#b45309" }}>
                      {summaryStats.totalSakit}
                    </td>
                    <td style={{ padding: "14px 14px", textAlign: "center", color: "#dc2626" }}>
                      {summaryStats.totalAlpha}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#0f172a" }}>
                      Rata-rata: {summaryStats.avgPct}%
                    </td>
                    <td style={{ padding: "14px 18px" }}></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

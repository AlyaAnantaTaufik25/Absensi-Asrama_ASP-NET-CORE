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
  Layers
} from "lucide-react";
import { getRekapPresensi, getGedung } from "../../services/api";
import { downloadCSV, printOfficialDocument } from "../../utils/exportUtils";

export default function RekapitulasiPresensiAdminPage() {
  // Role Tabs: "semua" | "penghuni" | "fasil" | "admin"
  const [activeRoleTab, setActiveRoleTab] = useState("semua");

  // Filters
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

  // Load Data dari backend
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

  // Hitung jumlah anggota untuk tiap kategori tab
  const roleCounts = useMemo(() => {
    return {
      semua: rawData.length,
      penghuni: rawData.filter((r) => r.role === "penghuni" || r.role === "mahasiswa").length,
      fasil: rawData.filter((r) => r.role === "fasil").length,
      admin: rawData.filter((r) => r.role === "admin").length
    };
  }, [rawData]);

  // Data yang difilter berdasarkan role tab dan kriteria filter lainnya
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

      // 2. Filter Search (Nama / NIM)
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

  // Ringkasan Total untuk Kategori yang Aktif
  const summaryStats = useMemo(() => {
    const totalUser = filteredList.length;
    const totalHadir = filteredList.reduce((acc, c) => acc + (c.hadir || 0), 0);
    const totalIzin = filteredList.reduce((acc, c) => acc + (c.izin || 0), 0);
    const totalSakit = filteredList.reduce((acc, c) => acc + (c.sakit || 0), 0);
    const totalAlpha = filteredList.reduce((acc, c) => acc + (c.alpha || 0), 0);
    const avgPct =
      totalUser > 0
        ? Math.round(
            filteredList.reduce((acc, c) => acc + (c.percentage || 0), 0) / totalUser
          )
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
  };

  // Ekspor Laporan CSV
  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      alert("Tidak ada data presensi untuk diekspor.");
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
      "Persentase Kehadiran"
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
      `${r.percentage}%`
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
  };

  // Cetak Dokumen PDF Resmi
  const handlePrintPDF = () => {
    if (filteredList.length === 0) {
      alert("Tidak ada data presensi untuk dicetak.");
      return;
    }

    const roleTitleMap = {
      semua: "REKAPITULASI PRESENSI SELURUH CIVITAS ASRAMA",
      penghuni: "REKAPITULASI PRESENSI MAHASISWA PENGHUNI ASRAMA",
      fasil: "REKAPITULASI KEHADIRAN & PIKET FASILITATOR ASRAMA",
      admin: "REKAPITULASI KEHADIRAN STAF PENGELOLA UPT ASRAMA"
    };

    const headers = [
      "NIM / ID",
      "Nama Lengkap",
      "Peran",
      "Lokasi / Gedung",
      "Hadir",
      "Izin",
      "Sakit",
      "Alpha",
      "Kepatuhan"
    ];

    const rows = filteredList.map((r) => [
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
              ? "Semua Kategori (Penghuni, Fasil, Admin)"
              : activeRoleTab.toUpperCase()
        },
        {
          label: "Total Pengguna",
          value: `${filteredList.length} Orang Terdaftar`
        },
        {
          label: "Ringkasan Kehadiran",
          value: `${summaryStats.totalHadir} Hadir · ${summaryStats.totalIzin} Izin · ${summaryStats.totalSakit} Sakit · ${summaryStats.totalAlpha} Alpha (Rata-rata: ${summaryStats.avgPct}%)`
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
          bg: "#f5f3ff",
          color: "#6d28d9",
          border: "#ddd6fe",
          label: "Fasilitator"
        };
      case "admin":
        return {
          bg: "#f0fdf4",
          color: "#166534",
          border: "#bbf7d0",
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header with Title & Export Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "800",
              color: "#2563eb",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              marginBottom: "4px"
            }}
          >
            PANEL ADMINISTRATOR
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
            Rekapitulasi Presensi Terintegrasi
          </h1>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
            Monitoring kehadiran seluruh civitas asrama dengan pemisahan peran (*role*): Penghuni, Fasil, dan Administrator.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
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
              color: "#334155",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
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
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
              transition: "all 0.15s ease"
            }}
          >
            <Download size={15} />
            <span>Ekspor Excel (.csv)</span>
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

      {/* 2. TAB NAVIGASI KHUSUS ROLE (Semua | Penghuni | Fasil | Admin) */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "2px solid #e2e8f0",
          paddingBottom: "2px",
          overflowX: "auto"
        }}
      >
        <button
          type="button"
          onClick={() => setActiveRoleTab("semua")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            border: "none",
            borderBottom: activeRoleTab === "semua" ? "3px solid #2563eb" : "3px solid transparent",
            backgroundColor: "transparent",
            color: activeRoleTab === "semua" ? "#1d4ed8" : "#64748b",
            fontWeight: activeRoleTab === "semua" ? "800" : "600",
            fontSize: "13.5px",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <Users size={16} />
          <span>Semua Pengguna</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: activeRoleTab === "semua" ? "#eff6ff" : "#f1f5f9",
              color: activeRoleTab === "semua" ? "#1e40af" : "#64748b"
            }}
          >
            {roleCounts.semua}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveRoleTab("penghuni")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            border: "none",
            borderBottom: activeRoleTab === "penghuni" ? "3px solid #2563eb" : "3px solid transparent",
            backgroundColor: "transparent",
            color: activeRoleTab === "penghuni" ? "#1d4ed8" : "#64748b",
            fontWeight: activeRoleTab === "penghuni" ? "800" : "600",
            fontSize: "13.5px",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <Building size={16} />
          <span>Penghuni Asrama</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: activeRoleTab === "penghuni" ? "#eff6ff" : "#f1f5f9",
              color: activeRoleTab === "penghuni" ? "#1e40af" : "#64748b"
            }}
          >
            {roleCounts.penghuni}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveRoleTab("fasil")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            border: "none",
            borderBottom: activeRoleTab === "fasil" ? "3px solid #7c3aed" : "3px solid transparent",
            backgroundColor: "transparent",
            color: activeRoleTab === "fasil" ? "#6d28d9" : "#64748b",
            fontWeight: activeRoleTab === "fasil" ? "800" : "600",
            fontSize: "13.5px",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <UserCheck size={16} />
          <span>Fasilitator (Fasil)</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: activeRoleTab === "fasil" ? "#f5f3ff" : "#f1f5f9",
              color: activeRoleTab === "fasil" ? "#6d28d9" : "#64748b"
            }}
          >
            {roleCounts.fasil}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveRoleTab("admin")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            border: "none",
            borderBottom: activeRoleTab === "admin" ? "3px solid #059669" : "3px solid transparent",
            backgroundColor: "transparent",
            color: activeRoleTab === "admin" ? "#047857" : "#64748b",
            fontWeight: activeRoleTab === "admin" ? "800" : "600",
            fontSize: "13.5px",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <Shield size={16} />
          <span>Administrator</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: activeRoleTab === "admin" ? "#ecfdf5" : "#f1f5f9",
              color: activeRoleTab === "admin" ? "#047857" : "#64748b"
            }}
          >
            {roleCounts.admin}
          </span>
        </button>
      </div>

      {/* 3. Summary KPI Cards Dinamis untuk Kategori Terpilih */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "16px"
        }}
      >
        <div style={{ backgroundColor: "#ffffff", padding: "18px 20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
            Total Subjek ({activeRoleTab.toUpperCase()})
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>
            {summaryStats.totalUser} <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Orang</span>
          </div>
          <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: "600", marginTop: "4px" }}>
            {activeRoleTab === "semua" ? "Seluruh Civitas Asrama" : `Kategori ${activeRoleTab}`}
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "18px 20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#166534", textTransform: "uppercase", marginBottom: "6px" }}>
            Total Hadir
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#15803d" }}>
            {summaryStats.totalHadir} <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600", marginTop: "4px" }}>
            Tercatat di sistem
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "18px 20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#1e40af", textTransform: "uppercase", marginBottom: "6px" }}>
            Total Izin / Sakit
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#2563eb" }}>
            {summaryStats.totalIzin + summaryStats.totalSakit} <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            {summaryStats.totalIzin} Izin · {summaryStats.totalSakit} Sakit
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "18px 20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#b91c1c", textTransform: "uppercase", marginBottom: "6px" }}>
            Total Alpha / Belum
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#dc2626" }}>
            {summaryStats.totalAlpha} <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Sesi</span>
          </div>
          <div style={{ fontSize: "11px", color: "#b91c1c", fontWeight: "600", marginTop: "4px" }}>
            Tanpa keterangan
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "18px 20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
            Rata-rata Kepatuhan
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: summaryStats.avgPct >= 80 ? "#15803d" : "#ea580c" }}>
            {summaryStats.avgPct}%
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            Tingkat kehadiran kelompok
          </div>
        </div>
      </div>

      {/* 4. Filter Bar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "16px 20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
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
              gap: "8px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "7px 12px",
              flex: "1 1 200px"
            }}
          >
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Cari nama, NIM, atau nomor kamar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                backgroundColor: "transparent",
                outline: "none",
                fontSize: "13px",
                width: "100%",
                color: "#0f172a"
              }}
            />
          </div>

          {/* Filter Gedung */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Gedung:</span>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              style={{
                padding: "7px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontSize: "12.5px",
                color: "#0f172a",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="SEMUA">Semua Gedung</option>
              {gedungList.map((g) => (
                <option key={g.idGedung} value={g.namaGedung}>
                  {g.namaGedung}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Lantai */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Lantai:</span>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              style={{
                padding: "7px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontSize: "12.5px",
                color: "#0f172a",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="SEMUA">Semua Lantai</option>
              <option value="Lantai 1">Lantai 1</option>
              <option value="Lantai 2">Lantai 2</option>
              <option value="Lantai 3">Lantai 3</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Menampilkan <strong>{filteredList.length}</strong> data
          </span>
          {(searchQuery || buildingFilter !== "SEMUA" || floorFilter !== "SEMUA") && (
            <button
              type="button"
              onClick={handleResetFilter}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* 5. Main Data Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          overflow: "hidden"
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "14px 18px", width: "40px" }}>No</th>
                <th style={{ padding: "14px 18px" }}>Nama Lengkap & NIM</th>
                <th style={{ padding: "14px 16px" }}>Peran (Role)</th>
                <th style={{ padding: "14px 18px" }}>Gedung & Kamar / Lantai</th>
                <th style={{ padding: "14px 14px", textAlign: "center" }}>Hadir</th>
                <th style={{ padding: "14px 14px", textAlign: "center" }}>Izin</th>
                <th style={{ padding: "14px 14px", textAlign: "center" }}>Sakit</th>
                <th style={{ padding: "14px 14px", textAlign: "center" }}>Alpha</th>
                <th style={{ padding: "14px 18px" }}>% Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    Memuat data rekapitulasi presensi...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                      Tidak Ada Data yang Sesuai
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "4px", color: "#94a3b8" }}>
                      Silakan sesuaikan filter role, gedung, atau kata kunci pencarian Anda.
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredList.map((row, index) => {
                    const badge = getRoleBadge(row.role);
                    return (
                      <tr
                        key={row.idUser}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background-color 0.1s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ padding: "12px 18px", color: "#64748b", fontWeight: "600" }}>
                          {index + 1}
                        </td>

                        <td style={{ padding: "12px 18px" }}>
                          <div style={{ fontWeight: "700", color: "#0f172a" }}>{row.nama}</div>
                          <div style={{ fontSize: "11.5px", color: "#64748b" }}>{row.nim}</div>
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
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

                        <td style={{ padding: "12px 18px" }}>
                          <div style={{ fontWeight: "600", color: "#0f172a" }}>{row.namaGedung}</div>
                          <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                            {row.nomorKamar !== "-" ? `Kamar ${row.nomorKamar} · Lantai ${row.lantai}` : "-"}
                          </div>
                        </td>

                        <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: "700", color: "#15803d" }}>
                          {row.hadir}
                        </td>

                        <td style={{ padding: "12px 14px", textAlign: "center", color: "#2563eb", fontWeight: "600" }}>
                          {row.izin}
                        </td>

                        <td style={{ padding: "12px 14px", textAlign: "center", color: "#0284c7", fontWeight: "600" }}>
                          {row.sakit}
                        </td>

                        <td style={{ padding: "12px 14px", textAlign: "center", color: row.alpha > 0 ? "#dc2626" : "#64748b", fontWeight: row.alpha > 0 ? "700" : "500" }}>
                          {row.alpha}
                        </td>

                        <td style={{ padding: "12px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div
                              style={{
                                width: "70px",
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
                                  backgroundColor: row.percentage >= 80 ? "#16a34a" : row.percentage >= 60 ? "#f59e0b" : "#dc2626",
                                  borderRadius: "999px"
                                }}
                              />
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>
                              {row.percentage}%
                            </span>
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
                    <td style={{ padding: "14px 14px", textAlign: "center", color: "#2563eb" }}>
                      {summaryStats.totalIzin}
                    </td>
                    <td style={{ padding: "14px 14px", textAlign: "center", color: "#0284c7" }}>
                      {summaryStats.totalSakit}
                    </td>
                    <td style={{ padding: "14px 14px", textAlign: "center", color: "#dc2626" }}>
                      {summaryStats.totalAlpha}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#0f172a" }}>
                      Rata-rata: {summaryStats.avgPct}%
                    </td>
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

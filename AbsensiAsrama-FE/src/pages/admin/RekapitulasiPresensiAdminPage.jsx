import React, { useState, useEffect, useMemo } from "react";
import { ArrowUpDown, RotateCcw, Filter, CheckCircle2, Download, Printer } from "lucide-react";
import { getPresensi, getUsers, getRekapPresensi, getGedung } from "../../services/api";
import { downloadCSV, printOfficialDocument } from "../../utils/exportUtils";
import { showToast } from "../../utils/toast";

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

  const totalHadir = filteredList.reduce((acc, curr) => acc + curr.hadir, 0);
  const totalTerlambat = filteredList.reduce((acc, curr) => acc + curr.terlambat, 0);
  const totalIzin = filteredList.reduce((acc, curr) => acc + curr.izin, 0);
  const totalAlpha = filteredList.reduce((acc, curr) => acc + curr.alpha, 0);
  const avgPercentage =
    filteredList.length > 0
      ? Math.round(
          filteredList.reduce((acc, curr) => acc + curr.percentage, 0) /
            filteredList.length
        )
      : 0;

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

  const fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: fontStack }}>
      {/* 1. Header with Export Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: "700",
              color: "#1c1c1e",
              margin: 0,
              letterSpacing: "-0.5px"
            }}
          >
            Rekapitulasi Presensi Terintegrasi
          </h1>
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
              border: "1px solid #e5e5ea",
              backgroundColor: "#f2f2f7",
              color: "#1c1c1e",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              fontFamily: fontStack
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
              backgroundColor: "#007aff",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0, 122, 255, 0.3)",
              fontFamily: fontStack
            }}
          >
            <Download size={15} />
            Ekspor Laporan (.CSV)
          </button>
        </div>
      </div>

      {appliedFilterNotice && (
        <div
          style={{
            backgroundColor: "rgba(52, 199, 89, 0.12)",
            border: "1px solid rgba(52, 199, 89, 0.25)",
            color: "#34c759",
            padding: "10px 16px",
            borderRadius: "12px",
            fontSize: "13.5px",
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
            Total Hadir
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#34c759" }}>
            {totalHadir} <span style={{ fontSize: "13px", fontWeight: "500", color: "#8e8e93" }}>sesi</span>
          </div>
        </div>

        <div style={{ borderRight: "1px solid #f2f2f7", paddingRight: "16px", paddingLeft: "8px" }}>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginBottom: "6px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Dispensasi / Izin
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#007aff" }}>
            {totalIzin} <span style={{ fontSize: "13px", fontWeight: "500", color: "#8e8e93" }}>sesi</span>
          </div>
        </div>

        <div style={{ borderRight: "1px solid #f2f2f7", paddingRight: "16px", paddingLeft: "8px" }}>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginBottom: "6px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Alpha / Belum
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#ff9500" }}>
            {totalAlpha} <span style={{ fontSize: "13px", fontWeight: "500", color: "#8e8e93" }}>sesi</span>
          </div>
        </div>

        <div style={{ paddingLeft: "8px" }}>
          <div style={{ fontSize: "11px", color: "#8e8e93", marginBottom: "6px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Tingkat Kepatuhan
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#007aff" }}>
            {avgPercentage}%
          </div>
        </div>
      </div>

      {/* 3. Filter Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          padding: "20px 24px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            marginBottom: "16px"
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8e8e93", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              PERIODE
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid #e5e5ea",
                fontSize: "13px",
                backgroundColor: "#f2f2f7",
                color: "#1c1c1e",
                outline: "none",
                fontFamily: fontStack
              }}
            >
              <option value="Bulan ini">Bulan ini</option>
              <option value="Minggu ini">Minggu ini</option>
              <option value="Hari ini">Hari ini</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8e8e93", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              DARI TANGGAL
            </label>
            <input
              type="text"
              placeholder="Cari nama, NIM, atau nomor kamar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid #e5e5ea",
                fontSize: "13px",
                backgroundColor: "#f2f2f7",
                color: "#1c1c1e",
                outline: "none",
                fontFamily: fontStack,
                boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8e8e93", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              SAMPAI TANGGAL
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid #e5e5ea",
                fontSize: "13px",
                backgroundColor: "#f2f2f7",
                color: "#1c1c1e",
                outline: "none",
                fontFamily: fontStack,
                boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8e8e93", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              ASRAMA
            </label>
            <select
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid #e5e5ea",
                fontSize: "13px",
                backgroundColor: "#f2f2f7",
                color: "#1c1c1e",
                outline: "none",
                fontFamily: fontStack
              }}
            >
              <option value="SEMUA">Semua Asrama</option>
              <option value="Asrama Hijau">Asrama Hijau</option>
              <option value="Asrama Orange">Asrama Orange</option>
              <option value="Asrama Roesma M. Sjaaf">Asrama Roesma M. Sjaaf</option>
              <option value="Asrama Menpera">Asrama Menpera</option>
              <option value="Asrama PUPERA 1">Asrama PUPERA 1</option>
              <option value="Asrama Rusunawa">Asrama Rusunawa</option>
              <option value="Asrama RPX">Asrama RPX</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={handleResetFilter}
            style={{
              backgroundColor: "#f2f2f7",
              color: "#8e8e93",
              border: "1px solid #e5e5ea",
              borderRadius: "10px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              fontFamily: fontStack
            }}
          >
            Reset Filter
          </button>
          <button
            type="button"
            onClick={handleApplyFilter}
            style={{
              backgroundColor: "#007aff",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "8px 20px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              fontFamily: fontStack,
              boxShadow: "0 2px 8px rgba(0, 122, 255, 0.3)"
            }}
          >
            Terapkan Filter
          </button>
        </div>
      </div>

      {/* 4. Table Card */}
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
              <tr style={{ backgroundColor: "#fafafc", borderBottom: "1px solid #e5e5ea", color: "#8e8e93", fontSize: "11.5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "16px 20px" }}>Nama Penghuni</th>
                <th style={{ padding: "16px 20px" }}>NIM</th>
                <th style={{ padding: "16px 20px" }}>Lokasi Kamar</th>
                <th style={{ padding: "16px 20px", textAlign: "center" }}>Hadir</th>
                <th style={{ padding: "16px 20px", textAlign: "center" }}>Izin</th>
                <th style={{ padding: "16px 20px", textAlign: "center" }}>Alpha</th>
                <th style={{ padding: "16px 20px", textAlign: "right" }}>Kepatuhan</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((row, index) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: index === filteredList.length - 1 ? "none" : "1px solid #f2f2f7",
                    transition: "background-color 0.1s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "14px 20px", fontWeight: "600", color: "#1c1c1e" }}>
                    {row.name}
                  </td>
                  <td style={{ padding: "14px 20px", color: "#8e8e93" }}>
                    {row.nim}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontWeight: "600", color: "#007aff", backgroundColor: "rgba(0, 122, 255, 0.08)", padding: "3px 8px", borderRadius: "6px", fontSize: "12px" }}>
                      {row.location}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "center", fontWeight: "600", color: "#34c759" }}>
                    {row.hadir}
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "center", fontWeight: "600", color: "#007aff" }}>
                    {row.izin}
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "center", fontWeight: "600", color: "#ff9500" }}>
                    {row.alpha}
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <span style={{ fontWeight: "700", color: row.percentage >= 80 ? "#34c759" : "#ff9500" }}>
                      {row.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

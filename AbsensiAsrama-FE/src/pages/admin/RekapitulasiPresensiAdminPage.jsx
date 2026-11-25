import React, { useState, useEffect, useMemo } from "react";
import { ArrowUpDown, RotateCcw, Filter, CheckCircle2, Download, Printer, UserCheck, AlertCircle, X } from "lucide-react";
import { getPresensi, getUsers, getRekapPresensi, getGedung } from "../../services/api";
import { downloadCSV, printOfficialDocument } from "../../utils/exportUtils";
import { showToast } from "../../utils/toast";

export default function RekapitulasiPresensiAdminPage() {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("SEMUA");
  const [floorFilter, setFloorFilter] = useState("SEMUA");
  const [periodFilter, setPeriodFilter] = useState("1 Bulan Terakhir");
  const [fromDate, setFromDate] = useState(() => getNDaysAgoStr(30));
  const [toDate, setToDate] = useState(getTodayStr);

  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState([]);
  const [gedungList, setGedungList] = useState([]);
  const [appliedFilterNotice, setAppliedFilterNotice] = useState("");

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

  // Load Data dari backend khusus Mahasiswa (role: "penghuni")
  const fetchData = async () => {
    setLoading(true);
    try {
      const gedungId = buildingFilter !== "SEMUA"
        ? gedungList.find(g => g.namaGedung?.toLowerCase().includes(buildingFilter.toLowerCase()))?.idGedung
        : undefined;

      // Presensi hanya untuk mahasiswa (penghuni)
      const params = {
        fromDate,
        toDate,
        role: "penghuni",
        ...(gedungId ? { gedungId } : {})
      };

      const [rekapRes, gedungs] = await Promise.all([
        getRekapPresensi(params),
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
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate, buildingFilter]);

  // Data murni hanya Mahasiswa (Penghuni)
  const mahasiswaData = useMemo(() => {
    return rawData.filter((item) => {
      const r = (item.role || "").toLowerCase();
      return r === "penghuni" || r === "mahasiswa";
    });
  }, [rawData]);

  // Ringkasan KPI dihitung dari SELURUH mahasiswa pada periode yang dipilih
  const totalHadir = mahasiswaData.reduce((acc, curr) => acc + (curr.hadir || 0), 0);
  const totalIzin = mahasiswaData.reduce((acc, curr) => acc + (curr.izin || 0), 0);
  const totalSakit = mahasiswaData.reduce((acc, curr) => acc + (curr.sakit || 0), 0);
  const totalAlpha = mahasiswaData.reduce((acc, curr) => acc + (curr.alpha || 0), 0);
  const avgPercentage =
    mahasiswaData.length > 0
      ? Math.round(
          mahasiswaData.reduce((acc, curr) => acc + (curr.percentage || 0), 0) /
            mahasiswaData.length
        )
      : 0;

  // Data yang difilter di tabel (termasuk filter klik kartu Hadir, Izin, Sakit, Alpha)
  const filteredList = useMemo(() => {
    return mahasiswaData.filter((item) => {
      // 1. Filter Klik Kartu KPI (Hadir, Izin, Sakit, Alpha)
      if (activeStatusCard === "hadir" && (item.hadir || 0) === 0) return false;
      if (activeStatusCard === "izin" && (item.izin || 0) === 0) return false;
      if (activeStatusCard === "sakit" && (item.sakit || 0) === 0) return false;
      if (activeStatusCard === "alpha" && (item.alpha || 0) === 0) return false;

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
  }, [mahasiswaData, activeStatusCard, searchQuery, buildingFilter, floorFilter]);

  const handleResetFilter = () => {
    setSearchQuery("");
    setBuildingFilter("SEMUA");
    setFloorFilter("SEMUA");
    setPeriodFilter("1 Bulan Terakhir");
    setActiveStatusCard("semua");
    setFromDate(getNDaysAgoStr(30));
    setToDate(getTodayStr());
    setAppliedFilterNotice("Filter direset ke 1 bulan terakhir.");
    setTimeout(() => setAppliedFilterNotice(""), 3000);
  };

  const handleApplyFilter = () => {
    fetchData();
    setAppliedFilterNotice(`Filter diterapkan: ${periodFilter} (${fromDate} s/d ${toDate})`);
    setTimeout(() => setAppliedFilterNotice(""), 3000);
  };

  const handleCardClick = (status) => {
    if (activeStatusCard === status) {
      setActiveStatusCard("semua");
      showToast("Menampilkan seluruh mahasiswa", "info");
    } else {
      setActiveStatusCard(status);
      showToast(`Menyaring mahasiswa dengan status: ${status.toUpperCase()}`, "info");
    }
  };

  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      showToast("Tidak ada data presensi untuk diekspor.", "warning");
      return;
    }

    const headers = [
      "No",
      "NIM",
      "Nama Mahasiswa",
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
      r.namaGedung,
      r.nomorKamar !== "-" ? `${r.nomorKamar} (Lt. ${r.lantai})` : "-",
      r.hadir || 0,
      r.izin || 0,
      r.sakit || 0,
      r.alpha || 0,
      `${r.percentage || 0}%`
    ]);

    const filterTag = activeStatusCard !== "semua" ? `_${activeStatusCard.toUpperCase()}` : "";
    downloadCSV(
      `Rekap_Presensi_Mahasiswa${filterTag}_${new Date().toISOString().slice(0, 10)}.csv`,
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

    const headers = [
      "NIM",
      "Nama Mahasiswa",
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
      r.nomorKamar !== "-" ? `${r.namaGedung} (${r.nomorKamar})` : r.namaGedung,
      r.hadir || 0,
      r.izin || 0,
      r.sakit || 0,
      r.alpha || 0,
      `${r.percentage || 0}%`
    ]);

    printOfficialDocument({
      title: "REKAPITULASI PRESENSI MAHASISWA ASRAMA",
      subtitle: "Laporan Kehadiran Terintegrasi Penghuni UPT Asrama Mahasiswa Universitas Andalas",
      metaInfo: [
        {
          label: "Kategori Pengguna",
          value: "Mahasiswa Penghuni Asrama"
        },
        {
          label: "Total Mahasiswa Ditampilkan",
          value: `${filteredList.length} Orang (Filter: ${activeStatusCard.toUpperCase()})`
        },
        {
          label: "Ringkasan Kehadiran Periode Ini",
          value: `${totalHadir} Hadir · ${totalIzin} Izin · ${totalSakit} Sakit · ${totalAlpha} Alpha (Rata-rata: ${avgPercentage}%)`
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
            Rekapitulasi Presensi Mahasiswa
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "13.5px", color: "#8e8e93" }}>
            Data pemantauan kehadiran khusus mahasiswa/penghuni asrama terintegrasi.
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

      {/* 3. Filter Controls Card */}
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
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "14px",
            marginBottom: "16px"
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8e8e93", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              PERIODE
            </label>
            <select
              value={periodFilter}
              onChange={(e) => handlePeriodChange(e.target.value)}
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
              <option value="Hari ini">Hari ini</option>
              <option value="7 Hari Terakhir">7 Hari Terakhir</option>
              <option value="1 Bulan Terakhir">1 Bulan Terakhir</option>
              <option value="Kustom">Kustom</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8e8e93", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              DARI TANGGAL
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPeriodFilter("Kustom");
              }}
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
              onChange={(e) => {
                setToDate(e.target.value);
                setPeriodFilter("Kustom");
              }}
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
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
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
              {gedungList.length > 0 ? (
                gedungList.map((g) => (
                  <option key={g.idGedung} value={g.namaGedung}>
                    {g.namaGedung}
                  </option>
                ))
              ) : (
                <>
                  <option value="Asrama Hijau">Asrama Hijau</option>
                  <option value="Asrama Orange">Asrama Orange</option>
                  <option value="Asrama Roesma M. Sjaaf">Asrama Roesma M. Sjaaf</option>
                  <option value="Asrama Menpera">Asrama Menpera</option>
                  <option value="Asrama PUPERA 1">Asrama PUPERA 1</option>
                  <option value="Asrama Rusunawa">Asrama Rusunawa</option>
                  <option value="Asrama RPX">Asrama RPX</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8e8e93", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              CARI MAHASISWA
            </label>
            <input
              type="text"
              placeholder="Cari nama, NIM, kamar..."
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
                <th style={{ padding: "16px 20px" }}>Nama Mahasiswa</th>
                <th style={{ padding: "16px 20px" }}>NIM</th>
                <th style={{ padding: "16px 20px" }}>Gedung & Kamar</th>
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
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px 20px", color: "#8e8e93" }}>
                    {loading
                      ? "Memuat data presensi mahasiswa..."
                      : "Tidak ada data mahasiswa yang sesuai dengan filter."}
                  </td>
                </tr>
              ) : (
                filteredList.map((row, index) => (
                  <tr
                    key={row.idUser || index}
                    style={{
                      borderBottom: index === filteredList.length - 1 ? "none" : "1px solid #f2f2f7",
                      transition: "background-color 0.1s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontWeight: "600", color: "#1c1c1e" }}>
                        {row.nama || row.name || "-"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#8e8e93" }}>
                        Mahasiswa Penghuni
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px", color: "#8e8e93", fontFamily: "monospace", fontWeight: "600" }}>
                      {row.nim || "-"}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontWeight: "600", color: "#007aff", backgroundColor: "rgba(0, 122, 255, 0.08)", padding: "3px 8px", borderRadius: "6px", fontSize: "12px" }}>
                        {row.nomorKamar && row.nomorKamar !== "-" ? `${row.namaGedung} · ${row.nomorKamar}` : (row.namaGedung || "-")}
                      </span>
                    </td>
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
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <span style={{ fontWeight: "700", color: (row.percentage || 0) >= 80 ? "#34c759" : "#ff9500" }}>
                        {row.percentage || 0}%
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

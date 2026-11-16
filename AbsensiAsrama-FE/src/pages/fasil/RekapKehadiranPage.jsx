import React, { useState } from "react";
import {
  Download,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  ChevronDown,
  X,
  TrendingUp,
  UserCheck
} from "lucide-react";

export default function RekapKehadiranPage() {
  const [filterSession, setFilterSession] = useState("semua"); // "semua" | "subuh" | "maghrib"
  const [filterPeriod, setFilterPeriod] = useState("hari-ini"); // "hari-ini" | "minggu-ini" | "bulan-ini"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const studentsAttendance = [
    {
      room: "B-301",
      name: "Fikri Ramadhan",
      nim: "2311521001",
      subuh: "Hadir",
      subuhTime: "04:45 WIB",
      maghrib: "Hadir",
      maghribTime: "18:07 WIB",
      complianceRate: 100,
      totalPresent: 28,
      totalPermit: 0,
      totalAlpha: 0,
      statusNote: "Tepat Waktu"
    },
    {
      room: "B-302",
      name: "Yoga Prasetyo",
      nim: "2311521002",
      subuh: "Hadir",
      subuhTime: "04:48 WIB",
      maghrib: "Hadir",
      maghribTime: "18:12 WIB",
      complianceRate: 96,
      totalPresent: 27,
      totalPermit: 1,
      totalAlpha: 0,
      statusNote: "Tepat Waktu"
    },
    {
      room: "B-303",
      name: "Taufik Hidayat",
      nim: "2311521003",
      subuh: "Hadir",
      subuhTime: "04:52 WIB",
      maghrib: "Hadir",
      maghribTime: "18:09 WIB",
      complianceRate: 93,
      totalPresent: 26,
      totalPermit: 2,
      totalAlpha: 0,
      statusNote: "Izin Keluar Malam"
    },
    {
      room: "B-304",
      name: "Rayhan Pratama",
      nim: "2311521004",
      subuh: "Hadir",
      subuhTime: "04:42 WIB",
      maghrib: "Hadir",
      maghribTime: "18:04 WIB",
      complianceRate: 100,
      totalPresent: 28,
      totalPermit: 0,
      totalAlpha: 0,
      statusNote: "Tepat Waktu"
    },
    {
      room: "B-305",
      name: "Alvin Syahputra",
      nim: "2311521005",
      subuh: "Hadir",
      subuhTime: "04:50 WIB",
      maghrib: "Hadir",
      maghribTime: "18:15 WIB",
      complianceRate: 89,
      totalPresent: 25,
      totalPermit: 2,
      totalAlpha: 1,
      statusNote: "Kegiatan UKM"
    },
    {
      room: "B-306",
      name: "Rendy Kusuma",
      nim: "2311521006",
      subuh: "Hadir",
      subuhTime: "04:47 WIB",
      maghrib: "Hadir",
      maghribTime: "18:21 WIB",
      complianceRate: 96,
      totalPresent: 27,
      totalPermit: 1,
      totalAlpha: 0,
      statusNote: "Tepat Waktu"
    },
    {
      room: "B-307",
      name: "Irfan Maulana",
      nim: "2311521007",
      subuh: "Hadir",
      subuhTime: "04:51 WIB",
      maghrib: "Izin",
      maghribTime: "Izin Sakit",
      complianceRate: 86,
      totalPresent: 24,
      totalPermit: 4,
      totalAlpha: 0,
      statusNote: "Izin Sakit di Kamar"
    },
    {
      room: "B-308",
      name: "Dimas Aditya",
      nim: "2311521008",
      subuh: "Hadir",
      subuhTime: "04:44 WIB",
      maghrib: "Hadir",
      maghribTime: "18:10 WIB",
      complianceRate: 100,
      totalPresent: 28,
      totalPermit: 0,
      totalAlpha: 0,
      statusNote: "Tepat Waktu"
    },
    {
      room: "B-309",
      name: "Gilang Permana",
      nim: "2311521009",
      subuh: "Hadir",
      subuhTime: "04:49 WIB",
      maghrib: "Hadir",
      maghribTime: "18:18 WIB",
      complianceRate: 93,
      totalPresent: 26,
      totalPermit: 2,
      totalAlpha: 0,
      statusNote: "Izin Beli Obat"
    },
    {
      room: "B-310",
      name: "Hasan Basri",
      nim: "2311521010",
      subuh: "Hadir",
      subuhTime: "04:40 WIB",
      maghrib: "Hadir",
      maghribTime: "18:03 WIB",
      complianceRate: 100,
      totalPresent: 28,
      totalPermit: 0,
      totalAlpha: 0,
      statusNote: "Tepat Waktu"
    },
    {
      room: "B-311",
      name: "Farid Ramli",
      nim: "2311521011",
      subuh: "Hadir",
      subuhTime: "04:54 WIB",
      maghrib: "Hadir",
      maghribTime: "18:25 WIB",
      complianceRate: 93,
      totalPresent: 26,
      totalPermit: 2,
      totalAlpha: 0,
      statusNote: "Izin Rapat Panitia"
    },
    {
      room: "B-312",
      name: "Wahyu Setiawan",
      nim: "2311521012",
      subuh: "Hadir",
      subuhTime: "04:55 WIB",
      maghrib: "Belum",
      maghribTime: "Belum Tercatat",
      complianceRate: 82,
      totalPresent: 23,
      totalPermit: 2,
      totalAlpha: 3,
      statusNote: "Perlu Verifikasi"
    }
  ];

  const handleExport = () => {
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 3500);
  };

  const filteredData = studentsAttendance.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nim.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterSession === "subuh") {
      return s.subuh === "Hadir";
    } else if (filterSession === "maghrib") {
      return s.maghrib === "Hadir";
    }

    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Rekap Kehadiran Lantai 3
          </h1>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
            Gedung Al-Farabi · Pemantauan kepatuhan presensi sholat & status kehadiran penghuni
          </p>
        </div>

        {/* Export Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleExport}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 20px",
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
            <span>Unduh Rekap (.xlsx)</span>
          </button>
        </div>
      </div>

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
          <span>Berhasil mengunduh rekapitulasi kehadiran Lantai 3 (Rekap_Presensi_Lt3_Mei2024.xlsx).</span>
        </div>
      )}

      {/* 2. Top 4 KPI Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "20px 24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
        }}
      >
        {/* KPI 1 */}
        <div style={{ borderRight: "1px solid #f1f5f9", paddingRight: "16px" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px", fontWeight: "500" }}>
            Tingkat Kepatuhan
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: "#15803d" }}>91.7%</span>
            <span style={{ fontSize: "11px", color: "#15803d", backgroundColor: "#dcfce7", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
              +2.4%
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div style={{ borderRight: "1px solid #f1f5f9", paddingRight: "16px", paddingLeft: "8px" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px", fontWeight: "500" }}>
            Total Hadir Hari Ini
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: "#2563eb" }}>22</span>
            <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "600" }}>/24 sesi</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div style={{ borderRight: "1px solid #f1f5f9", paddingRight: "16px", paddingLeft: "8px" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px", fontWeight: "500" }}>
            Izin Tercatat
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#0284c7" }}>
            1 <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "600" }}>sesi</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div style={{ paddingLeft: "8px" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px", fontWeight: "500" }}>
            Belum / Alpha
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#ea580c" }}>
            1 <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "600" }}>sesi</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
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
          gap: "14px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
        }}
      >
        {/* Left: Session Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "600", marginRight: "4px" }}>
            Sesi:
          </span>
          <button
            type="button"
            onClick={() => setFilterSession("semua")}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "12.5px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              backgroundColor: filterSession === "semua" ? "#2563eb" : "#f1f5f9",
              color: filterSession === "semua" ? "#ffffff" : "#475569"
            }}
          >
            Semua Sesi
          </button>
          <button
            type="button"
            onClick={() => setFilterSession("subuh")}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "12.5px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              backgroundColor: filterSession === "subuh" ? "#2563eb" : "#f1f5f9",
              color: filterSession === "subuh" ? "#ffffff" : "#475569"
            }}
          >
            Subuh
          </button>
          <button
            type="button"
            onClick={() => setFilterSession("maghrib")}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "12.5px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              backgroundColor: filterSession === "maghrib" ? "#2563eb" : "#f1f5f9",
              color: filterSession === "maghrib" ? "#ffffff" : "#475569"
            }}
          >
            Maghrib & Isya
          </button>
        </div>

        {/* Right: Search Box */}
        <div style={{ position: "relative", width: "260px" }}>
          <Search
            size={16}
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
            placeholder="Cari kamar atau santri..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "12.5px",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
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
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "11.5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "16px 20px" }}>Kamar</th>
                <th style={{ padding: "16px 20px" }}>Penghuni</th>
                <th style={{ padding: "16px 20px" }}>Sesi Subuh</th>
                <th style={{ padding: "16px 20px" }}>Sesi Maghrib & Isya</th>
                <th style={{ padding: "16px 20px" }}>Kepatuhan Bulan Ini</th>
                <th style={{ padding: "16px 20px" }}>Keterangan</th>
                <th style={{ padding: "16px 20px", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => {
                const subuhOk = row.subuh === "Hadir";
                const maghribOk = row.maghrib === "Hadir";
                const maghribIzin = row.maghrib === "Izin";

                return (
                  <tr
                    key={row.room}
                    style={{
                      borderBottom: index === filteredData.length - 1 ? "none" : "1px solid #f8fafc",
                      transition: "background-color 0.1s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "14px 20px", fontWeight: "700", color: "#0f172a" }}>
                      {row.room}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontWeight: "700", color: "#1e293b" }}>{row.name}</div>
                      <div style={{ fontSize: "11.5px", color: "#64748b" }}>{row.nim}</div>
                    </td>

                    {/* Subuh */}
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          backgroundColor: subuhOk ? "#dcfce7" : "#fee2e2",
                          color: subuhOk ? "#15803d" : "#b91c1c",
                          fontSize: "11px",
                          fontWeight: "600",
                          padding: "3px 8px",
                          borderRadius: "6px",
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
                          backgroundColor: maghribOk ? "#dcfce7" : maghribIzin ? "#dbeafe" : "#fef3c7",
                          color: maghribOk ? "#15803d" : maghribIzin ? "#1d4ed8" : "#b45309",
                          fontSize: "11px",
                          fontWeight: "600",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          display: "inline-block"
                        }}
                      >
                        {row.maghrib} ({row.maghribTime})
                      </span>
                    </td>

                    {/* Kepatuhan Progress */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            flex: 1,
                            maxWidth: "90px",
                            height: "6px",
                            backgroundColor: "#f1f5f9",
                            borderRadius: "999px",
                            overflow: "hidden"
                          }}
                        >
                          <div
                            style={{
                              width: `${row.complianceRate}%`,
                              height: "100%",
                              backgroundColor:
                                row.complianceRate >= 95
                                  ? "#15803d"
                                  : row.complianceRate >= 85
                                  ? "#2563eb"
                                  : "#ea580c"
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>
                          {row.complianceRate}%
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "14px 20px", color: "#64748b", fontSize: "12px" }}>
                      {row.statusNote}
                    </td>

                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
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
              })}
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
              maxWidth: "480px",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                Detail Kehadiran Santri
              </h2>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: "#f8fafc", padding: "14px 16px", borderRadius: "10px", marginBottom: "18px" }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                {selectedStudent.name}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                NIM: {selectedStudent.nim} · Kamar {selectedStudent.room} (Lantai 3 Al-Farabi)
              </div>
            </div>

            {/* Quick 3-Metric Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "18px" }}>
              <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#15803d", fontWeight: "600" }}>Total Hadir</div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#15803d" }}>{selectedStudent.totalPresent}</div>
              </div>
              <div style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#0284c7", fontWeight: "600" }}>Total Izin</div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#0284c7" }}>{selectedStudent.totalPermit}</div>
              </div>
              <div style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#c2410c", fontWeight: "600" }}>Alpha / Belum</div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#c2410c" }}>{selectedStudent.totalAlpha}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b" }}>Status Sesi Hari Ini:</span>
                <span style={{ fontWeight: "700", color: "#0f172a" }}>Subuh: {selectedStudent.subuh} · Maghrib: {selectedStudent.maghrib}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b" }}>Kepatuhan Akumulatif:</span>
                <span style={{ fontWeight: "800", color: "#15803d" }}>{selectedStudent.complianceRate}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>Catatan Fasilitator:</span>
                <span style={{ fontWeight: "600", color: "#334155" }}>{selectedStudent.statusNote}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                style={{
                  padding: "8px 18px",
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


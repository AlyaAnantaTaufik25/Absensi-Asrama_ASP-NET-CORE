import React, { useState, useEffect } from "react";
import { ArrowUpDown, RotateCcw, Filter, CheckCircle2 } from "lucide-react";
import { getPresensi, getUsers } from "../../services/api";

export default function RekapitulasiPresensiAdminPage() {
  const [period, setPeriod] = useState("Bulan ini");
  const [fromDate, setFromDate] = useState("2026-10-01");
  const [toDate, setToDate] = useState("2026-10-20");
  const [building, setBuilding] = useState("SEMUA");
  const [floor, setFloor] = useState("SEMUA");
  const [room, setRoom] = useState("SEMUA");
  const [session, setSession] = useState("SEMUA");

  const [appliedFilterNotice, setAppliedFilterNotice] = useState("");
  const [rawData, setRawData] = useState([]);
  const [filteredList, setFilteredList] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [presensi, users] = await Promise.all([getPresensi(), getUsers()]);
        if (Array.isArray(users) && users.length > 0) {
          const mapped = users.map((u, idx) => {
            const userPresensi = Array.isArray(presensi) ? presensi.filter((p) => p.idUser === u.idUser) : [];
            const hadir = userPresensi.filter((p) => p.status === "Hadir").length;
            const izin = userPresensi.filter((p) => p.status === "Izin").length;
            const alpha = userPresensi.filter((p) => p.status === "Alpha").length;
            const total = hadir + izin + alpha;
            const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;
            return {
              id: u.idUser || idx + 1,
              name: u.nama,
              nim: u.nim,
              location: u.nomorKamar ? `Kamar ${u.nomorKamar}` : "Asrama Hijau",
              building: "Asrama Hijau",
              floor: "Lantai 1",
              room: u.nomorKamar || "-",
              hadir: hadir,
              terlambat: 0,
              izin: izin,
              alpha: alpha,
              percentage: pct
            };
          });
          setRawData(mapped);
          setFilteredList(mapped);
        } else {
          setRawData([]);
          setFilteredList([]);
        }
      } catch (err) {
        console.warn("Gagal memuat rekap:", err);
      }
    }
    loadData();
  }, []);

  const handleApplyFilter = () => {
    let result = rawData;
    if (building !== "SEMUA") {
      result = result.filter((item) => item.building === building);
    }
    if (floor !== "SEMUA") {
      result = result.filter((item) => item.floor === floor);
    }
    if (room !== "SEMUA") {
      result = result.filter((item) => item.room === room);
    }

    setFilteredList(result);
    setAppliedFilterNotice("Filter berhasil diterapkan.");
    setTimeout(() => setAppliedFilterNotice(""), 3000);
  };

  const handleResetFilter = () => {
    setPeriod("Bulan ini");
    setFromDate("2026-10-01");
    setToDate("2026-10-20");
    setBuilding("SEMUA");
    setFloor("SEMUA");
    setRoom("SEMUA");
    setSession("SEMUA");
    setFilteredList(rawData);
    setAppliedFilterNotice("Filter direset ke nilai awal.");
    setTimeout(() => setAppliedFilterNotice(""), 3000);
  };

  // Aggregated totals
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header */}
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
          LAPORAN PRESENSI
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
          Rekapitulasi Presensi
        </h1>
        <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
          Ringkasan performa presensi setiap penghuni.
        </p>
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

      {/* 2. Filter Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          border: "1px solid #e2e8f0",
          padding: "20px 24px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)"
        }}
      >
        {/* Filter Inputs Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1.3fr 1.3fr 1fr 1fr 1fr 1fr",
            gap: "12px",
            marginBottom: "18px",
            alignItems: "flex-end"
          }}
        >
          {/* Periode */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>
              PERIODE
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                outline: "none"
              }}
            >
              <option value="Bulan ini">Bulan ini</option>
              <option value="Minggu ini">Minggu ini</option>
              <option value="Hari ini">Hari ini</option>
              <option value="Kustom">Kustom</option>
            </select>
          </div>

          {/* Dari Tanggal */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>
              DARI TANGGAL
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                color: "#0f172a",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Sampai Tanggal */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>
              SAMPAI TANGGAL
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                color: "#0f172a",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Gedung */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>
              GEDUNG
            </label>
            <select
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                outline: "none"
              }}
            >
              <option value="SEMUA">SEMUA</option>
              <option value="Gedung A">Gedung A</option>
              <option value="Gedung B">Gedung B</option>
              <option value="Gedung C">Gedung C</option>
            </select>
          </div>

          {/* Lantai */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>
              LANTAI
            </label>
            <select
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                outline: "none"
              }}
            >
              <option value="SEMUA">SEMUA</option>
              <option value="Lantai 1">Lantai 1</option>
              <option value="Lantai 2">Lantai 2</option>
              <option value="Lantai 3">Lantai 3</option>
            </select>
          </div>

          {/* Kamar */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>
              KAMAR
            </label>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                outline: "none"
              }}
            >
              <option value="SEMUA">SEMUA</option>
              <option value="A-101">A-101</option>
              <option value="A-102">A-102</option>
              <option value="B-201">B-201</option>
              <option value="B-202">B-202</option>
              <option value="C-101">C-101</option>
            </select>
          </div>

          {/* Sesi */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>
              SESI
            </label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                outline: "none"
              }}
            >
              <option value="SEMUA">SEMUA</option>
              <option value="Subuh">Subuh</option>
              <option value="Maghrib & Isya">Maghrib & Isya</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={handleResetFilter}
            style={{
              backgroundColor: "#ffffff",
              color: "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
          >
            Reset Filter
          </button>
          <button
            type="button"
            onClick={handleApplyFilter}
            style={{
              backgroundColor: "#1e3fae",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 20px",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(30, 63, 174, 0.25)",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#173294")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1e3fae")}
          >
            Tampilkan Data
          </button>
        </div>
      </div>

      {/* 3. Main Data Table Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
          overflow: "hidden"
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "16px 20px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                    NAMA <ArrowUpDown size={12} />
                  </div>
                </th>
                <th style={{ padding: "16px 16px" }}>NIM</th>
                <th style={{ padding: "16px 20px" }}>LOKASI</th>
                <th style={{ padding: "16px 16px", textAlign: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                    HADIR <ArrowUpDown size={12} />
                  </div>
                </th>
                <th style={{ padding: "16px 16px", textAlign: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                    TERLAMBAT <ArrowUpDown size={12} />
                  </div>
                </th>
                <th style={{ padding: "16px 16px", textAlign: "center" }}>IZIN</th>
                <th style={{ padding: "16px 16px", textAlign: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                    ALPHA <ArrowUpDown size={12} />
                  </div>
                </th>
                <th style={{ padding: "16px 20px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                    % KEHADIRAN <ArrowUpDown size={12} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                      Belum Ada Rekapitulasi Presensi di Database
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "4px", color: "#94a3b8" }}>
                      Data presensi santri yang masuk ke MySQL akan otomatis direkap di sini.
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredList.map((row, index) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: "1px solid #f8fafc",
                        transition: "background-color 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "13px 20px", fontWeight: "700", color: "#0f172a" }}>
                        {row.name}
                      </td>
                      <td style={{ padding: "13px 16px", color: "#64748b", fontSize: "12.5px" }}>
                        {row.nim}
                      </td>
                      <td style={{ padding: "13px 20px", color: "#475569", fontSize: "12.5px" }}>
                        {row.location}
                      </td>
                      <td style={{ padding: "13px 16px", textAlign: "center", fontWeight: "600", color: "#0f172a" }}>
                        {row.hadir}
                      </td>
                      <td style={{ padding: "13px 16px", textAlign: "center", color: "#64748b" }}>
                        {row.terlambat}
                      </td>
                      <td style={{ padding: "13px 16px", textAlign: "center", color: "#64748b" }}>
                        {row.izin}
                      </td>
                      <td style={{ padding: "13px 16px", textAlign: "center", color: "#64748b" }}>
                        {row.alpha}
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {/* Orange / Amber progress bar matching design */}
                          <div
                            style={{
                              width: "90px",
                              height: "6px",
                              backgroundColor: "#fef3c7",
                              borderRadius: "999px",
                              overflow: "hidden"
                            }}
                          >
                            <div
                              style={{
                                width: `${row.percentage}%`,
                                height: "100%",
                                backgroundColor: "#f59e0b",
                                borderRadius: "999px"
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a", minWidth: "35px" }}>
                            {row.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Summary / Total / Rata-rata Row */}
                  <tr style={{ backgroundColor: "#f8fafc", fontWeight: "700", borderTop: "2px solid #e2e8f0" }}>
                    <td style={{ padding: "14px 20px", color: "#0f172a" }}>
                      Total / Rata-rata
                    </td>
                    <td style={{ padding: "14px 16px" }}></td>
                    <td style={{ padding: "14px 20px" }}></td>
                    <td style={{ padding: "14px 16px", textAlign: "center", color: "#0f172a", fontWeight: "800" }}>
                      {totalHadir}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", color: "#0f172a", fontWeight: "800" }}>
                      {totalTerlambat}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", color: "#0f172a", fontWeight: "800" }}>
                      {totalIzin}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", color: "#0f172a", fontWeight: "800" }}>
                      {totalAlpha}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "90px",
                            height: "6px",
                            backgroundColor: "#fef3c7",
                            borderRadius: "999px",
                            overflow: "hidden"
                          }}
                        >
                          <div
                            style={{
                              width: `${avgPercentage}%`,
                              height: "100%",
                              backgroundColor: "#f59e0b",
                              borderRadius: "999px"
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "12.5px", fontWeight: "800", color: "#0f172a" }}>
                          {avgPercentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Row */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12.5px",
            color: "#64748b"
          }}
        >
          <div>
            {filteredList.length} data • Halaman 1 dari 1
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              disabled
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                color: "#94a3b8",
                cursor: "not-allowed"
              }}
            >
              &lt;
            </button>
            <button
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#1e3fae",
                color: "#ffffff",
                fontWeight: "700"
              }}
            >
              1
            </button>
            <button
              disabled
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                color: "#94a3b8",
                cursor: "not-allowed"
              }}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

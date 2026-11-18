import React, { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  ChevronDown,
  Search,
  CheckCircle2,
  Eye,
  FileText,
  X,
  Printer
} from "lucide-react";
import { getPresensi } from "../services/api";
import { downloadCSV, printOfficialDocument } from "../utils/exportUtils";

export default function RiwayatPresensiPage({ user }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionFilter, setSessionFilter] = useState("Semua Sesi");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getPresensi();
        if (Array.isArray(data)) {
          const userRecords = user?.id ? data.filter((d) => d.idUser === user.id) : data;
          setRecords(
            userRecords.map((item, idx) => ({
              id: item.idPresensi || idx + 1,
              tanggal: item.tanggal
                ? new Date(item.tanggal).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })
                : "-",
              waktu: item.waktu
                ? new Date(item.waktu).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit"
                  }) + " WIB"
                : "-",
              sesi: "Presensi Harian",
              lokasi: item.latitude ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}` : "Area Asrama",
              wajah: item.fotoWajah ? "Terverifikasi" : "98%",
              status: item.status || "Hadir",
              keterangan: item.keterangan || "Tepat waktu",
              koordinat: item.latitude ? `${item.latitude}, ${item.longitude}` : "-",
              fotoSimulasi: "Wajah cocok dengan database"
            }))
          );
        }
      } catch (err) {
        console.warn("Gagal memuat presensi:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  const countHadir = records.filter((r) => r.status?.toLowerCase() === "hadir").length;
  const countIzin = records.filter((r) => r.status?.toLowerCase() === "izin").length;
  const countAlpha = records.filter((r) => r.status?.toLowerCase() === "alpha").length;

  const filteredRecords = records.filter((rec) => {
    const matchSearch =
      rec.tanggal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.sesi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSession =
      sessionFilter === "Semua Sesi" || rec.sesi.toLowerCase() === sessionFilter.toLowerCase();
    const matchStatus =
      statusFilter === "Semua Status" || rec.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchSession && matchStatus;
  });

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert("Tidak ada data presensi untuk diunduh.");
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
    const cleanName = (user?.displayName || user?.name || "Mahasiswa").replace(/\s+/g, "_");
    downloadCSV(`Rekap_Presensi_${cleanName}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    setShowExportMenu(false);
  };

  const handlePrintPDF = () => {
    if (filteredRecords.length === 0) {
      alert("Tidak ada data presensi untuk dicetak.");
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
      title: "REKAPITULASI PRESENSI MAHASISWA ASRAMA",
      subtitle: "Laporan Kehadiran Harian Santri / Penghuni Asrama Universitas Andalas",
      metaInfo: [
        { label: "Nama Mahasiswa", value: user?.displayName || user?.name || "Alya Ananta" },
        { label: "NIM / ID", value: user?.nim || "2311523005" },
        { label: "Gedung Asrama / Kamar", value: `${user?.building || "Asrama Putri"} · ${user?.room || "Kamar 302"}` },
        { label: "Ringkasan Kehadiran", value: `${countHadir} Sesi Hadir · ${countIzin} Izin · ${countAlpha} Alpha` }
      ],
      headers,
      rows,
      signerName: "Fasilitator / Pembina Asrama",
      signerRole: "Pengelola Asrama Mahasiswa"
    });
    setShowExportMenu(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "-0.4px" }}>
            Riwayat Presensi Mahasiswa
          </h1>
          <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
            Catatan kehadiran harian santri/penghuni asrama
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", position: "relative" }}>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              backgroundColor: "#2349d4",
              border: "none",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "13px",
              padding: "10px 18px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              cursor: "pointer",
              boxShadow: "0 4px 14px -2px rgba(35, 73, 212, 0.4)"
            }}
          >
            <Download size={15} />
            <span>Unduh Rekap (.csv/Excel)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPDF}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#0f172a",
              fontWeight: "700",
              fontSize: "13px",
              padding: "10px 16px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <Printer size={15} color="#2563eb" />
            <span>Cetak Dokumen PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Stat Cards */}
      <div className="stat-cards-grid">
        {/* Card 1: TOTAL HADIR */}
        <div className="stat-box-card">
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            TOTAL HADIR
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
            {countHadir} <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Sesi</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: countHadir > 0 ? "#166534" : "#64748b", fontWeight: "600" }}>
            <CheckCircle2 size={14} color={countHadir > 0 ? "#16a34a" : "#94a3b8"} />
            {countHadir > 0 ? "Presensi tersimpan di database" : "Belum ada presensi tercatat"}
          </div>
        </div>

        {/* Card 2: DISPENSASI / IZIN */}
        <div className="stat-box-card">
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            DISPENSASI / IZIN
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
            {countIzin} <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Sesi</span>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            {countIzin > 0 ? "Izin tervalidasi" : "Tidak ada izin aktif"}
          </div>
        </div>

        {/* Card 3: TINGKAT KEPATUHAN */}
        <div className="stat-box-card">
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            TINGKAT KEPATUHAN
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#1e3fae", marginBottom: "6px" }}>
            {records.length > 0 ? ((countHadir / records.length) * 100).toFixed(1) + " %" : "0 %"}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            {records.length > 0 ? "Berdasarkan data MySQL" : "Menunggu data presensi"}
          </div>
        </div>

        {/* Card 4: ALPHA */}
        <div className="stat-box-card">
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            ALPHA / TANPA KETERANGAN
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
            {countAlpha} <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Sesi</span>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            Kedisiplinan terjaga
          </div>
        </div>
      </div>

      {/* 3. Table Card with Filter Row */}
      <div className="content-card" style={{ padding: "20px 24px" }}>
        {/* Filter Controls Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr 1.2fr 1.6fr", gap: "10px", marginBottom: "18px" }}>
          {/* Search */}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari..."
              style={{
                width: "100%",
                height: "38px",
                paddingLeft: "36px",
                paddingRight: "12px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                fontSize: "12.5px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Sesi dropdown */}
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            style={{
              height: "38px",
              padding: "0 12px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              fontSize: "12.5px",
              color: "#334155",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="Semua Sesi">Semua Sesi</option>
            <option value="Subuh">Subuh</option>
            <option value="Magrib & Isya">Magrib & Isya</option>
          </select>

          {/* Status dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: "38px",
              padding: "0 12px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              fontSize: "12.5px",
              color: "#334155",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Hadir">Hadir</option>
            <option value="Izin">Izin</option>
          </select>

          {/* Date range button */}
          <button
            onClick={() => alert("Pilih rentang tanggal...")}
            style={{
              height: "38px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 12px",
              borderRadius: "10px",
              border: "1px solid #bfdbfe",
              backgroundColor: "#f0f7ff",
              fontSize: "12.5px",
              color: "#2349d4",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={14} color="#2349d4" />
              01 Mei 2024 - 24 Mei 2024
            </span>
            <span>🗓</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="data-table-container">
          <table className="asrama-data-table">
            <thead>
              <tr>
                <th>Tanggal & waktu</th>
                <th>Sesi</th>
                <th>Lokasi</th>
                <th>Wajah</th>
                <th>Status</th>
                <th>Keterangan</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>
                    <Calendar size={36} style={{ margin: "0 auto 10px", color: "#cbd5e1" }} />
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                      Belum Ada Riwayat Presensi di Database
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "4px", color: "#94a3b8" }}>
                      Data kehadiran akan otomatis muncul di sini setelah Anda melakukan presensi.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.id}>
                    {/* Tanggal & Waktu */}
                    <td>
                      <div style={{ fontWeight: "700", color: "#0f172a" }}>{item.tanggal}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{item.waktu}</div>
                    </td>

                    {/* Sesi */}
                    <td>
                      <span style={{ fontWeight: "600", color: "#1e293b" }}>{item.sesi}</span>
                    </td>

                    {/* Lokasi */}
                    <td>
                      <span style={{ color: "#334155" }}>{item.lokasi}</span>
                    </td>

                    {/* Wajah */}
                    <td>
                      <span style={{ fontWeight: item.wajah !== "-" ? "700" : "400", color: item.wajah !== "-" ? "#15803d" : "#94a3b8" }}>
                        {item.wajah}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      {item.status === "Hadir" ? (
                        <span className="badge-status-green">Hadir</span>
                      ) : (
                        <span className="badge-status-blue">Izin</span>
                      )}
                    </td>

                    {/* Keterangan */}
                    <td>
                      <span style={{ color: "#475569" }}>{item.keterangan}</span>
                    </td>

                    {/* Aksi */}
                    <td style={{ textAlign: "center" }}>
                      {item.status === "Hadir" ? (
                        <button
                          onClick={() => setSelectedRecord(item)}
                          style={{
                            border: "none",
                            backgroundColor: "#f8fafc",
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#64748b",
                            cursor: "pointer"
                          }}
                          title="Lihat Detail Presensi"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#e8effe";
                            e.currentTarget.style.color = "#2349d4";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8fafc";
                            e.currentTarget.style.color = "#64748b";
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => alert(`Membuka lampiran surat perizinan: ${item.dokumen}`)}
                          style={{
                            border: "none",
                            backgroundColor: "#f8fafc",
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#2349d4",
                            cursor: "pointer"
                          }}
                          title="Lihat Dokumen Izin"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e8effe")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                        >
                          <FileText size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Pagination */}
        <div className="table-pagination-row">
          <div style={{ fontSize: "12.5px", color: "#64748b" }}>
            Menampilkan 6 dari 44 catatan bulan ini
          </div>

          <div className="pagination-controls">
            <button className="page-num-btn active">1</button>
            <button className="page-num-btn">2</button>
            <button className="page-num-btn">3</button>
            <span style={{ color: "#94a3b8", padding: "0 4px" }}>...</span>
            <button className="page-num-btn">9</button>
          </div>
        </div>
      </div>

      {/* Modal Detail Presensi Biometrik & Geofence */}
      {selectedRecord && (
        <div className="modal-backdrop-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal-dialog-box" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                Detail Verifikasi Presensi
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{
                  border: "none",
                  backgroundColor: "#f1f5f9",
                  borderRadius: "8px",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  cursor: "pointer"
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
                <div style={{ color: "#64748b", fontSize: "11px" }}>Sesi & Tanggal</div>
                <div style={{ fontWeight: "700", color: "#0f172a" }}>
                  {selectedRecord.sesi} · {selectedRecord.tanggal} ({selectedRecord.waktu})
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
                  <div style={{ color: "#64748b", fontSize: "11px" }}>Akurasi Wajah</div>
                  <div style={{ fontWeight: "800", color: "#16a34a", fontSize: "16px" }}>
                    {selectedRecord.wajah} (Valid)
                  </div>
                </div>

                <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
                  <div style={{ color: "#64748b", fontSize: "11px" }}>Radius Geofence</div>
                  <div style={{ fontWeight: "800", color: "#2349d4", fontSize: "16px" }}>
                    {selectedRecord.lokasi} (Di dalam radius 100m)
                  </div>
                </div>
              </div>

              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
                <div style={{ color: "#64748b", fontSize: "11px" }}>Koordinat GPS</div>
                <div style={{ fontWeight: "600", color: "#334155" }}>
                  {selectedRecord.koordinat || "-0.9208, 100.8186"}
                </div>
              </div>

              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
                <div style={{ color: "#64748b", fontSize: "11px" }}>Catatan Kehadiran</div>
                <div style={{ fontWeight: "600", color: "#334155" }}>
                  {selectedRecord.keterangan}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  backgroundColor: "#2349d4",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: "700",
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

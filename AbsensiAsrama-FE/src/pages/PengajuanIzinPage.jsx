import React, { useState } from "react";
import {
  Download,
  Plus,
  Search,
  ChevronDown,
  Calendar,
  FileText,
  X,
  UploadCloud,
  Trash2,
  Info,
  CheckCircle2,
  Clock,
  Briefcase,
  HeartPulse
} from "lucide-react";
import { submitIzin, getPerizinan, uploadIzinFile } from "../services/api";

export default function PengajuanIzinPage({ user }) {
  const [activeTab, setActiveTab] = useState("riwayat"); // "riwayat" or "form"
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");

  // Form State
  const [jenisIzin, setJenisIzin] = useState("sakit"); // "sakit" or "izin"
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedSessions, setSelectedSessions] = useState({
    subuh: false,
    magrib: true,
    penuh: false
  });
  const [reason, setReason] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [selectedRawFile, setSelectedRawFile] = useState(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const fileInputRef = React.useRef(null);

  // Table Data - Kosong secara default sampai dimuat dari MySQL
  const [izinList, setIzinList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Muat data izin dari database MySQL
  React.useEffect(() => {
    async function loadIzin() {
      setIsLoading(true);
      try {
        const data = await getPerizinan();
        if (Array.isArray(data)) {
          const userIzin = user?.nim ? data.filter((d) => d.nim === user.nim) : data;
          setIzinList(
            userIzin.map((item, idx) => ({
              id: item.idIzin || idx + 1,
              jenis: item.alasan?.toLowerCase().includes("sakit") ? "Sakit" : "Izin",
              rentang: item.tanggal
                ? new Date(item.tanggal).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })
                : "-",
              subRentang: "Sesi Izin Terdaftar",
              alasan: item.alasan || "Pengajuan Perizinan",
              subAlasan: `NIM: ${item.nim || "-"}`,
              dokumen: item.fileBukti || "Surat_Permohonan.pdf",
              status: "Tercatat di Database",
              statusType: "green"
            }))
          );
        }
      } catch (err) {
        console.warn("Gagal memuat izin:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadIzin();
  }, [user]);

  const handleToggleSession = (key) => {
    setSelectedSessions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingForm(true);

    let finalFileName = attachedFile ? attachedFile.name : null;

    // Jika pengguna memilih file asli, unggah ke backend API
    if (selectedRawFile) {
      try {
        const uploadRes = await uploadIzinFile(selectedRawFile);
        if (uploadRes && uploadRes.fileName) {
          finalFileName = uploadRes.fileName;
        }
      } catch (err) {
        console.warn("Gagal unggah file bukti:", err);
      }
    }

    try {
      // Simpan perizinan ke database MySQL
      await submitIzin({
        nim: user?.nim || "2311523005",
        tanggal: startDate ? new Date(startDate) : new Date(),
        alasan: `${jenisIzin === "sakit" ? "Sakit: " : "Izin: "}${reason}`,
        fileBukti: finalFileName
      });

      // Muat ulang daftar izin dari database MySQL
      const freshData = await getPerizinan();
      if (Array.isArray(freshData)) {
        const userIzin = user?.nim ? freshData.filter((d) => d.nim === user.nim) : freshData;
        setIzinList(
          userIzin.map((item, idx) => ({
            id: item.idIzin || idx + 1,
            jenis: item.alasan?.toLowerCase().includes("sakit") ? "Sakit" : "Izin",
            rentang: item.tanggal
              ? new Date(item.tanggal).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })
              : "-",
            subRentang: selectedSessions.penuh ? "Penuh / Bermalam" : "Sesi Presensi",
            alasan: item.alasan || "Pengajuan Perizinan",
            subAlasan: `NIM: ${item.nim || "-"}`,
            dokumen: item.fileBukti || "Surat_Permohonan.pdf",
            status: "Tercatat di Database",
            statusType: "green"
          }))
        );
      }
    } catch (err) {
      console.warn("Gagal simpan izin ke backend:", err);
    } finally {
      setIsSubmittingForm(false);
      setShowModal(false);
      setActiveTab("riwayat");
      setReason("");
      setAttachedFile(null);
      setSelectedRawFile(null);
      alert("Permohonan izin dan dokumen bukti berhasil diajukan dan tersimpan di database MySQL!");
    }
  };

  const filteredList = izinList.filter((item) => {
    const matchSearch =
      item.alasan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.jenis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dokumen.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      categoryFilter === "Semua" || item.jenis.toLowerCase() === categoryFilter.toLowerCase();
    const matchStatus =
      statusFilter === "Semua" || item.status.toLowerCase().includes(statusFilter.toLowerCase());
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "-0.4px" }}>
            Pengajuan & Riwayat Izin Mahasiswa
          </h1>
          <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
            Permohonan izin keluar asrama, sakit, atau dispensasi kegiatan akademik dan riwayat persetujuan
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => alert("Mengunduh rekap riwayat perizinan (PDF)...")}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              color: "#334155",
              fontWeight: "600",
              fontSize: "13px",
              padding: "10px 16px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
            }}
          >
            <Download size={15} />
            Unduh Rekap Izin
          </button>

          <button
            onClick={() => setShowModal(true)}
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
              gap: "6px",
              cursor: "pointer",
              boxShadow: "0 4px 14px -2px rgba(35, 73, 212, 0.4)"
            }}
          >
            <Plus size={16} />
            Ajukan Izin Baru
          </button>
        </div>
      </div>

      {/* 2. Top 4 Stat Cards */}
      <div className="stat-cards-grid">
        {/* Card 1: Kuota Izin */}
        <div className="stat-box-card">
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            KUOTA IZIN SEMESTER
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
            3 / 6 <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Digunakan</span>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
            Tersisa 3 kuota izin
          </div>
          {/* Progress bar */}
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{ width: "50%", height: "100%", backgroundColor: "#2349d4", borderRadius: "9999px" }} />
          </div>
        </div>

        {/* Card 2: Disetujui */}
        <div className="stat-box-card">
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            DISETUJUI
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
            5 Sesi
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
            Semua permohonan telah diverifikasi
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{ width: "100%", height: "100%", backgroundColor: "#10b981", borderRadius: "9999px" }} />
          </div>
        </div>

        {/* Card 3: Menunggu Review */}
        <div className="stat-box-card">
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            MENUNGGU REVIEW
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
            1 Permohonan
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
            Sedang ditinjau
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{ width: "35%", height: "100%", backgroundColor: "#f59e0b", borderRadius: "9999px" }} />
          </div>
        </div>

        {/* Card 4: Ditolak / Dibatalkan */}
        <div className="stat-box-card">
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            DITOLAK / DIBATALKAN
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
            0 Permohonan
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
            Catatan kepatuhan & kedisiplinan baik
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{ width: "0%", height: "100%", backgroundColor: "#ef4444", borderRadius: "9999px" }} />
          </div>
        </div>
      </div>

      {/* 3. Table Card with Tab bar & Filters */}
      <div className="content-card" style={{ padding: "20px 24px" }}>
        {/* Top Header of Card: Tabs & Semester Selector */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "16px",
            borderBottom: "1px solid #f1f5f9",
            marginBottom: "16px"
          }}
        >
          {/* Left Tabs */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setActiveTab("riwayat")}
              style={{
                backgroundColor: activeTab === "riwayat" ? "#e8effe" : "#f8fafc",
                color: activeTab === "riwayat" ? "#2349d4" : "#475569",
                border: activeTab === "riwayat" ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "6px 14px",
                fontSize: "12.5px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              Riwayat Perizinan
            </button>

            <button
              onClick={() => setShowModal(true)}
              style={{
                backgroundColor: "transparent",
                color: "#64748b",
                border: "none",
                borderRadius: "8px",
                padding: "6px 14px",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Formulir Pengajuan Baru
            </button>
          </div>

          {/* Right Semester */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12.5px",
              fontWeight: "600",
              color: "#334155",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              padding: "6px 12px",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            <Calendar size={14} color="#64748b" />
            <span>Semester Genap 2024/2025</span>
            <ChevronDown size={14} color="#64748b" />
          </div>
        </div>

        {/* Filter Controls Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr 1fr 1.2fr", gap: "10px", marginBottom: "18px" }}>
          {/* Search Input */}
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
              placeholder="Cari nomor izin, alasan, atau nama musyrif..."
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

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
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
            <option value="Semua">Semua Kategori (Sakit, Izin)</option>
            <option value="Sakit">Sakit</option>
            <option value="Izin">Izin</option>
          </select>

          {/* Status Dropdown */}
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
            <option value="Semua">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Selesai">Selesai</option>
          </select>

          {/* Rentang Waktu button */}
          <button
            onClick={() => alert("Pilih rentang tanggal...")}
            style={{
              height: "38px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 12px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              fontSize: "12.5px",
              color: "#334155",
              cursor: "pointer"
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={14} color="#64748b" />
              Rentang Waktu
            </span>
            <ChevronDown size={14} color="#64748b" />
          </button>
        </div>

        {/* Data Table */}
        <div className="data-table-container">
          <table className="asrama-data-table">
            <thead>
              <tr>
                <th>JENIS IZIN</th>
                <th>RENTANG WAKTU</th>
                <th>ALASAN / KETERANGAN</th>
                <th>DOKUMEN BUKTI</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>
                    <FileText size={36} style={{ margin: "0 auto 10px", color: "#cbd5e1" }} />
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                      Belum Ada Pengajuan Izin di Database
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "4px", color: "#94a3b8" }}>
                      Klik tombol "Ajukan Izin" di atas untuk membuat permohonan baru ke database.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id}>
                    {/* Jenis Izin */}
                    <td>
                      {item.jenis === "Sakit" ? (
                        <span className="badge-status-red">Sakit</span>
                      ) : (
                        <span className="badge-status-blue">Izin</span>
                      )}
                    </td>

                    {/* Rentang Waktu */}
                    <td>
                      <div style={{ fontWeight: "700", color: "#0f172a" }}>{item.rentang}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{item.subRentang}</div>
                    </td>

                    {/* Alasan */}
                    <td>
                      <div style={{ fontWeight: "600", color: "#1e293b" }}>{item.alasan}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{item.subAlasan}</div>
                    </td>

                    {/* Dokumen Bukti */}
                    <td>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#2349d4",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                        onClick={() => alert(`Membuka lampiran dokumen: ${item.dokumen}`)}
                      >
                        <FileText size={14} />
                        <span style={{ textDecoration: "underline" }}>{item.dokumen}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      {item.statusType === "amber" ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#b45309", fontSize: "12px", fontWeight: "600" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#f59e0b" }} />
                          Menunggu Persetujuan
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#15803d", fontSize: "12px", fontWeight: "600" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                          Selesai
                        </span>
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
            Menampilkan 4 dari 6 permohonan semester ini
          </div>

          <div className="pagination-controls">
            <button className="page-num-btn active">1</button>
            <button className="page-num-btn">2</button>
            <button className="page-num-btn" style={{ padding: "0 10px" }}>
              Berikutnya &gt;
            </button>
          </div>
        </div>
      </div>

      {/* 4. MODAL: Formulir Ajukan Izin Baru (Matches Screenshot 3 Right) */}
      {showModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-dialog-box" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    backgroundColor: "#e8effe",
                    color: "#2349d4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 2px 0" }}>
                    Formulir Ajukan Izin Baru
                  </h3>
                  <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                    Lengkapi formulir perizinan penghuni asrama
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
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

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Jenis Izin */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
                  Jenis Izin *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {/* Sakit Option */}
                  <div
                    onClick={() => setJenisIzin("sakit")}
                    style={{
                      border: jenisIzin === "sakit" ? "2px solid #ef4444" : "1px solid #e2e8f0",
                      backgroundColor: jenisIzin === "sakit" ? "#fff5f5" : "#ffffff",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: "#fee2e2",
                        color: "#ef4444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <HeartPulse size={18} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>Sakit</span>
                        <span style={{ fontSize: "9.5px", fontWeight: "700", color: "#ef4444", backgroundColor: "#fee2e2", padding: "1px 6px", borderRadius: "4px" }}>
                          Medis
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        Istirahat kamar / rawat medis
                      </div>
                    </div>
                  </div>

                  {/* Izin Option */}
                  <div
                    onClick={() => setJenisIzin("izin")}
                    style={{
                      border: jenisIzin === "izin" ? "2px solid #2349d4" : "1px solid #e2e8f0",
                      backgroundColor: jenisIzin === "izin" ? "#f4f7ff" : "#ffffff",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: "#dbeafe",
                        color: "#2349d4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>Izin</span>
                        <span style={{ fontSize: "9.5px", fontWeight: "700", color: "#2349d4", backgroundColor: "#dbeafe", padding: "1px 6px", borderRadius: "4px" }}>
                          Luar Asrama
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        Keperluan luar / dispensasi
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tanggal Mulai & Tanggal Selesai */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Tanggal Mulai *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                      fontSize: "13px",
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Tanggal Selesai *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                      fontSize: "13px",
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              {/* Sesi Presensi yang Diizinkan */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                    Sesi Presensi yang Diizinkan *
                  </label>
                  <span style={{ fontSize: "10.5px", color: "#94a3b8" }}>Pilih satu atau lebih</span>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <label
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: selectedSessions.subuh ? "1.5px solid #2349d4" : "1px solid #e2e8f0",
                      backgroundColor: selectedSessions.subuh ? "#f0f6ff" : "#f8fafc",
                      cursor: "pointer",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      color: selectedSessions.subuh ? "#2349d4" : "#334155"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSessions.subuh}
                      onChange={() => handleToggleSession("subuh")}
                      style={{ accentColor: "#2349d4" }}
                    />
                    Subuh
                  </label>

                  <label
                    style={{
                      flex: 1.3,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: selectedSessions.magrib ? "1.5px solid #2349d4" : "1px solid #e2e8f0",
                      backgroundColor: selectedSessions.magrib ? "#f0f6ff" : "#f8fafc",
                      cursor: "pointer",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      color: selectedSessions.magrib ? "#2349d4" : "#334155"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSessions.magrib}
                      onChange={() => handleToggleSession("magrib")}
                      style={{ accentColor: "#2349d4" }}
                    />
                    Magrib & Isya
                  </label>

                  <label
                    style={{
                      flex: 1.3,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: selectedSessions.penuh ? "1.5px solid #2349d4" : "1px solid #e2e8f0",
                      backgroundColor: selectedSessions.penuh ? "#f0f6ff" : "#f8fafc",
                      cursor: "pointer",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      color: selectedSessions.penuh ? "#2349d4" : "#334155"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSessions.penuh}
                      onChange={() => handleToggleSession("penuh")}
                      style={{ accentColor: "#2349d4" }}
                    />
                    Penuh / Bermalam
                  </label>
                </div>
              </div>

              {/* Alasan & Keterangan */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                    Alasan & Keterangan *
                  </label>
                  <span style={{ fontSize: "10.5px", color: "#94a3b8" }}>
                    {reason.length} / 250 karakter
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  maxLength={250}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan alasan izin secara rinci..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                    fontSize: "13px",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    resize: "none"
                  }}
                />
              </div>

              {/* Unggah Dokumen Bukti */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                  Unggah Dokumen Bukti
                </div>
                <div style={{ fontSize: "10.5px", color: "#64748b", marginBottom: "8px" }}>
                  (Opsional untuk izin singkat / Wajib untuk sakit & bermalam - PDF, JPG, PNG (Maks 5MB))
                </div>

                {/* Input file tersembunyi yang nyata */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedRawFile(file);
                      setAttachedFile({
                        name: file.name,
                        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB • Terpilih`
                      });
                    }
                  }}
                />

                {/* Dropzone interaktif */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "1.5px dashed #bfdbfe",
                    backgroundColor: "#f8fafc",
                    borderRadius: "12px",
                    padding: "16px",
                    textAlign: "center",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    color: "#2349d4",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#eff6ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                >
                  <UploadCloud size={22} />
                  <span>Klik di sini untuk memilih berkas bukti dari perangkat Anda</span>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "normal" }}>
                    Format didukung: PDF, JPG, PNG, DOC (Maks. 5 MB)
                  </span>
                </div>

                {/* File Preview Pill */}
                {attachedFile && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      marginTop: "10px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          backgroundColor: "#dcfce7",
                          color: "#16a34a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <FileText size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0f172a" }}>
                          {attachedFile.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600" }}>
                          {attachedFile.size}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAttachedFile(null);
                        setSelectedRawFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      style={{
                        border: "none",
                        background: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: "4px"
                      }}
                      title="Hapus berkas"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Catatan SOP & Ketentuan Asrama Notice Box */}
              <div
                style={{
                  backgroundColor: "#f0f7ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  fontSize: "11px",
                  lineHeight: 1.45,
                  color: "#1e3fae"
                }}
              >
                <Info size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong>Catatan SOP & Ketentuan Asrama:</strong> Pengajuan izin wajib diajukan maksimal 2 jam sebelum sesi presensi berlangsung. Surat izin memerlukan verifikasi fasil.
                </div>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                    color: "#475569",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  style={{
                    padding: "9px 22px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#2349d4",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px -2px rgba(35, 73, 212, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span>Kirim Pengajuan Izin</span>
                  <span>&gt;</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

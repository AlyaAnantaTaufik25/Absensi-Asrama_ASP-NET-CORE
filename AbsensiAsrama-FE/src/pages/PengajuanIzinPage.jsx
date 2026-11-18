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
  HeartPulse,
  Briefcase
} from "lucide-react";
import { submitIzin, getPerizinan } from "../services/api";

const PAGE_SIZE = 10;

export default function PengajuanIzinPage({ user }) {
  const [activeTab, setActiveTab] = useState("riwayat");
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);

  // Form State
  const [jenisIzin, setJenisIzin] = useState("sakit");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedSessions, setSelectedSessions] = useState({
    subuh: false,
    magrib: true,
    penuh: false
  });
  const [reason, setReason] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);

  // Data dari database
  const [izinList, setIzinList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  // Role-based: penghuni hanya lihat milik sendiri, fasil/admin lihat semua
  const isAdmin = user?.role === "admin" || user?.role === "fasil";

  // Muat data perizinan dari database
  React.useEffect(() => {
    async function loadIzin() {
      setIsLoading(true);
      setDbError(null);
      try {
        const data = await getPerizinan();
        if (Array.isArray(data)) {
          const filtered = isAdmin
            ? data
            : data.filter((d) => d.nim === user?.nim);

          setIzinList(
            filtered.map((item) => {
              const alasanLower = (item.alasan || "").toLowerCase();
              const jenis = alasanLower.startsWith("sakit")
                ? "Sakit"
                : alasanLower.startsWith("izin")
                ? "Izin"
                : "Lainnya";

              return {
                id: item.idIzin,
                nim: item.nim,
                jenis,
                rentang: item.tanggal
                  ? new Date(item.tanggal).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })
                  : "-",
                alasan: item.alasan || "-",
                dokumen: item.fileBukti || "Tidak ada lampiran",
                hasDokumen: !!item.fileBukti,
                status: "Tercatat",
                statusType: "green"
              };
            })
          );
        } else {
          setDbError("Gagal memuat data dari database.");
        }
      } catch (err) {
        setDbError("Backend tidak dapat dijangkau. Pastikan dotnet run sudah aktif.");
      } finally {
        setIsLoading(false);
      }
    }
    loadIzin();
  }, [user, isAdmin]);

  const handleToggleSession = (key) => {
    setSelectedSessions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const prefix = jenisIzin === "sakit" ? "Sakit: " : "Izin: ";
    const alasan = `${prefix}${reason}`;
    const payload = {
      nim: user?.nim || "",
      tanggal: startDate ? new Date(startDate) : new Date(),
      alasan,
      fileBukti: attachedFile ? attachedFile.name : null
    };

    try {
      await submitIzin(payload);
      setIzinList((prev) => [
        {
          id: Date.now(),
          nim: user?.nim || "-",
          jenis: jenisIzin === "sakit" ? "Sakit" : "Izin",
          rentang: new Date(startDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric"
          }),
          alasan,
          dokumen: attachedFile ? attachedFile.name : "Tidak ada lampiran",
          hasDokumen: !!attachedFile,
          status: "Tercatat",
          statusType: "green"
        },
        ...prev
      ]);
      setShowModal(false);
      setReason("");
      setAttachedFile(null);
      alert("Permohonan izin berhasil disimpan ke database.");
    } catch {
      alert("Gagal menyimpan ke database. Pastikan backend aktif.");
    }
  };

  const totalIzin = izinList.length;
  const totalSakit = izinList.filter((i) => i.jenis === "Sakit").length;
  const totalBiasa = izinList.filter((i) => i.jenis === "Izin").length;

  const filteredList = izinList.filter((item) => {
    const matchSearch =
      item.alasan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dokumen.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      categoryFilter === "Semua" || item.jenis === categoryFilter;
    const matchStatus =
      statusFilter === "Semua" || item.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const paginated = filteredList.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "-0.4px" }}>
            {isAdmin ? "Manajemen Perizinan" : "Pengajuan & Riwayat Izin"}
          </h1>
          <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
            {isAdmin
              ? "Kelola dan tinjau seluruh permohonan perizinan penghuni asrama"
              : "Permohonan izin keluar asrama, sakit, atau dispensasi kegiatan akademik"}
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

          {!isAdmin && (
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
          )}
        </div>
      </div>

      {/* 2. Top 4 Stat Cards */}
      <div className="stat-cards-grid">
        <div className="stat-box-card">
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            {isAdmin ? "TOTAL PERIZINAN" : "TOTAL IZIN SAYA"}
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
            {isLoading ? "..." : totalIzin} <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Pengajuan</span>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
            {isAdmin ? "Seluruh data perizinan" : `NIM: ${user?.nim || "-"}`}
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{ width: "100%", height: "100%", backgroundColor: "#2349d4", borderRadius: "9999px" }} />
          </div>
        </div>

        <div className="stat-box-card">
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            IZIN SAKIT
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
            {isLoading ? "..." : totalSakit} <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Data</span>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
            Perizinan dengan alasan sakit
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{ width: totalIzin ? `${(totalSakit / totalIzin) * 100}%` : "0%", height: "100%", backgroundColor: "#ef4444", borderRadius: "9999px" }} />
          </div>
        </div>

        <div className="stat-box-card">
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            IZIN KELUAR
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
            {isLoading ? "..." : totalBiasa} <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Data</span>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
            Perizinan keluar asrama
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{ width: totalIzin ? `${(totalBiasa / totalIzin) * 100}%` : "0%", height: "100%", backgroundColor: "#10b981", borderRadius: "9999px" }} />
          </div>
        </div>

        <div className="stat-box-card">
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            LAINNYA
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
            {isLoading ? "..." : totalIzin - totalSakit - totalBiasa} <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Data</span>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
            Kategori izin lainnya
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{ width: "0%", height: "100%", backgroundColor: "#f59e0b", borderRadius: "9999px" }} />
          </div>
        </div>
      </div>

      {/* 3. Table Card */}
      <div className="content-card" style={{ padding: "20px 24px" }}>
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
              placeholder="Cari alasan atau NIM..."
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
            <option value="Semua">Semua Kategori</option>
            <option value="Sakit">Sakit</option>
            <option value="Izin">Izin</option>
            <option value="Lainnya">Lainnya</option>
          </select>

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
            <option value="Tercatat">Tercatat</option>
          </select>

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
                <th>TANGGAL</th>
                <th>ALASAN / KETERANGAN</th>
                {isAdmin && <th>NIM</th>}
                <th>DOKUMEN BUKTI</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>
                    Memuat data dari database...
                  </td>
                </tr>
              ) : dbError ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: "center", padding: "48px 16px", color: "#ef4444" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700" }}>⚠️ {dbError}</div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>
                    <FileText size={36} style={{ margin: "0 auto 10px", color: "#cbd5e1" }} />
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                      Belum Ada Data Perizinan
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "4px", color: "#94a3b8" }}>
                      {isAdmin ? "Belum ada perizinan yang diajukan." : "Klik \"Ajukan Izin Baru\" untuk membuat permohonan."}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.jenis === "Sakit" ? (
                        <span className="badge-status-red">Sakit</span>
                      ) : item.jenis === "Izin" ? (
                        <span className="badge-status-blue">Izin</span>
                      ) : (
                        <span className="badge-status-amber">Lainnya</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: "700", color: "#0f172a" }}>{item.rentang}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>Tercatat di database</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: "600", color: "#1e293b" }}>{item.alasan}</div>
                      {isAdmin && <div style={{ fontSize: "11px", color: "#64748b" }}>NIM: {item.nim}</div>}
                    </td>
                    {isAdmin && (
                      <td style={{ fontSize: "12px", color: "#64748b" }}>{item.nim}</td>
                    )}
                    <td>
                      {item.hasDokumen ? (
                        <div
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#2349d4", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                          onClick={() => alert(`Membuka lampiran: ${item.dokumen}`)}
                        >
                          <FileText size={14} />
                          <span style={{ textDecoration: "underline" }}>{item.dokumen}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Tidak ada lampiran</span>
                      )}
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#15803d", fontSize: "12px", fontWeight: "600" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                        Tercatat
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="table-pagination-row">
          <div style={{ fontSize: "12.5px", color: "#64748b" }}>
            Menampilkan {paginated.length} dari {filteredList.length} data perizinan
          </div>
          <div className="pagination-controls">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`page-num-btn${p === currentPage ? " active" : ""}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
            {currentPage < totalPages && (
              <button className="page-num-btn" style={{ padding: "0 10px" }} onClick={() => setCurrentPage((p) => p + 1)}>
                Berikutnya &gt;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. MODAL: Formulir Ajukan Izin Baru */}
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
                      gap: "12px"
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
                      <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>Sakit</div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Istirahat kamar / rawat medis</div>
                    </div>
                  </div>

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
                      gap: "12px"
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
                      <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>Izin</div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Keperluan luar / dispensasi</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tanggal */}
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

              {/* Sesi Presensi */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                    Sesi Presensi yang Diizinkan *
                  </label>
                  <span style={{ fontSize: "10.5px", color: "#94a3b8" }}>Pilih satu atau lebih</span>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  {[
                    { key: "subuh", label: "Subuh" },
                    { key: "magrib", label: "Magrib & Isya" },
                    { key: "penuh", label: "Penuh / Bermalam" }
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: selectedSessions[key] ? "1.5px solid #2349d4" : "1px solid #e2e8f0",
                        backgroundColor: selectedSessions[key] ? "#f0f6ff" : "#f8fafc",
                        cursor: "pointer",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        color: selectedSessions[key] ? "#2349d4" : "#334155"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSessions[key]}
                        onChange={() => handleToggleSession(key)}
                        style={{ accentColor: "#2349d4" }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Alasan */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                    Alasan &amp; Keterangan *
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

              {/* Upload Dokumen */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                  Unggah Dokumen Bukti
                </div>
                <div style={{ fontSize: "10.5px", color: "#64748b", marginBottom: "8px" }}>
                  (Opsional untuk izin singkat — Wajib untuk sakit dan bermalam. PDF, JPG, maks 5MB)
                </div>

                <div
                  onClick={() => {
                    setAttachedFile({
                      name: "Surat_Keterangan_Sakit.pdf",
                      size: "1.4 MB"
                    });
                  }}
                  style={{
                    border: "1.5px dashed #bfdbfe",
                    backgroundColor: "#f8fafc",
                    borderRadius: "12px",
                    padding: "14px",
                    textAlign: "center",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    color: "#2349d4",
                    fontSize: "12.5px",
                    fontWeight: "600"
                  }}
                >
                  <UploadCloud size={18} />
                  <span>Klik untuk telusuri berkas atau seret berkas bukti ke sini</span>
                </div>

                {attachedFile && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      marginTop: "8px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          backgroundColor: "#fee2e2",
                          color: "#ef4444",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <FileText size={15} />
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>
                          {attachedFile.name}
                        </div>
                        <div style={{ fontSize: "10.5px", color: "#64748b" }}>
                          {attachedFile.size}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      style={{ border: "none", background: "none", color: "#94a3b8", cursor: "pointer" }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Info Box */}
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
                  <strong>Catatan SOP &amp; Ketentuan Asrama:</strong> Pengajuan izin wajib diajukan maksimal 2 jam sebelum sesi presensi berlangsung. Surat izin memerlukan verifikasi fasil.
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
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

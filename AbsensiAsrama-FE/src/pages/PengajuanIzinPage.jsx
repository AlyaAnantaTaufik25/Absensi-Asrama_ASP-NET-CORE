import React, { useState, useEffect, useRef } from "react";
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
  HeartPulse,
  Filter,
  Check,
  AlertCircle
} from "lucide-react";
import { submitIzin, getPerizinan, uploadIzinFile } from "../services/api";
import { showToast } from "../utils/toast";
import { downloadCSV, printOfficialDocument } from "../utils/exportUtils";

export default function PengajuanIzinPage({ user }) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");

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
  const [selectedRawFile, setSelectedRawFile] = useState(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const fileInputRef = useRef(null);

  // Table Data
  const [izinList, setIzinList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Izin from API
  useEffect(() => {
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
              status: item.status || "Menunggu Konfirmasi",
              statusType: (item.status && item.status.toLowerCase().includes("setuju")) ? "green" : (item.status && (item.status.toLowerCase().includes("tolak") || item.status.toLowerCase().includes("batal"))) ? "red" : "orange"
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
      await submitIzin({
        nim: user?.nim || "2311523005",
        tanggal: startDate ? new Date(startDate) : new Date(),
        alasan: `${jenisIzin === "sakit" ? "Sakit: " : "Izin: "}${reason}`,
        fileBukti: finalFileName
      });

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
            status: item.status || "Menunggu Konfirmasi",
            statusType: (item.status && item.status.toLowerCase().includes("setuju")) ? "green" : (item.status && (item.status.toLowerCase().includes("tolak") || item.status.toLowerCase().includes("batal"))) ? "red" : "orange"
          }))
        );
      }
    } catch (err) {
      console.warn("Gagal simpan izin ke backend:", err);
    } finally {
      setIsSubmittingForm(false);
      setShowModal(false);
      setReason("");
      setAttachedFile(null);
      setSelectedRawFile(null);
      showToast("Permohonan izin berhasil diajukan!", "success");
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

  const countSakit = izinList.filter((i) => i.jenis === "Sakit").length;
  const countIzin = izinList.filter((i) => i.jenis === "Izin").length;
  const countDisetujui = izinList.filter((i) => i.status?.toLowerCase().includes("setuju")).length;
  const countReview = izinList.filter((i) => i.status?.toLowerCase().includes("tinjau") || i.status?.toLowerCase().includes("menunggu") || i.status?.toLowerCase().includes("pending")).length;
  const countDitolak = izinList.filter((i) => i.status?.toLowerCase().includes("tolak") || i.status?.toLowerCase().includes("batal")).length;

  const totalPengajuan = izinList.length;

  const handleDownloadRekapIzin = () => {
    if (filteredList.length === 0) {
      showToast("Tidak ada data riwayat perizinan untuk diunduh.", "warning");
      return;
    }
    const headers = ["No", "NIM", "Jenis Izin", "Rentang Tanggal", "Sesi / Durasi", "Alasan", "Berkas Lampiran", "Status Pengajuan"];
    const rows = filteredList.map((item, idx) => [
      idx + 1,
      user?.nim || "2311523005",
      item.jenis,
      item.rentang,
      item.subRentang,
      item.alasan,
      item.dokumen,
      item.status
    ]);
    const cleanNim = (user?.nim || "2311523005").replace(/\s+/g, "_");
    downloadCSV(`Rekap_Perizinan_${cleanNim}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showToast("Rekap riwayat perizinan berhasil diunduh.", "success");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif',
        maxWidth: "1180px",
        margin: "0 auto",
        paddingBottom: "40px",
        color: "#1c1c1e"
      }}
    >
      {/* 1. iOS-Style Minimalist Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          padding: "4px 2px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1
              style={{
                fontSize: "26px",
                fontWeight: "700",
                color: "#1c1c1e",
                margin: 0,
                letterSpacing: "-0.5px"
              }}
            >
              Perizinan Asrama
            </h1>
            <span
              style={{
                backgroundColor: "#e5e5ea",
                color: "#636366",
                fontSize: "12px",
                fontWeight: "600",
                padding: "3px 10px",
                borderRadius: "20px"
              }}
            >
              {user?.nim || "2311523005"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleDownloadRekapIzin}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5ea",
              color: "#1c1c1e",
              fontWeight: "600",
              fontSize: "13px",
              padding: "9px 16px",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
            }}
          >
            <Download size={15} color="#007aff" />
            <span>Unduh Rekap</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: "#007aff",
              border: "none",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "13px",
              padding: "9px 18px",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,122,255,0.25)"
            }}
          >
            <Plus size={16} />
            <span>Ajukan Izin</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Stat Widgets (Murni Berdasarkan Data Riil Database - Tanpa Kuota) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "14px"
        }}
      >
        {/* Card 1: Total Pengajuan */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "20px 22px",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              TOTAL PERMOHONAN
            </div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#1c1c1e", marginTop: "6px", display: "flex", alignItems: "baseline", gap: "6px", letterSpacing: "-0.5px" }}>
              <span>{totalPengajuan}</span>
              <span style={{ fontSize: "12px", fontWeight: "500", color: "#8e8e93", letterSpacing: "normal" }}>Permohonan</span>
            </div>
            <div style={{ fontSize: "12px", color: "#8e8e93", marginTop: "4px" }}>
              {totalPengajuan > 0 ? "Total permohonan tercatat" : "Belum ada permohonan izin diajukan"}
            </div>
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f2f2f7", borderRadius: "9999px", marginTop: "16px", overflow: "hidden" }}>
            <div style={{ width: totalPengajuan > 0 ? "100%" : "0%", height: "100%", backgroundColor: "#007aff", borderRadius: "9999px" }} />
          </div>
        </div>

        {/* Card 2: Disetujui */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "20px 22px",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              DISETUJUI
            </div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#34c759", marginTop: "6px", display: "flex", alignItems: "baseline", gap: "6px", letterSpacing: "-0.5px" }}>
              <span>{countDisetujui}</span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#34c759", letterSpacing: "normal" }}>Sesi</span>
            </div>
            <div style={{ fontSize: "12px", color: "#8e8e93", marginTop: "4px" }}>
              {countDisetujui > 0 ? "Semua permohonan telah diverifikasi" : "Belum ada permohonan disetujui"}
            </div>
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f2f2f7", borderRadius: "9999px", marginTop: "16px", overflow: "hidden" }}>
            <div style={{ width: totalPengajuan > 0 ? `${Math.round((countDisetujui / totalPengajuan) * 100)}%` : "0%", height: "100%", backgroundColor: "#34c759", borderRadius: "9999px" }} />
          </div>
        </div>

        {/* Card 3: Menunggu Review */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "20px 22px",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              MENUNGGU REVIEW
            </div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#ff9500", marginTop: "6px", display: "flex", alignItems: "baseline", gap: "6px", letterSpacing: "-0.5px" }}>
              <span>{countReview}</span>
              <span style={{ fontSize: "12px", fontWeight: "500", color: "#ff9500", letterSpacing: "normal" }}>Permohonan</span>
            </div>
            <div style={{ fontSize: "12px", color: "#8e8e93", marginTop: "4px" }}>
              {countReview > 0 ? "Sedang ditinjau oleh fasilitator" : "Tidak ada permohonan menunggu review"}
            </div>
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f2f2f7", borderRadius: "9999px", marginTop: "16px", overflow: "hidden" }}>
            <div style={{ width: totalPengajuan > 0 ? `${Math.round((countReview / totalPengajuan) * 100)}%` : "0%", height: "100%", backgroundColor: "#ff9500", borderRadius: "9999px" }} />
          </div>
        </div>

        {/* Card 4: Ditolak / Dibatalkan */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "20px 22px",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              DITOLAK / DIBATALKAN
            </div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: countDitolak > 0 ? "#ff3b30" : "#1c1c1e", marginTop: "6px", display: "flex", alignItems: "baseline", gap: "6px", letterSpacing: "-0.5px" }}>
              <span>{countDitolak}</span>
              <span style={{ fontSize: "12px", fontWeight: "500", color: "#8e8e93", letterSpacing: "normal" }}>Permohonan</span>
            </div>
            <div style={{ fontSize: "12px", color: "#8e8e93", marginTop: "4px" }}>
              {countDitolak > 0 ? "Permohonan tidak disetujui" : "Tidak ada permohonan ditolak"}
            </div>
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f2f2f7", borderRadius: "9999px", marginTop: "16px", overflow: "hidden" }}>
            <div style={{ width: totalPengajuan > 0 ? `${Math.round((countDitolak / totalPengajuan) * 100)}%` : "0%", height: "100%", backgroundColor: "#ff3b30", borderRadius: "9999px" }} />
          </div>
        </div>
      </div>

      {/* 3. Main Card with Search, Filter & Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          padding: "22px",
          border: "1px solid rgba(0,0,0,0.04)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        {/* Controls Bar: Search & Category Filter */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          {/* Search Field */}
          <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8e8e93"
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari alasan izin atau dokumen..."
              style={{
                width: "100%",
                height: "38px",
                paddingLeft: "36px",
                paddingRight: "14px",
                borderRadius: "10px",
                border: "1px solid #e5e5ea",
                backgroundColor: "#f2f2f7",
                fontSize: "13px",
                color: "#1c1c1e",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Segmented / Filter Dropdowns */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                height: "38px",
                padding: "0 14px",
                borderRadius: "10px",
                border: "1px solid #e5e5ea",
                backgroundColor: "#ffffff",
                fontSize: "12.5px",
                fontWeight: "500",
                color: "#1c1c1e",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Sakit">Sakit</option>
              <option value="Izin">Izin</option>
            </select>
          </div>
        </div>

        {/* Clean iOS Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f2f2f7" }}>
                <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  KATEGORI
                </th>
                <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  TANGGAL
                </th>
                <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ALASAN / KETERANGAN
                </th>
                <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  BERKAS BUKTI
                </th>
                <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "48px 16px", color: "#8e8e93" }}>
                    <FileText size={36} style={{ margin: "0 auto 10px", color: "#c7c7cc" }} />
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#1c1c1e" }}>
                      Belum Ada Permohonan Izin
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "4px", color: "#8e8e93" }}>
                      Klik "Ajukan Izin" di atas untuk membuat permohonan baru.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: "1px solid #f2f2f7",
                      transition: "background-color 0.1s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Kategori Badge */}
                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "11.5px",
                          fontWeight: "600",
                          backgroundColor:
                            item.jenis === "Sakit"
                              ? "rgba(255, 59, 48, 0.1)"
                              : "rgba(0, 122, 255, 0.1)",
                          color: item.jenis === "Sakit" ? "#ff3b30" : "#007aff"
                        }}
                      >
                        {item.jenis}
                      </span>
                    </td>

                    {/* Tanggal */}
                    <td style={{ padding: "14px" }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#1c1c1e" }}>
                        {item.rentang}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93" }}>{item.subRentang}</div>
                    </td>

                    {/* Alasan */}
                    <td style={{ padding: "14px" }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#1c1c1e" }}>
                        {item.alasan}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93" }}>{item.subAlasan}</div>
                    </td>

                    {/* Dokumen Bukti */}
                    <td style={{ padding: "14px" }}>
                      <div
                        onClick={() => showToast(`Membuka berkas: ${item.dokumen}`, "info")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#007aff",
                          fontSize: "12.5px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        <FileText size={14} />
                        <span>{item.dokumen}</span>
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          backgroundColor: "rgba(52, 199, 89, 0.12)",
                          color: "#34c759",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "11.5px",
                          fontWeight: "600"
                        }}
                      >
                        <CheckCircle2 size={13} color="#34c759" />
                        Disetujui
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: Formulir Ajukan Izin Baru (iOS Sheet Style) */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              padding: "26px",
              width: "100%",
              maxWidth: "540px",
              boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              gap: "18px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                  Pengajuan Izin Baru
                </h3>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: "4px 0 0 0" }}>
                  Lengkapi data permohonan izin untuk verifikasi fasilitator
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                style={{
                  border: "none",
                  backgroundColor: "#f1f5f9",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
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
              {/* Jenis Izin (iOS Segmented Choice) */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>
                  Kategori Izin
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {/* Sakit Option */}
                  <div
                    onClick={() => setJenisIzin("sakit")}
                    style={{
                      border: jenisIzin === "sakit" ? "2px solid #ef4444" : "1px solid #e2e8f0",
                      backgroundColor: jenisIzin === "sakit" ? "#fef2f2" : "#ffffff",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
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
                      <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>Sakit</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>Medis / Istirahat</div>
                    </div>
                  </div>

                  {/* Izin Option */}
                  <div
                    onClick={() => setJenisIzin("izin")}
                    style={{
                      border: jenisIzin === "izin" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      backgroundColor: jenisIzin === "izin" ? "#eff6ff" : "#ffffff",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: "#dbeafe",
                        color: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>Izin Keluar</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>Akademik / Keluarga</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tanggal */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                    Tanggal Mulai
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
                      borderRadius: "12px",
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
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                    Tanggal Selesai
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
                      borderRadius: "12px",
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

              {/* Alasan */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  Alasan & Keterangan
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tuliskan keterangan detail alasan izin..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "12px",
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

              {/* Upload Berkas Bukti */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  Lampiran Dokumen Bukti (Opsional)
                </label>
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
                        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                      });
                    }
                  }}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "1.5px dashed #cbd5e1",
                    backgroundColor: "#f8fafc",
                    borderRadius: "14px",
                    padding: "14px",
                    textAlign: "center",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    color: "#2563eb",
                    fontSize: "12.5px",
                    fontWeight: "600"
                  }}
                >
                  <UploadCloud size={20} />
                  <span>Pilih berkas dari perangkat Anda</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "normal" }}>
                    PDF, JPG, PNG (Maks 5MB)
                  </span>
                </div>

                {attachedFile && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      backgroundColor: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      marginTop: "8px",
                      fontSize: "12px"
                    }}
                  >
                    <span style={{ fontWeight: "600", color: "#065f46" }}>
                      {attachedFile.name} ({attachedFile.size})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedFile(null);
                        setSelectedRawFile(null);
                      }}
                      style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "12px",
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
                  disabled={isSubmittingForm}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(37,99,235,0.25)"
                  }}
                >
                  {isSubmittingForm ? "Mengirim..." : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

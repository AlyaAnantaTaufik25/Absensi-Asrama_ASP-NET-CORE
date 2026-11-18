import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  RotateCcw,
  Check,
  X,
  Eye,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Building,
  Phone,
  ExternalLink,
  Download
} from "lucide-react";
import { getPerizinan, getUsers, updatePerizinanStatus, API_BASE_URL } from "../../services/api";

export default function IzinDaruratPage({ onCountChange }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua"); // "semua" | "menunggu" | "disetujui" | "ditolak"
  const [categoryFilter, setCategoryFilter] = useState("semua");

  // Modal Detail State & Bukti Preview State
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [previewBukti, setPreviewBukti] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [izinList, userList] = await Promise.all([getPerizinan(), getUsers()]);
        if (Array.isArray(izinList) && izinList.length > 0) {
          const mapped = izinList.map((item, index) => {
            const user = Array.isArray(userList)
              ? userList.find((u) => u.nim === item.nim)
              : null;

            const alasanLower = (item.alasan || "").toLowerCase();
            let kategori = "Lainnya";
            if (alasanLower.includes("sakit") || alasanLower.includes("dokter") || alasanLower.includes("medis") || alasanLower.includes("rumah sakit") || alasanLower.includes("klinik")) {
              kategori = "Medis / Sakit";
            } else if (alasanLower.includes("keluarga") || alasanLower.includes("orang tua") || alasanLower.includes("meninggal") || alasanLower.includes("darurat")) {
              kategori = "Keluarga / Darurat";
            } else if (alasanLower.includes("kuliah") || alasanLower.includes("tugas") || alasanLower.includes("lomba") || alasanLower.includes("kampus")) {
              kategori = "Akademik";
            }

            return {
              id: item.idIzin || index + 1,
              code: `IZN-${String(item.idIzin || index + 1).padStart(3, "0")}`,
              nim: item.nim || "-",
              name: user?.nama || `Mahasiswa (${item.nim || "-"})`,
              room: user?.nomorKamar ? `${user.nomorKamar}` : "B-302",
              gender: user?.jenisKelamin || "-",
              asal: user?.asal || "Mahasiswa Asrama",
              date: item.tanggal
                ? new Date(item.tanggal).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })
                : new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  }),
              time: item.tanggal
                ? new Date(item.tanggal).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                : "20:15 WIB",
              kategori,
              purpose: item.alasan || "Keperluan perizinan resmi.",
              fileBukti: item.fileBukti || null,
              status: item.status ? item.status.toLowerCase() : "menunggu",
              catatanFasil: ""
            };
          });
          setRequests(mapped);
          if (onCountChange) onCountChange(mapped.filter((m) => m.status === "menunggu").length);
        } else {
          setRequests([]);
          if (onCountChange) onCountChange(0);
        }
      } catch (err) {
        console.warn("Gagal memuat izin:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [onCountChange]);

  const handleUpdateStatus = async (id, newStatus, catatan = "") => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              catatanFasil: catatan || (newStatus === "disetujui" ? "Disetujui oleh Fasilitator." : "Pengajuan izin ditolak oleh Fasilitator.")
            }
          : r
      )
    );

    if (selectedDetail && selectedDetail.id === id) {
      setSelectedDetail((prev) => ({
        ...prev,
        status: newStatus,
        catatanFasil: catatan || (newStatus === "disetujui" ? "Disetujui oleh Fasilitator." : "Pengajuan izin ditolak oleh Fasilitator.")
      }));
    }

    try {
      await updatePerizinanStatus(id, newStatus);
    } catch (err) {
      console.warn("Gagal update status izin ke backend:", err);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.nim.toLowerCase().includes(q) ||
        item.room.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.purpose.toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter !== "semua") {
        matchesStatus = item.status === statusFilter;
      }

      let matchesCategory = true;
      if (categoryFilter !== "semua") {
        if (categoryFilter === "medis") matchesCategory = item.kategori.includes("Medis");
        else if (categoryFilter === "keluarga") matchesCategory = item.kategori.includes("Keluarga");
        else if (categoryFilter === "akademik") matchesCategory = item.kategori.includes("Akademik");
        else if (categoryFilter === "lainnya") matchesCategory = item.kategori.includes("Lainnya");
      }

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [requests, searchQuery, statusFilter, categoryFilter]);

  const countTotal = requests.length;
  const countMenunggu = requests.filter((r) => r.status === "menunggu").length;
  const countDisetujui = requests.filter((r) => r.status === "disetujui").length;
  const countDitolak = requests.filter((r) => r.status === "ditolak").length;

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("semua");
    setCategoryFilter("semua");
  };

  const fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: fontStack }}>
      {/* 1. Header Row (Nama diubah menjadi Izin, deskripsi dihapus sesuai revisi) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: "700",
            color: "#1c1c1e",
            margin: 0,
            letterSpacing: "-0.5px"
          }}
        >
          Izin
        </h1>
      </div>

      {/* 2. Metric Stat Cards (Deskripsi subteks dihapus sesuai revisi) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px"
        }}
      >
        {/* Total Izin */}
        <div
          onClick={() => setStatusFilter("semua")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "20px 22px 18px 22px",
            border: statusFilter === "semua" ? "1.5px solid #007aff" : "1px solid rgba(0, 0, 0, 0.04)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              Total Pengajuan
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#1c1c1e" }}>
              {countTotal}
            </div>
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f2f2f7", borderRadius: "9999px", marginTop: "16px", overflow: "hidden" }}>
            <div style={{ width: "100%", height: "100%", backgroundColor: "#007aff", borderRadius: "9999px" }} />
          </div>
        </div>

        {/* Menunggu Review */}
        <div
          onClick={() => setStatusFilter("menunggu")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "20px 22px 18px 22px",
            border: statusFilter === "menunggu" ? "1.5px solid #ff9500" : "1px solid rgba(0, 0, 0, 0.04)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              Menunggu Review
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#ff9500" }}>
              {countMenunggu}
            </div>
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f2f2f7", borderRadius: "9999px", marginTop: "16px", overflow: "hidden" }}>
            <div style={{ width: countTotal > 0 ? `${(countMenunggu / countTotal) * 100}%` : "0%", height: "100%", backgroundColor: "#ff9500", borderRadius: "9999px" }} />
          </div>
        </div>

        {/* Disetujui */}
        <div
          onClick={() => setStatusFilter("disetujui")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "20px 22px 18px 22px",
            border: statusFilter === "disetujui" ? "1.5px solid #34c759" : "1px solid rgba(0, 0, 0, 0.04)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              Disetujui
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#34c759" }}>
              {countDisetujui}
            </div>
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f2f2f7", borderRadius: "9999px", marginTop: "16px", overflow: "hidden" }}>
            <div style={{ width: countTotal > 0 ? `${(countDisetujui / countTotal) * 100}%` : "0%", height: "100%", backgroundColor: "#34c759", borderRadius: "9999px" }} />
          </div>
        </div>

        {/* Ditolak */}
        <div
          onClick={() => setStatusFilter("ditolak")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "20px 22px 18px 22px",
            border: statusFilter === "ditolak" ? "1.5px solid #ff3b30" : "1px solid rgba(0, 0, 0, 0.04)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              Ditolak
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#ff3b30" }}>
              {countDitolak}
            </div>
          </div>
          <div style={{ width: "100%", height: "4px", backgroundColor: "#f2f2f7", borderRadius: "9999px", marginTop: "16px", overflow: "hidden" }}>
            <div style={{ width: countTotal > 0 ? `${(countDitolak / countTotal) * 100}%` : "0%", height: "100%", backgroundColor: "#ff3b30", borderRadius: "9999px" }} />
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          padding: "16px 20px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
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
              gap: "10px",
              backgroundColor: "#f2f2f7",
              border: "1px solid #e5e5ea",
              borderRadius: "12px",
              padding: "8px 14px",
              flex: "1 1 240px",
              minWidth: "220px"
            }}
          >
            <Search size={16} color="#8e8e93" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama mahasiswa, NIM, atau alasan..."
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "13.5px",
                width: "100%",
                color: "#1c1c1e",
                fontFamily: fontStack
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8e8e93", padding: 0 }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#8e8e93" }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "12px",
                border: "1px solid #e5e5ea",
                backgroundColor: "#f2f2f7",
                fontSize: "13px",
                color: "#1c1c1e",
                cursor: "pointer",
                outline: "none",
                fontFamily: fontStack
              }}
            >
              <option value="semua">Semua Status</option>
              <option value="menunggu">Menunggu</option>
              <option value="disetujui">Disetujui</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>

          {/* Kategori Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#8e8e93" }}>Kategori:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "12px",
                border: "1px solid #e5e5ea",
                backgroundColor: "#f2f2f7",
                fontSize: "13px",
                color: "#1c1c1e",
                cursor: "pointer",
                outline: "none",
                fontFamily: fontStack
              }}
            >
              <option value="semua">Semua Kategori</option>
              <option value="medis">Medis / Sakit</option>
              <option value="keluarga">Keluarga / Darurat</option>
              <option value="akademik">Akademik</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
        </div>

        {/* Counter and Reset */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "#8e8e93" }}>
            Menampilkan <strong style={{ color: "#1c1c1e" }}>{filteredRequests.length}</strong> dari {requests.length} data
          </span>
          {(searchQuery || statusFilter !== "semua" || categoryFilter !== "semua") && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                backgroundColor: "#f2f2f7",
                color: "#1c1c1e",
                border: "1px solid #e5e5ea",
                borderRadius: "10px",
                padding: "7px 12px",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: fontStack
              }}
            >
              <RotateCcw size={13} /> Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* 4. Main Table Card (ID Izin diubah menjadi Nomor sesuai revisi) */}
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
              <tr
                style={{
                  backgroundColor: "#fafafc",
                  borderBottom: "1px solid #e5e5ea",
                  color: "#8e8e93",
                  fontSize: "11.5px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                <th style={{ padding: "16px 20px" }}>Nomor</th>
                <th style={{ padding: "16px 20px" }}>Nama Mahasiswa</th>
                <th style={{ padding: "16px 20px" }}>Kamar</th>
                <th style={{ padding: "16px 20px" }}>Tanggal & Waktu</th>
                <th style={{ padding: "16px 20px" }}>Kategori</th>
                <th style={{ padding: "16px 20px", maxWidth: "260px" }}>Alasan / Keperluan</th>
                <th style={{ padding: "16px 20px" }}>Bukti</th>
                <th style={{ padding: "16px 20px" }}>Status</th>
                <th style={{ padding: "16px 20px", textAlign: "right" }}>Aksi Persetujuan</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "48px 16px", color: "#8e8e93" }}>
                    <div style={{ fontSize: "15px", fontWeight: "600", color: "#1c1c1e" }}>
                      Tidak Ada Data Pengajuan Izin
                    </div>
                    <div style={{ fontSize: "13px", marginTop: "4px", color: "#8e8e93" }}>
                      {searchQuery || statusFilter !== "semua" || categoryFilter !== "semua"
                        ? "Coba sesuaikan kata kunci pencarian atau ubah filter status/kategori."
                        : "Belum ada mahasiswa yang mengajukan perizinan."}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((item, index) => {
                  let badgeBg = "rgba(255, 149, 0, 0.12)";
                  let badgeColor = "#ff9500";
                  let statusLabel = "Menunggu";

                  if (item.status === "disetujui") {
                    badgeBg = "rgba(52, 199, 89, 0.12)";
                    badgeColor = "#34c759";
                    statusLabel = "Disetujui";
                  } else if (item.status === "ditolak") {
                    badgeBg = "rgba(255, 59, 48, 0.12)";
                    badgeColor = "#ff3b30";
                    statusLabel = "Ditolak";
                  }

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: index === filteredRequests.length - 1 ? "none" : "1px solid #f2f2f7",
                        transition: "background-color 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Nomor (Kolom Nomor urut sesuai revisi) */}
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            fontWeight: "700",
                            color: "#1c1c1e",
                            fontSize: "13px"
                          }}
                        >
                          {index + 1}
                        </span>
                      </td>

                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: "600", color: "#1c1c1e" }}>{item.name}</div>
                        <div style={{ fontSize: "12px", color: "#8e8e93" }}>NIM: {item.nim}</div>
                      </td>

                      <td style={{ padding: "14px 20px", fontWeight: "600", color: "#1c1c1e" }}>
                        {item.room}
                      </td>

                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: "500", color: "#1c1c1e" }}>{item.date}</div>
                        <div style={{ fontSize: "12px", color: "#8e8e93" }}>{item.time}</div>
                      </td>

                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            backgroundColor: "rgba(142, 142, 147, 0.12)",
                            color: "#1c1c1e",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            padding: "3px 8px",
                            borderRadius: "8px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {item.kategori}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "14px 20px",
                          maxWidth: "260px",
                          color: "#1c1c1e",
                          lineHeight: "1.4"
                        }}
                      >
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                          title={item.purpose}
                        >
                          {item.purpose}
                        </div>
                      </td>

                      {/* Bukti File: fasil bisa melihat bukti perizinan mahasiswa */}
                      <td style={{ padding: "14px 20px" }}>
                        {item.fileBukti ? (
                          <button
                            type="button"
                            onClick={() => setPreviewBukti(item)}
                            title="Klik untuk melihat bukti perizinan mahasiswa"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              backgroundColor: "rgba(0, 122, 255, 0.08)",
                              padding: "5px 10px",
                              borderRadius: "8px",
                              fontSize: "11.5px",
                              color: "#007aff",
                              fontWeight: "600",
                              border: "none",
                              cursor: "pointer"
                            }}
                          >
                            <FileText size={13} />
                            <span>Lihat Bukti</span>
                          </button>
                        ) : (
                          <span style={{ color: "#8e8e93", fontSize: "12px" }}>Tanpa bukti</span>
                        )}
                      </td>

                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            backgroundColor: badgeBg,
                            color: badgeColor,
                            fontSize: "12px",
                            fontWeight: "600",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            display: "inline-block",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {statusLabel}
                        </span>
                      </td>

                      {/* Aksi Persetujuan / Penolakan (Button Setujui dan Tolak) */}
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            title="Setujui Izin Mahasiswa"
                            onClick={() => handleUpdateStatus(item.id, "disetujui")}
                            style={{
                              backgroundColor: item.status === "disetujui" ? "#34c759" : "rgba(52, 199, 89, 0.12)",
                              color: item.status === "disetujui" ? "#ffffff" : "#34c759",
                              border: "1px solid rgba(52, 199, 89, 0.3)",
                              borderRadius: "8px",
                              padding: "6px 10px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontFamily: fontStack
                            }}
                          >
                            <Check size={13} strokeWidth={2.5} /> Setujui
                          </button>

                          <button
                            type="button"
                            title="Tolak Izin Mahasiswa"
                            onClick={() => handleUpdateStatus(item.id, "ditolak")}
                            style={{
                              backgroundColor: item.status === "ditolak" ? "#ff3b30" : "rgba(255, 59, 48, 0.08)",
                              color: item.status === "ditolak" ? "#ffffff" : "#ff3b30",
                              border: "1px solid rgba(255, 59, 48, 0.3)",
                              borderRadius: "8px",
                              padding: "6px 10px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontFamily: fontStack
                            }}
                          >
                            <X size={13} strokeWidth={2.5} /> Tolak
                          </button>

                          <button
                            type="button"
                            title="Lihat Detail Lengkap"
                            onClick={() => setSelectedDetail(item)}
                            style={{
                              backgroundColor: "#f2f2f7",
                              color: "#1c1c1e",
                              border: "1px solid #e5e5ea",
                              borderRadius: "8px",
                              padding: "6px 10px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontFamily: fontStack
                            }}
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Preview Bukti File */}
      {previewBukti && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
            fontFamily: fontStack
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "560px",
              padding: "26px",
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={20} color="#007aff" />
                <h2 style={{ fontSize: "17px", fontWeight: "700", color: "#1c1c1e", margin: 0 }}>
                  Bukti Perizinan Mahasiswa
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewBukti(null)}
                style={{ background: "none", border: "none", color: "#8e8e93", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: "#f2f2f7", padding: "12px 16px", borderRadius: "12px", fontSize: "13px" }}>
              <div style={{ fontWeight: "700", color: "#1c1c1e" }}>{previewBukti.name} ({previewBukti.nim})</div>
              <div style={{ color: "#8e8e93", marginTop: "2px" }}>Kamar: {previewBukti.room} • Alasan: {previewBukti.purpose}</div>
            </div>

            {/* Preview Box */}
            <div
              style={{
                borderRadius: "14px",
                border: "1px solid #e5e5ea",
                backgroundColor: "#fafafc",
                padding: "20px",
                textAlign: "center",
                minHeight: "220px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px"
              }}
            >
              {(() => {
                const fileName = previewBukti.fileBukti || "";
                const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName) || fileName.startsWith("data:image");
                const isPdf = /\.pdf$/i.test(fileName);
                const fileUrl = fileName.startsWith("http") || fileName.startsWith("data:")
                  ? fileName
                  : `${API_BASE_URL}/uploads/${fileName}`;

                if (isImage) {
                  return (
                    <img
                      src={fileUrl}
                      alt="Bukti Lampiran"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "320px",
                        objectFit: "contain",
                        borderRadius: "10px",
                        border: "1px solid #e5e5ea"
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  );
                }

                if (isPdf) {
                  return (
                    <iframe
                      src={fileUrl}
                      title="Bukti PDF"
                      style={{
                        width: "100%",
                        height: "400px",
                        border: "none",
                        borderRadius: "10px"
                      }}
                    />
                  );
                }

                return null;
              })()}

              <div
                style={{
                  display: (() => {
                    const fileName = previewBukti.fileBukti || "";
                    const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName) || fileName.startsWith("data:image");
                    const isPdf = /\.pdf$/i.test(fileName);
                    return (isImage || isPdf) ? "none" : "flex";
                  })(),
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    backgroundColor: "rgba(0, 122, 255, 0.1)",
                    color: "#007aff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <FileText size={28} />
                </div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1c1c1e" }}>
                  {previewBukti.fileBukti}
                </div>
                <div style={{ fontSize: "12px", color: "#8e8e93" }}>
                  Dokumen lampiran surat izin resmi dari mahasiswa.
                </div>
                <a
                  href={(() => {
                    const fn = previewBukti.fileBukti || "";
                    return fn.startsWith("http") || fn.startsWith("data:")
                      ? fn
                      : `${API_BASE_URL}/uploads/${fn}`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "4px",
                    backgroundColor: "#007aff",
                    color: "#ffffff",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "600",
                    textDecoration: "none",
                    boxShadow: "0 2px 8px rgba(0,122,255,0.25)"
                  }}
                >
                  <Download size={14} /> Unduh / Buka Dokumen
                </a>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setPreviewBukti(null)}
                style={{
                  padding: "9px 18px",
                  borderRadius: "10px",
                  border: "1px solid #e5e5ea",
                  backgroundColor: "#f2f2f7",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Detail Modal */}
      {selectedDetail && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
            fontFamily: fontStack
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "540px",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              border: "1px solid rgba(0, 0, 0, 0.05)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <span
                  style={{
                    backgroundColor: "rgba(0, 122, 255, 0.08)",
                    color: "#007aff",
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "6px"
                  }}
                >
                  {selectedDetail.code}
                </span>
                <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1c1c1e", margin: "6px 0 0 0" }}>
                  Detail Permohonan Izin
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                style={{ background: "none", border: "none", color: "#8e8e93", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ backgroundColor: "#f2f2f7", borderRadius: "14px", padding: "14px 18px", border: "1px solid #e5e5ea" }}>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#1c1c1e" }}>
                  {selectedDetail.name}
                </div>
                <div style={{ fontSize: "13px", color: "#8e8e93", marginTop: "3px" }}>
                  NIM: {selectedDetail.nim} · Kamar: {selectedDetail.room}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ backgroundColor: "#fafafc", padding: "12px 14px", borderRadius: "12px", border: "1px solid #e5e5ea" }}>
                  <div style={{ fontSize: "11.5px", color: "#8e8e93", fontWeight: "600" }}>WAKTU PENGAJUAN</div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#1c1c1e", marginTop: "3px" }}>
                    {selectedDetail.date}, {selectedDetail.time}
                  </div>
                </div>
                <div style={{ backgroundColor: "#fafafc", padding: "12px 14px", borderRadius: "12px", border: "1px solid #e5e5ea" }}>
                  <div style={{ fontSize: "11.5px", color: "#8e8e93", fontWeight: "600" }}>KATEGORI IZIN</div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#1c1c1e", marginTop: "3px" }}>
                    {selectedDetail.kategori}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: "12.5px", fontWeight: "600", color: "#8e8e93", marginBottom: "4px" }}>
                  Alasan / Keperluan
                </div>
                <div style={{ backgroundColor: "#f2f2f7", padding: "12px 14px", borderRadius: "12px", fontSize: "13.5px", color: "#1c1c1e", lineHeight: "1.5" }}>
                  {selectedDetail.purpose}
                </div>
              </div>

              {selectedDetail.fileBukti && (
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: "600", color: "#8e8e93", marginBottom: "4px" }}>
                    Dokumen Bukti Pendukung
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewBukti(selectedDetail)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: "rgba(0, 122, 255, 0.08)",
                      padding: "8px 14px",
                      borderRadius: "10px",
                      color: "#007aff",
                      fontSize: "13px",
                      fontWeight: "600",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    <FileText size={15} />
                    <span>Lihat Berkas Bukti: {selectedDetail.fileBukti}</span>
                  </button>
                </div>
              )}

              {selectedDetail.catatanFasil && (
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: "600", color: "#8e8e93", marginBottom: "4px" }}>
                    Catatan Fasilitator
                  </div>
                  <div style={{ backgroundColor: "#fafafc", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e5e5ea", fontSize: "13px", color: "#1c1c1e" }}>
                    {selectedDetail.catatanFasil}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                style={{
                  padding: "9px 18px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  backgroundColor: "#f2f2f7",
                  color: "#8e8e93",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: fontStack
                }}
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedDetail.id, "ditolak")}
                style={{
                  padding: "9px 18px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  backgroundColor: selectedDetail.status === "ditolak" ? "#ff3b30" : "transparent",
                  color: selectedDetail.status === "ditolak" ? "#ffffff" : "#ff3b30",
                  border: "1px solid rgba(255, 59, 48, 0.3)",
                  cursor: "pointer",
                  fontFamily: fontStack
                }}
              >
                Tolak Izin
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedDetail.id, "disetujui")}
                style={{
                  padding: "9px 22px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  backgroundColor: "#34c759",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: fontStack,
                  boxShadow: "0 2px 8px rgba(52, 199, 89, 0.3)"
                }}
              >
                Setujui Izin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

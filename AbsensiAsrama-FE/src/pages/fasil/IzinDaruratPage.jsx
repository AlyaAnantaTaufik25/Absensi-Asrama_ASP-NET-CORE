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
  Download,
  Printer
} from "lucide-react";
import { getPerizinan, getUsers } from "../../services/api";
import { downloadCSV, printOfficialDocument } from "../../utils/exportUtils";

export default function IzinDaruratPage({ onCountChange }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua"); // "semua" | "menunggu" | "disetujui" | "ditolak"
  const [categoryFilter, setCategoryFilter] = useState("semua"); // "semua" | "medis" | "keluarga" | "akademik" | "lainnya"

  // Modal Detail State
  const [selectedDetail, setSelectedDetail] = useState(null);

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

            // Tentukan kategori dari isi alasan
            const alasanLower = (item.alasan || "").toLowerCase();
            let kategori = "Lainnya";
            if (alasanLower.includes("sakit") || alasanLower.includes("dokter") || alasanLower.includes("medis") || alasanLower.includes("rumah sakit") || alasanLower.includes("klinik")) {
              kategori = "Medis / Sakit";
            } else if (alasanLower.includes("keluarga") || alasanLower.includes("orang tua") || alasanLower.includes("meninggal") || alasanLower.includes("darurat")) {
              kategori = "Keluarga / Darurat";
            } else if (alasanLower.includes("kuliah") || alasanLower.includes("tugas") || alasanLower.includes("lomba") || alasanLower.includes("kampus")) {
              kategori = "Akademik";
            }

            // Status default: bagi yang id genap atau ada flag, default "menunggu"
            return {
              id: item.idIzin || index + 1,
              code: `IZN-${String(item.idIzin || index + 1).padStart(3, "0")}`,
              nim: item.nim || "-",
              name: user?.nama || `Mahasiswa (${item.nim || "Santri"})`,
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
              purpose: item.alasan || "Keperluan darurat setelah jam batas malam.",
              fileBukti: item.fileBukti || "Surat_Permohonan.pdf",
              status: "menunggu", // "menunggu" | "disetujui" | "ditolak"
              catatanFasil: ""
            };
          });
          setRequests(mapped);
          if (onCountChange) onCountChange(mapped.filter((m) => m.status === "menunggu").length);
        } else {
          // Data cadangan demonstrasi jika database MySQL masih kosong pengajuan
          const sampleData = [
            {
              id: 1,
              code: "IZN-001",
              nim: "2100018001",
              name: "Muhammad Rizky Pratama",
              room: "B-302",
              gender: "Laki-laki",
              asal: "Yogyakarta",
              date: "24 Mei 2024",
              time: "20:30 WIB",
              kategori: "Medis / Sakit",
              purpose: "Demam tinggi mendadak (39°C), perlu berobat ke IGD RS terdekat didampingi teman sekamar.",
              fileBukti: "Surat_Rujukan_Klinik.pdf",
              status: "menunggu",
              catatanFasil: ""
            },
            {
              id: 2,
              code: "IZN-002",
              nim: "2100018005",
              name: "Fajar Nugraha",
              room: "B-305",
              gender: "Laki-laki",
              asal: "Solo",
              date: "24 Mei 2024",
              time: "20:45 WIB",
              kategori: "Keluarga / Darurat",
              purpose: "Menjemput orang tua yang tiba di stasiun kereta pada malam hari karena jadwal kereta delay.",
              fileBukti: "Tiket_Kereta_Keluarga.jpg",
              status: "menunggu",
              catatanFasil: ""
            },
            {
              id: 3,
              code: "IZN-003",
              nim: "2100018012",
              name: "Ahmad Zaki Fauzan",
              room: "B-308",
              gender: "Laki-laki",
              asal: "Semarang",
              date: "23 Mei 2024",
              time: "21:10 WIB",
              kategori: "Akademik",
              purpose: "Menyelesaikan proyek robotika di laboratorium kampus untuk persiapan kompetisi nasional.",
              fileBukti: "Surat_Tugas_Laboratorium.pdf",
              status: "disetujui",
              catatanFasil: "Disetujui. Wajib lapor kembali ke pos satpam sebelum pukul 04:30 WIB."
            },
            {
              id: 4,
              code: "IZN-004",
              nim: "2100018018",
              name: "Bagus Setiawan",
              room: "B-310",
              gender: "Laki-laki",
              asal: "Klaten",
              date: "22 Mei 2024",
              time: "22:15 WIB",
              kategori: "Lainnya",
              purpose: "Membeli perlengkapan pribadi di luar asrama tanpa surat pendukung.",
              fileBukti: null,
              status: "ditolak",
              catatanFasil: "Sudah lewat jam malam (22:00 WIB) dan bukan keperluan darurat medis/keluarga."
            }
          ];
          setRequests(sampleData);
          if (onCountChange) onCountChange(sampleData.filter((m) => m.status === "menunggu").length);
        }
      } catch (err) {
        console.warn("Gagal memuat izin darurat:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [onCountChange]);

  // Actions
  const handleUpdateStatus = (id, newStatus, catatan = "") => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              catatanFasil: catatan || (newStatus === "disetujui" ? "Disetujui oleh Fasilitator Lantai." : "Pengajuan tidak memenuhi syarat darurat.")
            }
          : r
      )
    );

    if (selectedDetail && selectedDetail.id === id) {
      setSelectedDetail((prev) => ({
        ...prev,
        status: newStatus,
        catatanFasil: catatan || (newStatus === "disetujui" ? "Disetujui oleh Fasilitator Lantai." : "Pengajuan tidak memenuhi syarat darurat.")
      }));
    }
  };

  // Filtered List
  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      // Search check
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.nim.toLowerCase().includes(q) ||
        item.room.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.purpose.toLowerCase().includes(q);

      // Status check
      let matchesStatus = true;
      if (statusFilter !== "semua") {
        matchesStatus = item.status === statusFilter;
      }

      // Category check
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

  // Counts
  const countTotal = requests.length;
  const countMenunggu = requests.filter((r) => r.status === "menunggu").length;
  const countDisetujui = requests.filter((r) => r.status === "disetujui").length;
  const countDitolak = requests.filter((r) => r.status === "ditolak").length;

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("semua");
    setCategoryFilter("semua");
  };

  const handleExportCSV = () => {
    if (filteredRequests.length === 0) {
      alert("Tidak ada data izin darurat untuk diunduh.");
      return;
    }
    const headers = ["No", "Kode Izin", "Nama Santri", "NIM", "Kamar", "Kategori", "Keperluan", "Rentang Waktu", "Status"];
    const rows = filteredRequests.map((r, i) => [
      i + 1,
      r.code,
      r.name,
      r.nim,
      r.room,
      r.kategori,
      r.purpose,
      r.timeRange,
      r.status
    ]);
    downloadCSV(`Rekap_Izin_Darurat_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const handlePrintPDF = () => {
    if (filteredRequests.length === 0) {
      alert("Tidak ada data izin darurat untuk dicetak.");
      return;
    }
    const headers = ["Kode", "Nama Santri", "NIM", "Kamar", "Kategori", "Keperluan", "Status"];
    const rows = filteredRequests.map((r) => [
      r.code,
      r.name,
      r.nim,
      r.room,
      r.kategori,
      r.purpose,
      r.status.toUpperCase()
    ]);
    printOfficialDocument({
      title: "REKAPITULASI IZIN DARURAT SANTRI ASRAMA",
      subtitle: "Laporan Permohonan Izin Darurat, Sakit, & Malam Terverifikasi",
      metaInfo: [
        { label: "Unit Pengelola", value: "Fasilitator Asrama Mahasiswa Universitas Andalas" },
        { label: "Total Permohonan", value: `${filteredRequests.length} Pengajuan Tercatat (${countDisetujui} Disetujui, ${countMenunggu} Menunggu, ${countDitolak} Ditolak)` },
        { label: "Tanggal Dokumen", value: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) }
      ],
      headers,
      rows,
      signerName: "Fasilitator Jaga",
      signerRole: "Fasilitator Pendamping Asrama"
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#0f172a",
              margin: "0 0 6px 0",
              letterSpacing: "-0.5px"
            }}
          >
            Izin Darurat Santri
          </h1>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
            Daftar pengajuan izin darurat dan izin malam santri yang memerlukan verifikasi cepat fasilitator.
          </p>
        </div>

        {/* Action Buttons: Export CSV & Print PDF */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)"
            }}
          >
            <Download size={15} />
            <span>Unduh Rekap (.csv)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPDF}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              backgroundColor: "#ffffff",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <Printer size={15} color="#2563eb" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Metric Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px"
        }}
      >
        {/* Total Izin */}
        <div
          onClick={() => setStatusFilter("semua")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "16px 20px",
            border: statusFilter === "semua" ? "2px solid #2563eb" : "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <div style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "600", marginBottom: "6px" }}>
            Total Pengajuan
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>
            {countTotal}
          </div>
        </div>

        {/* Menunggu */}
        <div
          onClick={() => setStatusFilter("menunggu")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "16px 20px",
            border: statusFilter === "menunggu" ? "2px solid #d97706" : "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <div style={{ fontSize: "12.5px", color: "#d97706", fontWeight: "700", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={14} /> Menunggu Verifikasi
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#b45309" }}>
            {countMenunggu}
          </div>
        </div>

        {/* Disetujui */}
        <div
          onClick={() => setStatusFilter("disetujui")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "16px 20px",
            border: statusFilter === "disetujui" ? "2px solid #16a34a" : "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <div style={{ fontSize: "12.5px", color: "#16a34a", fontWeight: "700", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckCircle2 size={14} /> Disetujui
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#15803d" }}>
            {countDisetujui}
          </div>
        </div>

        {/* Ditolak */}
        <div
          onClick={() => setStatusFilter("ditolak")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "16px 20px",
            border: statusFilter === "ditolak" ? "2px solid #dc2626" : "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <div style={{ fontSize: "12.5px", color: "#dc2626", fontWeight: "700", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <XCircle size={14} /> Ditolak
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#b91c1c" }}>
            {countDitolak}
          </div>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "18px 20px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
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
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "8px 14px",
              flex: "1 1 240px",
              minWidth: "220px"
            }}
          >
            <Search size={16} color="#64748b" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama santri, NIM, kamar, alasan..."
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "13px",
                width: "100%",
                color: "#0f172a"
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#64748b" }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                fontSize: "13px",
                color: "#0f172a",
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="semua">Semua Status</option>
              <option value="menunggu">Menunggu</option>
              <option value="disetujui">Disetujui</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>

          {/* Kategori Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#64748b" }}>Kategori:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                fontSize: "13px",
                color: "#0f172a",
                cursor: "pointer",
                outline: "none"
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
          <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "600" }}>
            Menampilkan <strong style={{ color: "#0f172a" }}>{filteredRequests.length}</strong> dari {requests.length} data
          </span>
          {(searchQuery || statusFilter !== "semua" || categoryFilter !== "semua") && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "7px 12px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <RotateCcw size={13} /> Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* 4. Main Table Only Card */}
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
              <tr
                style={{
                  backgroundColor: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  color: "#64748b",
                  fontSize: "11.5px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                <th style={{ padding: "16px 20px" }}>ID Izin</th>
                <th style={{ padding: "16px 20px" }}>Santri / Penghuni</th>
                <th style={{ padding: "16px 20px" }}>Kamar</th>
                <th style={{ padding: "16px 20px" }}>Tanggal & Waktu</th>
                <th style={{ padding: "16px 20px" }}>Kategori</th>
                <th style={{ padding: "16px 20px", maxWidth: "260px" }}>Alasan / Keperluan</th>
                <th style={{ padding: "16px 20px" }}>Bukti</th>
                <th style={{ padding: "16px 20px" }}>Status</th>
                <th style={{ padding: "16px 20px", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#475569" }}>
                      Tidak Ada Data Pengajuan Izin
                    </div>
                    <div style={{ fontSize: "12.5px", marginTop: "4px", color: "#94a3b8" }}>
                      {searchQuery || statusFilter !== "semua" || categoryFilter !== "semua"
                        ? "Coba sesuaikan kata kunci pencarian atau ubah filter status/kategori."
                        : "Belum ada santri yang mengajukan izin darurat."}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((item, index) => {
                  let badgeBg = "#fef3c7";
                  let badgeColor = "#b45309";
                  let statusLabel = "Menunggu";

                  if (item.status === "disetujui") {
                    badgeBg = "#dcfce7";
                    badgeColor = "#15803d";
                    statusLabel = "Disetujui";
                  } else if (item.status === "ditolak") {
                    badgeBg = "#fee2e2";
                    badgeColor = "#b91c1c";
                    statusLabel = "Ditolak";
                  }

                  let catBg = "#f1f5f9";
                  let catColor = "#475569";
                  if (item.kategori.includes("Medis")) {
                    catBg = "#fee2e2";
                    catColor = "#b91c1c";
                  } else if (item.kategori.includes("Keluarga")) {
                    catBg = "#fef3c7";
                    catColor = "#b45309";
                  } else if (item.kategori.includes("Akademik")) {
                    catBg = "#e0e7ff";
                    catColor = "#4338ca";
                  }

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: index === filteredRequests.length - 1 ? "none" : "1px solid #f1f5f9",
                        transition: "background-color 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* ID Code */}
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            fontWeight: "700",
                            fontFamily: "monospace",
                            color: "#1e3fae",
                            backgroundColor: "#eff6ff",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "12px"
                          }}
                        >
                          {item.code}
                        </span>
                      </td>

                      {/* Penghuni */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: "700", color: "#0f172a" }}>{item.name}</div>
                        <div style={{ fontSize: "11.5px", color: "#64748b" }}>NIM: {item.nim}</div>
                      </td>

                      {/* Kamar */}
                      <td style={{ padding: "14px 20px", fontWeight: "600", color: "#334155" }}>
                        {item.room}
                      </td>

                      {/* Tanggal & Waktu */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: "600", color: "#1e293b" }}>{item.date}</div>
                        <div style={{ fontSize: "11.5px", color: "#64748b" }}>{item.time}</div>
                      </td>

                      {/* Kategori */}
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            backgroundColor: catBg,
                            color: catColor,
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {item.kategori}
                        </span>
                      </td>

                      {/* Alasan */}
                      <td
                        style={{
                          padding: "14px 20px",
                          maxWidth: "260px",
                          color: "#334155",
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

                      {/* Bukti Lampiran */}
                      <td style={{ padding: "14px 20px" }}>
                        {item.fileBukti ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              backgroundColor: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "11.5px",
                              color: "#2563eb",
                              fontWeight: "600"
                            }}
                          >
                            <FileText size={12} /> {item.fileBukti.length > 15 ? item.fileBukti.substring(0, 14) + "…" : item.fileBukti}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "12px" }}>Tanpa bukti</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            backgroundColor: badgeBg,
                            color: badgeColor,
                            fontSize: "11.5px",
                            fontWeight: "700",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            display: "inline-block",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {statusLabel}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {item.status === "menunggu" && (
                            <>
                              <button
                                type="button"
                                title="Setujui Izin"
                                onClick={() => handleUpdateStatus(item.id, "disetujui")}
                                style={{
                                  backgroundColor: "#16a34a",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "6px",
                                  padding: "6px 10px",
                                  fontSize: "11.5px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px"
                                }}
                              >
                                <Check size={13} /> Setujui
                              </button>
                              <button
                                type="button"
                                title="Tolak Izin"
                                onClick={() => handleUpdateStatus(item.id, "ditolak")}
                                style={{
                                  backgroundColor: "#ffffff",
                                  color: "#dc2626",
                                  border: "1px solid #fca5a5",
                                  borderRadius: "6px",
                                  padding: "5px 10px",
                                  fontSize: "11.5px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px"
                                }}
                              >
                                <X size={13} /> Tolak
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            title="Lihat Detail Lengkap"
                            onClick={() => setSelectedDetail(item)}
                            style={{
                              backgroundColor: "#f1f5f9",
                              color: "#475569",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                              padding: "6px 10px",
                              fontSize: "11.5px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Eye size={13} /> Detail
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

      {/* 5. Detail Modal */}
      {selectedDetail && (
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
              borderRadius: "18px",
              width: "100%",
              maxWidth: "540px",
              padding: "26px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    fontWeight: "700",
                    backgroundColor: "#eff6ff",
                    color: "#1e3fae",
                    padding: "3px 8px",
                    borderRadius: "6px"
                  }}
                >
                  {selectedDetail.code}
                </span>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "6px 0 2px 0" }}>
                  Detail Pengajuan Izin Darurat
                </h2>
                <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                  Diajukan pada {selectedDetail.date} · {selectedDetail.time}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Info Card */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                padding: "14px 16px",
                marginBottom: "16px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px"
              }}
            >
              <div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Nama Santri</div>
                <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>{selectedDetail.name}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>NIM</div>
                <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a", fontFamily: "monospace" }}>{selectedDetail.nim}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Kamar & Lantai</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Kamar {selectedDetail.room}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Asal Kota</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>{selectedDetail.asal}</div>
              </div>
            </div>

            {/* Reason & Category */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", marginBottom: "4px" }}>
                  Kategori Keperluan
                </div>
                <span
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#334155",
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "4px 10px",
                    borderRadius: "6px"
                  }}
                >
                  {selectedDetail.kategori}
                </span>
              </div>

              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", marginBottom: "4px" }}>
                  Alasan Lengkap
                </div>
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    fontSize: "13px",
                    color: "#1e293b",
                    lineHeight: "1.5"
                  }}
                >
                  {selectedDetail.purpose}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", marginBottom: "4px" }}>
                  Dokumen Bukti Pendukung
                </div>
                {selectedDetail.fileBukti ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", color: "#2563eb" }}>
                      <FileText size={16} />
                      {selectedDetail.fileBukti}
                    </div>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Tersimpan di Cloud</span>
                  </div>
                ) : (
                  <div style={{ fontSize: "12.5px", color: "#94a3b8" }}>Tidak ada dokumen yang dilampirkan.</div>
                )}
              </div>

              {selectedDetail.catatanFasil && (
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", marginBottom: "4px" }}>
                    Catatan Fasilitator
                  </div>
                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontSize: "12.5px",
                      color: "#475569"
                    }}
                  >
                    {selectedDetail.catatanFasil}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Status Saat Ini:</span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    backgroundColor:
                      selectedDetail.status === "disetujui"
                        ? "#dcfce7"
                        : selectedDetail.status === "ditolak"
                        ? "#fee2e2"
                        : "#fef3c7",
                    color:
                      selectedDetail.status === "disetujui"
                        ? "#15803d"
                        : selectedDetail.status === "ditolak"
                        ? "#b91c1c"
                        : "#b45309"
                  }}
                >
                  {selectedDetail.status.toUpperCase()}
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                {selectedDetail.status === "menunggu" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedDetail.id, "ditolak")}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                        color: "#dc2626",
                        border: "1px solid #fca5a5",
                        cursor: "pointer"
                      }}
                    >
                      Tolak Izin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedDetail.id, "disetujui")}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        backgroundColor: "#16a34a",
                        color: "#ffffff",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      Setujui Izin
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDetail(null)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

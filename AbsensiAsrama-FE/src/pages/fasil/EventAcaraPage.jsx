import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  CalendarDays,
  Trash2,
  Edit3,
  X,
  Users
} from "lucide-react";
import { getEvents, createEvent, updateEvent, deleteEvent } from "../../services/api";
import { showToast as globalToast } from "../../utils/toast";

export default function EventAcaraPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("semua");
  const [statusFilter, setStatusFilter] = useState("semua");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    judul: "",
    kategori: "Keagamaan",
    lokasi: "",
    tanggal: new Date().toISOString().split("T")[0],
    waktu: "19:30 WIB",
    deskripsi: "",
    penyelenggara: "Fasilitator Asrama",
    status: "Akan Datang"
  });
  const [toastMsg, setToastMsg] = useState("");

  const categories = [
    "Keagamaan",
    "Lingkungan",
    "Sosialisasi",
    "Akademik",
    "Olahraga",
    "Umum"
  ];

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      if (Array.isArray(data)) {
        setEvents(data);
      }
    } catch (err) {
      console.warn("Gagal mengambil event:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingEvent(null);
    setFormData({
      judul: "",
      kategori: "Keagamaan",
      lokasi: "",
      tanggal: new Date().toISOString().split("T")[0],
      waktu: "19:30 WIB",
      deskripsi: "",
      penyelenggara: "Fasilitator Asrama",
      status: "Akan Datang"
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (evt) => {
    setEditingEvent(evt);
    setFormData({
      judul: evt.judul || "",
      kategori: evt.kategori || "Keagamaan",
      lokasi: evt.lokasi || "",
      tanggal: evt.tanggal || new Date().toISOString().split("T")[0],
      waktu: evt.waktu || "19:30 WIB",
      deskripsi: evt.deskripsi || "",
      penyelenggara: evt.penyelenggara || "Fasilitator Asrama",
      status: evt.status || "Akan Datang"
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.judul.trim()) {
      globalToast("Mohon masukkan judul kegiatan.", "warning");
      return;
    }

    // Validasi: tanggal tidak boleh di masa lampau
    const today = new Date().toISOString().split("T")[0];
    if (formData.tanggal < today) {
      globalToast("Tanggal tidak boleh di masa lampau!", "warning");
      return;
    }

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.idEvent, formData);
        globalToast("Kegiatan berhasil diperbarui!", "success");
      } else {
        await createEvent(formData);
        globalToast("Kegiatan baru berhasil disimpan!", "success");
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (err) {
      globalToast("Gagal menyimpan kegiatan: " + err.message, "error");
    }
  };

  const handleDelete = async (idEvent, judul) => {
    if (!window.confirm(`Hapus acara "${judul}"?`)) return;
    try {
      await deleteEvent(idEvent);
      globalToast("Kegiatan berhasil dihapus!", "success");
      fetchEvents();
    } catch (err) {
      globalToast("Gagal menghapus kegiatan: " + err.message, "error");
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (evt.judul && evt.judul.toLowerCase().includes(q)) ||
        (evt.lokasi && evt.lokasi.toLowerCase().includes(q)) ||
        (evt.deskripsi && evt.deskripsi.toLowerCase().includes(q));

      const matchCat =
        categoryFilter === "semua" ||
        (evt.kategori && evt.kategori.toLowerCase() === categoryFilter.toLowerCase());

      const matchStat =
        statusFilter === "semua" ||
        (evt.status && evt.status.toLowerCase() === statusFilter.toLowerCase());

      return matchSearch && matchCat && matchStat;
    });
  }, [events, searchQuery, categoryFilter, statusFilter]);

  const countTotal = events.length;
  const countAkanDatang = events.filter((e) => e.status === "Akan Datang").length;
  const countSelesai = events.filter((e) => e.status === "Selesai").length;

  const fontStack =
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: fontStack }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#059669",
            padding: "12px 18px",
            borderRadius: "14px",
            fontSize: "13px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(5, 150, 105, 0.08)"
          }}
        >
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px"
        }}
      >
        <h1
          style={{
            fontSize: "26px",
            fontWeight: "700",
            color: "#1c1c1e",
            margin: 0,
            letterSpacing: "-0.5px"
          }}
        >
          Event / Acara Kegiatan
        </h1>

        <button
          type="button"
          onClick={handleOpenAddModal}
          style={{
            backgroundColor: "#007aff",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            padding: "10px 18px",
            fontSize: "13.5px",
            fontWeight: "600",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(0, 122, 255, 0.25)"
          }}
        >
          <Plus size={16} />
          <span>Tambah Kegiatan</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px"
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "18px 20px",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#8e8e93", textTransform: "uppercase" }}>
            Total Kegiatan
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#1c1c1e", marginTop: "6px" }}>
            {countTotal}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "18px 20px",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#8e8e93", textTransform: "uppercase" }}>
            Akan Datang
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#007aff", marginTop: "6px" }}>
            {countAkanDatang}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "18px 20px",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#8e8e93", textTransform: "uppercase" }}>
            Selesai
          </div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#34c759", marginTop: "6px" }}>
            {countSelesai}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          backgroundColor: "#ffffff",
          padding: "12px 16px",
          borderRadius: "14px",
          border: "1px solid rgba(0,0,0,0.04)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#f2f2f7",
              borderRadius: "10px",
              padding: "6px 12px",
              minWidth: "220px",
              flex: 1
            }}
          >
            <Search size={15} color="#8e8e93" />
            <input
              type="text"
              placeholder="Cari kegiatan atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "13px",
                width: "100%",
                fontFamily: fontStack
              }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "10px",
              border: "1px solid #e5e5ea",
              backgroundColor: "#f2f2f7",
              fontSize: "13px",
              fontFamily: fontStack,
              cursor: "pointer"
            }}
          >
            <option value="semua">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "10px",
              border: "1px solid #e5e5ea",
              backgroundColor: "#f2f2f7",
              fontSize: "13px",
              fontFamily: fontStack,
              cursor: "pointer"
            }}
          >
            <option value="semua">Semua Status</option>
            <option value="Akan Datang">Akan Datang</option>
            <option value="Sedang Berlangsung">Sedang Berlangsung</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>

        <div style={{ fontSize: "12.5px", color: "#8e8e93" }}>
          Menampilkan <strong style={{ color: "#1c1c1e" }}>{filteredEvents.length}</strong> kegiatan
        </div>
      </div>

      {/* Events List Cards */}
      {filteredEvents.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "48px 24px",
            textAlign: "center",
            border: "1px solid rgba(0,0,0,0.04)"
          }}
        >
          <CalendarDays size={36} color="#8e8e93" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: "15px", fontWeight: "600", color: "#1c1c1e" }}>
            Belum Ada Kegiatan Tercatat
          </div>
          <div style={{ fontSize: "13px", color: "#8e8e93", marginTop: "4px" }}>
            Klik tombol &quot;Tambah Kegiatan&quot; di atas untuk mencatat agenda asrama baru.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
          {filteredEvents.map((evt) => {
            const isFinished = evt.status === "Selesai";
            const badgeBg = isFinished
              ? "rgba(52, 199, 89, 0.12)"
              : evt.status === "Sedang Berlangsung"
              ? "rgba(255, 149, 0, 0.12)"
              : "rgba(0, 122, 255, 0.12)";
            const badgeColor = isFinished
              ? "#34c759"
              : evt.status === "Sedang Berlangsung"
              ? "#ff9500"
              : "#007aff";

            return (
              <div
                key={evt.idEvent}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "18px",
                  padding: "20px 22px",
                  border: "1px solid rgba(0,0,0,0.05)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                    <span
                      style={{
                        backgroundColor: "rgba(142, 142, 147, 0.12)",
                        color: "#1c1c1e",
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "3px 8px",
                        borderRadius: "6px"
                      }}
                    >
                      {evt.kategori || "Umum"}
                    </span>
                    <span
                      style={{
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "3px 8px",
                        borderRadius: "6px"
                      }}
                    >
                      {evt.status || "Akan Datang"}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#1c1c1e",
                      margin: "0 0 8px 0",
                      letterSpacing: "-0.3px",
                      lineHeight: "1.3"
                    }}
                  >
                    {evt.judul}
                  </h3>

                  {evt.deskripsi && (
                    <p
                      style={{
                        fontSize: "12.5px",
                        color: "#636366",
                        margin: "0 0 12px 0",
                        lineHeight: "1.4"
                      }}
                    >
                      {evt.deskripsi}
                    </p>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#8e8e93" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar size={13} color="#007aff" />
                      <span>{evt.tanggal}</span>
                      <span style={{ margin: "0 4px" }}>•</span>
                      <Clock size={13} color="#007aff" />
                      <span>{evt.waktu}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <MapPin size={13} color="#ff9500" />
                      <span>{evt.lokasi || "Lokasi menyusul"}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Users size={13} color="#8e8e93" />
                      <span>{evt.penyelenggara || "Pengelola Asrama"}</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                    borderTop: "1px solid #f2f2f7",
                    paddingTop: "12px"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(evt)}
                    style={{
                      backgroundColor: "#f2f2f7",
                      color: "#1c1c1e",
                      border: "none",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(evt.idEvent, evt.judul)}
                    style={{
                      backgroundColor: "rgba(255, 59, 48, 0.08)",
                      color: "#ff3b30",
                      border: "none",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <Trash2 size={12} /> Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              padding: "26px 28px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
              fontFamily: fontStack,
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1c1c1e", margin: 0 }}>
                {editingEvent ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#8e8e93"
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1c1c1e", marginBottom: "5px" }}>
                  Judul Acara / Kegiatan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kajian Rutin Malam Jumat"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #e5e5ea",
                    fontSize: "13px",
                    fontFamily: fontStack,
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1c1c1e", marginBottom: "5px" }}>
                    Kategori
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid #e5e5ea",
                      fontSize: "13px",
                      fontFamily: fontStack,
                      outline: "none",
                      backgroundColor: "#fff",
                      boxSizing: "border-box"
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1c1c1e", marginBottom: "5px" }}>
                    Status Kegiatan
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid #e5e5ea",
                      fontSize: "13px",
                      fontFamily: fontStack,
                      outline: "none",
                      backgroundColor: "#fff",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="Akan Datang">Akan Datang</option>
                    <option value="Sedang Berlangsung">Sedang Berlangsung</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1c1c1e", marginBottom: "5px" }}>
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid #e5e5ea",
                      fontSize: "13px",
                      fontFamily: fontStack,
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1c1c1e", marginBottom: "5px" }}>
                    Waktu / Jam
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 19:30 - 21:00 WIB"
                    value={formData.waktu}
                    onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid #e5e5ea",
                      fontSize: "13px",
                      fontFamily: fontStack,
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1c1c1e", marginBottom: "5px" }}>
                  Lokasi Kegiatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Aula Gedung Asrama Lantai 1"
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #e5e5ea",
                    fontSize: "13px",
                    fontFamily: fontStack,
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1c1c1e", marginBottom: "5px" }}>
                  Penyelenggara
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Fasilitator Binaan Lantai"
                  value={formData.penyelenggara}
                  onChange={(e) => setFormData({ ...formData, penyelenggara: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #e5e5ea",
                    fontSize: "13px",
                    fontFamily: fontStack,
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1c1c1e", marginBottom: "5px" }}>
                  Deskripsi / Keterangan Acara
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan keterangan ringkas mengenai agenda kegiatan ini..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #e5e5ea",
                    fontSize: "13px",
                    fontFamily: fontStack,
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e5e5ea",
                    backgroundColor: "#f2f2f7",
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
                    padding: "9px 18px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#007aff",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,122,255,0.25)"
                  }}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

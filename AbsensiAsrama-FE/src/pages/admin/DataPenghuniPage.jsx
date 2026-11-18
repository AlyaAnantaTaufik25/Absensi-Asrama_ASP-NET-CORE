import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Eye,
  ChevronDown
} from "lucide-react";

const API_BASE = "http://localhost:5250";

export default function DataPenghuniPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [gedungFilter, setGedungFilter] = useState("Semua Gedung");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [showModal, setShowModal] = useState(false);
  const [selectedPenghuni, setSelectedPenghuni] = useState(null);

  const [penghuniList, setPenghuniList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    nama: "",
    nim: "",
    asal: "",
    nomorKamar: "",
    jenisKelamin: "L",
    email: "",
    password: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // ── Fetch data from API ──────────────────────────────────────────────────
  const fetchPenghuni = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/users/penghuni`);
      if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      const mapped = data.map((u) => ({
        id: u.idUser,
        nama: u.nama,
        email: u.email,
        nim: u.nim,
        jk: u.jenisKelamin === "Perempuan" ? "P" : u.jenisKelamin === "Laki-laki" ? "L" : (u.jenisKelamin || "-"),
        lokasi: u.nomorKamar ? `Kamar ${u.nomorKamar}` : "-",
        asal: u.asal || "-",
        role: u.role,
        status: "Aktif"
      }));
      setPenghuniList(mapped);
    } catch (err) {
      setError(err.message || "Gagal memuat data penghuni.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPenghuni();
  }, []);

  // ── Tambah penghuni ──────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const payload = {
        nama: formData.nama,
        nim: formData.nim,
        asal: formData.asal,
        nomorKamar: formData.nomorKamar || null,
        jenisKelamin: formData.jenisKelamin === "L" ? "Laki-laki" : "Perempuan",
        email: formData.email,
        password: formData.password,
        role: "penghuni"
      };
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal menyimpan: ${res.status}`);
      }
      setShowModal(false);
      setFormData({ nama: "", nim: "", asal: "", nomorKamar: "", jenisKelamin: "L", email: "", password: "" });
      await fetchPenghuni();
    } catch (err) {
      setFormError(err.message || "Terjadi kesalahan saat menyimpan.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Hapus penghuni ───────────────────────────────────────────────────────
  const handleDelete = async (p) => {
    if (!window.confirm(`Hapus penghuni "${p.nama}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal menghapus: ${res.status}`);
      }
      await fetchPenghuni();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // ── Filter ───────────────────────────────────────────────────────────────
  const filteredList = penghuniList.filter((item) => {
    const matchSearch =
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nim || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchGedung =
      gedungFilter === "Semua Gedung" || item.lokasi.includes(gedungFilter);
    const matchStatus =
      statusFilter === "Semua Status" || item.status === statusFilter;
    return matchSearch && matchGedung && matchStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "800",
              color: "#2349d4",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              marginBottom: "4px"
            }}
          >
            MANAJEMEN PENGHUNI
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#0f172a",
              letterSpacing: "-0.4px",
              margin: "0 0 4px 0"
            }}
          >
            Data Penghuni
          </h1>
          <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
            Kelola data dan akses seluruh penghuni asrama.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: "#2349d4",
            border: "none",
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "12.5px",
            padding: "9px 18px",
            borderRadius: "10px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            boxShadow: "0 4px 14px -2px rgba(35, 73, 212, 0.4)"
          }}
        >
          <Plus size={15} />
          Tambah
        </button>
      </div>

      {/* 2. Content Card with Filters and Table */}
      <div className="content-card" style={{ padding: "20px 24px" }}>
        {/* Filter Controls Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "18px" }}>
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
              placeholder="Cari nama atau NIM..."
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

          {/* Gedung */}
          <select
            value={gedungFilter}
            onChange={(e) => setGedungFilter(e.target.value)}
            style={{ height: "38px", padding: "0 10px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px" }}
          >
            <option value="Semua Gedung">Semua Gedung</option>
            <option value="Gedung A">Gedung A</option>
            <option value="Gedung B">Gedung B</option>
            <option value="Gedung C">Gedung C</option>
          </select>

          {/* Lantai */}
          <select style={{ height: "38px", padding: "0 10px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px" }}>
            <option value="Semua">Semua Lantai</option>
            <option value="1">Lantai 1</option>
            <option value="2">Lantai 2</option>
          </select>

          {/* Kamar */}
          <select style={{ height: "38px", padding: "0 10px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px" }}>
            <option value="Semua">Semua Kamar</option>
            <option value="A-101">A-101</option>
            <option value="B-104">B-104</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: "38px", padding: "0 10px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px" }}
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: "13.5px" }}>
            Memuat data penghuni...
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "14px 18px",
            color: "#b91c1c",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <span style={{ fontWeight: "700" }}>⚠ Gagal memuat data:</span> {error}
            <button
              onClick={fetchPenghuni}
              style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: "6px", border: "1px solid #fca5a5", backgroundColor: "#fff", cursor: "pointer", fontSize: "12px", color: "#b91c1c", fontWeight: "600" }}
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && (
          <div className="data-table-container">
            <table className="asrama-data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>NIM</th>
                  <th>JK</th>
                  <th>Kamar</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#94a3b8", fontSize: "13px" }}>
                      {penghuniList.length === 0 ? "Belum ada data penghuni." : "Tidak ada data yang sesuai filter."}
                    </td>
                  </tr>
                ) : (
                  filteredList.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: "700", color: "#0f172a" }}>{p.nama}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{p.email}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: "600", color: "#334155" }}>{p.nim || "-"}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: "600", color: "#64748b" }}>{p.jk}</span>
                      </td>
                      <td>
                        <span style={{ color: "#334155" }}>{p.lokasi}</span>
                      </td>
                      <td>
                        {p.status === "Aktif" ? (
                          <span className="badge-status-green" style={{ fontSize: "11px", padding: "2px 10px" }}>
                            ● Aktif
                          </span>
                        ) : (
                          <span style={{ backgroundColor: "#f1f5f9", color: "#64748b", fontSize: "11px", fontWeight: "700", padding: "2px 10px", borderRadius: "9999px" }}>
                            ● Nonaktif
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={() => setSelectedPenghuni(p)}
                            style={{
                              backgroundColor: "#f0f6ff",
                              border: "1px solid #bfdbfe",
                              color: "#2349d4",
                              fontSize: "11px",
                              fontWeight: "700",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              cursor: "pointer"
                            }}
                          >
                            Lihat Detail
                          </button>
                          <button
                            style={{ border: "none", background: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
                            title="Edit"
                            onClick={() => alert(`Edit penghuni: ${p.nama}`)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                            title="Hapus"
                            onClick={() => handleDelete(p)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && !error && (
          <div className="table-pagination-row">
            <div style={{ fontSize: "12.5px", color: "#64748b" }}>
              {filteredList.length} data · Halaman 1 dari 1
            </div>
            <div className="pagination-controls">
              <button className="page-num-btn active">1</button>
            </div>
          </div>
        )}
      </div>

      {/* 3. MODAL: Tambah Penghuni */}
      {showModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-dialog-box" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#2349d4", letterSpacing: "1px", textTransform: "uppercase" }}>
                  DATA PENGHUNI
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                  Tambah Penghuni
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ border: "none", background: "#f1f5f9", borderRadius: "8px", width: "28px", height: "28px", cursor: "pointer" }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            {formError && (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", color: "#b91c1c", fontSize: "12.5px", marginBottom: "12px" }}>
                ⚠ {formError}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Alya Ananta"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                    NIM *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nim}
                    onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                    placeholder="Contoh: 2311523005"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                    Asal
                  </label>
                  <input
                    type="text"
                    value={formData.asal}
                    onChange={(e) => setFormData({ ...formData, asal: e.target.value })}
                    placeholder="Contoh: Padang, Sumbar"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                    Nomor Kamar
                  </label>
                  <input
                    type="text"
                    value={formData.nomorKamar}
                    onChange={(e) => setFormData({ ...formData, nomorKamar: e.target.value })}
                    placeholder="Contoh: A-101"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                    Jenis Kelamin *
                  </label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px" }}
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@email.com"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 6 karakter"
                  style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", cursor: "pointer", fontSize: "12.5px", fontWeight: "600" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{ padding: "8px 20px", borderRadius: "8px", border: "none", backgroundColor: formLoading ? "#93aef0" : "#2349d4", color: "#ffffff", cursor: formLoading ? "not-allowed" : "pointer", fontSize: "12.5px", fontWeight: "700" }}
                >
                  {formLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Penghuni */}
      {selectedPenghuni && (
        <div className="modal-backdrop-overlay" onClick={() => setSelectedPenghuni(null)}>
          <div className="modal-dialog-box" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>Detail Penghuni</div>
              <button onClick={() => setSelectedPenghuni(null)} style={{ border: "none", background: "#f1f5f9", borderRadius: "6px", width: "26px", height: "26px", cursor: "pointer" }}>
                <X size={15} color="#64748b" />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div><strong>Nama:</strong> {selectedPenghuni.nama}</div>
              <div><strong>NIM:</strong> {selectedPenghuni.nim || "-"}</div>
              <div><strong>Email:</strong> {selectedPenghuni.email}</div>
              <div><strong>Jenis Kelamin:</strong> {selectedPenghuni.jk}</div>
              <div><strong>Asal:</strong> {selectedPenghuni.asal}</div>
              <div><strong>Lokasi:</strong> {selectedPenghuni.lokasi}</div>
              <div><strong>Status:</strong> {selectedPenghuni.status}</div>
              <div><strong>Role:</strong> {selectedPenghuni.role}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

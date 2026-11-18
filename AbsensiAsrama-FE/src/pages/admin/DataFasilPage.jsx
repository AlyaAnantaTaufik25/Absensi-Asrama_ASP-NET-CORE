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

export default function DataFasilPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [gedungFilter, setGedungFilter] = useState("Semua Gedung");
  const [showModal, setShowModal] = useState(false);
  const [selectedFasil, setSelectedFasil] = useState(null);

  const [fasilList, setFasilList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State for Tambah Fasil
  const [formData, setFormData] = useState({
    nama: "",
    nim: "",
    asal: "",
    jenisKelamin: "L",
    email: "",
    password: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Fetch fasil list from API
  const fetchFasil = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/users/fasil`);
      if (!res.ok) throw new Error(`Gagal mengambil data fasil (${res.status})`);
      const data = await res.json();
      const mapped = data.map((u) => ({
        id: u.idUser,
        nama: u.nama,
        nim: u.nim || "-",
        email: u.email,
        asal: u.asal || "-",
        gedung: "-",
        hp: "-",
        role: u.role,
        status: "Aktif"
      }));
      setFasilList(mapped);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFasil();
  }, []);

  // Delete fasil
  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Hapus fasil "${nama}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Gagal menghapus (${res.status})`);
      await fetchFasil();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Submit tambah fasil
  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        nama: formData.nama,
        nim: formData.nim,
        asal: formData.asal,
        jenisKelamin: formData.jenisKelamin,
        email: formData.email,
        password: formData.password,
        role: "fasil"
      };
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal menyimpan (${res.status})`);
      }
      setShowModal(false);
      setFormData({ nama: "", nim: "", asal: "", jenisKelamin: "L", email: "", password: "" });
      await fetchFasil();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = fasilList.filter((item) => {
    const matchSearch =
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hp.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGedung =
      gedungFilter === "Semua Gedung" || item.gedung === gedungFilter;
    return matchSearch && matchGedung;
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
            MANAJEMEN FASILITATOR
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
            Data Fasil
          </h1>
          <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
            Kelola fasilitator dan penugasan satu gedung.
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
        {/* Filters */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px", marginBottom: "18px" }}>
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
              placeholder="Cari nama atau email..."
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
            <option value="Gedung D">Gedung D</option>
            <option value="Gedung E">Gedung E</option>
          </select>

          {/* Status */}
          <select style={{ height: "38px", padding: "0 10px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px" }}>
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
          </select>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div style={{ textAlign: "center", padding: "32px", color: "#64748b", fontSize: "13px" }}>
            Memuat data fasil...
          </div>
        )}
        {error && !loading && (
          <div style={{ textAlign: "center", padding: "20px", color: "#ef4444", fontSize: "13px", backgroundColor: "#fff5f5", borderRadius: "8px", marginBottom: "12px" }}>
            ⚠️ {error}
            <button
              onClick={fetchFasil}
              style={{ marginLeft: "12px", padding: "4px 12px", borderRadius: "6px", border: "1px solid #ef4444", background: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}
            >
              Coba Lagi
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
                  <th>Email</th>
                  <th>No. HP</th>
                  <th>Gedung yang Dikelola</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#94a3b8", fontSize: "13px" }}>
                      Tidak ada data fasil ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <div style={{ fontWeight: "700", color: "#0f172a" }}>{f.nama}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{f.asal}</div>
                      </td>
                      <td>
                        <span style={{ color: "#334155" }}>{f.nim}</span>
                      </td>
                      <td>
                        <span style={{ color: "#334155" }}>{f.email}</span>
                      </td>
                      <td>
                        <span style={{ color: "#475569" }}>{f.hp}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: "600", color: "#0f172a" }}>{f.gedung}</span>
                      </td>
                      <td>
                        <span className="badge-status-green" style={{ fontSize: "11px", padding: "2px 10px" }}>
                          ● Aktif
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={() => setSelectedFasil(f)}
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
                            style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                            title="Hapus"
                            onClick={() => handleDelete(f.id, f.nama)}
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
        <div className="table-pagination-row">
          <div style={{ fontSize: "12.5px", color: "#64748b" }}>
            {filteredList.length} data · Halaman 1 dari 1
          </div>
          <div className="pagination-controls">
            <button className="page-num-btn active">1</button>
          </div>
        </div>
      </div>

      {/* 3. MODAL: Tambah Fasil */}
      {showModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-dialog-box" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#2349d4", letterSpacing: "1px", textTransform: "uppercase" }}>
                  DATA FASILITATOR
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                  Tambah Fasil
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
              <div style={{ marginBottom: "12px", padding: "10px 14px", backgroundColor: "#fff5f5", border: "1px solid #fecaca", borderRadius: "8px", color: "#ef4444", fontSize: "12.5px" }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    NIM *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nim}
                    onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                    placeholder="Contoh: 12345678"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Asal *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.asal}
                    onChange={(e) => setFormData({ ...formData, asal: e.target.value })}
                    placeholder="Contoh: Makassar"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Jenis Kelamin *
                  </label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px" }}
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="fasil@asramaaman.id"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
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
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", cursor: "pointer", fontSize: "12.5px", fontWeight: "600" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "8px 20px", borderRadius: "8px", border: "none", backgroundColor: submitting ? "#93aef0" : "#2349d4", color: "#ffffff", cursor: submitting ? "not-allowed" : "pointer", fontSize: "12.5px", fontWeight: "700" }}
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Fasil */}
      {selectedFasil && (
        <div className="modal-backdrop-overlay" onClick={() => setSelectedFasil(null)}>
          <div className="modal-dialog-box" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>Detail Fasilitator</div>
              <button onClick={() => setSelectedFasil(null)} style={{ border: "none", background: "#f1f5f9", borderRadius: "6px", width: "26px", height: "26px", cursor: "pointer" }}>
                <X size={15} color="#64748b" />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div><strong>Nama:</strong> {selectedFasil.nama}</div>
              <div><strong>NIM:</strong> {selectedFasil.nim}</div>
              <div><strong>Email:</strong> {selectedFasil.email}</div>
              <div><strong>Asal:</strong> {selectedFasil.asal}</div>
              <div><strong>No. HP:</strong> {selectedFasil.hp}</div>
              <div><strong>Gedung yang Dikelola:</strong> {selectedFasil.gedung}</div>
              <div><strong>Status:</strong> {selectedFasil.status}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
import { getUsers, createUser, updateUser, deleteUser } from "../../services/api";

export default function DataFasilPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [gedungFilter, setGedungFilter] = useState("Semua Gedung");
  const [showModal, setShowModal] = useState(false);
  const [editingFasil, setEditingFasil] = useState(null);
  const [selectedFasil, setSelectedFasil] = useState(null);
  const [fasilList, setFasilList] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadFasil = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      if (Array.isArray(data)) {
        const filtered = data.filter((u) => u.role?.toLowerCase() === "fasil");
        setFasilList(
          filtered.map((u, idx) => ({
            id: u.idUser,
            nama: u.nama,
            code: u.nim || `FD-0${idx + 1}`,
            email: u.email,
            hp: "081267-02001",
            gedung: u.nomorKamar || "Gedung Asrama",
            status: "Aktif"
          }))
        );
      }
    } catch (e) {
      console.warn("Gagal memuat fasil:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFasil();
  }, []);

  // Form State for Tambah/Edit Fasil
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    hp: "",
    gedung: "Gedung A"
  });

  const handleOpenTambah = () => {
    setEditingFasil(null);
    setFormData({
      nama: "",
      email: "",
      password: "",
      hp: "",
      gedung: "Gedung A"
    });
    setShowModal(true);
  };

  const handleOpenEdit = (f) => {
    setEditingFasil(f.id);
    setFormData({
      nama: f.nama,
      email: f.email,
      password: "",
      hp: f.hp || "",
      gedung: f.gedung || "Gedung A"
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      nama: formData.nama.trim(),
      email: formData.email.trim(),
      nomorKamar: formData.gedung,
      role: "fasil"
    };

    if (formData.password.trim()) {
      payload.password = formData.password.trim();
    } else if (!editingFasil) {
      payload.password = "asrama123";
    }

    try {
      const res = editingFasil
        ? await updateUser(editingFasil, payload)
        : await createUser({
            ...payload,
            nim: `FASIL-${Date.now().toString().slice(-4)}`,
            asal: "Padang",
            jenisKelamin: "Laki-laki"
          });

      if (res.ok) {
        alert(editingFasil ? "Data Fasilitator berhasil diperbarui di database!" : "Data Fasilitator berhasil ditambahkan ke database!");
        setShowModal(false);
        setEditingFasil(null);
        await loadFasil();
      } else {
        alert("Gagal menyimpan fasil: " + (res.data?.message || "Terjadi kesalahan."));
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus fasilitator ${nama || ""} dari database?`)) return;
    try {
      const res = await deleteUser(id);
      if (res.ok) {
        alert("Fasilitator berhasil dihapus.");
        await loadFasil();
      } else {
        alert("Gagal menghapus fasilitator: " + (res.data?.message || "Terjadi kesalahan."));
      }
    } catch (err) {
      alert("Error: " + err.message);
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
          onClick={handleOpenTambah}
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
            <option value="Semua Gedung">Semua Asrama</option>
            <option value="Asrama Hijau">Asrama Hijau (Putra)</option>
            <option value="Asrama Orange">Asrama Orange (Putra)</option>
            <option value="Asrama Roesma M. Sjaaf">Asrama Roesma M. Sjaaf (Putri)</option>
            <option value="Asrama Menpera">Asrama Menpera (Putri)</option>
            <option value="Asrama PUPERA 1">Asrama PUPERA 1 (Putri)</option>
            <option value="Asrama Rusunawa">Asrama Rusunawa (Putri)</option>
            <option value="Asrama RPX">Asrama RPX (Putri)</option>
          </select>

          {/* Status */}
          <select style={{ height: "38px", padding: "0 10px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px" }}>
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
          </select>
        </div>

        {/* Data Table */}
        <div className="data-table-container">
          <table className="asrama-data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>No. HP</th>
                <th>Gedung yang Dikelola</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((f) => (
                <tr key={f.id}>
                  <td>
                    <div style={{ fontWeight: "700", color: "#0f172a" }}>{f.nama}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{f.code}</div>
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
                        style={{ border: "none", background: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
                        title="Edit Fasilitator"
                        onClick={() => handleOpenEdit(f)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                        title="Hapus Fasilitator"
                        onClick={() => handleDelete(f.id, f.nama)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

      {/* 3. MODAL: Tambah Fasil (Screenshot 5 Left) */}
      {showModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-dialog-box" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#2349d4", letterSpacing: "1px", textTransform: "uppercase" }}>
                  DATA FASILITATOR
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                  {editingFasil ? "Edit Data Fasilitator" : "Tambah Fasil"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ border: "none", background: "#f1f5f9", borderRadius: "8px", width: "28px", height: "28px", cursor: "pointer" }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

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
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="fasil@mynava.id"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Password {editingFasil ? "(Kosongkan jika tidak diubah)" : "*"}
                  </label>
                  <input
                    type="password"
                    required={!editingFasil}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingFasil ? "Kosongkan jika tidak diubah" : "Min. 6 karakter"}
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Nomor HP
                  </label>
                  <input
                    type="text"
                    value={formData.hp}
                    onChange={(e) => setFormData({ ...formData, hp: e.target.value })}
                    placeholder="0812-XXXX-XXXX"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Gedung yang Dikelola *
                </label>
                <select
                  value={formData.gedung}
                  onChange={(e) => setFormData({ ...formData, gedung: e.target.value })}
                  style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px" }}
                >
                  <option value="Asrama Hijau">Asrama Hijau (Putra)</option>
                  <option value="Asrama Orange">Asrama Orange (Putra)</option>
                  <option value="Asrama Roesma M. Sjaaf">Asrama Roesma M. Sjaaf (Putri)</option>
                  <option value="Asrama Menpera">Asrama Menpera (Putri)</option>
                  <option value="Asrama PUPERA 1">Asrama PUPERA 1 (Putri)</option>
                  <option value="Asrama Rusunawa">Asrama Rusunawa (Putri)</option>
                  <option value="Asrama RPX">Asrama RPX (Putri)</option>
                </select>
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
                  style={{ padding: "8px 20px", borderRadius: "8px", border: "none", backgroundColor: "#2349d4", color: "#ffffff", cursor: "pointer", fontSize: "12.5px", fontWeight: "700" }}
                >
                  {editingFasil ? "Simpan Perubahan" : "Simpan Fasilitator"}
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
              <div><strong>Nama:</strong> {selectedFasil.nama} ({selectedFasil.code})</div>
              <div><strong>Email:</strong> {selectedFasil.email}</div>
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

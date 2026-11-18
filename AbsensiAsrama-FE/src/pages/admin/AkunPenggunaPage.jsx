import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, X } from "lucide-react";

const API_BASE = "http://localhost:5250";

export default function AkunPenggunaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua");
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nama: "", nim: "", asal: "", jenisKelamin: "Laki-laki",
    email: "", password: "", role: "penghuni", nomorKamar: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data.map(u => ({
        id: u.idUser, nama: u.nama, email: u.email, nim: u.nim || "-",
        asal: u.asal || "-", nomorKamar: u.nomorKamar || "-",
        jenisKelamin: u.jenisKelamin || "-",
        role: u.role || "penghuni"
      })) : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAccounts(); }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ nama: "", nim: "", asal: "", jenisKelamin: "Laki-laki", email: "", password: "", role: "penghuni", nomorKamar: "" });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      nama: u.nama, nim: u.nim === "-" ? "" : u.nim, asal: u.asal === "-" ? "" : u.asal,
      jenisKelamin: u.jenisKelamin === "-" ? "Laki-laki" : u.jenisKelamin,
      email: u.email, password: "", role: u.role,
      nomorKamar: u.nomorKamar === "-" ? "" : u.nomorKamar
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingUser) {
        const payload = {
          nama: formData.nama, asal: formData.asal, nomorKamar: formData.nomorKamar || null,
          jenisKelamin: formData.jenisKelamin, email: formData.email, role: formData.role
        };
        if (formData.password) payload.password = formData.password;
        const res = await fetch(`${API_BASE}/api/users/${editingUser.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Gagal mengupdate"); }
      } else {
        if (!formData.password || formData.password.length < 6) throw new Error("Password minimal 6 karakter");
        const payload = {
          nama: formData.nama, nim: formData.nim, asal: formData.asal,
          nomorKamar: formData.nomorKamar || null, jenisKelamin: formData.jenisKelamin,
          email: formData.email, password: formData.password, role: formData.role
        };
        const res = await fetch(`${API_BASE}/api/users`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Gagal menambah akun"); }
      }
      setShowModal(false);
      await loadAccounts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Hapus akun "${u.nama}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${u.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      await loadAccounts();
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const filteredList = accounts.filter(a => {
    const matchSearch = a.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.nim.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === "Semua" || a.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleBadge = (role) => {
    const colors = {
      admin: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
      fasil: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      penghuni: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
      mahasiswa: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" }
    };
    const c = colors[role] || colors.penghuni;
    return (
      <span style={{ padding: "3px 10px", borderRadius: "9999px", fontSize: "11.5px", fontWeight: "700", backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const inputStyle = { width: "100%", height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px", boxSizing: "border-box", outline: "none" };
  const labelStyle = { display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" };
  const btnPrimary = { padding: "8px 20px", borderRadius: "8px", border: "none", backgroundColor: "#2349d4", color: "#fff", cursor: "pointer", fontSize: "12.5px", fontWeight: "700" };
  const btnSecondary = { padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#fff", cursor: "pointer", fontSize: "12.5px", fontWeight: "600" };
  const thStyle = { padding: "12px 16px", textAlign: "left", fontWeight: "700", color: "#475569", fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.5px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0" }}>Akun Pengguna</h1>
          <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>Kelola semua akun pengguna dan hak akses sistem</p>
        </div>
        <button onClick={openAddModal} style={{ ...btnPrimary, padding: "10px 18px", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 14px -2px rgba(35,73,212,0.4)" }}>
          <Plus size={16} /> Tambah Akun
        </button>
      </div>

      {/* Filters */}
      <div className="content-card" style={{ padding: "16px 20px", display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input placeholder="Cari nama, email, atau NIM..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "36px", height: "40px", backgroundColor: "#fff" }} />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          style={{ ...inputStyle, width: "160px", height: "40px", backgroundColor: "#fff", cursor: "pointer" }}>
          <option value="Semua">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="fasil">Fasilitator</option>
          <option value="penghuni">Penghuni</option>
        </select>
      </div>

      {error && <div style={{ padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", color: "#b91c1c", fontSize: "13px" }}>⚠️ {error}</div>}
      {isLoading && <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Memuat data...</div>}

      {!isLoading && (
        <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Nama</th>
                <th style={thStyle}>NIM</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Jenis Kelamin</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Tidak ada data</td></tr>
              ) : filteredList.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 16px", color: "#64748b" }}>{i + 1}</td>
                  <td style={{ padding: "14px 16px", fontWeight: "700", color: "#0f172a" }}>{u.nama}</td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>{u.nim}</td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>{u.email}</td>
                  <td style={{ padding: "14px 16px" }}>{roleBadge(u.role)}</td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>{u.jenisKelamin}</td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                      <button onClick={() => openEditModal(u)} title="Edit" style={{ border: "none", background: "#f0f7ff", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Edit2 size={14} color="#2349d4" />
                      </button>
                      <button onClick={() => handleDelete(u)} title="Hapus" style={{ border: "none", background: "#fef2f2", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-dialog-box" style={{ maxWidth: "520px", maxHeight: "85vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#2349d4", letterSpacing: "1px", textTransform: "uppercase" }}>AKUN PENGGUNA</div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                  {editingUser ? "Edit Akun" : "Tambah Akun Baru"}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ border: "none", background: "#f1f5f9", borderRadius: "8px", width: "28px", height: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color="#64748b" />
              </button>
            </div>

            {formError && <div style={{ padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "12px", marginBottom: "12px" }}>{formError}</div>}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Nama Lengkap *</label>
                  <input type="text" required value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} placeholder="Nama lengkap" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>NIM *</label>
                  <input type="text" required={!editingUser} value={formData.nim} onChange={(e) => setFormData({ ...formData, nim: e.target.value })} placeholder="NIM" style={inputStyle} disabled={!!editingUser} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Asal *</label>
                  <input type="text" required value={formData.asal} onChange={(e) => setFormData({ ...formData, asal: e.target.value })} placeholder="Kota / Daerah" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Jenis Kelamin *</label>
                  <select required value={formData.jenisKelamin} onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@contoh.com" style={inputStyle} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Password {editingUser ? "(kosongkan jika tidak diubah)" : "*"}</label>
                  <input type="password" required={!editingUser} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={editingUser ? "Kosongkan jika tidak diubah" : "Min. 6 karakter"} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Role *</label>
                  <select required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="penghuni">Penghuni</option>
                    <option value="fasil">Fasilitator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Nomor Kamar (opsional)</label>
                <input type="text" value={formData.nomorKamar} onChange={(e) => setFormData({ ...formData, nomorKamar: e.target.value })} placeholder="Contoh: A-101" style={inputStyle} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={btnSecondary} disabled={formLoading}>Batal</button>
                <button type="submit" style={btnPrimary} disabled={formLoading}>{formLoading ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

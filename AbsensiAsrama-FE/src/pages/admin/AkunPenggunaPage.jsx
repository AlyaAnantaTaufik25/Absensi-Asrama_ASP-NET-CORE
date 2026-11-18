import React, { useState, useEffect } from "react";
import {
  Search,
  KeyRound,
  Trash2,
  Edit2,
  X,
  Lock,
  UserCheck,
  ShieldCheck
} from "lucide-react";
import { getUsers, updateUser, deleteUser } from "../../services/api";

export default function AkunPenggunaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua Role");
  const [statusFilter, setStatusFilter] = useState("Semua Status");

  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    nama: "",
    email: "",
    role: "Penghuni",
    password: ""
  });

  const loadBackendUsers = async () => {
    setIsLoading(true);
    try {
      const dbUsers = await getUsers();
      if (Array.isArray(dbUsers)) {
        setAccounts(
          dbUsers.map((u, idx) => {
            const rawRole = (u.role || "").trim().toLowerCase();
            let roleFormatted = "Penghuni";
            if (rawRole === "admin") roleFormatted = "Admin";
            else if (rawRole === "fasil") roleFormatted = "Fasil";
            else roleFormatted = "Penghuni";

            return {
              id: u.idUser || idx + 1,
              nama: u.nama,
              email: u.email,
              role: roleFormatted,
              status: "Aktif"
            };
          })
        );
      }
    } catch (err) {
      console.warn("Gagal mengambil data user:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackendUsers();
  }, []);

  const handleOpenEdit = (acc) => {
    setEditForm({
      id: acc.id,
      nama: acc.nama,
      email: acc.email,
      role: acc.role,
      password: ""
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nama: editForm.nama.trim(),
        email: editForm.email.trim(),
        role: editForm.role.toLowerCase()
      };
      if (editForm.password.trim()) {
        if (editForm.password.trim().length < 6) {
          alert("Kata sandi baru minimal 6 karakter.");
          return;
        }
        payload.password = editForm.password.trim();
      }

      const res = await updateUser(editForm.id, payload);
      if (res.ok) {
        alert("Akun dan peran pengguna berhasil diperbarui di database!");
        setShowEditModal(false);
        await loadBackendUsers();
      } else {
        alert("Gagal memperbarui akun: " + (res.data?.message || "Terjadi kesalahan."));
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus akun ${nama} secara permanen dari database MySQL?`)) return;
    try {
      const res = await deleteUser(id);
      if (res.ok) {
        alert("Akun berhasil dihapus dari database!");
        await loadBackendUsers();
      } else {
        alert("Gagal menghapus akun: " + (res.data?.message || "Terjadi kesalahan."));
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchSearch =
      acc.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole =
      roleFilter === "Semua Role" || acc.role.toLowerCase() === roleFilter.toLowerCase();
    const matchStatus =
      statusFilter === "Semua Status" || acc.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header Row */}
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
          AKSES & LOGIN
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
          Akun Pengguna
        </h1>
        <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
          Pusat pengelolaan akun, reset kata sandi, dan hak akses Penghuni, Fasil, serta Admin.
        </p>
      </div>

      {/* 2. Content Card with Filters and Table */}
      <div className="content-card" style={{ padding: "20px 24px" }}>
        {/* Filters */}
        <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1.2fr 1.2fr", gap: "12px", marginBottom: "18px" }}>
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

          {/* Role */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ height: "38px", padding: "0 10px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px" }}
          >
            <option value="Semua Role">Semua Role</option>
            <option value="Penghuni">Penghuni</option>
            <option value="Fasil">Fasil</option>
            <option value="Admin">Admin</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: "38px", padding: "0 10px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px" }}
          >
            <option value="Semua Status">Semua Status</option>
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
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>
                    <KeyRound size={36} style={{ margin: "0 auto 10px", color: "#cbd5e1" }} />
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                      Belum Ada Akun Pengguna di Database
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "4px", color: "#94a3b8" }}>
                      Akun yang didaftarkan ke MySQL akan otomatis muncul di tabel ini.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span style={{ fontWeight: "700", color: "#0f172a" }}>{a.nama}</span>
                    </td>
                    <td>
                      <span style={{ color: "#334155" }}>{a.email}</span>
                    </td>
                    <td>
                      {a.role === "Fasil" ? (
                        <span style={{ backgroundColor: "#e0e7ff", color: "#4338ca", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "9999px" }}>
                          Fasil
                        </span>
                      ) : a.role === "Admin" ? (
                        <span className="badge-status-amber" style={{ fontSize: "11px", padding: "2px 8px" }}>
                          Admin
                        </span>
                      ) : (
                        <span className="badge-status-blue" style={{ fontSize: "11px", padding: "2px 8px" }}>
                          Penghuni
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge-status-green" style={{ fontSize: "11px", padding: "2px 10px" }}>
                        ● Aktif
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <button
                          style={{
                            border: "none",
                            background: "none",
                            color: "#64748b",
                            cursor: "pointer",
                            padding: "4px"
                          }}
                          title="Edit Akun & Peran"
                          onClick={() => handleOpenEdit(a)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          style={{
                            border: "none",
                            background: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "4px"
                          }}
                          title="Hapus Akun"
                          onClick={() => handleDelete(a.id, a.nama)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="table-pagination-row">
          <div style={{ fontSize: "12.5px", color: "#64748b" }}>
            {filteredAccounts.length} data · Halaman 1 dari 1
          </div>
          <div className="pagination-controls">
            <button className="page-num-btn active">1</button>
          </div>
        </div>
      </div>

      {/* 3. MODAL EDIT AKUN PENGGUNA & PERAN */}
      {showEditModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-dialog-box" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#2349d4", letterSpacing: "1px", textTransform: "uppercase" }}>
                  PENGELOLAAN AKUN
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                  Edit Akun & Hak Akses
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ border: "none", background: "#f1f5f9", borderRadius: "8px", width: "28px", height: "28px", cursor: "pointer" }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                    fontSize: "12.5px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Email Akun *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                    fontSize: "12.5px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Peran / Hak Akses Akun *
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                    fontSize: "12.5px",
                    boxSizing: "border-box"
                  }}
                >
                  <option value="Penghuni">Penghuni (Mahasiswa)</option>
                  <option value="Fasil">Fasil (Fasilitator Asrama)</option>
                  <option value="Admin">Admin (Administrator)</option>
                </select>
                <p style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 0 0" }}>
                  Mengubah peran di sini akan langsung mengatur hak akses pengguna pada sistem.
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Kata Sandi Baru (Opsional)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                    fontSize: "12.5px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", cursor: "pointer", fontSize: "12.5px", fontWeight: "600" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 22px", borderRadius: "8px", border: "none", backgroundColor: "#2349d4", color: "#ffffff", cursor: "pointer", fontSize: "12.5px", fontWeight: "700" }}
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

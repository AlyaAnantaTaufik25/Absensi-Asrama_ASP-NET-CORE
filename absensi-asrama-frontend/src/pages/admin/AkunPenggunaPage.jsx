import React, { useState, useEffect } from "react";
import {
  Search,
  KeyRound,
  Shield,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  X
} from "lucide-react";
import { getUsers } from "../../services/api";

export default function AkunPenggunaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua Role");
  const [statusFilter, setStatusFilter] = useState("Semua Status");

  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // If no accounts loaded and not loading, render nothing
  if (!isLoading && accounts.length === 0) {
    return null;
  }
  // Muat data user dari backend jika server aktif
  useEffect(() => {
    async function loadBackendUsers() {
      setIsLoading(true);
      try {
        const dbUsers = await getUsers();
        if (Array.isArray(dbUsers)) {
          setAccounts(
            dbUsers.map((u, idx) => ({
              id: u.idUser || idx + 1,
              nama: u.nama,
              email: u.email,
              role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Penghuni",
              status: "Aktif",
              lastLogin: "Terdaftar di MySQL"
            }))
          );
        }
      } catch (err) {
        console.warn("Gagal mengambil data user:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBackendUsers();
  }, []);

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
          Satu pusat pengelolaan akun Penghuni, Fasil, dan Admin.
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
            <option value="Terkunci">Terkunci</option>
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
                <th>Terakhir Login</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>
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
                      {a.role === "Penghuni" && (
                        <span className="badge-status-blue" style={{ fontSize: "11px", padding: "2px 8px" }}>
                          Penghuni
                        </span>
                      )}
                      {a.role === "Fasil" && (
                        <span style={{ backgroundColor: "#e0e7ff", color: "#4338ca", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "9999px" }}>
                          Fasil
                        </span>
                      )}
                      {a.role === "Admin" && (
                        <span className="badge-status-amber" style={{ fontSize: "11px", padding: "2px 8px" }}>
                          Admin
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge-status-green" style={{ fontSize: "11px", padding: "2px 10px" }}>
                        ● Aktif
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{a.lastLogin}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                        <button
                          style={{ border: "none", background: "none", color: "#64748b", cursor: "pointer", padding: "2px" }}
                          title="Reset Kata Sandi"
                          onClick={() => alert(`Reset kata sandi untuk ${a.nama}`)}
                        >
                          <KeyRound size={15} />
                        </button>
                        <button
                          style={{ border: "none", background: "none", color: "#64748b", cursor: "pointer", padding: "2px" }}
                          title="Ubah Hak Akses"
                          onClick={() => alert(`Atur hak akses untuk ${a.nama}`)}
                        >
                          <Shield size={15} />
                        </button>
                        <button
                          style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", padding: "2px" }}
                          title="Kunci / Hapus Akun"
                          onClick={() => setAccounts(accounts.filter((x) => x.id !== a.id))}
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
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  Search,
  KeyRound,
  Trash2,
  Edit2,
  X,
  Lock,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  ChevronDown
} from "lucide-react";
import { getUsers, updateUser, deleteUser } from "../../services/api";
import { showToast } from "../../utils/toast";

export default function AkunPenggunaPage() {
  const [subTab, setSubTab] = useState("akun"); // "akun" | "hak-akses"
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua Role");
  const [statusFilter, setStatusFilter] = useState("Semua Status");

  const [accounts, setAccounts] = useState([]);
  const [accessUsers, setAccessUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const buildingsList = [
    "Asrama Hijau",
    "Asrama Orange",
    "Asrama Roesma M. Sjaaf",
    "Asrama Menpera",
    "Asrama PUPERA 1",
    "Asrama Rusunawa",
    "Asrama RPX"
  ];

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    nama: "",
    email: "",
    role: "Mahasiswa",
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
            let roleFormatted = "Mahasiswa";
            if (rawRole === "admin") roleFormatted = "Admin";
            else if (rawRole === "fasil") roleFormatted = "Fasil";
            else roleFormatted = "Mahasiswa";

            return {
              id: u.idUser || idx + 1,
              nama: u.nama,
              email: u.email,
              role: roleFormatted,
              status: "Aktif"
            };
          })
        );

        setAccessUsers(
          dbUsers.map((u, idx) => {
            const rawRole = (u.role || "").trim().toLowerCase();
            let formatted = "Mahasiswa";
            if (rawRole === "admin") formatted = "Admin";
            else if (rawRole === "fasil") formatted = "Fasil";
            else formatted = "Mahasiswa";

            return {
              id: u.idUser || idx + 1,
              name: u.nama,
              email: u.email,
              currentRole: formatted,
              newRole: formatted,
              assignedBuilding: rawRole === "fasil" ? (u.nomorKamar || "Asrama Hijau") : "Tidak diperlukan"
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
        role: editForm.role.toLowerCase() === "mahasiswa" ? "penghuni" : editForm.role.toLowerCase()
      };
      if (editForm.password.trim()) {
        if (editForm.password.trim().length < 6) {
          showToast("Kata sandi baru minimal 6 karakter.", "warning");
          return;
        }
        payload.password = editForm.password.trim();
      }

      const res = await updateUser(editForm.id, payload);
      if (res.ok) {
        showToast("Akun dan peran pengguna berhasil diperbarui!", "success");
        setShowEditModal(false);
        await loadBackendUsers();
      } else {
        showToast("Gagal memperbarui akun: " + (res.data?.message || "Terjadi kesalahan."), "error");
      }
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus akun ${nama || "pengguna ini"}?`)) return;
    try {
      const res = await deleteUser(id);
      if (res.ok) {
        showToast("Akun pengguna berhasil dihapus.", "success");
        await loadBackendUsers();
      } else {
        showToast("Gagal menghapus akun: " + (res.data?.message || "Terjadi kesalahan."), "error");
      }
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  // Hak Akses Handlers
  const handleRoleChange = (id, newRole) => {
    setAccessUsers((prev) =>
      prev.map((user) => {
        if (user.id === id) {
          return {
            ...user,
            newRole,
            assignedBuilding:
              newRole === "Fasil"
                ? user.assignedBuilding === "Tidak diperlukan"
                  ? "Asrama Hijau"
                  : user.assignedBuilding
                : "Tidak diperlukan"
          };
        }
        return user;
      })
    );
  };

  const handleBuildingChange = (id, assignedBuilding) => {
    setAccessUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, assignedBuilding } : user))
    );
  };

  const handleSaveAccess = async () => {
    try {
      const changed = accessUsers.filter((u) => u.currentRole !== u.newRole);
      for (const u of changed) {
        const backendRole = u.newRole.toLowerCase() === "mahasiswa" ? "penghuni" : u.newRole.toLowerCase();
        await updateUser(u.id, { role: backendRole });
      }
      setToastMessage("Perubahan hak akses berhasil disimpan!");
      setTimeout(() => setToastMessage(""), 3500);
      setAccessUsers((prev) => prev.map((u) => ({ ...u, currentRole: u.newRole })));
      await loadBackendUsers();
    } catch (e) {
      setToastMessage("Gagal menyimpan perubahan hak akses.");
    }
  };

  const hasAccessChanges = accessUsers.some((u) => u.currentRole !== u.newRole);

  const filteredAccounts = accounts.filter((acc) => {
    const matchSearch =
      acc.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === "Semua Role" || acc.role === roleFilter;
    const matchStatus = statusFilter === "Semua Status" || acc.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const filteredAccessUsers = accessUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fontStack =
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: fontStack }}>
      {/* 1. Header & Segmented Sub-Tab Switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: "700",
            color: "#1c1c1e",
            letterSpacing: "-0.5px",
            margin: 0
          }}
        >
          Akun Pengguna & Hak Akses
        </h1>

        {/* Sub-tab Switcher: Satukan Akun Pengguna & Hak Akses */}
        <div
          style={{
            display: "inline-flex",
            backgroundColor: "#e5e5ea",
            padding: "3px",
            borderRadius: "12px",
            gap: "2px"
          }}
        >
          <button
            type="button"
            onClick={() => setSubTab("akun")}
            style={{
              padding: "7px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              backgroundColor: subTab === "akun" ? "#ffffff" : "transparent",
              color: subTab === "akun" ? "#1c1c1e" : "#636366",
              boxShadow: subTab === "akun" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.15s ease",
              fontFamily: fontStack,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <KeyRound size={14} />
            <span>Daftar Akun</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("hak-akses")}
            style={{
              padding: "7px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              backgroundColor: subTab === "hak-akses" ? "#ffffff" : "transparent",
              color: subTab === "hak-akses" ? "#1c1c1e" : "#636366",
              boxShadow: subTab === "hak-akses" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.15s ease",
              fontFamily: fontStack,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <ShieldCheck size={14} />
            <span>Hak Akses & Peran</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div
          style={{
            backgroundColor: "rgba(52, 199, 89, 0.12)",
            border: "1px solid rgba(52, 199, 89, 0.25)",
            color: "#34c759",
            padding: "12px 18px",
            borderRadius: "12px",
            fontSize: "13.5px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* 2. Content Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          overflow: "hidden"
        }}
      >
        {/* SUBTAB 1: DAFTAR AKUN */}
        {subTab === "akun" && (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", padding: "18px 20px", borderBottom: "1px solid #f2f2f7" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#f2f2f7",
                  borderRadius: "12px",
                  border: "1px solid #e5e5ea",
                  padding: "8px 14px",
                  flex: "1 1 240px"
                }}
              >
                <Search size={15} color="#8e8e93" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau email pengguna..."
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    fontSize: "13px",
                    fontWeight: "400",
                    outline: "none",
                    color: "#1c1c1e",
                    fontFamily: fontStack
                  }}
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "12px",
                  border: "1px solid #e5e5ea",
                  backgroundColor: "#f2f2f7",
                  fontSize: "13px",
                  color: "#1c1c1e",
                  outline: "none",
                  fontFamily: fontStack
                }}
              >
                <option value="Semua Role">Semua Role</option>
                <option value="Admin">Admin</option>
                <option value="Fasil">Fasilitator</option>
                <option value="Mahasiswa">Mahasiswa</option>
              </select>

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
                  outline: "none",
                  fontFamily: fontStack
                }}
              >
                <option value="Semua Status">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#fafafc", borderBottom: "1px solid #e5e5ea", color: "#8e8e93", fontSize: "11.5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "16px 20px" }}>Nama Pengguna</th>
                    <th style={{ padding: "16px 20px" }}>Email Akun</th>
                    <th style={{ padding: "16px 20px" }}>Role / Peran</th>
                    <th style={{ padding: "16px 20px" }}>Status</th>
                    <th style={{ padding: "16px 20px", textAlign: "right" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((acc, index) => {
                    let roleBg = "rgba(142, 142, 147, 0.12)";
                    let roleColor = "#8e8e93";

                    if (acc.role === "Admin") {
                      roleBg = "rgba(255, 149, 0, 0.12)";
                      roleColor = "#ff9500";
                    } else if (acc.role === "Fasil") {
                      roleBg = "rgba(0, 122, 255, 0.12)";
                      roleColor = "#007aff";
                    } else if (acc.role === "Mahasiswa") {
                      roleBg = "rgba(52, 199, 89, 0.12)";
                      roleColor = "#34c759";
                    }

                    return (
                      <tr
                        key={acc.id}
                        style={{
                          borderBottom: index === filteredAccounts.length - 1 ? "none" : "1px solid #f2f2f7",
                          transition: "background-color 0.1s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ fontWeight: "600", color: "#1c1c1e" }}>{acc.nama}</div>
                        </td>
                        <td style={{ padding: "14px 20px", color: "#636366" }}>
                          {acc.email}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span
                            style={{
                              backgroundColor: roleBg,
                              color: roleColor,
                              fontSize: "12px",
                              fontWeight: "600",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              display: "inline-block"
                            }}
                          >
                            {acc.role}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span
                            style={{
                              backgroundColor: "rgba(52, 199, 89, 0.12)",
                              color: "#34c759",
                              fontSize: "12px",
                              fontWeight: "600",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              display: "inline-block"
                            }}
                          >
                            {acc.status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            <button
                              style={{
                                border: "none",
                                background: "none",
                                color: "#007aff",
                                cursor: "pointer",
                                padding: "4px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "12.5px",
                                fontWeight: "600"
                              }}
                              onClick={() => handleOpenEdit(acc)}
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                            <button
                              style={{
                                border: "none",
                                background: "none",
                                color: "#ff3b30",
                                cursor: "pointer",
                                padding: "4px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "12.5px",
                                fontWeight: "600"
                              }}
                              onClick={() => handleDelete(acc.id, acc.nama)}
                            >
                              <Trash2 size={14} /> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid #f2f2f7", fontSize: "13px", color: "#8e8e93" }}>
              Total <strong style={{ color: "#1c1c1e" }}>{filteredAccounts.length}</strong> akun terdaftar
            </div>
          </div>
        )}

        {/* SUBTAB 2: HAK AKSES & PERAN */}
        {subTab === "hak-akses" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid #f2f2f7", flexWrap: "wrap", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#f2f2f7",
                  borderRadius: "12px",
                  border: "1px solid #e5e5ea",
                  padding: "8px 14px",
                  maxWidth: "320px",
                  flex: 1
                }}
              >
                <Search size={15} color="#8e8e93" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari pengguna..."
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    fontSize: "13px",
                    fontWeight: "400",
                    outline: "none",
                    color: "#1c1c1e",
                    fontFamily: fontStack
                  }}
                />
              </div>

              {hasAccessChanges && (
                <button
                  type="button"
                  onClick={handleSaveAccess}
                  style={{
                    backgroundColor: "#007aff",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "9px 20px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0, 122, 255, 0.3)",
                    fontFamily: fontStack
                  }}
                >
                  Simpan Perubahan
                </button>
              )}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#fafafc", borderBottom: "1px solid #e5e5ea", color: "#8e8e93", fontSize: "11.5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "16px 20px" }}>Pengguna</th>
                    <th style={{ padding: "16px 20px" }}>Peran Saat Ini</th>
                    <th style={{ padding: "16px 20px" }}>Ubah Peran</th>
                    <th style={{ padding: "16px 20px" }}>Penugasan Asrama</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccessUsers.map((u, index) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: index === filteredAccessUsers.length - 1 ? "none" : "1px solid #f2f2f7",
                        transition: "background-color 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: "600", color: "#1c1c1e" }}>{u.name}</div>
                        <div style={{ fontSize: "12px", color: "#8e8e93" }}>{u.email}</div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            backgroundColor:
                              u.currentRole === "Admin"
                                ? "rgba(255, 149, 0, 0.12)"
                                : u.currentRole === "Fasil"
                                ? "rgba(0, 122, 255, 0.12)"
                                : "rgba(52, 199, 89, 0.12)",
                            color:
                              u.currentRole === "Admin"
                                ? "#ff9500"
                                : u.currentRole === "Fasil"
                                ? "#007aff"
                                : "#34c759",
                            fontSize: "12px",
                            fontWeight: "600",
                            padding: "4px 10px",
                            borderRadius: "12px"
                          }}
                        >
                          {u.currentRole}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <select
                          value={u.newRole}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "10px",
                            border: "1px solid #e5e5ea",
                            backgroundColor: "#f2f2f7",
                            fontSize: "13px",
                            fontWeight: "400",
                            color: "#1c1c1e",
                            outline: "none",
                            fontFamily: fontStack,
                            cursor: "pointer"
                          }}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Fasil">Fasilitator</option>
                          <option value="Mahasiswa">Mahasiswa</option>
                        </select>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        {u.newRole === "Fasil" ? (
                          <select
                            value={u.assignedBuilding}
                            onChange={(e) => handleBuildingChange(u.id, e.target.value)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "10px",
                              border: "1px solid #e5e5ea",
                              backgroundColor: "#f2f2f7",
                              fontSize: "13px",
                              fontWeight: "400",
                              color: "#1c1c1e",
                              outline: "none",
                              fontFamily: fontStack,
                              cursor: "pointer"
                            }}
                          >
                            {buildingsList.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: "#8e8e93", fontSize: "12.5px" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid #f2f2f7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", color: "#8e8e93" }}>
                Total <strong style={{ color: "#1c1c1e" }}>{filteredAccessUsers.length}</strong> pengguna
              </div>
              {hasAccessChanges && (
                <button
                  type="button"
                  onClick={handleSaveAccess}
                  style={{
                    backgroundColor: "#007aff",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "7px 18px",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0, 122, 255, 0.25)"
                  }}
                >
                  Simpan Perubahan
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
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
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "480px",
              padding: "26px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              border: "1px solid rgba(0, 0, 0, 0.05)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1c1c1e", margin: 0 }}>
                Edit Akun Pengguna
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#8e8e93", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#ffffff", fontSize: "13px", fontWeight: "400", outline: "none", color: "#1c1c1e", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                  Email Akun
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#ffffff", fontSize: "13px", fontWeight: "400", outline: "none", color: "#1c1c1e", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                  Role / Peran
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#ffffff", fontSize: "13px", fontWeight: "400", outline: "none", color: "#1c1c1e", boxSizing: "border-box", cursor: "pointer" }}
                >
                  <option value="Mahasiswa">Mahasiswa</option>
                  <option value="Fasil">Fasilitator</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                  Reset Kata Sandi (Opsional)
                </label>
                <input
                  type="password"
                  placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#ffffff", fontSize: "13px", fontWeight: "400", outline: "none", color: "#1c1c1e", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: "9px 18px", borderRadius: "10px", border: "none", backgroundColor: "#f2f2f7", color: "#8e8e93", cursor: "pointer", fontSize: "13px", fontWeight: "600", fontFamily: fontStack }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: "9px 22px", borderRadius: "10px", border: "none", backgroundColor: "#007aff", color: "#ffffff", cursor: "pointer", fontSize: "13px", fontWeight: "600", fontFamily: fontStack, boxShadow: "0 2px 8px rgba(0, 122, 255, 0.3)" }}
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

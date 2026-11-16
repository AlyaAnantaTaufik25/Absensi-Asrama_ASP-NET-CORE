import React, { useState, useEffect } from "react";
import { Search, CheckCircle2, ChevronDown, RotateCcw } from "lucide-react";
import { getUsers, updateUser } from "../../services/api";

export default function HakAksesPage() {
  const buildingsList = [
    "Pilih asrama fasil...",
    "Asrama Hijau",
    "Asrama Orange",
    "Asrama Roesma M. Sjaaf",
    "Asrama Menpera",
    "Asrama PUPERA 1",
    "Asrama Rusunawa",
    "Asrama RPX"
  ];

  const [users, setUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const dbUsers = await getUsers();
        if (Array.isArray(dbUsers)) {
          setUsers(
            dbUsers.map((u, idx) => {
              const rawRole = (u.role || "").trim().toLowerCase();
              let formatted = "Penghuni";
              if (rawRole === "admin") formatted = "Admin";
              else if (rawRole === "fasil") formatted = "Fasil";
              else formatted = "Penghuni";

              return {
                id: u.idUser || idx + 1,
                name: u.nama,
                email: u.email,
                currentRole: formatted,
                newRole: formatted,
                assignedBuilding: rawRole === "fasil" ? "Gedung Al-Farabi" : "Tidak diperlukan"
              };
            })
          );
        }
      } catch (err) {
        console.warn("Gagal memuat pengguna:", err);
      }
    }
    loadUsers();
  }, []);

  const handleRoleChange = (id, newRole) => {
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id === id) {
          return {
            ...user,
            newRole,
            assignedBuilding:
              newRole === "Fasil"
                ? user.assignedBuilding === "Tidak diperlukan"
                  ? "Pilih gedung fasil..."
                  : user.assignedBuilding
                : "Tidak diperlukan"
          };
        }
        return user;
      })
    );
  };

  const handleBuildingChange = (id, assignedBuilding) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, assignedBuilding } : user))
    );
  };

  const handleReset = () => {
    setUsers(initialUsers);
    setToastMessage("Perubahan dibatalkan.");
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleSave = async () => {
    try {
      const changed = users.filter((u) => u.currentRole !== u.newRole);
      for (const u of changed) {
        await updateUser(u.id, { role: u.newRole.toLowerCase() });
      }
      setToastMessage("Perubahan hak akses berhasil disimpan ke database!");
      setTimeout(() => setToastMessage(""), 3500);
      setUsers((prev) => prev.map((u) => ({ ...u, currentRole: u.newRole })));
    } catch (e) {
      setToastMessage("Gagal menyimpan perubahan hak akses.");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header Row */}
      <div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: "800",
            color: "#2563eb",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            marginBottom: "4px"
          }}
        >
          OTORISASI
        </div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "800",
            color: "#0f172a",
            margin: "0 0 6px 0",
            letterSpacing: "-0.5px"
          }}
        >
          Hak Akses
        </h1>
        <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
          Atur role akun maupun akses setiap pengguna.
        </p>
      </div>

      {toastMessage && (
        <div
          style={{
            backgroundColor: "#dcfce7",
            border: "1px solid #bbf7d0",
            color: "#15803d",
            padding: "12px 18px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Main Table Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
          overflow: "hidden"
        }}
      >
        {/* Top Actions Bar inside Card */}
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
            borderBottom: "1px solid #f1f5f9"
          }}
        >
          {/* Search Box */}
          <div style={{ position: "relative", width: "320px", maxWidth: "100%" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8"
              }}
            />
            <input
              type="text"
              placeholder="Cari pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 14px 9px 40px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                color: "#0f172a",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                backgroundColor: "#ffffff",
                color: "#475569",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "9px 18px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
            >
              Batalkan Perubahan
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "9px 20px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
            >
              Simpan Perubahan
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "11.5px", fontWeight: "700", letterSpacing: "0.5px" }}>
                <th style={{ padding: "16px 24px" }}>PENGGUNA</th>
                <th style={{ padding: "16px 20px" }}>EMAIL</th>
                <th style={{ padding: "16px 20px" }}>ROLE SAAT INI</th>
                <th style={{ padding: "16px 20px" }}>ROLE BARU</th>
                <th style={{ padding: "16px 24px" }}>GEDUNG PENUGASAN</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                      Belum Ada Pengguna di Database
                    </div>
                    <div style={{ fontSize: "12px", marginTop: "4px", color: "#94a3b8" }}>
                      Akun yang terdaftar di MySQL akan otomatis muncul di sini untuk dikelola perannya.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((row, index) => {
                  const isFasil = row.newRole === "Fasil";
                  return (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: index === filteredUsers.length - 1 ? "none" : "1px solid #f8fafc",
                        transition: "background-color 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "14px 24px", fontWeight: "700", color: "#0f172a" }}>
                        {row.name}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#64748b" }}>
                        {row.email}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            backgroundColor: "#eff6ff",
                            color: "#1e3fae",
                            fontSize: "11.5px",
                            fontWeight: "700",
                            padding: "4px 12px",
                            borderRadius: "999px",
                            display: "inline-block"
                          }}
                        >
                          {row.currentRole}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <select
                          value={row.newRole}
                          onChange={(e) => handleRoleChange(row.id, e.target.value)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "12.5px",
                            color: "#0f172a",
                            backgroundColor: "#ffffff",
                            cursor: "pointer",
                            outline: "none",
                            minWidth: "120px"
                          }}
                        >
                          <option value="Penghuni">Penghuni</option>
                          <option value="Fasil">Fasil</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td style={{ padding: "14px 24px" }}>
                        {isFasil ? (
                          <select
                            value={row.assignedBuilding}
                            onChange={(e) => handleBuildingChange(row.id, e.target.value)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              border: "1px solid #bfdbfe",
                              backgroundColor: "#eff6ff",
                              color: "#1e3fae",
                              fontSize: "12.5px",
                              fontWeight: "500",
                              cursor: "pointer",
                              outline: "none",
                              minWidth: "180px"
                            }}
                          >
                            {buildingsList.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "12.5px" }}>
                            Tidak diperlukan
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12.5px",
            color: "#64748b"
          }}
        >
          <div>
            {filteredUsers.length} akun • Halaman 1 dari 1
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              disabled
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                color: "#94a3b8",
                cursor: "not-allowed"
              }}
            >
              &lt;
            </button>
            <button
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#1e3fae",
                color: "#ffffff",
                fontWeight: "700"
              }}
            >
              1
            </button>
            <button
              disabled
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                color: "#94a3b8",
                cursor: "not-allowed"
              }}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Cakupan Data per Role */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          border: "1px solid #e2e8f0",
          padding: "24px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)"
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0" }}>
            Cakupan Data per Role
          </h2>
          <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
            Akses data berdasarkan level role.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {/* Role 1: Penghuni */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px 18px"
            }}
          >
            <span
              style={{
                backgroundColor: "#dbeafe",
                color: "#1d4ed8",
                fontSize: "11px",
                fontWeight: "700",
                padding: "3px 10px",
                borderRadius: "999px",
                display: "inline-block",
                marginBottom: "12px"
              }}
            >
              Penghuni
            </span>
            <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
              Data diri sendiri
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
              Profil peserta dan izin milik sendiri.
            </div>
          </div>

          {/* Role 2: Fasil */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px 18px"
            }}
          >
            <span
              style={{
                backgroundColor: "#fef3c7",
                color: "#b45309",
                fontSize: "11px",
                fontWeight: "700",
                padding: "3px 10px",
                borderRadius: "999px",
                display: "inline-block",
                marginBottom: "12px"
              }}
            >
              Fasil
            </span>
            <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
              Penghuni di gedung yang dipetakan
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
              Peserta dan izin satu gedung.
            </div>
          </div>

          {/* Role 3: Admin */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px 18px"
            }}
          >
            <span
              style={{
                backgroundColor: "#ede9fe",
                color: "#6d28d9",
                fontSize: "11px",
                fontWeight: "700",
                padding: "3px 10px",
                borderRadius: "999px",
                display: "inline-block",
                marginBottom: "12px"
              }}
            >
              Admin
            </span>
            <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
              Seluruh data
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
              Akses penuh seluruh gedung dan pengguna.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

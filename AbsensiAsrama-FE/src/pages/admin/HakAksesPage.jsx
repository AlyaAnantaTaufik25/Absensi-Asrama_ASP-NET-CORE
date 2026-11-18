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
                assignedBuilding: rawRole === "fasil" ? (u.nomorKamar || "Asrama Hijau") : "Tidak diperlukan"
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
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, assignedBuilding } : user))
    );
  };

  const handleSave = async () => {
    try {
      const changed = users.filter((u) => u.currentRole !== u.newRole);
      for (const u of changed) {
        await updateUser(u.id, { role: u.newRole.toLowerCase() });
      }
      setToastMessage("Perubahan hak akses berhasil disimpan!");
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

  const hasChanges = users.some((u) => u.currentRole !== u.newRole);
  const fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: fontStack }}>
      {/* 1. Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1c1c1e", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
            Hak Akses & Peran
          </h1>
          <p style={{ fontSize: "14px", color: "#8e8e93", margin: 0 }}>
            Atur dan tetapkan peran (Admin, Fasilitator, Penghuni) untuk setiap pengguna.
          </p>
        </div>

        {hasChanges && (
          <button
            onClick={handleSave}
            style={{
              backgroundColor: "#007aff",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 22px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0, 122, 255, 0.3)",
              fontFamily: fontStack
            }}
          >
            Simpan Perubahan Peran
          </button>
        )}
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
        {/* Search */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #f2f2f7" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#f2f2f7",
              borderRadius: "12px",
              border: "1px solid #e5e5ea",
              padding: "8px 14px",
              maxWidth: "320px"
            }}
          >
            <Search size={15} color="#8e8e93" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pengguna..."
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                fontSize: "13px",
                outline: "none",
                color: "#1c1c1e",
                fontFamily: fontStack
              }}
            />
          </div>
        </div>

        {/* Table */}
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
              {filteredUsers.map((u, index) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: index === filteredUsers.length - 1 ? "none" : "1px solid #f2f2f7",
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
                            ? "rgba(0, 122, 255, 0.12)"
                            : u.currentRole === "Fasil"
                            ? "rgba(52, 199, 89, 0.12)"
                            : "rgba(142, 142, 147, 0.12)",
                        color:
                          u.currentRole === "Admin"
                            ? "#007aff"
                            : u.currentRole === "Fasil"
                            ? "#34c759"
                            : "#8e8e93",
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
                        color: "#1c1c1e",
                        outline: "none",
                        fontFamily: fontStack
                      }}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Fasil">Fasilitator</option>
                      <option value="Penghuni">Penghuni</option>
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
                          color: "#1c1c1e",
                          outline: "none",
                          fontFamily: fontStack
                        }}
                      >
                        {buildingsList.slice(1).map((b) => (
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
      </div>
    </div>
  );
}

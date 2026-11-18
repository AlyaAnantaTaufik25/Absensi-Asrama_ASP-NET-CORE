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
import { showToast } from "../../utils/toast";

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
        showToast(editingFasil ? "Data Fasilitator berhasil diperbarui!" : "Data Fasilitator berhasil ditambahkan!", "success");
        setShowModal(false);
        setEditingFasil(null);
        await loadFasil();
      } else {
        showToast("Gagal menyimpan fasil: " + (res.data?.message || "Terjadi kesalahan."), "error");
      }
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus fasilitator ${nama || ""}?`)) return;
    try {
      const res = await deleteUser(id);
      if (res.ok) {
        showToast("Fasilitator berhasil dihapus.", "success");
        await loadFasil();
      } else {
        showToast("Gagal menghapus fasilitator: " + (res.data?.message || "Terjadi kesalahan."), "error");
      }
    } catch (err) {
      showToast("Error: " + err.message, "error");
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

  const fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: fontStack }}>
      {/* 1. Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: "700",
              color: "#1c1c1e",
              letterSpacing: "-0.5px",
              margin: "0 0 4px 0"
            }}
          >
            Data Fasilitator
          </h1>
          <p style={{ fontSize: "14px", color: "#8e8e93", margin: 0 }}>
            Kelola data fasilitator dan penugasan lantai/gedung asrama.
          </p>
        </div>

        <button
          onClick={handleOpenTambah}
          style={{
            backgroundColor: "#007aff",
            border: "none",
            color: "#ffffff",
            fontWeight: "600",
            fontSize: "13px",
            padding: "9px 18px",
            borderRadius: "10px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0, 122, 255, 0.3)",
            fontFamily: fontStack
          }}
        >
          <Plus size={15} />
          Tambah Fasil
        </button>
      </div>

      {/* 2. Content Card with Filters and Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          overflow: "hidden"
        }}
      >
        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", padding: "18px 20px", borderBottom: "1px solid #f2f2f7" }}>
          {/* Search */}
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
              placeholder="Cari nama atau email..."
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

          {/* Gedung */}
          <select
            value={gedungFilter}
            onChange={(e) => setGedungFilter(e.target.value)}
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
            <option value="Semua Gedung">Semua Asrama</option>
            <option value="Asrama Hijau">Asrama Hijau (Putra)</option>
            <option value="Asrama Orange">Asrama Orange (Putra)</option>
            <option value="Asrama Roesma M. Sjaaf">Asrama Roesma M. Sjaaf (Putri)</option>
            <option value="Asrama Menpera">Asrama Menpera (Putri)</option>
            <option value="Asrama PUPERA 1">Asrama PUPERA 1 (Putri)</option>
            <option value="Asrama Rusunawa">Asrama Rusunawa (Putri)</option>
            <option value="Asrama RPX">Asrama RPX (Putri)</option>
          </select>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
            <thead>
              <tr style={{ backgroundColor: "#fafafc", borderBottom: "1px solid #e5e5ea", color: "#8e8e93", fontSize: "11.5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "16px 20px" }}>Nama Fasilitator</th>
                <th style={{ padding: "16px 20px" }}>ID / Kode</th>
                <th style={{ padding: "16px 20px" }}>No. Telepon / HP</th>
                <th style={{ padding: "16px 20px" }}>Gedung Binaan</th>
                <th style={{ padding: "16px 20px" }}>Status</th>
                <th style={{ padding: "16px 20px", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((f, index) => (
                <tr
                  key={f.id}
                  style={{
                    borderBottom: index === filteredList.length - 1 ? "none" : "1px solid #f2f2f7",
                    transition: "background-color 0.1s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: "600", color: "#1c1c1e" }}>{f.nama}</div>
                    <div style={{ fontSize: "12px", color: "#8e8e93" }}>{f.email}</div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontWeight: "600", color: "#007aff", backgroundColor: "rgba(0, 122, 255, 0.08)", padding: "3px 8px", borderRadius: "6px", fontSize: "12px" }}>
                      {f.code}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", color: "#8e8e93" }}>
                    {f.hp}
                  </td>
                  <td style={{ padding: "14px 20px", color: "#1c1c1e", fontWeight: "500" }}>
                    {f.gedung}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ backgroundColor: "rgba(52, 199, 89, 0.12)", color: "#34c759", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "12px" }}>
                      Aktif
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <button
                        onClick={() => setSelectedFasil(f)}
                        style={{
                          backgroundColor: "#f2f2f7",
                          border: "1px solid #e5e5ea",
                          color: "#1c1c1e",
                          fontSize: "12px",
                          fontWeight: "600",
                          padding: "5px 10px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontFamily: fontStack
                        }}
                      >
                        Detail
                      </button>
                      <button
                        style={{ border: "none", background: "none", color: "#8e8e93", cursor: "pointer", padding: "5px" }}
                        title="Edit Fasilitator"
                        onClick={() => handleOpenEdit(f)}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        style={{ border: "none", background: "none", color: "#ff3b30", cursor: "pointer", padding: "5px" }}
                        title="Hapus Fasilitator"
                        onClick={() => handleDelete(f.id, f.nama)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f2f2f7" }}>
          <div style={{ fontSize: "13px", color: "#8e8e93" }}>
            {filteredList.length} fasilitator terdaftar
          </div>
        </div>
      </div>

      {/* MODAL: Tambah / Edit Fasil */}
      {showModal && (
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
          onClick={() => setShowModal(false)}
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
                {editingFasil ? "Edit Fasilitator" : "Tambah Fasilitator"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ border: "none", background: "none", color: "#8e8e93", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Kak Alif Rahman"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", boxSizing: "border-box", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="fasil@demo.com"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", boxSizing: "border-box", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                  Password {editingFasil ? "(Kosongkan jika tetap)" : "*"}
                </label>
                <input
                  type="password"
                  required={!editingFasil}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingFasil ? "Kosongkan jika tidak diubah" : "Min. 6 karakter"}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", boxSizing: "border-box", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                  Gedung Binaan
                </label>
                <select
                  value={formData.gedung}
                  onChange={(e) => setFormData({ ...formData, gedung: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "9px 18px", borderRadius: "10px", border: "none", backgroundColor: "#f2f2f7", color: "#8e8e93", cursor: "pointer", fontSize: "13px", fontWeight: "600", fontFamily: fontStack }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: "9px 22px", borderRadius: "10px", border: "none", backgroundColor: "#007aff", color: "#ffffff", cursor: "pointer", fontSize: "13px", fontWeight: "600", fontFamily: fontStack, boxShadow: "0 2px 8px rgba(0, 122, 255, 0.3)" }}
                >
                  {editingFasil ? "Simpan Perubahan" : "Simpan Fasil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail */}
      {selectedFasil && (
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
          onClick={() => setSelectedFasil(null)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "420px",
              padding: "26px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              border: "1px solid rgba(0, 0, 0, 0.05)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ fontSize: "17px", fontWeight: "700", color: "#1c1c1e" }}>Detail Fasilitator</div>
              <button onClick={() => setSelectedFasil(null)} style={{ border: "none", background: "none", color: "#8e8e93", cursor: "pointer", padding: "4px" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13.5px" }}>
              <div style={{ backgroundColor: "#f2f2f7", padding: "12px 14px", borderRadius: "12px" }}>
                <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600", textTransform: "uppercase" }}>Nama Fasilitator</div>
                <div style={{ fontWeight: "700", color: "#1c1c1e", marginTop: "2px" }}>{selectedFasil.nama}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ backgroundColor: "#f2f2f7", padding: "10px 12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600" }}>KODE</div>
                  <div style={{ fontWeight: "600", color: "#007aff", marginTop: "2px" }}>{selectedFasil.code}</div>
                </div>
                <div style={{ backgroundColor: "#f2f2f7", padding: "10px 12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600" }}>STATUS</div>
                  <div style={{ fontWeight: "600", color: "#34c759", marginTop: "2px" }}>{selectedFasil.status}</div>
                </div>
              </div>
              <div style={{ backgroundColor: "#f2f2f7", padding: "10px 12px", borderRadius: "10px" }}>
                <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600" }}>EMAIL</div>
                <div style={{ color: "#1c1c1e", marginTop: "2px" }}>{selectedFasil.email}</div>
              </div>
              <div style={{ backgroundColor: "#f2f2f7", padding: "10px 12px", borderRadius: "10px" }}>
                <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600" }}>GEDUNG BINAAN</div>
                <div style={{ color: "#1c1c1e", fontWeight: "600", marginTop: "2px" }}>{selectedFasil.gedung}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

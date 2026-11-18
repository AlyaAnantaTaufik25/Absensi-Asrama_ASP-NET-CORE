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
import { getUsers, createUser, updateUser, deleteUser, getGedung, getKamar } from "../../services/api";
import { showToast } from "../../utils/toast";

export default function DataPenghuniPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [gedungFilter, setGedungFilter] = useState("Semua Gedung");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [showModal, setShowModal] = useState(false);
  const [editingPenghuni, setEditingPenghuni] = useState(null);
  const [selectedPenghuni, setSelectedPenghuni] = useState(null);
  const [penghuniList, setPenghuniList] = useState([]);
  const [availableGedung, setAvailableGedung] = useState([]);
  const [availableKamar, setAvailableKamar] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPenghuni = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      if (Array.isArray(data)) {
        const filtered = data.filter(
          (u) => u.role?.toLowerCase() === "penghuni" || u.role?.toLowerCase() === "mahasiswa"
        );
        setPenghuniList(
          filtered.map((u) => {
            const rawRoom = u.nomorKamar || "A-101";
            const parts = rawRoom.split("-");
            const gedungPrefix = parts[0] || "A";
            const lantaiNumber = parts[1] ? parts[1].charAt(0) : "1";

            return {
              id: u.idUser,
              nama: u.nama,
              email: u.email,
              nim: u.nim,
              asal: u.asal || "Padang",
              jk: u.jenisKelamin?.toLowerCase().startsWith("p") ? "P" : "L",
              gedung: `Gedung ${gedungPrefix}`,
              lantai: lantaiNumber,
              kamar: rawRoom,
              lokasi: `Kamar ${rawRoom}`,
              status: "Aktif"
            };
          })
        );
      }
    } catch (e) {
      console.warn("Gagal memuat penghuni:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPenghuni();
    getGedung().then((g) => { if (Array.isArray(g)) setAvailableGedung(g); });
    getKamar().then((k) => { if (Array.isArray(k)) setAvailableKamar(k); });
  }, []);

  const [formData, setFormData] = useState({
    nama: "",
    nim: "",
    asal: "Padang",
    jk: "L",
    email: "",
    password: "",
    gedung: "Gedung A",
    lantai: "1",
    kamar: "A-101"
  });

  const handleOpenTambah = () => {
    setEditingPenghuni(null);
    setFormData({
      nama: "",
      nim: "",
      asal: "Padang",
      jk: "L",
      email: "",
      password: "",
      gedung: availableGedung[0]?.namaGedung || "Gedung A",
      lantai: "1",
      kamar: availableKamar[0]?.noKamar || "A-101"
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPenghuni(p.id);
    setFormData({
      nama: p.nama,
      nim: p.nim,
      asal: p.asal || "Padang",
      jk: p.jk,
      email: p.email,
      password: "",
      gedung: p.gedung,
      lantai: String(p.lantai || "1"),
      kamar: p.kamar
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      nama: formData.nama.trim(),
      nim: formData.nim.trim(),
      asal: formData.asal || "Padang",
      nomorKamar: formData.kamar.trim(),
      jenisKelamin: formData.jk === "P" ? "Perempuan" : "Laki-laki",
      email: formData.email.trim() || `${formData.nim.trim()}@mynava.id`,
      role: "penghuni"
    };

    if (formData.password.trim()) {
      payload.password = formData.password.trim();
    } else if (!editingPenghuni) {
      payload.password = "asrama123";
    }

    try {
      const res = editingPenghuni
        ? await updateUser(editingPenghuni, payload)
        : await createUser(payload);

      if (res.ok) {
        showToast(editingPenghuni ? "Data penghuni berhasil diperbarui!" : "Data penghuni berhasil ditambahkan!", "success");
        setShowModal(false);
        setEditingPenghuni(null);
        await loadPenghuni();
      } else {
        showToast("Gagal menyimpan penghuni: " + (res.data?.message || "Terjadi kesalahan."), "error");
      }
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus ${nama || "penghuni ini"}?`)) return;
    try {
      const res = await deleteUser(id);
      if (res.ok) {
        showToast("Penghuni berhasil dihapus.", "success");
        await loadPenghuni();
      } else {
        showToast("Gagal menghapus penghuni: " + (res.data?.message || "Terjadi kesalahan."), "error");
      }
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  const filteredList = penghuniList.filter((item) => {
    const matchSearch =
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGedung =
      gedungFilter === "Semua Gedung" || item.lokasi.includes(gedungFilter);
    const matchStatus =
      statusFilter === "Semua Status" || item.status === statusFilter;
    return matchSearch && matchGedung && matchStatus;
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
              margin: 0
            }}
          >
            Data Mahasiswa
          </h1>
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
          Tambah Mahasiswa
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
        {/* Filter Controls Row */}
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
              placeholder="Cari nama atau NIM..."
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

          {/* Status */}
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

        {/* Data Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
            <thead>
              <tr style={{ backgroundColor: "#fafafc", borderBottom: "1px solid #e5e5ea", color: "#8e8e93", fontSize: "11.5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "16px 20px" }}>Nama</th>
                <th style={{ padding: "16px 20px" }}>NIM</th>
                <th style={{ padding: "16px 20px" }}>JK</th>
                <th style={{ padding: "16px 20px" }}>Gedung / Kamar</th>
                <th style={{ padding: "16px 20px" }}>Status</th>
                <th style={{ padding: "16px 20px", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((p, index) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: index === filteredList.length - 1 ? "none" : "1px solid #f2f2f7",
                    transition: "background-color 0.1s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: "600", color: "#1c1c1e" }}>{p.nama}</div>
                    <div style={{ fontSize: "12px", color: "#8e8e93" }}>{p.email}</div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontWeight: "500", color: "#1c1c1e" }}>{p.nim}</span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ color: "#8e8e93" }}>{p.jk}</span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontWeight: "600", color: "#007aff", backgroundColor: "rgba(0, 122, 255, 0.08)", padding: "3px 8px", borderRadius: "6px", fontSize: "12px" }}>
                      {p.lokasi}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    {p.status === "Aktif" ? (
                      <span style={{ backgroundColor: "rgba(52, 199, 89, 0.12)", color: "#34c759", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "12px" }}>
                        Aktif
                      </span>
                    ) : (
                      <span style={{ backgroundColor: "rgba(142, 142, 147, 0.12)", color: "#8e8e93", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "12px" }}>
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <button
                        onClick={() => setSelectedPenghuni(p)}
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
                        title="Edit Mahasiswa"
                        onClick={() => handleOpenEdit(p)}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        style={{ border: "none", background: "none", color: "#ff3b30", cursor: "pointer", padding: "5px" }}
                        title="Hapus Mahasiswa"
                        onClick={() => handleDelete(p.id, p.nama)}
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
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f2f2f7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "13px", color: "#8e8e93" }}>
            {filteredList.length} data mahasiswa terdaftar
          </div>
        </div>
      </div>

      {/* MODAL: Tambah / Edit Mahasiswa */}
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
              maxWidth: "540px",
              padding: "26px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              border: "1px solid rgba(0, 0, 0, 0.05)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1c1c1e", margin: 0 }}>
                {editingPenghuni ? "Edit Data Mahasiswa" : "Tambah Mahasiswa"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#8e8e93", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Alya Ananta"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", boxSizing: "border-box", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                    NIM *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nim}
                    onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                    placeholder="Contoh: 2311523005"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", boxSizing: "border-box", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                    Asal
                  </label>
                  <input
                    type="text"
                    value={formData.asal}
                    onChange={(e) => setFormData({ ...formData, asal: e.target.value })}
                    placeholder="Contoh: Padang, Sumbar"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", boxSizing: "border-box", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                    Jenis Kelamin *
                  </label>
                  <select
                    value={formData.jk}
                    onChange={(e) => setFormData({ ...formData, jk: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@email.com"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", boxSizing: "border-box", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                    Password {editingPenghuni ? "(Kosongkan jika tetap)" : "*"}
                  </label>
                  <input
                    type="password"
                    required={!editingPenghuni}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingPenghuni ? "Kosongkan jika tidak diubah" : "Min. 6 karakter"}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", boxSizing: "border-box", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                  />
                </div>
              </div>

              {/* Input Gedung, Lantai, dan Kamar */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                    Gedung Asrama *
                  </label>
                  <select
                    value={formData.gedung}
                    onChange={(e) => {
                      const selectedGedung = e.target.value;
                      const matchingKamars = availableKamar.filter((k) => k.namaGedung === selectedGedung);
                      setFormData({
                        ...formData,
                        gedung: selectedGedung,
                        kamar: matchingKamars[0]?.noKamar || formData.kamar
                      });
                    }}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                  >
                    {availableGedung.length > 0 ? (
                      availableGedung.map((g) => (
                        <option key={g.idGedung} value={g.namaGedung}>{g.namaGedung}</option>
                      ))
                    ) : (
                      <>
                        <option value="Asrama Hijau">Asrama Hijau (Putra)</option>
                        <option value="Asrama Orange">Asrama Orange (Putra)</option>
                        <option value="Asrama Roesma M. Sjaaf">Asrama Roesma M. Sjaaf (Putri)</option>
                        <option value="Asrama Menpera">Asrama Menpera (Putri)</option>
                        <option value="Asrama PUPERA 1">Asrama PUPERA 1 (Putri)</option>
                        <option value="Asrama Rusunawa">Asrama Rusunawa (Putri)</option>
                        <option value="Asrama RPX">Asrama RPX (Putri)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                    Lantai *
                  </label>
                  <select
                    value={formData.lantai}
                    onChange={(e) => setFormData({ ...formData, lantai: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                  >
                    <option value="1">Lantai 1</option>
                    <option value="2">Lantai 2</option>
                    <option value="3">Lantai 3</option>
                    <option value="4">Lantai 4</option>
                    <option value="5">Lantai 5</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                    Nomor Kamar *
                  </label>
                  <input
                    type="text"
                    list="kamar-list-dropdown"
                    required
                    value={formData.kamar}
                    onChange={(e) => setFormData({ ...formData, kamar: e.target.value })}
                    placeholder="Contoh: A-101"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", boxSizing: "border-box", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                  />
                  <datalist id="kamar-list-dropdown">
                    {availableKamar.map((k) => (
                      <option key={k.noKamar} value={k.noKamar}>
                        {k.noKamar} ({k.namaGedung})
                      </option>
                    ))}
                  </datalist>
                </div>
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
                  {editingPenghuni ? "Simpan Perubahan" : "Simpan Mahasiswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Mahasiswa */}
      {selectedPenghuni && (
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
          onClick={() => setSelectedPenghuni(null)}
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
              <div style={{ fontSize: "17px", fontWeight: "700", color: "#1c1c1e" }}>Detail Mahasiswa</div>
              <button onClick={() => setSelectedPenghuni(null)} style={{ border: "none", background: "none", color: "#8e8e93", cursor: "pointer", padding: "4px" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13.5px" }}>
              <div style={{ backgroundColor: "#f2f2f7", padding: "12px 14px", borderRadius: "12px" }}>
                <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600", textTransform: "uppercase" }}>Nama Lengkap</div>
                <div style={{ fontWeight: "700", color: "#1c1c1e", marginTop: "2px" }}>{selectedPenghuni.nama}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ backgroundColor: "#f2f2f7", padding: "10px 12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600" }}>NIM</div>
                  <div style={{ fontWeight: "600", color: "#1c1c1e", marginTop: "2px" }}>{selectedPenghuni.nim}</div>
                </div>
                <div style={{ backgroundColor: "#f2f2f7", padding: "10px 12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600" }}>STATUS</div>
                  <div style={{ fontWeight: "600", color: "#34c759", marginTop: "2px" }}>{selectedPenghuni.status}</div>
                </div>
              </div>
              <div style={{ backgroundColor: "#f2f2f7", padding: "10px 12px", borderRadius: "10px" }}>
                <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600" }}>EMAIL</div>
                <div style={{ color: "#1c1c1e", marginTop: "2px" }}>{selectedPenghuni.email}</div>
              </div>
              <div style={{ backgroundColor: "#f2f2f7", padding: "10px 12px", borderRadius: "10px" }}>
                <div style={{ fontSize: "11px", color: "#8e8e93", fontWeight: "600" }}>KAMAR / LOKASI</div>
                <div style={{ color: "#007aff", fontWeight: "600", marginTop: "2px" }}>{selectedPenghuni.lokasi}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

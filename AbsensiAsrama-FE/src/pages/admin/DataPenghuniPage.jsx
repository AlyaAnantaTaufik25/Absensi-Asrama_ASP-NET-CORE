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

  // Form State
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
        alert(editingPenghuni ? "Data penghuni berhasil diperbarui di database!" : "Data penghuni berhasil ditambahkan ke database!");
        setShowModal(false);
        setEditingPenghuni(null);
        await loadPenghuni();
      } else {
        alert("Gagal menyimpan penghuni: " + (res.data?.message || "Terjadi kesalahan."));
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus ${nama || "penghuni ini"} dari database MySQL?`)) return;
    try {
      const res = await deleteUser(id);
      if (res.ok) {
        alert("Penghuni berhasil dihapus.");
        await loadPenghuni();
      } else {
        alert("Gagal menghapus penghuni: " + (res.data?.message || "Terjadi kesalahan."));
      }
    } catch (err) {
      alert("Error: " + err.message);
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
            MANAJEMEN PENGHUNI
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
            Data Penghuni
          </h1>
          <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
            Kelola data dan akses seluruh penghuni asrama.
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
        {/* Filter Controls Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "18px" }}>
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
              placeholder="Cari nama atau NIM..."
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

          {/* Lantai */}
          <select style={{ height: "38px", padding: "0 10px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px" }}>
            <option value="Semua">Semua Lantai</option>
            <option value="1">Lantai 1</option>
            <option value="2">Lantai 2</option>
          </select>

          {/* Kamar */}
          <select style={{ height: "38px", padding: "0 10px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px" }}>
            <option value="Semua">Semua Kamar</option>
            <option value="A-101">A-101</option>
            <option value="B-104">B-104</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: "38px", padding: "0 10px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px" }}
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>

        {/* Data Table */}
        <div className="data-table-container">
          <table className="asrama-data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>NIM</th>
                <th>JK</th>
                <th>Gedung / Lantai / Kamar</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: "700", color: "#0f172a" }}>{p.nama}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{p.email}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: "600", color: "#334155" }}>{p.nim}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: "600", color: "#64748b" }}>{p.jk}</span>
                  </td>
                  <td>
                    <span style={{ color: "#334155" }}>{p.lokasi}</span>
                  </td>
                  <td>
                    {p.status === "Aktif" ? (
                      <span className="badge-status-green" style={{ fontSize: "11px", padding: "2px 10px" }}>
                        ● Aktif
                      </span>
                    ) : (
                      <span style={{ backgroundColor: "#f1f5f9", color: "#64748b", fontSize: "11px", fontWeight: "700", padding: "2px 10px", borderRadius: "9999px" }}>
                        ● Nonaktif
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <button
                        onClick={() => setSelectedPenghuni(p)}
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
                        title="Edit Penghuni"
                        onClick={() => handleOpenEdit(p)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                        title="Hapus Penghuni"
                        onClick={() => handleDelete(p.id, p.nama)}
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

      {/* 3. MODAL: Tambah Penghuni (Screenshot 4 Left) */}
      {showModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-dialog-box" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#2349d4", letterSpacing: "1px", textTransform: "uppercase" }}>
                  DATA PENGHUNI
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                  {editingPenghuni ? "Edit Data Penghuni" : "Tambah Penghuni"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ border: "none", background: "#f1f5f9", borderRadius: "8px", width: "28px", height: "28px", cursor: "pointer" }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Alya Ananta"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                    NIM *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nim}
                    onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                    placeholder="Contoh: 2311523005"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                    Asal
                  </label>
                  <input
                    type="text"
                    value={formData.asal}
                    onChange={(e) => setFormData({ ...formData, asal: e.target.value })}
                    placeholder="Contoh: Padang, Sumbar"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                    Jenis Kelamin *
                  </label>
                  <select
                    value={formData.jk}
                    onChange={(e) => setFormData({ ...formData, jk: e.target.value })}
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px" }}
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@email.com"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                    Password {editingPenghuni ? "(Kosongkan jika tidak diubah)" : "*"}
                  </label>
                  <input
                    type="password"
                    required={!editingPenghuni}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingPenghuni ? "Kosongkan jika tidak diubah" : "Min. 6 karakter"}
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Input Gedung, Lantai, dan Kamar */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
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
                    style={{ width: "100%", height: "36px", padding: "0 8px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px" }}
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
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                    Lantai *
                  </label>
                  <select
                    value={formData.lantai}
                    onChange={(e) => setFormData({ ...formData, lantai: e.target.value })}
                    style={{ width: "100%", height: "36px", padding: "0 8px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px" }}
                  >
                    <option value="1">Lantai 1</option>
                    <option value="2">Lantai 2</option>
                    <option value="3">Lantai 3</option>
                    <option value="4">Lantai 4</option>
                    <option value="5">Lantai 5</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                    Nomor Kamar *
                  </label>
                  <input
                    type="text"
                    list="kamar-list-dropdown"
                    required
                    value={formData.kamar}
                    onChange={(e) => setFormData({ ...formData, kamar: e.target.value })}
                    placeholder="Contoh: A-101"
                    style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
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
                  {editingPenghuni ? "Simpan Perubahan" : "Simpan Penghuni"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Penghuni */}
      {selectedPenghuni && (
        <div className="modal-backdrop-overlay" onClick={() => setSelectedPenghuni(null)}>
          <div className="modal-dialog-box" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>Detail Penghuni</div>
              <button onClick={() => setSelectedPenghuni(null)} style={{ border: "none", background: "#f1f5f9", borderRadius: "6px", width: "26px", height: "26px", cursor: "pointer" }}>
                <X size={15} color="#64748b" />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div><strong>Nama:</strong> {selectedPenghuni.nama}</div>
              <div><strong>NIM:</strong> {selectedPenghuni.nim}</div>
              <div><strong>Email:</strong> {selectedPenghuni.email}</div>
              <div><strong>Lokasi:</strong> {selectedPenghuni.lokasi}</div>
              <div><strong>Status:</strong> {selectedPenghuni.status}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  X,
  Crosshair,
  ChevronDown
} from "lucide-react";

const API = "http://localhost:5000";

export default function MasterDataPage() {
  const [activeSubTab, setActiveSubTab] = useState("gedung"); // "gedung" | "lantai" | "kamar"
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showModalGedung, setShowModalGedung] = useState(false);
  const [showModalLantai, setShowModalLantai] = useState(false);
  const [showModalKamar, setShowModalKamar] = useState(false);

  // Data dari database
  const [gedungList, setGedungList] = useState([]);
  const [kamarList, setKamarList] = useState([]);
  const [lantaiList, setLantaiList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch gedung dari API
  const fetchGedung = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/gedung`);
      if (!res.ok) throw new Error("Gagal mengambil data gedung");
      const data = await res.json();
      setGedungList(data.map(g => ({
        id: g.idGedung,
        nama: g.namaGedung,
        idUser: g.idUser,
        fasil: g.namaFasil || "-",
        lat: "-",
        lng: "-",
        radius: "-"
      })));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch kamar dari API
  const fetchKamar = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/kamar`);
      if (!res.ok) throw new Error("Gagal mengambil data kamar");
      const data = await res.json();
      setKamarList(data.map(k => ({
        id: k.noKamar,
        nomor: k.noKamar,
        gedung: k.namaGedung || "-",
        lantai: String(k.lantai),
        idGedung: k.idGedung,
        kapasitas: "-",
        terisi: "-"
      })));

      // Hitung lantai unik dari kamar
      const lantaiMap = {};
      data.forEach(k => {
        const key = `${k.idGedung}-${k.lantai}`;
        if (!lantaiMap[key]) {
          lantaiMap[key] = {
            id: key,
            gedung: k.namaGedung || "-",
            nomor: `Lantai ${k.lantai}`,
            kamar: 0
          };
        }
        lantaiMap[key].kamar++;
      });
      setLantaiList(Object.values(lantaiMap).map(l => ({
        ...l,
        kamar: `${l.kamar} Kamar`
      })));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGedung();
    fetchKamar();
  }, []);

  // Hapus gedung
  const handleDeleteGedung = async (id) => {
    if (!window.confirm("Yakin hapus gedung ini?")) return;
    try {
      const res = await fetch(`${API}/api/gedung/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus gedung");
      await fetchGedung();
    } catch (e) {
      alert(e.message);
    }
  };

  // Hapus kamar
  const handleDeleteKamar = async (noKamar) => {
    if (!window.confirm("Yakin hapus kamar ini?")) return;
    try {
      const res = await fetch(`${API}/api/kamar/${noKamar}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus kamar");
      await fetchKamar();
    } catch (e) {
      alert(e.message);
    }
  };

  // Form states for modals
  const [formGedung, setFormGedung] = useState({
    nama: "",
    idUser: "",
    lat: "-0.9411",
    lng: "100.4172",
    radius: "50"
  });

  const [formKamar, setFormKamar] = useState({
    noKamar: "",
    lantai: "1",
    idGedung: ""
  });

  // Handlers
  const handleSaveGedung = async (e) => {
    e.preventDefault();
    if (!formGedung.idUser) { alert("Pilih fasil pengelola (IdUser) terlebih dahulu."); return; }
    try {
      const res = await fetch(`${API}/api/gedung`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaGedung: formGedung.nama, idUser: parseInt(formGedung.idUser) })
      });
      if (!res.ok) throw new Error("Gagal menyimpan gedung");
      setShowModalGedung(false);
      setFormGedung({ nama: "", idUser: "", lat: "-0.9411", lng: "100.4172", radius: "50" });
      await fetchGedung();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveKamar = async (e) => {
    e.preventDefault();
    if (!formKamar.idGedung) { alert("Pilih gedung terlebih dahulu."); return; }
    try {
      const res = await fetch(`${API}/api/kamar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noKamar: formKamar.noKamar, lantai: parseInt(formKamar.lantai), idGedung: parseInt(formKamar.idGedung) })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Gagal menyimpan kamar"); }
      setShowModalKamar(false);
      setFormKamar({ noKamar: "", lantai: "1", idGedung: "" });
      await fetchKamar();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Error banner */}
      {error && (
        <div style={{ padding: "10px 16px", backgroundColor: "#fee2e2", borderRadius: "8px", color: "#b91c1c", fontSize: "13px" }}>
          ⚠️ {error} — Pastikan backend berjalan dan MySQL aktif.
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div style={{ padding: "10px 16px", backgroundColor: "#eff6ff", borderRadius: "8px", color: "#1d4ed8", fontSize: "13px" }}>
          ⏳ Memuat data dari database...
        </div>
      )}

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
          KONFIGURASI ASRAMA
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
          Master Data
        </h1>
        <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
          Kelola struktur gedung, lantai, dan kamar.
        </p>
      </div>

      {/* 2. Subtabs: Gedung | Lantai | Kamar */}
      <div style={{ display: "flex", gap: "10px" }}>
        {/* Gedung tab */}
        <button
          onClick={() => setActiveSubTab("gedung")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 18px",
            borderRadius: "12px",
            border: activeSubTab === "gedung" ? "none" : "1px solid #e2e8f0",
            backgroundColor: activeSubTab === "gedung" ? "#2349d4" : "#ffffff",
            color: activeSubTab === "gedung" ? "#ffffff" : "#475569",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: activeSubTab === "gedung" ? "0 4px 14px -2px rgba(35, 73, 212, 0.4)" : "none"
          }}
        >
          <span>Gedung</span>
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: "700",
              backgroundColor: activeSubTab === "gedung" ? "#f59e0b" : "#f1f5f9",
              color: activeSubTab === "gedung" ? "#ffffff" : "#64748b",
              padding: "1px 6px",
              borderRadius: "6px"
            }}
          >
            {gedungList.length}
          </span>
        </button>

        {/* Lantai tab */}
        <button
          onClick={() => setActiveSubTab("lantai")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 18px",
            borderRadius: "12px",
            border: activeSubTab === "lantai" ? "none" : "1px solid #e2e8f0",
            backgroundColor: activeSubTab === "lantai" ? "#2349d4" : "#ffffff",
            color: activeSubTab === "lantai" ? "#ffffff" : "#475569",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: activeSubTab === "lantai" ? "0 4px 14px -2px rgba(35, 73, 212, 0.4)" : "none"
          }}
        >
          <span>Lantai</span>
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: "700",
              backgroundColor: activeSubTab === "lantai" ? "#f59e0b" : "#f1f5f9",
              color: activeSubTab === "lantai" ? "#ffffff" : "#64748b",
              padding: "1px 6px",
              borderRadius: "6px"
            }}
          >
            {lantaiList.length}
          </span>
        </button>

        {/* Kamar tab */}
        <button
          onClick={() => setActiveSubTab("kamar")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 18px",
            borderRadius: "12px",
            border: activeSubTab === "kamar" ? "none" : "1px solid #e2e8f0",
            backgroundColor: activeSubTab === "kamar" ? "#2349d4" : "#ffffff",
            color: activeSubTab === "kamar" ? "#ffffff" : "#475569",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: activeSubTab === "kamar" ? "0 4px 14px -2px rgba(35, 73, 212, 0.4)" : "none"
          }}
        >
          <span>Kamar</span>
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: "700",
              backgroundColor: activeSubTab === "kamar" ? "#f59e0b" : "#f1f5f9",
              color: activeSubTab === "kamar" ? "#ffffff" : "#64748b",
              padding: "1px 6px",
              borderRadius: "6px"
            }}
          >
            {kamarList.length}
          </span>
        </button>
      </div>

      {/* 3. Main Table Card */}
      <div className="content-card" style={{ padding: "20px 24px" }}>
        {/* Top Filter and Action Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div style={{ position: "relative", width: "320px" }}>
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
              placeholder={`Cari ${activeSubTab}...`}
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

          {activeSubTab === "gedung" && (
            <button
              onClick={() => setShowModalGedung(true)}
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
              Tambah Gedung
            </button>
          )}

          {activeSubTab === "lantai" && (
            <button
              onClick={() => setShowModalLantai(true)}
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
              Tambah Lantai
            </button>
          )}

          {activeSubTab === "kamar" && (
            <button
              onClick={() => setShowModalKamar(true)}
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
              Tambah Kamar
            </button>
          )}
        </div>

        {/* 3.1 Gedung Table */}
        {activeSubTab === "gedung" && (
          <div className="data-table-container">
            <table className="asrama-data-table">
              <thead>
                <tr>
                  <th>Nama Gedung</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Radius</th>
                  <th>Fasil Pengelola</th>
                  <th style={{ textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {gedungList.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <span style={{ fontWeight: "700", color: "#0f172a" }}>{g.nama}</span>
                    </td>
                    <td>{g.lat}</td>
                    <td>{g.lng}</td>
                    <td>{g.radius}</td>
                    <td>
                      <span style={{ fontWeight: "600", color: "#334155" }}>{g.fasil}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <button
                          style={{
                            border: "none",
                            background: "none",
                            color: "#64748b",
                            cursor: "pointer",
                            padding: "4px"
                          }}
                          title="Edit"
                          onClick={() => alert(`Edit ${g.nama}`)}
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
                          title="Hapus"
                          onClick={() => handleDeleteGedung(g.id)}
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
        )}

        {/* 3.2 Lantai Table */}
        {activeSubTab === "lantai" && (
          <div className="data-table-container">
            <table className="asrama-data-table">
              <thead>
                <tr>
                  <th>Gedung</th>
                  <th>Nomor Lantai</th>
                  <th>Jumlah Kamar</th>
                  <th style={{ textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {lantaiList.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <span style={{ fontWeight: "700", color: "#0f172a" }}>{l.gedung}</span>
                    </td>
                    <td>{l.nomor}</td>
                    <td>{l.kamar}</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <button style={{ border: "none", background: "none", color: "#64748b", cursor: "pointer" }}>
                          <Edit2 size={15} />
                        </button>
                        <button
                          style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer" }}
                          onClick={() => setLantaiList(lantaiList.filter((x) => x.id !== l.id))}
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
        )}

        {/* 3.3 Kamar Table */}
        {activeSubTab === "kamar" && (
          <div className="data-table-container">
            <table className="asrama-data-table">
              <thead>
                <tr>
                  <th>Nomor Kamar</th>
                  <th>Gedung</th>
                  <th>Lantai</th>
                  <th>Kapasitas</th>
                  <th>Terisi</th>
                  <th style={{ textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kamarList.map((k) => (
                  <tr key={k.id}>
                    <td>
                      <span style={{ fontWeight: "700", color: "#0f172a" }}>{k.nomor}</span>
                    </td>
                    <td>{k.gedung}</td>
                    <td>Lantai {k.lantai}</td>
                    <td>{k.kapasitas}</td>
                    <td>
                      <span className="badge-status-blue" style={{ fontSize: "11px", padding: "2px 8px" }}>
                        {k.terisi}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <button style={{ border: "none", background: "none", color: "#64748b", cursor: "pointer" }}>
                          <Edit2 size={15} />
                        </button>
                        <button
                          style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer" }}
                          onClick={() => handleDeleteKamar(k.nomor)}
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
        )}

        {/* Table Footer */}
        <div className="table-pagination-row">
          <div style={{ fontSize: "12.5px", color: "#64748b" }}>
            Menampilkan {activeSubTab === "gedung" ? gedungList.length : activeSubTab === "lantai" ? lantaiList.length : kamarList.length} data
          </div>
          <div className="pagination-controls">
            <button className="page-num-btn active">1</button>
          </div>
        </div>
      </div>

      {/* 4. MODAL: Tambah Gedung (Screenshot 2 Left) */}
      {showModalGedung && (
        <div className="modal-backdrop-overlay" onClick={() => setShowModalGedung(false)}>
          <div className="modal-dialog-box" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#2349d4", letterSpacing: "1px", textTransform: "uppercase" }}>
                  MASTER DATA
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                  Tambah Gedung
                </h3>
              </div>
              <button
                onClick={() => setShowModalGedung(false)}
                style={{ border: "none", background: "#f1f5f9", borderRadius: "8px", width: "28px", height: "28px", cursor: "pointer" }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSaveGedung} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Nama Gedung *
                  </label>
                  <input
                    type="text"
                    required
                    value={formGedung.nama}
                    onChange={(e) => setFormGedung({ ...formGedung, nama: e.target.value })}
                    placeholder="Contoh: Gedung A"
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
                    ID Fasil Pengelola *
                  </label>
                  <select
                    value={formGedung.idUser}
                    onChange={(e) => setFormGedung({ ...formGedung, idUser: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                      fontSize: "12.5px",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">-- Pilih Fasil --</option>
                    {gedungList
                      .filter((g, i, arr) => arr.findIndex(x => x.idUser === g.idUser) === i && g.idUser)
                      .map(g => (
                        <option key={g.idUser} value={g.idUser}>{g.fasil} (ID: {g.idUser})</option>
                      ))
                    }
                  </select>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0 0" }}>
                    Pilih dari daftar fasil yang sudah terdaftar di database.
                  </p>
                </div>
              </div>

              {/* Map Preview Simulation */}
              <div
                style={{
                  height: "170px",
                  borderRadius: "12px",
                  backgroundColor: "#e8eff4",
                  position: "relative",
                  overflow: "hidden",
                  border: "1px solid #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {/* Simulated Roads */}
                <div style={{ position: "absolute", width: "100%", height: "18px", backgroundColor: "#ffffff", transform: "rotate(-18deg)" }} />
                <div style={{ position: "absolute", width: "100%", height: "22px", backgroundColor: "#ffffff", transform: "rotate(40deg)" }} />

                {/* Geofence circular radius */}
                <div
                  style={{
                    width: "90px",
                    height: "90px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(35, 73, 212, 0.15)",
                    border: "2px solid #2349d4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    zIndex: 2
                  }}
                >
                  <MapPin size={22} color="#2349d4" fill="#2349d4" />
                </div>

                {/* Map hint */}
                <span
                  style={{
                    position: "absolute",
                    bottom: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.85)",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    fontSize: "10.5px",
                    color: "#475569",
                    zIndex: 2
                  }}
                >
                  Klik pada peta untuk menentukan radius
                </span>
              </div>

              {/* Gunakan Lokasi Saya button */}
              <button
                type="button"
                onClick={() => {
                  setFormGedung({ ...formGedung, lat: "-0.9411", lng: "100.4172" });
                  alert("Lokasi GPS saat ini berhasil diterapkan.");
                }}
                style={{
                  width: "100%",
                  height: "38px",
                  backgroundColor: "#f0f6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "8px",
                  color: "#2349d4",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <Crosshair size={14} />
                Gunakan Lokasi Saya
              </button>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setShowModalGedung(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", cursor: "pointer", fontSize: "12.5px", fontWeight: "600" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 20px", borderRadius: "8px", border: "none", backgroundColor: "#2349d4", color: "#ffffff", cursor: "pointer", fontSize: "12.5px", fontWeight: "700" }}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Tambah Lantai (Screenshot 2 Right) */}
      {showModalLantai && (
        <div className="modal-backdrop-overlay" onClick={() => setShowModalLantai(false)}>
          <div className="modal-dialog-box" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#2349d4", letterSpacing: "1px", textTransform: "uppercase" }}>
                  MASTER DATA
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                  Tambah Lantai
                </h3>
              </div>
              <button
                onClick={() => setShowModalLantai(false)}
                style={{ border: "none", background: "#f1f5f9", borderRadius: "8px", width: "28px", height: "28px", cursor: "pointer" }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSaveLantai} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Gedung *
                  </label>
                  <select
                    value={formLantai.gedung}
                    onChange={(e) => setFormLantai({ ...formLantai, gedung: e.target.value })}
                    style={{ width: "100%", height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px" }}
                  >
                    {gedungList.map((g) => (
                      <option key={g.id} value={g.nama}>{g.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Nomor Lantai *
                  </label>
                  <input
                    type="text"
                    required
                    value={formLantai.nomor}
                    onChange={(e) => setFormLantai({ ...formLantai, nomor: e.target.value })}
                    placeholder="Contoh: Lantai 3"
                    style={{ width: "100%", height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowModalLantai(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", cursor: "pointer", fontSize: "12.5px", fontWeight: "600" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 20px", borderRadius: "8px", border: "none", backgroundColor: "#2349d4", color: "#ffffff", cursor: "pointer", fontSize: "12.5px", fontWeight: "700" }}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: Tambah Kamar (Screenshot 3 Left) */}
      {showModalKamar && (
        <div className="modal-backdrop-overlay" onClick={() => setShowModalKamar(false)}>
          <div className="modal-dialog-box" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#2349d4", letterSpacing: "1px", textTransform: "uppercase" }}>
                  MASTER DATA
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                  Tambah Kamar
                </h3>
              </div>
              <button
                onClick={() => setShowModalKamar(false)}
                style={{ border: "none", background: "#f1f5f9", borderRadius: "8px", width: "28px", height: "28px", cursor: "pointer" }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSaveKamar} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Gedung *
                  </label>
                  <select
                    value={formKamar.idGedung}
                    onChange={(e) => setFormKamar({ ...formKamar, idGedung: e.target.value })}
                    required
                    style={{ width: "100%", height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px" }}
                  >
                    <option value="">-- Pilih Gedung --</option>
                    {gedungList.map((g) => (
                      <option key={g.id} value={g.id}>{g.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Lantai *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formKamar.lantai}
                    onChange={(e) => setFormKamar({ ...formKamar, lantai: e.target.value })}
                    placeholder="Contoh: 1"
                    style={{ width: "100%", height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Nomor Kamar *
                  </label>
                  <input
                    type="text"
                    required
                    value={formKamar.noKamar}
                    onChange={(e) => setFormKamar({ ...formKamar, noKamar: e.target.value })}
                    placeholder="Contoh: A-101"
                    style={{ width: "100%", height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowModalKamar(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", cursor: "pointer", fontSize: "12.5px", fontWeight: "600" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 20px", borderRadius: "8px", border: "none", backgroundColor: "#2349d4", color: "#ffffff", cursor: "pointer", fontSize: "12.5px", fontWeight: "700" }}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

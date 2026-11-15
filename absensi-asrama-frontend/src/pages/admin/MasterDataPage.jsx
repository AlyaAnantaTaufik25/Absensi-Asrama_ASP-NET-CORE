import React, { useState } from "react";
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

export default function MasterDataPage() {
  const [activeSubTab, setActiveSubTab] = useState("gedung"); // "gedung" | "lantai" | "kamar"
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showModalGedung, setShowModalGedung] = useState(false);
  const [showModalLantai, setShowModalLantai] = useState(false);
  const [showModalKamar, setShowModalKamar] = useState(false);

  // Gedung Data
  const [gedungList, setGedungList] = useState([
    { id: 1, nama: "Gedung A", lat: "-0.9411", lng: "100.4172", radius: "50 m", fasil: "Budi Santoso" },
    { id: 2, nama: "Gedung B", lat: "-0.9413", lng: "100.4172", radius: "50 m", fasil: "Maya Kurnia" },
    { id: 3, nama: "Gedung C", lat: "-0.9409", lng: "100.4172", radius: "70 m", fasil: "Andi Rahman" },
    { id: 4, nama: "Gedung D", lat: "-0.9414", lng: "100.4172", radius: "50 m", fasil: "Risa Melati" },
    { id: 5, nama: "Gedung E", lat: "-0.9397", lng: "100.4172", radius: "50 m", fasil: "Dedi Irawan" }
  ]);

  // Lantai Data
  const [lantaiList, setLantaiList] = useState([
    { id: 1, gedung: "Gedung A", nomor: "Lantai 1", kamar: "4 Kamar" },
    { id: 2, gedung: "Gedung A", nomor: "Lantai 2", kamar: "6 Kamar" },
    { id: 3, gedung: "Gedung B", nomor: "Lantai 1", kamar: "5 Kamar" },
    { id: 4, gedung: "Gedung B", nomor: "Lantai 2", kamar: "5 Kamar" },
    { id: 5, gedung: "Gedung C", nomor: "Lantai 1", kamar: "4 Kamar" }
  ]);

  // Kamar Data
  const [kamarList, setKamarList] = useState([
    { id: 1, nomor: "A-101", gedung: "Gedung A", lantai: "1", kapasitas: "4 orang", terisi: "3/4" },
    { id: 2, nomor: "A-102", gedung: "Gedung A", lantai: "1", kapasitas: "4 orang", terisi: "4/4" },
    { id: 3, nomor: "A-103", gedung: "Gedung A", lantai: "1", kapasitas: "4 orang", terisi: "2/4" },
    { id: 4, nomor: "A-104", gedung: "Gedung A", lantai: "1", kapasitas: "4 orang", terisi: "4/4" },
    { id: 5, nomor: "A-201", gedung: "Gedung A", lantai: "2", kapasitas: "4 orang", terisi: "3/4" }
  ]);

  // Form states for modals
  const [formGedung, setFormGedung] = useState({
    nama: "",
    fasil: "Budi Santoso",
    lat: "-0.9411",
    lng: "100.4172",
    radius: "50"
  });

  const [formLantai, setFormLantai] = useState({
    gedung: "Gedung A",
    nomor: ""
  });

  const [formKamar, setFormKamar] = useState({
    gedung: "Gedung A",
    lantai: "Lantai 1",
    nomor: "",
    kapasitas: "4"
  });

  // Handlers
  const handleSaveGedung = (e) => {
    e.preventDefault();
    const newEntry = {
      id: Date.now(),
      nama: formGedung.nama || `Gedung ${String.fromCharCode(65 + gedungList.length)}`,
      lat: formGedung.lat,
      lng: formGedung.lng,
      radius: `${formGedung.radius} m`,
      fasil: formGedung.fasil
    };
    setGedungList([...gedungList, newEntry]);
    setShowModalGedung(false);
    setFormGedung({ nama: "", fasil: "Budi Santoso", lat: "-0.9411", lng: "100.4172", radius: "50" });
  };

  const handleSaveLantai = (e) => {
    e.preventDefault();
    const newEntry = {
      id: Date.now(),
      gedung: formLantai.gedung,
      nomor: formLantai.nomor || `Lantai ${lantaiList.length + 1}`,
      kamar: "0 Kamar"
    };
    setLantaiList([...lantaiList, newEntry]);
    setShowModalLantai(false);
    setFormLantai({ gedung: "Gedung A", nomor: "" });
  };

  const handleSaveKamar = (e) => {
    e.preventDefault();
    const newEntry = {
      id: Date.now(),
      nomor: formKamar.nomor || `Kamar-${kamarList.length + 1}`,
      gedung: formKamar.gedung,
      lantai: formKamar.lantai.replace("Lantai ", ""),
      kapasitas: `${formKamar.kapasitas} orang`,
      terisi: `0/${formKamar.kapasitas}`
    };
    setKamarList([...kamarList, newEntry]);
    setShowModalKamar(false);
    setFormKamar({ gedung: "Gedung A", lantai: "Lantai 1", nomor: "", kapasitas: "4" });
  };

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
                          onClick={() => setGedungList(gedungList.filter((x) => x.id !== g.id))}
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
                          onClick={() => setKamarList(kamarList.filter((x) => x.id !== k.id))}
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
                    Fasil Pengelola
                  </label>
                  <select
                    value={formGedung.fasil}
                    onChange={(e) => setFormGedung({ ...formGedung, fasil: e.target.value })}
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
                    <option value="Budi Santoso">Budi Santoso</option>
                    <option value="Maya Kurnia">Maya Kurnia</option>
                    <option value="Andi Rahman">Andi Rahman</option>
                    <option value="Risa Melati">Risa Melati</option>
                    <option value="Dedi Irawan">Dedi Irawan</option>
                  </select>
                </div>
              </div>

              {/* Coordinates & Radius Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={formGedung.lat}
                    onChange={(e) => setFormGedung({ ...formGedung, lat: e.target.value })}
                    style={{ width: "100%", height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={formGedung.lng}
                    onChange={(e) => setFormGedung({ ...formGedung, lng: e.target.value })}
                    style={{ width: "100%", height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Radius geofence (m)
                  </label>
                  <input
                    type="number"
                    value={formGedung.radius}
                    onChange={(e) => setFormGedung({ ...formGedung, radius: e.target.value })}
                    style={{ width: "100%", height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12px", boxSizing: "border-box" }}
                  />
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
                    value={formKamar.gedung}
                    onChange={(e) => setFormKamar({ ...formKamar, gedung: e.target.value })}
                    style={{ width: "100%", height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px" }}
                  >
                    {gedungList.map((g) => (
                      <option key={g.id} value={g.nama}>{g.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Lantai *
                  </label>
                  <select
                    value={formKamar.lantai}
                    onChange={(e) => setFormKamar({ ...formKamar, lantai: e.target.value })}
                    style={{ width: "100%", height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px" }}
                  >
                    <option value="Lantai 1">Lantai 1</option>
                    <option value="Lantai 2">Lantai 2</option>
                    <option value="Lantai 3">Lantai 3</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Nomor Kamar *
                  </label>
                  <input
                    type="text"
                    required
                    value={formKamar.nomor}
                    onChange={(e) => setFormKamar({ ...formKamar, nomor: e.target.value })}
                    placeholder="Contoh: A-101"
                    style={{ width: "100%", height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Kapasitas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formKamar.kapasitas}
                    onChange={(e) => setFormKamar({ ...formKamar, kapasitas: e.target.value })}
                    style={{ width: "100%", height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px", boxSizing: "border-box" }}
                  />
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

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  X,
  Crosshair,
  Building,
  Layers,
  DoorClosed,
  Navigation
} from "lucide-react";
import { API_BASE_URL, getUsers } from "../../services/api";

const API = API_BASE_URL;

/**
 * Komponen Peta Interaktif Leaflet OpenStreetMap
 */
function BuildingMapPicker({ lat, lng, radius, onChangeLocation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window === "undefined" || typeof window.L === "undefined") return;
      const el = document.getElementById("building-leaflet-container");
      if (!el) return;

      if (el._leaflet_id) {
        el._leaflet_id = null;
        el.innerHTML = "";
      }

      const parsedLat = parseFloat(lat) || -0.9144;
      const parsedLng = parseFloat(lng) || 100.4608;
      const parsedRadius = parseInt(radius) || 100;

      const map = window.L.map("building-leaflet-container", {
        center: [parsedLat, parsedLng],
        zoom: 16
      });

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors"
      }).addTo(map);

      const marker = window.L.marker([parsedLat, parsedLng], { draggable: true }).addTo(map);
      const circle = window.L.circle([parsedLat, parsedLng], {
        color: "#2563eb",
        fillColor: "#3b82f6",
        fillOpacity: 0.25,
        radius: parsedRadius
      }).addTo(map);

      marker.bindPopup("<b>Titik Lokasi Gedung</b><br/>Klik peta atau geser pin untuk menentukan titik.").openPopup();

      const onMove = (newLat, newLng) => {
        marker.setLatLng([newLat, newLng]);
        circle.setLatLng([newLat, newLng]);
        onChangeLocation(newLat.toFixed(6), newLng.toFixed(6));
      };

      marker.on("dragend", (e) => {
        const p = e.target.getLatLng();
        onMove(p.lat, p.lng);
      });

      map.on("click", (e) => {
        onMove(e.latlng.lat, e.latlng.lng);
      });

      setTimeout(() => map.invalidateSize(), 300);
    }, 150);

    return () => clearTimeout(timer);
  }, [lat, lng, radius]);

  return (
    <div>
      <div
        id="building-leaflet-container"
        style={{
          height: "220px",
          width: "100%",
          borderRadius: "10px",
          border: "1px solid #cbd5e1",
          overflow: "hidden",
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          zIndex: 1
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
        <span style={{ fontSize: "11px", color: "#64748b" }}>
          💡 Peta asli OpenStreetMap. Klik pada peta atau geser pin merah untuk memposisikan koordinat gedung.
        </span>
      </div>
    </div>
  );
}

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
  const [fasilOptions, setFasilOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Editing tracking
  const [editingGedung, setEditingGedung] = useState(null);
  const [editingKamar, setEditingKamar] = useState(null);

  // Form states for modals
  const [formGedung, setFormGedung] = useState({
    nama: "",
    namaFasil: "",
    idUser: "",
    lat: "-0.914400",
    lng: "100.460800",
    radius: "100",
    jumlahLantai: "3",
    kamarPerLantai: "4"
  });

  const [formKamar, setFormKamar] = useState({
    noKamar: "",
    lantai: "1",
    idGedung: ""
  });

  // Fetch gedung dari API
  const fetchGedung = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/gedung`);
      if (!res.ok) throw new Error("Gagal mengambil data gedung");
      const data = await res.json();
      setGedungList(
        data.map((g) => ({
          id: g.idGedung,
          nama: g.namaGedung,
          idUser: g.idUser,
          fasil: g.namaFasil || "-",
          lat: "-0.9144",
          lng: "100.4608",
          radius: "100m"
        }))
      );
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
      setKamarList(
        data.map((k) => ({
          id: k.noKamar,
          nomor: k.noKamar,
          gedung: k.namaGedung || "-",
          lantai: String(k.lantai),
          idGedung: k.idGedung,
          kapasitas: "4 Orang",
          terisi: "Terisi"
        }))
      );

      // Hitung lantai unik dari kamar
      const lantaiMap = {};
      data.forEach((k) => {
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
      setLantaiList(
        Object.values(lantaiMap).map((l) => ({
          ...l,
          kamar: `${l.kamar} Kamar`
        }))
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGedung();
    fetchKamar();
    getUsers().then((users) => {
      if (Array.isArray(users)) {
        setFasilOptions(
          users.filter(
            (u) => u.role?.toLowerCase() === "fasil" || u.role?.toLowerCase() === "admin"
          )
        );
      }
    });
  }, []);

  // Hapus gedung
  const handleDeleteGedung = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus ${nama} beserta seluruh kamar di dalamnya dari database?`)) return;
    try {
      const res = await fetch(`${API}/api/gedung/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus gedung");
      alert("Gedung berhasil dihapus dari database!");
      await fetchGedung();
      await fetchKamar();
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  // Hapus kamar
  const handleDeleteKamar = async (noKamar) => {
    if (!window.confirm(`Yakin ingin menghapus kamar ${noKamar} dari database?`)) return;
    try {
      const res = await fetch(`${API}/api/kamar/${noKamar}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus kamar");
      alert("Kamar berhasil dihapus dari database!");
      await fetchKamar();
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  // Open modal handlers
  const handleOpenTambahGedung = () => {
    setEditingGedung(null);
    setFormGedung({
      nama: "",
      namaFasil: fasilOptions[0]?.nama || "",
      idUser: fasilOptions[0]?.idUser ? String(fasilOptions[0].idUser) : "",
      lat: "-0.914400",
      lng: "100.460800",
      radius: "100",
      jumlahLantai: "3",
      kamarPerLantai: "4"
    });
    setShowModalGedung(true);
  };

  const handleOpenEditGedung = (g) => {
    setEditingGedung(g.id);
    setFormGedung({
      nama: g.nama,
      namaFasil: g.fasil && g.fasil !== "-" ? g.fasil : "",
      idUser: g.idUser ? String(g.idUser) : "",
      lat: "-0.914400",
      lng: "100.460800",
      radius: "100",
      jumlahLantai: "3",
      kamarPerLantai: "0"
    });
    setShowModalGedung(true);
  };

  const handleOpenTambahKamar = () => {
    setEditingKamar(null);
    setFormKamar({
      noKamar: "",
      lantai: "1",
      idGedung: gedungList[0]?.id ? String(gedungList[0].id) : ""
    });
    setShowModalKamar(true);
  };

  const handleOpenEditKamar = (k) => {
    setEditingKamar(k.noKamar);
    setFormKamar({
      noKamar: k.noKamar,
      lantai: String(k.lantai || "1"),
      idGedung: String(k.idGedung || (gedungList[0]?.id || "1"))
    });
    setShowModalKamar(true);
  };

  // Geolocation
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          setFormGedung((prev) => ({ ...prev, lat, lng }));
          alert(`Lokasi GPS terdeteksi: ${lat}, ${lng}`);
        },
        () => alert("Gagal mendeteksi lokasi GPS. Pastikan izin lokasi browser telah diizinkan.")
      );
    } else {
      alert("Browser tidak mendukung geolokasi GPS.");
    }
  };

  // Handlers simpan gedung
  const handleSaveGedung = async (e) => {
    e.preventDefault();
    if (!formGedung.nama.trim()) {
      alert("Nama gedung wajib diisi.");
      return;
    }
    try {
      const url = editingGedung ? `${API}/api/gedung/${editingGedung}` : `${API}/api/gedung`;
      const method = editingGedung ? "PUT" : "POST";
      const payload = {
        namaGedung: formGedung.nama.trim(),
        namaFasil: formGedung.namaFasil.trim(),
        idUser: formGedung.idUser ? parseInt(formGedung.idUser) : null,
        jumlahLantai: parseInt(formGedung.jumlahLantai) || 1,
        kamarPerLantai: parseInt(formGedung.kamarPerLantai) || 0,
        latitude: parseFloat(formGedung.lat) || -0.9144,
        longitude: parseFloat(formGedung.lng) || 100.4608,
        radius: parseInt(formGedung.radius) || 100
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || (editingGedung ? "Gagal memperbarui gedung" : "Gagal menyimpan gedung"));
      }

      setShowModalGedung(false);
      setEditingGedung(null);
      alert(editingGedung ? "Data gedung berhasil diperbarui!" : "Gedung dan struktur kamar berhasil ditambahkan ke database!");
      await fetchGedung();
      await fetchKamar();
    } catch (err) {
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  // Handlers simpan kamar
  const handleSaveKamar = async (e) => {
    e.preventDefault();
    if (!formKamar.idGedung) {
      alert("Pilih gedung terlebih dahulu.");
      return;
    }
    try {
      const url = editingKamar ? `${API}/api/kamar/${editingKamar}` : `${API}/api/kamar`;
      const method = editingKamar ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noKamar: formKamar.noKamar,
          lantai: parseInt(formKamar.lantai),
          idGedung: parseInt(formKamar.idGedung)
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || (editingKamar ? "Gagal memperbarui kamar" : "Gagal menyimpan kamar"));
      }
      setShowModalKamar(false);
      setEditingKamar(null);
      setFormKamar({ noKamar: "", lantai: "1", idGedung: "" });
      alert(editingKamar ? "Kamar berhasil diperbarui!" : "Kamar berhasil ditambahkan ke database!");
      await fetchKamar();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Filtered lists
  const filteredGedung = gedungList.filter(
    (g) =>
      g.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.fasil.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredKamar = kamarList.filter(
    (k) =>
      k.nomor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.gedung.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          Data Gedung
        </h1>
        <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
          Kelola data gedung, penugasan fasilitator pengelola, struktur lantai, dan kamar asrama.
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
            fontWeight: "700",
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: activeSubTab === "gedung" ? "0 4px 12px rgba(35, 73, 212, 0.25)" : "none"
          }}
        >
          <Building size={15} />
          Gedung
          <span
            style={{
              backgroundColor: activeSubTab === "gedung" ? "#f59e0b" : "#f1f5f9",
              color: activeSubTab === "gedung" ? "#ffffff" : "#64748b",
              borderRadius: "999px",
              padding: "1px 7px",
              fontSize: "11px",
              fontWeight: "800"
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
            fontWeight: "700",
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: activeSubTab === "lantai" ? "0 4px 12px rgba(35, 73, 212, 0.25)" : "none"
          }}
        >
          <Layers size={15} />
          Lantai
          <span
            style={{
              backgroundColor: activeSubTab === "lantai" ? "#f59e0b" : "#f1f5f9",
              color: activeSubTab === "lantai" ? "#ffffff" : "#64748b",
              borderRadius: "999px",
              padding: "1px 7px",
              fontSize: "11px",
              fontWeight: "800"
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
            fontWeight: "700",
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: activeSubTab === "kamar" ? "0 4px 12px rgba(35, 73, 212, 0.25)" : "none"
          }}
        >
          <DoorClosed size={15} />
          Kamar
          <span
            style={{
              backgroundColor: activeSubTab === "kamar" ? "#f59e0b" : "#f1f5f9",
              color: activeSubTab === "kamar" ? "#ffffff" : "#64748b",
              borderRadius: "999px",
              padding: "1px 7px",
              fontSize: "11px",
              fontWeight: "800"
            }}
          >
            {kamarList.length}
          </span>
        </button>
      </div>

      {/* 3. Main Data Card */}
      <div className="content-card" style={{ padding: "20px 24px" }}>
        {/* Search & Actions Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "18px" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "420px" }}>
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
              onClick={handleOpenTambahGedung}
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

          {activeSubTab === "kamar" && (
            <button
              onClick={handleOpenTambahKamar}
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
                {filteredGedung.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
                      Belum ada data gedung di database.
                    </td>
                  </tr>
                ) : (
                  filteredGedung.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <span style={{ fontWeight: "700", color: "#0f172a" }}>{g.nama}</span>
                      </td>
                      <td>{g.lat}</td>
                      <td>{g.lng}</td>
                      <td>{g.radius}</td>
                      <td>
                        <span style={{ fontWeight: "600", color: "#2563eb" }}>{g.fasil}</span>
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
                            title="Edit Gedung"
                            onClick={() => handleOpenEditGedung(g)}
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
                            title="Hapus Gedung"
                            onClick={() => handleDeleteGedung(g.id, g.nama)}
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
        )}

        {/* 3.2 Lantai Table */}
        {activeSubTab === "lantai" && (
          <div className="data-table-container">
            <table className="asrama-data-table">
              <thead>
                <tr>
                  <th>Gedung</th>
                  <th>Lantai</th>
                  <th>Total Kamar</th>
                </tr>
              </thead>
              <tbody>
                {lantaiList.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
                      Belum ada data lantai di database.
                    </td>
                  </tr>
                ) : (
                  lantaiList.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <span style={{ fontWeight: "700", color: "#0f172a" }}>{l.gedung}</span>
                      </td>
                      <td>{l.nomor}</td>
                      <td>
                        <span className="badge-status-blue" style={{ fontSize: "11px", padding: "2px 8px" }}>
                          {l.kamar}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
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
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredKamar.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
                      Belum ada data kamar di database.
                    </td>
                  </tr>
                ) : (
                  filteredKamar.map((k) => (
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
                          <button
                            style={{ border: "none", background: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
                            title="Edit Kamar"
                            onClick={() => handleOpenEditKamar(k)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                            title="Hapus Kamar"
                            onClick={() => handleDeleteKamar(k.nomor)}
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
        )}

        {/* Table Footer */}
        <div className="table-pagination-row">
          <div style={{ fontSize: "12.5px", color: "#64748b" }}>
            Menampilkan {activeSubTab === "gedung" ? filteredGedung.length : activeSubTab === "lantai" ? lantaiList.length : filteredKamar.length} data
          </div>
        </div>
      </div>

      {/* 4. MODAL: Tambah / Edit Gedung Lengkap dengan Peta Asli & Struktur Kamar */}
      {showModalGedung && (
        <div className="modal-backdrop-overlay" onClick={() => setShowModalGedung(false)}>
          <div className="modal-dialog-box" style={{ maxWidth: "640px", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#2349d4", letterSpacing: "1px", textTransform: "uppercase" }}>
                  DATA GEDUNG
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                  {editingGedung ? "Edit Data Gedung" : "Tambah Gedung Baru"}
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
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                    Nama Gedung *
                  </label>
                  <input
                    type="text"
                    required
                    value={formGedung.nama}
                    onChange={(e) => setFormGedung({ ...formGedung, nama: e.target.value })}
                    placeholder="Contoh: Gedung C"
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
                    Fasilitator Pengelola (Bisa Diketik / Dipilih) *
                  </label>
                  <input
                    type="text"
                    list="fasil-list-options"
                    required
                    value={formGedung.namaFasil}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = fasilOptions.find((f) => f.nama.toLowerCase() === val.toLowerCase());
                      setFormGedung({
                        ...formGedung,
                        namaFasil: val,
                        idUser: matched ? String(matched.idUser) : formGedung.idUser
                      });
                    }}
                    placeholder="Ketik nama fasil..."
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
                  <datalist id="fasil-list-options">
                    {fasilOptions.map((f) => (
                      <option key={f.idUser} value={f.nama}>
                        {f.nama} ({f.role ? f.role.toUpperCase() : "FASIL"})
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Sekaligus Buat Struktur Lantai & Kamar */}
              <div style={{ backgroundColor: "#f8fafc", borderRadius: "10px", padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12.5px", fontWeight: "800", color: "#0f172a", marginBottom: "2px" }}>
                  🏢 Struktur Lantai & Kamar Sekaligus
                </div>
                <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 8px 0" }}>
                  Tentukan jumlah lantai dan kamar agar database otomatis membuat kamar untuk gedung ini.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "3px" }}>
                      Jumlah Lantai
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formGedung.jumlahLantai}
                      onChange={(e) => setFormGedung({ ...formGedung, jumlahLantai: e.target.value })}
                      style={{
                        width: "100%",
                        height: "34px",
                        padding: "0 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        fontSize: "12px",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "3px" }}>
                      Kamar per Lantai
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={formGedung.kamarPerLantai}
                      onChange={(e) => setFormGedung({ ...formGedung, kamarPerLantai: e.target.value })}
                      style={{
                        width: "100%",
                        height: "34px",
                        padding: "0 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        fontSize: "12px",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
                {parseInt(formGedung.jumlahLantai) > 0 && parseInt(formGedung.kamarPerLantai) > 0 && (
                  <div style={{ marginTop: "6px", fontSize: "11.5px", color: "#2563eb", fontWeight: "700" }}>
                    ✓ Total {parseInt(formGedung.jumlahLantai) * parseInt(formGedung.kamarPerLantai)} kamar akan otomatis di-generate di database.
                  </div>
                )}
              </div>

              {/* Peta Asli Leaflet OpenStreetMap */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Peta Lokasi & Geofence Gedung (OpenStreetMap)
                </label>
                <BuildingMapPicker
                  lat={formGedung.lat}
                  lng={formGedung.lng}
                  radius={formGedung.radius}
                  onChangeLocation={(lat, lng) => setFormGedung((prev) => ({ ...prev, lat, lng }))}
                />
              </div>

              {/* Koordinat & Radius Inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "3px" }}>
                    LATITUDE
                  </label>
                  <input
                    type="text"
                    value={formGedung.lat}
                    onChange={(e) => setFormGedung({ ...formGedung, lat: e.target.value })}
                    style={{ width: "100%", height: "34px", padding: "0 8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "3px" }}>
                    LONGITUDE
                  </label>
                  <input
                    type="text"
                    value={formGedung.lng}
                    onChange={(e) => setFormGedung({ ...formGedung, lng: e.target.value })}
                    style={{ width: "100%", height: "34px", padding: "0 8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "3px" }}>
                    RADIUS (METER)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={formGedung.radius}
                    onChange={(e) => setFormGedung({ ...formGedung, radius: e.target.value })}
                    style={{ width: "100%", height: "34px", padding: "0 8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  style={{
                    flex: 1,
                    height: "36px",
                    backgroundColor: "#f0f6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "8px",
                    color: "#2349d4",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <Crosshair size={14} />
                  Gunakan Lokasi GPS Saya
                </button>
                <button
                  type="button"
                  onClick={() => setFormGedung((prev) => ({ ...prev, lat: "-0.914400", lng: "100.460800" }))}
                  style={{
                    padding: "0 14px",
                    height: "36px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    color: "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Asrama Unand
                </button>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowModalGedung(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", cursor: "pointer", fontSize: "12.5px", fontWeight: "600" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 22px", borderRadius: "8px", border: "none", backgroundColor: "#2349d4", color: "#ffffff", cursor: "pointer", fontSize: "12.5px", fontWeight: "700" }}
                >
                  {editingGedung ? "Simpan Perubahan Gedung" : "Simpan Gedung & Kamar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Tambah / Edit Kamar */}
      {showModalKamar && (
        <div className="modal-backdrop-overlay" onClick={() => setShowModalKamar(false)}>
          <div className="modal-dialog-box" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#2349d4", letterSpacing: "1px", textTransform: "uppercase" }}>
                  DATA KAMAR
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                  {editingKamar ? "Edit Kamar" : "Tambah Kamar"}
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
                  style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px", boxSizing: "border-box" }}
                />
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
                  {editingKamar ? "Simpan Perubahan Kamar" : "Simpan Kamar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

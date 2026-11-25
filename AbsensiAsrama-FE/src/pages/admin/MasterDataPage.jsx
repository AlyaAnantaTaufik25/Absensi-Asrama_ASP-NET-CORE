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
import { showToast } from "../../utils/toast";

const API = API_BASE_URL;

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
        color: "#007aff",
        fillColor: "#007aff",
        fillOpacity: 0.2,
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
          borderRadius: "12px",
          border: "1px solid #e5e5ea",
          overflow: "hidden",
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          zIndex: 1
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
        <span style={{ fontSize: "11.5px", color: "#8e8e93" }}>
          Peta OpenStreetMap. Klik pada peta atau geser pin merah untuk memposisikan koordinat gedung.
        </span>
      </div>
    </div>
  );
}

export default function MasterDataPage() {
  const [activeSubTab, setActiveSubTab] = useState("gedung"); // "gedung" | "lantai" | "kamar"
  const [searchQuery, setSearchQuery] = useState("");

  const [showModalGedung, setShowModalGedung] = useState(false);
  const [showModalLantai, setShowModalLantai] = useState(false);
  const [showModalKamar, setShowModalKamar] = useState(false);

  const [gedungList, setGedungList] = useState([]);
  const [kamarList, setKamarList] = useState([]);
  const [lantaiList, setLantaiList] = useState([]);
  const [fasilOptions, setFasilOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [editingGedung, setEditingGedung] = useState(null);
  const [editingKamar, setEditingKamar] = useState(null);
  const [selectedFasils, setSelectedFasils] = useState([]);

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

  const fetchGedung = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/gedung`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("mynava_gedung_cache", JSON.stringify(data));
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
        setError(null);
        return;
      }
    } catch (e) {
      console.warn("Gagal mengambil data gedung dari backend:", e);
    } finally {
      setLoading(false);
    }
    const cached = localStorage.getItem("mynava_gedung_cache");
    if (cached) {
      try {
        const data = JSON.parse(cached);
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
      } catch {}
    }
  };

  const fetchKamar = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/kamar`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("mynava_kamar_cache", JSON.stringify(data));
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
        setError(null);
        return;
      }
    } catch (e) {
      console.warn("Gagal mengambil data kamar dari backend:", e);
    } finally {
      setLoading(false);
    }
    const cachedKamar = localStorage.getItem("mynava_kamar_cache");
    if (cachedKamar) {
      try {
        const data = JSON.parse(cachedKamar);
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
      } catch {}
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

  const handleDeleteGedung = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus ${nama} beserta seluruh kamar di dalamnya dari database?`)) return;
    try {
      const res = await fetch(`${API}/api/gedung/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus gedung");
      showToast("Gedung berhasil dihapus!", "success");
      await fetchGedung();
      await fetchKamar();
    } catch (e) {
      showToast("Error: " + e.message, "error");
    }
  };

  const handleDeleteKamar = async (noKamar) => {
    if (!window.confirm(`Yakin ingin menghapus kamar ${noKamar} dari database?`)) return;
    try {
      const res = await fetch(`${API}/api/kamar/${noKamar}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus kamar");
      showToast("Kamar berhasil dihapus!", "success");
      await fetchKamar();
    } catch (e) {
      showToast("Error: " + e.message, "error");
    }
  };

  const handleOpenTambahGedung = () => {
    setEditingGedung(null);
    setSelectedFasils([]);
    setFormGedung({
      nama: "",
      namaFasil: "",
      idUser: "",
      lat: "",
      lng: "",
      radius: "",
      jumlahLantai: "",
      kamarPerLantai: ""
    });
    setShowModalGedung(true);
  };

  const handleOpenEditGedung = (g) => {
    setEditingGedung(g.id);
    const fasilNames = g.fasil && g.fasil !== "-" ? g.fasil.split(",").map((s) => s.trim()).filter(Boolean) : [];
    setSelectedFasils(fasilNames);
    setFormGedung({
      nama: g.nama,
      namaFasil: g.fasil && g.fasil !== "-" ? g.fasil : "",
      idUser: g.idUser ? String(g.idUser) : "",
      lat: g.lat ? g.lat.replace("m", "") : "",
      lng: g.lng || "",
      radius: g.radius ? g.radius.replace("m", "") : "",
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

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          setFormGedung((prev) => ({ ...prev, lat, lng }));
          showToast(`Lokasi GPS terdeteksi: ${lat}, ${lng}`, "info");
        },
        () => showToast("Gagal mendeteksi lokasi GPS. Pastikan izin lokasi browser telah diizinkan.", "error")
      );
    } else {
      showToast("Browser tidak mendukung geolokasi GPS.", "warning");
    }
  };

  const handleSaveGedung = async (e) => {
    e.preventDefault();
    if (!formGedung.nama.trim()) {
      showToast("Nama gedung wajib diisi.", "warning");
      return;
    }
    const finalFasilNames = selectedFasils.length > 0 ? selectedFasils.join(", ") : formGedung.namaFasil.trim();
    if (!finalFasilNames) {
      showToast("Silakan pilih minimal satu fasilitator pengelola.", "warning");
      return;
    }

    const firstFasilObj = fasilOptions.find(f => f.nama.toLowerCase() === (selectedFasils[0] || formGedung.namaFasil).toLowerCase());
    const assignedUserId = firstFasilObj ? firstFasilObj.idUser : (formGedung.idUser ? parseInt(formGedung.idUser) : null);

    try {
      const url = editingGedung ? `${API}/api/gedung/${editingGedung}` : `${API}/api/gedung`;
      const method = editingGedung ? "PUT" : "POST";
      const payload = {
        namaGedung: formGedung.nama.trim(),
        namaFasil: finalFasilNames,
        idUser: assignedUserId,
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
      showToast(editingGedung ? "Data gedung berhasil diperbarui!" : "Gedung dan kamar berhasil disimpan!", "success");
      await fetchGedung();
      await fetchKamar();
    } catch (e) {
      showToast("Error: " + e.message, "error");
    }
  };

  const handleSaveKamar = async (e) => {
    e.preventDefault();
    if (!formKamar.idGedung) {
      showToast("Pilih gedung terlebih dahulu.", "warning");
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
      showToast(editingKamar ? "Kamar berhasil diperbarui!" : "Kamar berhasil ditambahkan!", "success");
      await fetchKamar();
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

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

  const fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: fontStack }}>
      {/* Error banner */}
      {error && (
        <div style={{ padding: "12px 18px", backgroundColor: "rgba(255, 59, 48, 0.12)", border: "1px solid rgba(255, 59, 48, 0.25)", borderRadius: "12px", color: "#ff3b30", fontSize: "13.5px" }}>
          {error} — Pastikan backend berjalan dan MySQL aktif.
        </div>
      )}

      {/* 1. Header Row */}
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
          Data Gedung Asrama
        </h1>
        <p style={{ fontSize: "14px", color: "#8e8e93", margin: 0 }}>
          Kelola data gedung, penugasan fasilitator pengelola, struktur lantai, dan kamar asrama.
        </p>
      </div>

      {/* 2. Apple HIG Segmented Subtabs: Gedung | Lantai | Kamar */}
      <div
        style={{
          display: "inline-flex",
          backgroundColor: "#e5e5ea",
          padding: "3px",
          borderRadius: "12px",
          gap: "2px",
          alignSelf: "flex-start"
        }}
      >
        <button
          onClick={() => setActiveSubTab("gedung")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "7px 18px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: activeSubTab === "gedung" ? "#ffffff" : "transparent",
            color: activeSubTab === "gedung" ? "#1c1c1e" : "#8e8e93",
            fontWeight: "600",
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: activeSubTab === "gedung" ? "0 2px 6px rgba(0, 0, 0, 0.08)" : "none",
            transition: "all 0.15s ease",
            fontFamily: fontStack
          }}
        >
          <Building size={15} />
          Gedung ({gedungList.length})
        </button>

        <button
          onClick={() => setActiveSubTab("lantai")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "7px 18px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: activeSubTab === "lantai" ? "#ffffff" : "transparent",
            color: activeSubTab === "lantai" ? "#1c1c1e" : "#8e8e93",
            fontWeight: "600",
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: activeSubTab === "lantai" ? "0 2px 6px rgba(0, 0, 0, 0.08)" : "none",
            transition: "all 0.15s ease",
            fontFamily: fontStack
          }}
        >
          <Layers size={15} />
          Lantai ({lantaiList.length})
        </button>

        <button
          onClick={() => setActiveSubTab("kamar")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "7px 18px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: activeSubTab === "kamar" ? "#ffffff" : "transparent",
            color: activeSubTab === "kamar" ? "#1c1c1e" : "#8e8e93",
            fontWeight: "600",
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: activeSubTab === "kamar" ? "0 2px 6px rgba(0, 0, 0, 0.08)" : "none",
            transition: "all 0.15s ease",
            fontFamily: fontStack
          }}
        >
          <DoorClosed size={15} />
          Kamar ({kamarList.length})
        </button>
      </div>

      {/* 3. Main Data Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          overflow: "hidden"
        }}
      >
        {/* Search & Actions Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "18px 20px", borderBottom: "1px solid #f2f2f7", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#f2f2f7",
              borderRadius: "12px",
              border: "1px solid #e5e5ea",
              padding: "8px 14px",
              maxWidth: "360px",
              flex: 1
            }}
          >
            <Search size={15} color="#8e8e93" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari data ${activeSubTab}...`}
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

          {activeSubTab === "gedung" && (
            <button
              onClick={handleOpenTambahGedung}
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
              Tambah Gedung
            </button>
          )}

          {activeSubTab === "kamar" && (
            <button
              onClick={handleOpenTambahKamar}
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
              Tambah Kamar
            </button>
          )}
        </div>

        {/* 3.1 Gedung Table */}
        {activeSubTab === "gedung" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "#fafafc", borderBottom: "1px solid #e5e5ea", color: "#8e8e93", fontSize: "11.5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "16px 20px" }}>Nama Gedung</th>
                  <th style={{ padding: "16px 20px" }}>Latitude</th>
                  <th style={{ padding: "16px 20px" }}>Longitude</th>
                  <th style={{ padding: "16px 20px" }}>Radius Geofence</th>
                  <th style={{ padding: "16px 20px" }}>Fasilitator Pengelola</th>
                  <th style={{ padding: "16px 20px", textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredGedung.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px", color: "#8e8e93" }}>
                      Belum ada data gedung di database.
                    </td>
                  </tr>
                ) : (
                  filteredGedung.map((g, index) => (
                    <tr
                      key={g.id}
                      style={{
                        borderBottom: index === filteredGedung.length - 1 ? "none" : "1px solid #f2f2f7",
                        transition: "background-color 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontWeight: "600", color: "#1c1c1e" }}>{g.nama}</span>
                      </td>
                      <td style={{ padding: "14px 20px", color: "#8e8e93" }}>{g.lat}</td>
                      <td style={{ padding: "14px 20px", color: "#8e8e93" }}>{g.lng}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontWeight: "600", color: "#007aff", backgroundColor: "rgba(0, 122, 255, 0.08)", padding: "3px 8px", borderRadius: "6px", fontSize: "12px" }}>
                          {g.radius}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", color: "#1c1c1e", fontWeight: "500" }}>
                        {g.fasil}
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            style={{ border: "none", background: "none", color: "#8e8e93", cursor: "pointer", padding: "5px" }}
                            title="Edit Gedung"
                            onClick={() => handleOpenEditGedung(g)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            style={{ border: "none", background: "none", color: "#ff3b30", cursor: "pointer", padding: "5px" }}
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
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "#fafafc", borderBottom: "1px solid #e5e5ea", color: "#8e8e93", fontSize: "11.5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "16px 20px" }}>Gedung</th>
                  <th style={{ padding: "16px 20px" }}>Lantai</th>
                  <th style={{ padding: "16px 20px" }}>Total Kamar</th>
                </tr>
              </thead>
              <tbody>
                {lantaiList.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "48px 16px", color: "#8e8e93" }}>
                      Belum ada data lantai di database.
                    </td>
                  </tr>
                ) : (
                  lantaiList.map((l, index) => (
                    <tr
                      key={l.id}
                      style={{
                        borderBottom: index === lantaiList.length - 1 ? "none" : "1px solid #f2f2f7",
                        transition: "background-color 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "14px 20px", fontWeight: "600", color: "#1c1c1e" }}>
                        {l.gedung}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#1c1c1e" }}>{l.nomor}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontWeight: "600", color: "#007aff", backgroundColor: "rgba(0, 122, 255, 0.08)", padding: "3px 8px", borderRadius: "6px", fontSize: "12px" }}>
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
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "#fafafc", borderBottom: "1px solid #e5e5ea", color: "#8e8e93", fontSize: "11.5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "16px 20px" }}>Nomor Kamar</th>
                  <th style={{ padding: "16px 20px" }}>Gedung</th>
                  <th style={{ padding: "16px 20px" }}>Lantai</th>
                  <th style={{ padding: "16px 20px" }}>Kapasitas</th>
                  <th style={{ padding: "16px 20px" }}>Status</th>
                  <th style={{ padding: "16px 20px", textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredKamar.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px", color: "#8e8e93" }}>
                      Belum ada data kamar di database.
                    </td>
                  </tr>
                ) : (
                  filteredKamar.map((k, index) => (
                    <tr
                      key={k.id}
                      style={{
                        borderBottom: index === filteredKamar.length - 1 ? "none" : "1px solid #f2f2f7",
                        transition: "background-color 0.1s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontWeight: "600", color: "#007aff", backgroundColor: "rgba(0, 122, 255, 0.08)", padding: "3px 8px", borderRadius: "6px", fontSize: "12px" }}>
                          {k.nomor}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", color: "#1c1c1e", fontWeight: "500" }}>{k.gedung}</td>
                      <td style={{ padding: "14px 20px", color: "#8e8e93" }}>Lantai {k.lantai}</td>
                      <td style={{ padding: "14px 20px", color: "#8e8e93" }}>{k.kapasitas}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ backgroundColor: "rgba(52, 199, 89, 0.12)", color: "#34c759", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "12px" }}>
                          {k.terisi}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            style={{ border: "none", background: "none", color: "#8e8e93", cursor: "pointer", padding: "5px" }}
                            title="Edit Kamar"
                            onClick={() => handleOpenEditKamar(k)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            style={{ border: "none", background: "none", color: "#ff3b30", cursor: "pointer", padding: "5px" }}
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
      </div>

      {/* MODAL: Tambah / Edit Gedung */}
      {showModalGedung && (
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
          onClick={() => setShowModalGedung(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "620px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "26px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              border: "1px solid rgba(0, 0, 0, 0.05)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1c1c1e", margin: 0 }}>
                {editingGedung ? "Edit Data Gedung" : "Tambah Gedung Baru"}
              </h3>
              <button
                onClick={() => setShowModalGedung(false)}
                style={{ border: "none", background: "none", color: "#8e8e93", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGedung} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                    Nama Gedung *
                  </label>
                  <input
                    type="text"
                    required
                    value={formGedung.nama}
                    onChange={(e) => setFormGedung({ ...formGedung, nama: e.target.value })}
                    placeholder="Contoh: Gedung C"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#ffffff", fontSize: "13px", fontWeight: "400", boxSizing: "border-box", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                    Fasilitator Pengelola * (Bisa Pilih &gt; 1)
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "8px 10px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#ffffff", minHeight: "38px", maxHeight: "110px", overflowY: "auto", boxSizing: "border-box" }}>
                    {fasilOptions.length === 0 ? (
                      <span style={{ fontSize: "12px", color: "#8e8e93", fontWeight: "400" }}>Memuat daftar fasil...</span>
                    ) : (
                      fasilOptions.map((f) => {
                        const isSelected = selectedFasils.includes(f.nama);
                        return (
                          <button
                            key={f.idUser}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedFasils(selectedFasils.filter((name) => name !== f.nama));
                              } else {
                                setSelectedFasils([...selectedFasils, f.nama]);
                              }
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 9px",
                              borderRadius: "7px",
                              fontSize: "12px",
                              fontWeight: "400",
                              cursor: "pointer",
                              border: isSelected ? "1px solid #007aff" : "1px solid #e5e5ea",
                              backgroundColor: isSelected ? "#007aff" : "#f2f2f7",
                              color: isSelected ? "#ffffff" : "#1c1c1e",
                              transition: "all 0.15s ease"
                            }}
                          >
                            {isSelected && <Check size={11} strokeWidth={2.5} />}
                            <span>{f.nama}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                  {selectedFasils.length > 0 && (
                    <div style={{ fontSize: "11.5px", color: "#007aff", fontWeight: "400", marginTop: "3px" }}>
                      Fasilitator dipilih: {selectedFasils.join(", ")}
                    </div>
                  )}
                </div>
              </div>

              {/* Sekaligus Buat Struktur Lantai & Kamar */}
              <div style={{ backgroundColor: "#f9fafb", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e5ea" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#1c1c1e", marginBottom: "2px" }}>
                  Struktur Lantai & Kamar Otomatis
                </div>
                <p style={{ fontSize: "12px", color: "#8e8e93", margin: "0 0 10px 0", fontWeight: "400" }}>
                  Tentukan jumlah lantai dan kamar agar sistem otomatis membuat kamar untuk gedung ini.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                      Jumlah Lantai
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      placeholder="Contoh: 3"
                      value={formGedung.jumlahLantai}
                      onChange={(e) => setFormGedung({ ...formGedung, jumlahLantai: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e5e5ea", backgroundColor: "#ffffff", fontSize: "13px", fontWeight: "400", boxSizing: "border-box", color: "#1c1c1e" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                      Kamar per Lantai
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      placeholder="Contoh: 4"
                      value={formGedung.kamarPerLantai}
                      onChange={(e) => setFormGedung({ ...formGedung, kamarPerLantai: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e5e5ea", backgroundColor: "#ffffff", fontSize: "13px", fontWeight: "400", boxSizing: "border-box", color: "#1c1c1e" }}
                    />
                  </div>
                </div>
              </div>

              {/* Peta Asli Leaflet OpenStreetMap */}
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "6px" }}>
                  Peta Lokasi & Geofence (OpenStreetMap)
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
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#8e8e93", marginBottom: "3px" }}>
                    LATITUDE
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: -0.914400"
                    value={formGedung.lat}
                    onChange={(e) => setFormGedung({ ...formGedung, lat: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e5e5ea", fontSize: "12px", fontWeight: "400", boxSizing: "border-box", backgroundColor: "#ffffff", color: "#1c1c1e" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#8e8e93", marginBottom: "3px" }}>
                    LONGITUDE
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 100.460800"
                    value={formGedung.lng}
                    onChange={(e) => setFormGedung({ ...formGedung, lng: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e5e5ea", fontSize: "12px", fontWeight: "400", boxSizing: "border-box", backgroundColor: "#ffffff", color: "#1c1c1e" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#8e8e93", marginBottom: "3px" }}>
                    RADIUS (METER)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    placeholder="Contoh: 100"
                    value={formGedung.radius}
                    onChange={(e) => setFormGedung({ ...formGedung, radius: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e5e5ea", fontSize: "12px", fontWeight: "400", boxSizing: "border-box", backgroundColor: "#ffffff", color: "#1c1c1e" }}
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
                    backgroundColor: "rgba(0, 122, 255, 0.08)",
                    border: "1px solid rgba(0, 122, 255, 0.2)",
                    borderRadius: "10px",
                    color: "#007aff",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontFamily: fontStack
                  }}
                >
                  <Crosshair size={14} />
                  Gunakan Lokasi GPS Saya
                </button>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowModalGedung(false)}
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

      {/* MODAL: Tambah / Edit Kamar */}
      {showModalKamar && (
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
          onClick={() => setShowModalKamar(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "460px",
              padding: "26px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              border: "1px solid rgba(0, 0, 0, 0.05)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1c1c1e", margin: 0 }}>
                {editingKamar ? "Edit Kamar" : "Tambah Kamar"}
              </h3>
              <button
                onClick={() => setShowModalKamar(false)}
                style={{ border: "none", background: "none", color: "#8e8e93", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveKamar} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                    Gedung *
                  </label>
                  <select
                    value={formKamar.idGedung}
                    onChange={(e) => setFormKamar({ ...formKamar, idGedung: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                  >
                    <option value="">-- Pilih Gedung --</option>
                    {gedungList.map((g) => (
                      <option key={g.id} value={g.id}>{g.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                    Lantai *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formKamar.lantai}
                    onChange={(e) => setFormKamar({ ...formKamar, lantai: e.target.value })}
                    placeholder="Contoh: 1"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", boxSizing: "border-box", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#1c1c1e", marginBottom: "4px" }}>
                  Nomor Kamar *
                </label>
                <input
                  type="text"
                  required
                  value={formKamar.noKamar}
                  onChange={(e) => setFormKamar({ ...formKamar, noKamar: e.target.value })}
                  placeholder="Contoh: A-101"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e5e5ea", backgroundColor: "#f2f2f7", fontSize: "13px", boxSizing: "border-box", outline: "none", color: "#1c1c1e", fontFamily: fontStack }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowModalKamar(false)}
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

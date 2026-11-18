import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, X, Building2 } from "lucide-react";

const API_BASE = "http://localhost:5250";

export default function MasterDataPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [gedungList, setGedungList] = useState([]);
  const [kamarList, setKamarList] = useState([]);
  const [fasilList, setFasilList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingGedung, setEditingGedung] = useState(null);
  const [formData, setFormData] = useState({ namaGedung: "", idUser: "" });
  const [formLantaiKamar, setFormLantaiKamar] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [expandedGedung, setExpandedGedung] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRes, kRes, fRes] = await Promise.all([
        fetch(`${API_BASE}/api/gedung`),
        fetch(`${API_BASE}/api/kamar`),
        fetch(`${API_BASE}/api/users/fasil`)
      ]);
      if (!gRes.ok) throw new Error("Gagal mengambil data gedung");
      if (!kRes.ok) throw new Error("Gagal mengambil data kamar");
      setGedungList(await gRes.json());
      setKamarList(await kRes.json());
      setFasilList(fRes.ok ? await fRes.json() : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const getKamarForGedung = (id) => kamarList.filter(k => k.idGedung === id);
  const getLantaiForGedung = (id) => [...new Set(getKamarForGedung(id).map(k => k.lantai))].sort((a, b) => a - b);

  const openAddModal = () => {
    setEditingGedung(null);
    setFormData({ namaGedung: "", idUser: "" });
    setFormLantaiKamar([{ lantai: 1, kamars: [""] }]);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (g) => {
    setEditingGedung(g);
    setFormData({ namaGedung: g.namaGedung, idUser: String(g.idUser) });
    const kamars = getKamarForGedung(g.idGedung);
    const lantaiMap = {};
    kamars.forEach(k => {
      if (!lantaiMap[k.lantai]) lantaiMap[k.lantai] = [];
      lantaiMap[k.lantai].push(k.noKamar);
    });
    const entries = Object.entries(lantaiMap).map(([l, ks]) => ({ lantai: parseInt(l), kamars: ks }));
    setFormLantaiKamar(entries.length > 0 ? entries : [{ lantai: 1, kamars: [""] }]);
    setFormError(null);
    setShowModal(true);
  };

  const addLantai = () => {
    const max = formLantaiKamar.reduce((m, l) => Math.max(m, l.lantai), 0);
    setFormLantaiKamar([...formLantaiKamar, { lantai: max + 1, kamars: [""] }]);
  };
  const removeLantai = (idx) => setFormLantaiKamar(formLantaiKamar.filter((_, i) => i !== idx));
  const addKamarToLantai = (li) => {
    const u = [...formLantaiKamar]; u[li].kamars.push(""); setFormLantaiKamar(u);
  };
  const removeKamarFromLantai = (li, ki) => {
    const u = [...formLantaiKamar]; u[li].kamars = u[li].kamars.filter((_, i) => i !== ki); setFormLantaiKamar(u);
  };
  const updateKamarName = (li, ki, v) => {
    const u = [...formLantaiKamar]; u[li].kamars[ki] = v; setFormLantaiKamar(u);
  };
  const updateLantaiNumber = (li, v) => {
    const u = [...formLantaiKamar]; u[li].lantai = parseInt(v) || 1; setFormLantaiKamar(u);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      let gedungId;
      if (editingGedung) {
        const res = await fetch(`${API_BASE}/api/gedung/${editingGedung.idGedung}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ namaGedung: formData.namaGedung, idUser: parseInt(formData.idUser) || null })
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Gagal mengupdate gedung"); }
        gedungId = editingGedung.idGedung;
      } else {
        const res = await fetch(`${API_BASE}/api/gedung`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ namaGedung: formData.namaGedung, idUser: parseInt(formData.idUser) || 0 })
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Gagal menambah gedung"); }
        const created = await res.json();
        gedungId = created.idGedung;
      }

      for (const lk of formLantaiKamar) {
        for (const noKamar of lk.kamars) {
          if (!noKamar.trim()) continue;
          const existing = kamarList.find(k => k.noKamar === noKamar.trim());
          if (!existing) {
            await fetch(`${API_BASE}/api/kamar`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ noKamar: noKamar.trim(), lantai: lk.lantai, idGedung: gedungId })
            });
          }
        }
      }

      setShowModal(false);
      await fetchAll();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteGedung = async (g) => {
    const kamars = getKamarForGedung(g.idGedung);
    if (kamars.length > 0) {
      if (!window.confirm(`Gedung "${g.namaGedung}" memiliki ${kamars.length} kamar. Hapus semua kamar dan gedung ini?`)) return;
      for (const k of kamars) { await fetch(`${API_BASE}/api/kamar/${k.noKamar}`, { method: "DELETE" }); }
    } else {
      if (!window.confirm(`Hapus gedung "${g.namaGedung}"?`)) return;
    }
    const res = await fetch(`${API_BASE}/api/gedung/${g.idGedung}`, { method: "DELETE" });
    if (!res.ok) { alert("Gagal menghapus gedung"); return; }
    await fetchAll();
  };

  const handleDeleteKamar = async (noKamar) => {
    if (!window.confirm(`Hapus kamar "${noKamar}"?`)) return;
    const res = await fetch(`${API_BASE}/api/kamar/${noKamar}`, { method: "DELETE" });
    if (!res.ok) { alert("Gagal menghapus kamar"); return; }
    await fetchAll();
  };

  const filteredGedung = gedungList.filter(g =>
    g.namaGedung.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.namaFasil || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inputStyle = { width: "100%", height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "12.5px", boxSizing: "border-box", outline: "none" };
  const labelStyle = { display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" };
  const btnPrimary = { padding: "8px 20px", borderRadius: "8px", border: "none", backgroundColor: "#2349d4", color: "#ffffff", cursor: "pointer", fontSize: "12.5px", fontWeight: "700" };
  const btnSecondary = { padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", cursor: "pointer", fontSize: "12.5px", fontWeight: "600" };
  const thStyle = { padding: "12px 16px", textAlign: "left", fontWeight: "700", color: "#475569", fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.5px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0" }}>Data Gedung</h1>
          <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>Kelola data gedung, lantai, dan kamar asrama</p>
        </div>
        <button onClick={openAddModal} style={{ ...btnPrimary, padding: "10px 18px", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 14px -2px rgba(35,73,212,0.4)" }}>
          <Plus size={16} /> Tambah Gedung
        </button>
      </div>

      {/* Search */}
      <div className="content-card" style={{ padding: "16px 20px" }}>
        <div style={{ position: "relative" }}>
          <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input placeholder="Cari gedung atau fasilitator..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "36px", height: "40px", backgroundColor: "#fff" }} />
        </div>
      </div>

      {error && <div style={{ padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", color: "#b91c1c", fontSize: "13px" }}>⚠️ {error}</div>}
      {loading && <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Memuat data...</div>}

      {/* Gedung Table */}
      {!loading && (
        <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Nama Gedung</th>
                <th style={thStyle}>Fasilitator</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Lantai</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Kamar</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredGedung.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                  {searchQuery ? "Tidak ada gedung yang cocok" : "Belum ada data gedung"}
                </td></tr>
              ) : filteredGedung.map((g, i) => {
                const kamars = getKamarForGedung(g.idGedung);
                const lantais = getLantaiForGedung(g.idGedung);
                const isExpanded = expandedGedung === g.idGedung;
                return (
                  <React.Fragment key={g.idGedung}>
                    <tr style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", backgroundColor: isExpanded ? "#f0f7ff" : "transparent" }}
                      onClick={() => setExpandedGedung(isExpanded ? null : g.idGedung)}>
                      <td style={{ padding: "14px 16px", color: "#64748b" }}>{i + 1}</td>
                      <td style={{ padding: "14px 16px", fontWeight: "700", color: "#0f172a" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Building2 size={16} color="#2349d4" /> {g.namaGedung}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>{g.namaFasil || "-"}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span style={{ backgroundColor: "#e8effe", color: "#2349d4", padding: "2px 10px", borderRadius: "9999px", fontWeight: "700", fontSize: "12px" }}>{lantais.length}</span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "2px 10px", borderRadius: "9999px", fontWeight: "700", fontSize: "12px" }}>{kamars.length}</span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                          <button onClick={() => openEditModal(g)} title="Edit" style={{ border: "none", background: "#f0f7ff", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Edit2 size={14} color="#2349d4" />
                          </button>
                          <button onClick={() => handleDeleteGedung(g)} title="Hapus" style={{ border: "none", background: "#fef2f2", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Trash2 size={14} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ padding: "0 16px 16px 48px", backgroundColor: "#fafbff" }}>
                          {lantais.length === 0 ? (
                            <div style={{ color: "#94a3b8", fontSize: "12px", padding: "12px 0" }}>Belum ada lantai/kamar</div>
                          ) : lantais.map(l => {
                            const kamarsOnFloor = kamars.filter(k => k.lantai === l);
                            return (
                              <div key={l} style={{ marginTop: "12px" }}>
                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Lantai {l} ({kamarsOnFloor.length} kamar)</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                  {kamarsOnFloor.map(k => (
                                    <div key={k.noKamar} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: "#334155" }}>
                                      {k.noKamar}
                                      <button onClick={() => handleDeleteKamar(k.noKamar)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "flex" }} title="Hapus kamar">
                                        <X size={12} color="#ef4444" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah/Edit Gedung */}
      {showModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-dialog-box" style={{ maxWidth: "560px", maxHeight: "85vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#2349d4", letterSpacing: "1px", textTransform: "uppercase" }}>DATA GEDUNG</div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                  {editingGedung ? "Edit Gedung" : "Tambah Gedung Baru"}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ border: "none", background: "#f1f5f9", borderRadius: "8px", width: "28px", height: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color="#64748b" />
              </button>
            </div>

            {formError && <div style={{ padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "12px", marginBottom: "12px" }}>{formError}</div>}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Nama Gedung *</label>
                <input type="text" required value={formData.namaGedung} onChange={(e) => setFormData({ ...formData, namaGedung: e.target.value })} placeholder="Contoh: Asrama Putra A" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Fasilitator *</label>
                <select required value={formData.idUser} onChange={(e) => setFormData({ ...formData, idUser: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">-- Pilih Fasilitator --</option>
                  {fasilList.map((f) => <option key={f.idUser} value={f.idUser}>{f.nama} ({f.nim})</option>)}
                </select>
              </div>

              {/* Lantai & Kamar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Lantai & Kamar</label>
                  <button type="button" onClick={addLantai} style={{ ...btnSecondary, padding: "4px 10px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Plus size={12} /> Tambah Lantai
                  </button>
                </div>

                {formLantaiKamar.map((lk, lIdx) => (
                  <div key={lIdx} style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label style={{ fontSize: "11.5px", fontWeight: "700", color: "#475569" }}>Lantai</label>
                        <input type="number" min="1" value={lk.lantai} onChange={(e) => updateLantaiNumber(lIdx, e.target.value)}
                          style={{ ...inputStyle, width: "60px", height: "30px", textAlign: "center", fontSize: "12px" }} />
                      </div>
                      {formLantaiKamar.length > 1 && (
                        <button type="button" onClick={() => removeLantai(lIdx)} style={{ border: "none", background: "#fef2f2", borderRadius: "6px", width: "24px", height: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 size={12} color="#ef4444" />
                        </button>
                      )}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
                      {lk.kamars.map((km, kIdx) => (
                        <div key={kIdx} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <input type="text" value={km} onChange={(e) => updateKamarName(lIdx, kIdx, e.target.value)} placeholder={`Kamar ${kIdx + 1}`}
                            style={{ ...inputStyle, width: "100px", height: "30px", fontSize: "11.5px" }} />
                          {lk.kamars.length > 1 && (
                            <button type="button" onClick={() => removeKamarFromLantai(lIdx, kIdx)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: "2px" }}>
                              <X size={12} color="#94a3b8" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => addKamarToLantai(lIdx)} style={{ border: "1px dashed #cbd5e1", background: "transparent", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Plus size={11} /> Tambah Kamar
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={btnSecondary} disabled={formLoading}>Batal</button>
                <button type="submit" style={btnPrimary} disabled={formLoading}>{formLoading ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

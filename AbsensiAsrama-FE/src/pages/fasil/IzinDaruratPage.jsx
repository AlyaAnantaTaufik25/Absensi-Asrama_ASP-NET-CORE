import React, { useState, useEffect } from "react";
import { Check, X, Clock, AlertCircle } from "lucide-react";

const API_BASE = "http://localhost:5250";

export default function IzinDaruratPage({ onCountChange }) {
  const [filterTab, setFilterTab] = useState("menunggu"); // "menunggu" | "selesai"
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/perizinan`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map(p => ({
            id: p.idIzin || p.id,
            name: p.nim || "-",
            room: "-",
            timeSubmitted: p.tanggal ? new Date(p.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-",
            purpose: p.alasan || "-",
            destination: "-",
            estimatedReturn: "-",
            status: "menunggu",
            statusLabel: "Menunggu",
            fileBukti: p.fileBukti || null
          }));
          setRequests(mapped);
          if (onCountChange) onCountChange(mapped.filter(r => r.status === "menunggu").length);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAction = (id, newStatus) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              statusLabel: newStatus === "disetujui" ? "Disetujui" : "Ditolak"
            }
          : r
      )
    );
  };

  const pendingList = requests.filter((r) => r.status === "menunggu");
  const completedList = requests.filter((r) => r.status !== "menunggu");
  const displayList = filterTab === "menunggu" ? pendingList : completedList;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header & Filter Tabs */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
          Izin darurat malam
        </h1>
        <p style={{ margin: 0, fontSize: "13.5px", color: "#64748b" }}>
          Pengajuan izin keluar setelah pukul 20:00 WIB yang butuh keputusan cepat dari fasilitator.
        </p>

        {/* Tab Pills */}
        <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
          <button
            type="button"
            onClick={() => setFilterTab("menunggu")}
            style={{
              padding: "7px 18px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              backgroundColor: filterTab === "menunggu" ? "#2563eb" : "#f1f5f9",
              color: filterTab === "menunggu" ? "#ffffff" : "#475569",
              transition: "all 0.15s ease"
            }}
          >
            Menunggu {pendingList.length}
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("selesai")}
            style={{
              padding: "7px 18px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              backgroundColor: filterTab === "selesai" ? "#2563eb" : "#f1f5f9",
              color: filterTab === "selesai" ? "#ffffff" : "#475569",
              transition: "all 0.15s ease"
            }}
          >
            Selesai {completedList.length}
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.9fr 1.1fr", gap: "24px", alignItems: "flex-start" }}>
        {/* Left Column: Request Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {displayList.length === 0 ? (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "48px 24px",
                textAlign: "center",
                color: "#94a3b8"
              }}
            >
              <Clock size={36} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <div style={{ fontSize: "15px", fontWeight: "600", color: "#475569" }}>
                Tidak ada pengajuan izin {filterTab}
              </div>
            </div>
          ) : (
            displayList.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "20px 24px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
                }}
              >
                {/* Header Row of the Card */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "2px" }}>
                      {item.room} · diajukan {item.timeSubmitted}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: "600",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      backgroundColor:
                        item.status === "menunggu"
                          ? "#fef3c7"
                          : item.status === "disetujui"
                          ? "#dcfce7"
                          : "#fee2e2",
                      color:
                        item.status === "menunggu"
                          ? "#b45309"
                          : item.status === "disetujui"
                          ? "#15803d"
                          : "#b91c1c"
                    }}
                  >
                    {item.statusLabel}
                  </span>
                </div>

                {/* Details Grid (3 columns) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr 1fr",
                    gap: "12px",
                    padding: "14px 0",
                    borderTop: "1px solid #f8fafc",
                    borderBottom: item.status === "menunggu" ? "1px solid #f8fafc" : "none"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11.5px", color: "#94a3b8", fontWeight: "500", marginBottom: "4px" }}>
                      Keperluan
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>
                      {item.purpose}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "11.5px", color: "#94a3b8", fontWeight: "500", marginBottom: "4px" }}>
                      Tujuan
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>
                      {item.destination}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "11.5px", color: "#94a3b8", fontWeight: "500", marginBottom: "4px" }}>
                      Estimasi kembali
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>
                      {item.estimatedReturn}
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Pending Items */}
                {item.status === "menunggu" && (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                    <button
                      type="button"
                      onClick={() => handleAction(item.id, "ditolak")}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                        color: "#ef4444",
                        border: "1px solid #fca5a5",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#fee2e2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#ffffff";
                      }}
                    >
                      Tolak
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(item.id, "disetujui")}
                      style={{
                        padding: "8px 20px",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(37, 99, 235, 0.2)",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#1d4ed8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#2563eb";
                      }}
                    >
                      Setujui
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right Column: Rules & Info Box */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "24px"
          }}
        >
          <h2 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", margin: "0 0 16px 0" }}>
            Aturan izin darurat
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ fontSize: "12.5px", color: "#475569", lineHeight: "1.55" }}>
              Maksimal 4 jam di luar asrama, dan wajib kembali sebelum pukul 05:00 WIB.
            </div>

            <div style={{ fontSize: "12.5px", color: "#475569", lineHeight: "1.55" }}>
              Keperluan medis atau keluarga diprioritaskan. Minta bukti singkat bila perlu.
            </div>

            <div style={{ fontSize: "12.5px", color: "#475569", lineHeight: "1.55" }}>
              Untuk izin lebih dari 4 jam atau menginap di luar, teruskan ke pembina gedung (Ust. Ahmad Fauzi).
            </div>

            <div style={{ fontSize: "12.5px", color: "#475569", lineHeight: "1.55" }}>
              Setiap keputusan tercatat otomatis di log keluar-masuk.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from "react";
import { Clock, Sliders, X, Check } from "lucide-react";

export default function SessionSettingModal({
  isOpen,
  onClose,
  sessionConfig,
  onSave,
  isSaving = false
}) {
  const [editSession, setEditSession] = useState({
    subuhStart: "04:00",
    subuhEnd: "06:00",
    malamStart: "18:00",
    malamEnd: "20:30"
  });

  useEffect(() => {
    if (sessionConfig) {
      setEditSession({
        subuhStart: sessionConfig.subuhStart || "04:00",
        subuhEnd: sessionConfig.subuhEnd || "06:00",
        malamStart: sessionConfig.malamStart || "18:00",
        malamEnd: sessionConfig.malamEnd || "20:30"
      });
    }
  }, [sessionConfig, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(editSession);
    }
  };

  const handleResetDefault = () => {
    setEditSession({
      subuhStart: "04:00",
      subuhEnd: "06:00",
      malamStart: "18:00",
      malamEnd: "20:30"
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "22px",
          width: "100%",
          maxWidth: "440px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Inter', system-ui, sans-serif"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(0, 122, 255, 0.1)",
                color: "#007aff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Clock size={18} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#1c1c1e",
                  margin: 0,
                  letterSpacing: "-0.3px"
                }}
              >
                Atur Jam Sesi Presensi
              </h3>
              <p style={{ fontSize: "11.5px", color: "#8e8e93", margin: "2px 0 0 0" }}>
                Disesuaikan oleh Fasilitator & langsung aktif
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              backgroundColor: "#f2f2f7",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#8e8e93"
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Form Input Jam */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Sesi 1: Subuh / Pagi */}
          <div
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: "16px",
              padding: "14px",
              border: "1px solid #f2f2f7"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#1c1c1e" }}>
                Sesi Subuh / Pagi
              </div>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: "600",
                  color: "#007aff",
                  backgroundColor: "rgba(0, 122, 255, 0.08)",
                  padding: "2px 8px",
                  borderRadius: "12px"
                }}
              >
                Default: 04:00 - 06:00
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#8e8e93", marginBottom: "4px", fontWeight: "500" }}>
                  Jam Buka:
                </label>
                <input
                  type="time"
                  value={editSession.subuhStart}
                  onChange={(e) => setEditSession({ ...editSession, subuhStart: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 10px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontWeight: "600",
                    boxSizing: "border-box",
                    backgroundColor: "#ffffff",
                    outline: "none"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#8e8e93", marginBottom: "4px", fontWeight: "500" }}>
                  Jam Tutup:
                </label>
                <input
                  type="time"
                  value={editSession.subuhEnd}
                  onChange={(e) => setEditSession({ ...editSession, subuhEnd: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 10px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontWeight: "600",
                    boxSizing: "border-box",
                    backgroundColor: "#ffffff",
                    outline: "none"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sesi 2: Malam (Magrib & Isya) */}
          <div
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: "16px",
              padding: "14px",
              border: "1px solid #f2f2f7"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#1c1c1e" }}>
                Sesi Malam (Magrib & Isya)
              </div>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: "600",
                  color: "#007aff",
                  backgroundColor: "rgba(0, 122, 255, 0.08)",
                  padding: "2px 8px",
                  borderRadius: "12px"
                }}
              >
                Default: 18:00 - 20:30
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#8e8e93", marginBottom: "4px", fontWeight: "500" }}>
                  Jam Buka:
                </label>
                <input
                  type="time"
                  value={editSession.malamStart}
                  onChange={(e) => setEditSession({ ...editSession, malamStart: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 10px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontWeight: "600",
                    boxSizing: "border-box",
                    backgroundColor: "#ffffff",
                    outline: "none"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#8e8e93", marginBottom: "4px", fontWeight: "500" }}>
                  Jam Tutup:
                </label>
                <input
                  type="time"
                  value={editSession.malamEnd}
                  onChange={(e) => setEditSession({ ...editSession, malamEnd: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 10px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontWeight: "600",
                    boxSizing: "border-box",
                    backgroundColor: "#ffffff",
                    outline: "none"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Reset to Default Button */}
          <button
            type="button"
            onClick={handleResetDefault}
            style={{
              border: "none",
              background: "none",
              color: "#007aff",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              textAlign: "center",
              padding: "4px 0"
            }}
          >
            Reset ke Jam Standar (04:00-06:00 & 18:00-20:30)
          </button>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                height: "42px",
                borderRadius: "12px",
                border: "1px solid #e5e5ea",
                backgroundColor: "#f2f2f7",
                color: "#1c1c1e",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                flex: 2,
                height: "42px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "#007aff",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "600",
                cursor: isSaving ? "default" : "pointer",
                boxShadow: "0 4px 12px rgba(0, 122, 255, 0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <Check size={16} />
              <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React from "react";

export default function Logo({ variant = "white-on-blue", size = "normal" }) {
  // variant:
  // - "yellow": yellow box with bar chart (used in Login dark blue left pane)
  // - "dark": blue/gray box used in Navbar on white bg
  
  if (variant === "yellow") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            backgroundColor: "#f59e0b",
            borderRadius: "9px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "7px 6px",
            gap: "3px"
          }}
        >
          <span style={{ width: "4px", height: "10px", backgroundColor: "#ffffff", borderRadius: "2px" }} />
          <span style={{ width: "4px", height: "16px", backgroundColor: "#ffffff", borderRadius: "2px" }} />
          <span style={{ width: "4px", height: "12px", backgroundColor: "#ffffff", borderRadius: "2px" }} />
        </div>
        <span style={{ fontSize: "20px", color: "#ffffff", letterSpacing: "-0.3px", fontWeight: "400" }}>
          Asrama<strong style={{ fontWeight: "800" }}>Aman</strong>
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          width: "34px",
          height: "34px",
          backgroundColor: "#ffffff",
          border: "2px solid #2563eb",
          borderRadius: "8px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "6px 5px",
          gap: "3px"
        }}
      >
        <span style={{ width: "3.5px", height: "9px", backgroundColor: "#2563eb", borderRadius: "1.5px" }} />
        <span style={{ width: "3.5px", height: "15px", backgroundColor: "#2563eb", borderRadius: "1.5px" }} />
        <span style={{ width: "3.5px", height: "11px", backgroundColor: "#2563eb", borderRadius: "1.5px" }} />
      </div>
      <span style={{ fontSize: "19px", color: "#0f172a", letterSpacing: "-0.3px", fontWeight: "400" }}>
        Asrama<strong style={{ fontWeight: "800" }}>Aman</strong>
      </span>
    </div>
  );
}

import React from "react";
import logoImg from "../assets/mynava-logo.jpg";

export default function Logo({ variant = "white-on-blue", size = "normal" }) {
  // variant:
  // - "yellow" / "white-on-blue": used in dark sidebars (Admin & Fasil sidebar)
  // - "dark": used on white/light backgrounds (Navbar, Login Page)

  const isDarkBackground = variant === "yellow" || variant === "white-on-blue";

  if (isDarkBackground) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          backgroundColor: "#ffffff",
          padding: "6px 12px",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
          maxWidth: "100%",
          boxSizing: "border-box"
        }}
      >
        <img
          src={logoImg}
          alt="MyNAVA Logo"
          style={{
            height: size === "large" ? "42px" : "32px",
            width: "auto",
            maxWidth: "100%",
            objectFit: "contain",
            display: "block"
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center" }}>
      <img
        src={logoImg}
        alt="MyNAVA Logo"
        style={{
          height: size === "large" ? "48px" : "36px",
          width: "auto",
          maxWidth: "100%",
          objectFit: "contain",
          display: "block"
        }}
      />
    </div>
  );
}


import React from "react";

export default function Logo({ variant = "dark", size = "normal" }) {
  // variant:
  // - "yellow" / "white-on-blue": used in dark blue sidebar (AdminSidebar, FasilSidebar)
  // - "dark": used in Navbar, LoginPage on light background

  const isDarkBg = variant === "yellow" || variant === "white-on-blue";

  if (isDarkBg) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center" }}>
        <img
          src="/logo-mynava-white.png"
          alt="MyNAVA"
          style={{
            height: size === "large" ? "42px" : "36px",
            width: "auto",
            display: "block",
            objectFit: "contain"
          }}
        />
      </div>
    );
  }

  // Light background variant (Navbar, Login Page)
  return (
    <div style={{ display: "inline-flex", alignItems: "center" }}>
      <img
        src="/logo-mynava.png"
        alt="MyNAVA - Navigasi Absensi dan Verifikasi Asrama"
        style={{
          height: size === "large" ? "44px" : "34px",
          width: "auto",
          display: "block",
          objectFit: "contain"
        }}
      />
    </div>
  );
}

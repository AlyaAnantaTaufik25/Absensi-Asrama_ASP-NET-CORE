import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  Building2,
  CheckCircle2,
  Save,
  KeyRound,
  Camera,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  X,
  ScanFace,
  ChevronRight,
  Hash,
  MapPin,
  DoorOpen,
  Fingerprint
} from "lucide-react";
import { updateUser } from "../services/api";

export default function ProfilePage({ user, onUpdateUser }) {
  const userRole = (user?.role || "penghuni").toLowerCase();
  const userId = user?.idUser || user?.id || 1;
  const userNim = user?.nim || "";

  // Password state (hanya ini yang dapat diedit dan diketik oleh user)
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: ""
  });

  // Biometrik State
  const storageBiometricKey = `mynava_biometric_${userId}_${userNim}`;
  const [registeredBiometric, setRegisteredBiometric] = useState(() => {
    return localStorage.getItem(storageBiometricKey) || user?.fotoBiometrik || user?.foto || null;
  });

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [tempCapturedFace, setTempCapturedFace] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [errorToast, setErrorToast] = useState("");

  const roleLabel =
    userRole === "admin"
      ? "Administrator"
      : userRole === "fasil"
      ? "Fasilitator Asrama"
      : "Penghuni / Mahasiswa";

  const displayName = user?.displayName || user?.name || "Alya Ananta";
  const userEmail = user?.email || (userNim ? `${userNim.toLowerCase()}@mahasiswa.ac.id` : "user@mynava.ac.id");
  const userKamar = user?.room || user?.nomorKamar || "Kamar B-302";
  const userGedung = user?.asrama || user?.namaGedung || "Asrama Hijau";
  const userGender = user?.jenisKelamin || (displayName.toLowerCase().includes("alya") ? "Perempuan" : "Laki-laki");
  const userAsal = user?.asal || "Sumatera Barat";

  // Inisial avatar
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AA";

  // Camera Handlers for Face Biometric Registration
  const startCamera = async () => {
    setCameraError("");
    setTempCapturedFace(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: "user" }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Gagal mengakses kamera:", err);
      setCameraError("Kamera tidak dapat diakses. Pastikan izin kamera aktif pada peramban Anda.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const handleOpenBiometricModal = () => {
    setIsCameraModalOpen(true);
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  const handleCloseBiometricModal = () => {
    stopCamera();
    setIsCameraModalOpen(false);
    setTempCapturedFace(null);
  };

  const handleCaptureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setTempCapturedFace(dataUrl);
    }
  };

  const handleSaveBiometric = () => {
    if (!tempCapturedFace) return;
    localStorage.setItem(storageBiometricKey, tempCapturedFace);
    setRegisteredBiometric(tempCapturedFace);
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        fotoBiometrik: tempCapturedFace,
        foto: tempCapturedFace
      });
    }
    handleCloseBiometricModal();
    setSuccessToast("Biometrik wajah berhasil didaftarkan untuk akun " + displayName + "!");
    setTimeout(() => setSuccessToast(""), 4000);
  };

  // Simpan Perubahan Password Saja
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setErrorToast("");
    setSuccessToast("");

    if (!passwordData.password) {
      setErrorToast("Silakan masukkan kata sandi baru.");
      return;
    }

    if (passwordData.password.length < 6) {
      setErrorToast("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setErrorToast("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setIsSaving(true);
    try {
      await updateUser(userId, {
        nama: displayName,
        email: userEmail,
        nim: userNim,
        asal: userAsal,
        nomorKamar: userKamar,
        jenisKelamin: userGender,
        role: userRole,
        password: passwordData.password.trim()
      });

      setPasswordData({ password: "", confirmPassword: "" });
      setSuccessToast("Kata sandi berhasil diperbarui!");
      setTimeout(() => setSuccessToast(""), 4000);
    } catch (err) {
      setErrorToast(err.message || "Gagal memperbarui kata sandi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif',
        maxWidth: "680px",
        margin: "0 auto",
        paddingBottom: "60px",
        color: "#000000"
      }}
    >
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Notifications */}
      {successToast && (
        <div
          style={{
            backgroundColor: "#dcfce7",
            border: "1px solid #86efac",
            color: "#15803d",
            padding: "13px 18px",
            borderRadius: "16px",
            fontSize: "13.5px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 4px 14px rgba(21, 128, 61, 0.1)"
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#b91c1c",
            padding: "13px 18px",
            borderRadius: "16px",
            fontSize: "13.5px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <AlertCircle size={18} />
          <span>{errorToast}</span>
        </div>
      )}

      {/* 1. iOS Authentic Settings Profile Header Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "20px 10px 6px 10px",
          userSelect: "none"
        }}
      >
        {/* Large Rounded Apple Avatar */}
        <div
          style={{
            position: "relative",
            width: "92px",
            height: "92px",
            borderRadius: "50%",
            backgroundColor: "#007aff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: "30px",
            fontWeight: "700",
            boxShadow: "0 8px 24px rgba(0, 122, 255, 0.28)",
            marginBottom: "14px",
            overflow: "hidden"
          }}
        >
          {registeredBiometric ? (
            <img
              src={registeredBiometric}
              alt={displayName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <h1
          style={{
            fontSize: "23px",
            fontWeight: "700",
            color: "#000000",
            margin: "0 0 4px 0",
            letterSpacing: "-0.5px"
          }}
        >
          {displayName}
        </h1>

        <p
          style={{
            fontSize: "13.5px",
            color: "#8e8e93",
            margin: "0 0 10px 0",
            fontWeight: "400"
          }}
        >
          {userEmail} • {userRole === "admin" ? "NIP: " : "NIM: "}{userNim || "ID: " + userId}
        </p>

        <span
          style={{
            fontSize: "11.5px",
            fontWeight: "600",
            backgroundColor: "#e5e5ea",
            color: "#3a3a3c",
            padding: "4px 14px",
            borderRadius: "20px",
            letterSpacing: "0.2px"
          }}
        >
          {roleLabel} • Akun Terverifikasi
        </span>
      </div>

      {/* 2. iOS Inset Group: PENGATURAN BIOMETRIK WAJAH (FACE ID) */}
      {userRole === "penghuni" && (
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#6c6c70",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              paddingLeft: "16px",
              marginBottom: "7px",
              userSelect: "none"
            }}
          >
            Biometrik Wajah (Face ID)
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.02)",
              overflow: "hidden",
              border: "1px solid rgba(0, 0, 0, 0.04)"
            }}
          >
            {/* Row 1: Status Wajah Terdaftar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderBottom: "1px solid #f2f2f7",
                userSelect: "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: registeredBiometric ? "#34c759" : "#ff9500",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff"
                  }}
                >
                  <ScanFace size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: "600", color: "#000000" }}>
                    Status Biometrik Wajah
                  </div>
                  <div style={{ fontSize: "12px", color: "#8e8e93", marginTop: "1px" }}>
                    {registeredBiometric ? "Tercatat untuk presensi kamera" : "Belum didaftarkan"}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  backgroundColor: registeredBiometric ? "#e8f8ec" : "#fff8e6",
                  color: registeredBiometric ? "#34c759" : "#ff9500"
                }}
              >
                {registeredBiometric ? "Terdaftar & Aktif" : "Belum Terdaftar"}
              </span>
            </div>

            {/* Row 2: Tombol Aksi Pindai / Daftarkan Wajah */}
            <div
              onClick={handleOpenBiometricModal}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                cursor: "pointer",
                backgroundColor: "#ffffff",
                transition: "background-color 0.12s ease",
                userSelect: "none"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9fb")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: "#007aff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff"
                  }}
                >
                  <Camera size={18} />
                </div>
                <div style={{ fontSize: "14.5px", fontWeight: "600", color: "#007aff" }}>
                  {registeredBiometric ? "Pindai Ulang Wajah Pemilik Akun" : "Daftarkan Wajah Pemilik Akun Sekarang"}
                </div>
              </div>

              <ChevronRight size={17} color="#c7c7cc" />
            </div>
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#8e8e93",
              paddingLeft: "16px",
              paddingRight: "16px",
              marginTop: "6px",
              lineHeight: 1.4,
              userSelect: "none"
            }}
          >
            Data wajah biometrik digunakan untuk memvalidasi presensi mandiri mahasiswa. Sistem menolak presensi jika wajah di depan kamera bukan pemilik akun terdaftar.
          </div>
        </div>
      )}

      {/* 3. iOS Inset Group: INFORMASI DATA DIRI (MURNI LABEL CELL - KURSOR TIDAK DAPAT DILETAKKAN) */}
      <div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#6c6c70",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            paddingLeft: "16px",
            marginBottom: "7px",
            userSelect: "none"
          }}
        >
          Data Identitas & Kamar
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.02)",
            overflow: "hidden",
            border: "1px solid rgba(0, 0, 0, 0.04)",
            cursor: "default",
            userSelect: "none"
          }}
        >
          {/* Item 1: Nama Lengkap */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "13px 18px",
              borderBottom: "1px solid #f2f2f7",
              pointerEvents: "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "7px",
                  backgroundColor: "#007aff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff"
                }}
              >
                <User size={15} />
              </div>
              <span style={{ fontSize: "14.5px", fontWeight: "500", color: "#000000" }}>
                Nama Lengkap
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px", color: "#6c6c70", fontWeight: "500" }}>
                {displayName}
              </span>
              <Lock size={12} color="#c7c7cc" />
            </div>
          </div>

          {/* Item 2: NIM / NIP */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "13px 18px",
              borderBottom: "1px solid #f2f2f7",
              pointerEvents: "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "7px",
                  backgroundColor: "#5856d6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff"
                }}
              >
                <Hash size={15} />
              </div>
              <span style={{ fontSize: "14.5px", fontWeight: "500", color: "#000000" }}>
                {userRole === "admin" ? "NIP / Nomor Induk Pegawai" : "NIM / Nomor Induk Mahasiswa"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px", color: "#6c6c70", fontWeight: "500" }}>
                {userNim || "2311523005"}
              </span>
              <Lock size={12} color="#c7c7cc" />
            </div>
          </div>

          {/* Item 3: Jenis Kelamin */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "13px 18px",
              borderBottom: "1px solid #f2f2f7",
              pointerEvents: "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "7px",
                  backgroundColor: "#af52de",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff"
                }}
              >
                <ShieldCheck size={15} />
              </div>
              <span style={{ fontSize: "14.5px", fontWeight: "500", color: "#000000" }}>
                Jenis Kelamin
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px", color: "#6c6c70", fontWeight: "500" }}>
                {userGender}
              </span>
              <Lock size={12} color="#c7c7cc" />
            </div>
          </div>

          {/* Item 4: Asal Daerah */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "13px 18px",
              borderBottom: "1px solid #f2f2f7",
              pointerEvents: "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "7px",
                  backgroundColor: "#34c759",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff"
                }}
              >
                <MapPin size={15} />
              </div>
              <span style={{ fontSize: "14.5px", fontWeight: "500", color: "#000000" }}>
                Asal Daerah
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px", color: "#6c6c70", fontWeight: "500" }}>
                {userAsal}
              </span>
              <Lock size={12} color="#c7c7cc" />
            </div>
          </div>

          {/* Item 5: Gedung Asrama */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "13px 18px",
              borderBottom: "1px solid #f2f2f7",
              pointerEvents: "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "7px",
                  backgroundColor: "#ff9500",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff"
                }}
              >
                <Building2 size={15} />
              </div>
              <span style={{ fontSize: "14.5px", fontWeight: "500", color: "#000000" }}>
                Gedung Asrama
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px", color: "#6c6c70", fontWeight: "500" }}>
                {userGedung}
              </span>
              <Lock size={12} color="#c7c7cc" />
            </div>
          </div>

          {/* Item 6: Nomor Kamar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "13px 18px",
              borderBottom: "1px solid #f2f2f7",
              pointerEvents: "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "7px",
                  backgroundColor: "#ff3b30",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff"
                }}
              >
                <DoorOpen size={15} />
              </div>
              <span style={{ fontSize: "14.5px", fontWeight: "500", color: "#000000" }}>
                Nomor Kamar
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px", color: "#6c6c70", fontWeight: "500" }}>
                {userKamar}
              </span>
              <Lock size={12} color="#c7c7cc" />
            </div>
          </div>

          {/* Item 7: Email Akun */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "13px 18px",
              pointerEvents: "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "7px",
                  backgroundColor: "#007aff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff"
                }}
              >
                <Mail size={15} />
              </div>
              <span style={{ fontSize: "14.5px", fontWeight: "500", color: "#000000" }}>
                Email Akun
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px", color: "#6c6c70", fontWeight: "500" }}>
                {userEmail}
              </span>
              <Lock size={12} color="#c7c7cc" />
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "#8e8e93",
            paddingLeft: "16px",
            paddingRight: "16px",
            marginTop: "6px",
            userSelect: "none"
          }}
        >
          Data identitas dan penempatan kamar dikelola oleh Administrator sistem.
        </div>
      </div>

      {/* 4. iOS Inset Group: KEAMANAN & UBAH KATA SANDI (DAPAT DIUBAH USER) */}
      <form onSubmit={handleSavePassword}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#6c6c70",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            paddingLeft: "16px",
            marginBottom: "7px",
            userSelect: "none"
          }}
        >
          Keamanan & Kata Sandi
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.02)",
            overflow: "hidden",
            border: "1px solid rgba(0, 0, 0, 0.04)",
            marginBottom: "16px"
          }}
        >
          {/* Row Input 1: Kata Sandi Baru */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 18px",
              borderBottom: "1px solid #f2f2f7"
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "7px",
                backgroundColor: "#ff9500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                marginRight: "12px",
                flexShrink: 0
              }}
            >
              <KeyRound size={15} />
            </div>
            <span
              style={{
                fontSize: "14.5px",
                fontWeight: "500",
                color: "#000000",
                width: "160px",
                flexShrink: 0,
                userSelect: "none"
              }}
            >
              Kata Sandi Baru
            </span>
            <input
              type="password"
              value={passwordData.password}
              onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
              placeholder="Minimal 6 karakter"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "14px",
                color: "#000000",
                backgroundColor: "transparent",
                textAlign: "right"
              }}
            />
          </div>

          {/* Row Input 2: Konfirmasi Kata Sandi Baru */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 18px"
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "7px",
                backgroundColor: "#34c759",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                marginRight: "12px",
                flexShrink: 0
              }}
            >
              <Lock size={15} />
            </div>
            <span
              style={{
                fontSize: "14.5px",
                fontWeight: "500",
                color: "#000000",
                width: "160px",
                flexShrink: 0,
                userSelect: "none"
              }}
            >
              Konfirmasi Sandi
            </span>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Ketik ulang kata sandi"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "14px",
                color: "#000000",
                backgroundColor: "transparent",
                textAlign: "right"
              }}
            />
          </div>
        </div>

        {/* Primary Action Button (iOS Style) */}
        <button
          type="submit"
          disabled={isSaving}
          style={{
            width: "100%",
            backgroundColor: "#007aff",
            color: "#ffffff",
            border: "none",
            borderRadius: "14px",
            padding: "14px 20px",
            fontSize: "14.5px",
            fontWeight: "600",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: isSaving ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(0, 122, 255, 0.28)",
            transition: "all 0.15s ease",
            opacity: isSaving ? 0.7 : 1
          }}
        >
          {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
        </button>
      </form>

      {/* Modal Pindai Biometrik Wajah iOS */}
      {isCameraModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "26px",
              width: "100%",
              maxWidth: "440px",
              padding: "24px",
              boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "18px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#000000", margin: 0 }}>
                  Pindai Biometrik Wajah
                </h3>
                <span style={{ fontSize: "12.5px", color: "#8e8e93" }}>
                  Posisikan wajah Anda di dalam lingkaran panduan
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseBiometricModal}
                style={{
                  background: "#f2f2f7",
                  border: "none",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#8e8e93"
                }}
              >
                <X size={17} />
              </button>
            </div>

            {/* Viewfinder Camera Box */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "320px",
                backgroundColor: "#090d16",
                borderRadius: "20px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {tempCapturedFace ? (
                <img
                  src={tempCapturedFace}
                  alt="Hasil Pindai Wajah"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scaleX(-1)"
                  }}
                />
              )}

              {/* Oval Face Guide */}
              {!tempCapturedFace && (
                <div
                  style={{
                    position: "absolute",
                    width: "180px",
                    height: "230px",
                    border: "2px dashed rgba(255, 255, 255, 0.75)",
                    borderRadius: "50%",
                    pointerEvents: "none",
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.28)"
                  }}
                />
              )}

              {cameraError && (
                <div
                  style={{
                    position: "absolute",
                    padding: "20px",
                    textAlign: "center",
                    color: "#ffffff",
                    fontSize: "13px"
                  }}
                >
                  {cameraError}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              {tempCapturedFace ? (
                <>
                  <button
                    type="button"
                    onClick={() => setTempCapturedFace(null)}
                    style={{
                      padding: "11px 18px",
                      borderRadius: "14px",
                      border: "none",
                      backgroundColor: "#f2f2f7",
                      fontSize: "13.5px",
                      fontWeight: "600",
                      color: "#000000",
                      cursor: "pointer"
                    }}
                  >
                    Foto Ulang
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBiometric}
                    style={{
                      padding: "11px 22px",
                      borderRadius: "14px",
                      border: "none",
                      backgroundColor: "#34c759",
                      fontSize: "13.5px",
                      fontWeight: "600",
                      color: "#ffffff",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 12px rgba(52, 199, 89, 0.25)"
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Simpan Biometrik</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleCaptureFace}
                  style={{
                    width: "100%",
                    padding: "13px 0",
                    borderRadius: "14px",
                    border: "none",
                    backgroundColor: "#007aff",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 14px rgba(0, 122, 255, 0.25)"
                  }}
                >
                  <Camera size={17} />
                  <span>Ambil Foto Biometrik</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

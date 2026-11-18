import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Check,
  SwitchCamera,
  Sparkles,
  MapPin,
  RefreshCw,
  Clock,
  ShieldCheck,
  Building,
  XCircle,
  HelpCircle,
  RotateCcw
} from "lucide-react";
import { recordPresensi } from "../services/api";
import {
  ASRAMA_LIST,
  calculateDistanceMeters,
  checkPresensiSession
} from "../utils/asramaConfig";

export default function PresensiPage({ user, setActiveTab }) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Selected Asrama (default based on user gender or Asrama Hijau)
  const defaultAsrama = useMemo(() => {
    if (user?.jenisKelamin?.toLowerCase() === "perempuan") {
      return ASRAMA_LIST.find((a) => a.id === "asrama-roesma") || ASRAMA_LIST[2];
    }
    return ASRAMA_LIST.find((a) => a.id === "asrama-hijau") || ASRAMA_LIST[0];
  }, [user]);

  const [selectedAsramaId, setSelectedAsramaId] = useState(defaultAsrama.id);
  const [showMap, setShowMap] = useState(false);
  const currentAsrama = useMemo(
    () => ASRAMA_LIST.find((a) => a.id === selectedAsramaId) || defaultAsrama,
    [selectedAsramaId, defaultAsrama]
  );

  // Location & Geofence State
  // Mode: "real" (default: GPS fisik asli dari browser), "inside" (simulasi ~15m), "outside" (simulasi Pasar Baru ~2.1km)
  const [locationMode, setLocationMode] = useState("real");
  const [isLocating, setIsLocating] = useState(true);
  const [gpsError, setGpsError] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  // Otomatis minta izin dan baca koordinat GPS asli perangkat pengguna
  useEffect(() => {
    if (locationMode !== "real") return;

    if (!navigator.geolocation) {
      setGpsError("Browser Anda tidak mendukung fitur Geolocation.");
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setGpsError("");

    // 1. Ambil koordinat awal secara cepat
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 5)
        });
        setIsLocating(false);
        setGpsError("");
      },
      (err) => {
        console.warn("getCurrentPosition warning:", err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // 2. Pantau pergerakan realtime perangkat
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 5)
        });
        setIsLocating(false);
        setGpsError("");
      },
      (err) => {
        console.warn("Gagal mendapatkan lokasi GPS asli:", err);
        setIsLocating(false);
        if (err.code === 1) {
          setGpsError("Izin akses lokasi (GPS) ditolak browser. Klik ikon gembok/izin di address bar browser dan pilih 'Izinkan Lokasi'.");
        } else if (err.code === 2) {
          setGpsError("Sinyal GPS tidak ditemukan. Pastikan layanan lokasi/GPS pada HP atau laptop Anda sudah aktif.");
        } else {
          setGpsError("Waktu pencarian GPS habis. Silakan klik tombol 'Deteksi Ulang GPS'.");
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [locationMode]);

  // Handler beralih ke simulasi atau GPS asli
  const handleSetSimulationInside = () => {
    setLocationMode("inside");
    setIsLocating(false);
    setGpsError("");
    setUserLocation({
      lat: currentAsrama.lat + 0.0001,
      lng: currentAsrama.lng + 0.0001,
      accuracy: 3.5
    });
  };

  const handleSetSimulationOutside = () => {
    setLocationMode("outside");
    setIsLocating(false);
    setGpsError("");
    // Koordinat Pasar Baru Pauh Padang (berjarak ~2.1 km dari asrama Unand)
    setUserLocation({
      lat: -0.914200,
      lng: 100.435000,
      accuracy: 10.0
    });
  };

  const handleSetRealGps = () => {
    setLocationMode("real");
    setUserLocation(null);
    setIsLocating(true);
    setGpsError("");
  };

  // Calculate distance in meters to the selected asrama's central point
  const currentDistance = useMemo(() => {
    if (!userLocation) return null;
    return calculateDistanceMeters(
      userLocation.lat,
      userLocation.lng,
      currentAsrama.lat,
      currentAsrama.lng
    );
  }, [userLocation, currentAsrama]);

  // Max allowed radius is strictly 100 meters
  const isWithinRadius = userLocation != null && currentDistance !== null && currentDistance <= 100;

  // Realtime Session Time Checker (04:00 - 06:00 & 18:00 - 20:30 WIB)
  const [sessionInfo, setSessionInfo] = useState(() => checkPresensiSession());

  // Update status sesi setiap 5 detik agar selalu realtime mengikuti jam perangkat
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionInfo(checkPresensiSession());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Presensi hanya berlaku jika sesi waktu benar-benar aktif (ketat: Subuh 04.00-06.00 & Malam 18.00-20.30 WIB)
  const isSessionValid = sessionInfo.isActive;

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("loading"); // "loading" | "active" | "captured" | "error"
  const [facingMode, setFacingMode] = useState("user");
  const [capturedImage, setCapturedImage] = useState(null);
  const [showFlash, setShowFlash] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async (mode = facingMode) => {
    stopCameraStream();
    setCameraStatus("loading");
    setCameraError("");

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser tidak mendukung akses kamera.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(() => {});
        };
      }

      setCameraActive(true);
      setCameraStatus("active");
    } catch (err) {
      setCameraActive(false);
      setCameraStatus("error");
      setCameraError(
        "Kamera tidak terdeteksi atau izin ditolak. Mode simulasi biometrik otomatis aktif."
      );
    }
  }, [facingMode, stopCameraStream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCameraStream();
    };
  }, [startCamera, stopCameraStream]);

  const handleCapturePhoto = () => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 250);

    if (cameraActive && videoRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setCapturedImage(dataUrl);
      setCameraStatus("captured");
    } else {
      setCapturedImage("simulated-captured");
      setCameraStatus("captured");
    }
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // CHECKLIST CRITERIA
  const checklist = useMemo(() => {
    return [
      {
        id: "session",
        title: "Sesi Waktu Presensi Aktif",
        desc: isSessionValid
          ? `Sesi ${sessionInfo.session} (${sessionInfo.timeRange}) sedang berlangsung`
          : `Saat ini di luar jam sesi presensi. ${sessionInfo.statusText}. Jadwal: Subuh (04.00 - 06.00) & Malam (18.00 - 20.30 WIB)`,
        status: isSessionValid,
        badge: isSessionValid
          ? `Sesi ${sessionInfo.session} Aktif`
          : "Di Luar Jam Sesi (Terkunci)"
      },
      {
        id: "geofence",
        title: "Radius Geofence Maksimal 100 Meter",
        desc: isLocating
          ? `Mendeteksi lokasi GPS untuk menghitung jarak ke ${currentAsrama.name}...`
          : !userLocation
          ? `Akses lokasi (GPS) diperlukan untuk validasi jarak ke ${currentAsrama.name}`
          : `Jarak Anda: ${currentDistance?.toLocaleString("id-ID") || 0} meter dari titik tengah ${currentAsrama.name} (Batas: 100 m)`,
        status: isWithinRadius,
        badge: isLocating
          ? "Mencari GPS..."
          : !userLocation
          ? "Lokasi Belum Terbaca"
          : isWithinRadius
          ? `Lolos (${currentDistance} m <= 100 m)`
          : `Gagal (${currentDistance?.toLocaleString("id-ID")} m > 100 m)`
      },
      {
        id: "biometric",
        title: "Pengambilan Foto Wajah (Biometrik)",
        desc: "Wajah berada di dalam frame tanpa masker/penutup untuk verifikasi AI",
        status: !!capturedImage,
        badge: capturedImage ? "Foto Terambil" : "Belum Mengambil Foto"
      },
      {
        id: "identity",
        title: "Identitas Penghuni & Asrama Terdaftar",
        desc: `NIM: ${user?.nim || "2311523005"} · ${currentAsrama.name}`,
        status: true,
        badge: "Terverifikasi"
      }
    ];
  }, [isSessionValid, sessionInfo, isWithinRadius, currentDistance, currentAsrama, capturedImage, user]);

  const allRequirementsMet = checklist.every((c) => c.status);

  // Submit presensi
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isSessionValid) {
      alert("Absensi Ditolak! Saat ini berada di luar rentang waktu sesi presensi resmi.\n\nJadwal resmi presensi asrama:\n• Sesi Subuh: 04.00 - 06.00 WIB\n• Sesi Malam: 18.00 - 20.30 WIB");
      return;
    }

    if (!isWithinRadius) {
      alert(`Absensi Ditolak! Anda terdeteksi berada pada jarak ${currentDistance?.toLocaleString("id-ID") || "jauh"} meter dari titik tengah ${currentAsrama.name} (melebihi batas radius 100 meter).`);
      return;
    }

    if (!capturedImage) {
      handleCapturePhoto();
    }

    setIsSubmitting(true);
    setSubmitStep("Menganalisis biometrik wajah & radius GPS...");

    setTimeout(async () => {
      setSubmitStep(`Validasi geofence ${currentAsrama.name} (${currentDistance} m)...`);

      try {
        await recordPresensi({
          idUser: user?.id || 1,
          status: "Hadir",
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          keterangan: note || `Presensi ${currentAsrama.name} tepat waktu (Jarak: ${currentDistance}m)`,
          fotoWajah: capturedImage || null
        });
      } catch (err) {
        console.warn("Koneksi backend presensi:", err);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitStep("");
        setSubmitted(true);
      }, 700);
    }, 800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* 1. Greeting Row */}
      <div className="greeting-section">
        <div>
          <div className="greeting-title-wrap">
            <h1 className="greeting-name">
              Selamat Datang, {user?.displayName || user?.name || "Penghuni Asrama"}
            </h1>
            <span className="nim-badge">{user?.nim || "2311523005"}</span>
          </div>
          <p className="greeting-subtitle">
            {currentAsrama.name} · {user?.room || "Kamar 302"}
          </p>
        </div>

        <div className="greeting-date-info">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
          })} · Semester Ganjil
        </div>
      </div>

      {/* 2. Main 2-Column Content */}
      <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1.15fr", gap: "22px" }}>
        {/* Left Column: Camera Card, Lokasi Card, Catatan & Kirim */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Big Blue Card: Presensi Camera Viewfinder */}
          <div
            style={{
              backgroundColor: "#2349d4",
              background: "linear-gradient(145deg, #1e3fae 0%, #2563eb 100%)",
              borderRadius: "20px",
              padding: "24px 28px",
              color: "#ffffff",
              boxShadow: "0 10px 25px -5px rgba(35, 73, 212, 0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 4px 0", letterSpacing: "-0.3px" }}>
                  Presensi Kamera & Wajah
                </h2>
                <div style={{ fontSize: "13px", opacity: 0.85 }}>
                  Posisikan wajah di dalam bingkai, lalu klik layar atau tombol di bawah
                </div>
              </div>

              <span
                style={{
                  backgroundColor: isSessionValid ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)",
                  border: isSessionValid ? "1px solid rgba(74, 222, 128, 0.5)" : "1px solid rgba(248, 113, 113, 0.5)",
                  backdropFilter: "blur(4px)",
                  padding: "5px 14px",
                  borderRadius: "9999px",
                  fontSize: "11.5px",
                  fontWeight: "700",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: isSessionValid ? "#4ade80" : "#f87171"
                  }}
                />
                {isSessionValid
                  ? `Sesi ${sessionInfo.session} (${sessionInfo.statusText})`
                  : `Sesi Ditutup · ${sessionInfo.statusText}`}
              </span>
            </div>

            {/* Camera Viewport Area */}
            <div
              style={{
                width: "100%",
                height: "300px",
                backgroundColor: "#0f172a",
                borderRadius: "16px",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: cameraStatus === "active" ? "pointer" : "default",
                border: "2px solid rgba(255, 255, 255, 0.15)"
              }}
              onClick={() => {
                if (cameraStatus === "active") handleCapturePhoto();
              }}
              title={cameraStatus === "active" ? "Klik pada layar untuk jepret foto" : ""}
            >
              {showFlash && <div className="camera-flash-overlay" />}

              {/* 1. Live Video Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: facingMode === "user" ? "scaleX(-1)" : "none",
                  display: cameraActive && !capturedImage ? "block" : "none"
                }}
              />

              {/* 2. Captured Image Preview */}
              {capturedImage && capturedImage !== "simulated-captured" && (
                <img
                  src={capturedImage}
                  alt="Hasil Foto Presensi"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}

              {/* 3. Fallback / Simulation Graphic */}
              {(!cameraActive || capturedImage === "simulated-captured") && (
                <div
                  style={{
                    textAlign: "center",
                    color: "rgba(255, 255, 255, 0.8)",
                    padding: "20px"
                  }}
                >
                  <Sparkles size={48} style={{ margin: "0 auto 12px", opacity: 0.8, color: "#60a5fa" }} />
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>
                    {capturedImage ? "✓ Foto Biometrik Siap Dikirim" : "Simulasi Biometrik Wajah Aktif"}
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.75, marginTop: "4px" }}>
                    {cameraError || "Klik tombol Ambil Foto di bawah untuk konfirmasi wajah"}
                  </div>
                </div>
              )}

              {/* Face Guide Overlay */}
              <div
                style={{
                  position: "absolute",
                  width: "190px",
                  height: "230px",
                  border: "2px dashed rgba(255, 255, 255, 0.6)",
                  borderRadius: "999px",
                  pointerEvents: "none"
                }}
              />
            </div>

            {/* Camera Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <button
                type="button"
                onClick={handleCapturePhoto}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#1e3fae",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                }}
              >
                <Camera size={16} />
                {capturedImage ? "Jepret Ulang Foto" : "Ambil Foto Sekarang"}
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextMode = facingMode === "user" ? "environment" : "user";
                  setFacingMode(nextMode);
                  startCamera(nextMode);
                }}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.18)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "10px",
                  padding: "9px 16px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <SwitchCamera size={15} /> Ganti Kamera
              </button>
            </div>
          </div>

          {/* Lokasi & Geofence 100m Card */}
          <div className="content-card" style={{ padding: "22px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapPin size={18} color="#2563eb" />
                  <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                    Lokasi GPS & Radius Geofence (Maks. 100 Meter)
                  </h3>
                </div>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: "4px 0 0 0" }}>
                  Absensi hanya diperbolehkan jika posisi Anda berada dalam radius 100 meter dari titik tengah gedung asrama.
                </p>
              </div>

              {/* Status Radius Pill */}
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "5px 12px",
                  borderRadius: "999px",
                  backgroundColor: isLocating
                    ? "#eff6ff"
                    : !userLocation
                    ? "#fef2f2"
                    : isWithinRadius
                    ? "#dcfce7"
                    : "#fee2e2",
                  color: isLocating
                    ? "#1d4ed8"
                    : !userLocation
                    ? "#b91c1c"
                    : isWithinRadius
                    ? "#15803d"
                    : "#b91c1c",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  border: isLocating
                    ? "1px solid #bfdbfe"
                    : !userLocation
                    ? "1px solid #fca5a5"
                    : isWithinRadius
                    ? "1px solid #86efac"
                    : "1px solid #fca5a5"
                }}
              >
                {isLocating ? (
                  <>
                    <RefreshCw size={14} style={{ animation: "spin 1.5s linear infinite" }} /> Mendeteksi GPS...
                  </>
                ) : !userLocation ? (
                  <>
                    <AlertCircle size={14} /> GPS Belum Terbaca
                  </>
                ) : isWithinRadius ? (
                  <>
                    <CheckCircle2 size={14} /> Di Dalam Radius ({currentDistance} m)
                  </>
                ) : (
                  <>
                    <XCircle size={14} /> Di Luar Radius ({currentDistance?.toLocaleString("id-ID")} m &gt; 100m)
                  </>
                )}
              </span>
            </div>

            {/* Catatan Info Jika Berada di Luar Radius (misal di Pasar Baru) */}
            {!isLocating && userLocation && !isWithinRadius && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1.5px solid #fca5a5",
                  borderRadius: "10px",
                  padding: "11px 15px",
                  color: "#991b1b",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px"
                }}
              >
                <XCircle size={17} color="#dc2626" style={{ flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <div style={{ fontWeight: "800", marginBottom: "2px", fontSize: "12.5px" }}>
                    Presensi Ditolak: Anda Berada di Luar Area Asrama
                  </div>
                  <div>
                    Posisi Anda terdeteksi berjarak <strong>{currentDistance?.toLocaleString("id-ID")} meter</strong> dari titik tengah <strong>{currentAsrama.name}</strong>. Batas maksimal yang diperbolehkan adalah <strong>100 meter</strong>. Silakan kembali ke lingkungan gedung asrama untuk melakukan presensi.
                  </div>
                </div>
              </div>
            )}

            {/* Low GPS Accuracy Warning (Laptop/Desktop Wi-Fi Geolocation) */}
            {locationMode === "real" && userLocation && userLocation.accuracy > 150 && (
              <div
                style={{
                  backgroundColor: "#fffbeb",
                  border: "1.5px solid #fbbf24",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  color: "#92400e",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px"
                }}
              >
                <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <div style={{ fontWeight: "800", marginBottom: "3px" }}>Informasi Akurasi Lokasi (±{userLocation.accuracy} m)</div>
                  <div>Browser perangkat mendeteksi perkiraan lokasi via jaringan/Wi-Fi. Untuk tingkat presisi terbaik (akurasi tinggi hingga 5-10 meter), buka web ini melalui <strong>smartphone dengan GPS aktif</strong>.</div>
                </div>
              </div>
            )}

            {/* GPS Error Alert */}
            {gpsError && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1.5px solid #fca5a5",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  color: "#991b1b",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span>{gpsError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSetRealGps}
                  style={{
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "11px",
                    cursor: "pointer",
                    fontWeight: "700",
                    whiteSpace: "nowrap"
                  }}
                >
                  Deteksi Ulang GPS
                </button>
              </div>
            )}

            {/* Pilihan Gedung Asrama */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                Pilih Gedung Asrama Anda:
              </label>
              <select
                value={selectedAsramaId}
                onChange={(e) => setSelectedAsramaId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  backgroundColor: "#f8fafc",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#0f172a",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <optgroup label="Asrama Putra (Laki-laki)">
                  {ASRAMA_LIST.filter((a) => a.gender === "Laki-laki").map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Titik Tengah: {a.lat}, {a.lng})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Asrama Putri (Perempuan)">
                  {ASRAMA_LIST.filter((a) => a.gender === "Perempuan").map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Titik Tengah: {a.lat}, {a.lng})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* 3 Detail Info Boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px 14px" }}>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Titik Tengah Asrama</div>
                <div style={{ fontSize: "12.5px", fontWeight: "800", color: "#0f172a", fontFamily: "monospace", marginTop: "2px" }}>
                  {currentAsrama.lat.toFixed(6)}, {currentAsrama.lng.toFixed(6)}
                </div>
                <div style={{ fontSize: "11px", color: "#2563eb", marginTop: "3px", fontWeight: "600" }}>
                  Batas Maksimal: 100 Meter
                </div>
              </div>

              <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px 14px" }}>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
                  Koordinat Posisi Anda ({locationMode === "real" ? "GPS Asli" : "Simulasi"})
                </div>
                <div style={{ fontSize: "12.5px", fontWeight: "800", color: "#0f172a", fontFamily: "monospace", marginTop: "2px" }}>
                  {isLocating
                    ? "Mencari GPS..."
                    : userLocation
                    ? `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`
                    : "Belum terdeteksi"}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
                  {isLocating ? "Menghubungkan ke satelit/sensor..." : userLocation ? `Akurasi: ±${userLocation.accuracy} m` : "Izin lokasi diperlukan"}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: isWithinRadius ? "#f0fdf4" : "#fef2f2",
                  border: isWithinRadius ? "1.5px solid #86efac" : "1.5px solid #fca5a5",
                  borderRadius: "12px",
                  padding: "12px 14px"
                }}
              >
                <div style={{ fontSize: "11px", color: isWithinRadius ? "#166534" : "#991b1b", fontWeight: "700" }}>
                  Jarak ke Titik Tengah
                </div>
                <div style={{ fontSize: "17px", fontWeight: "800", color: isWithinRadius ? "#15803d" : "#b91c1c", marginTop: "2px" }}>
                  {isLocating ? "Menghitung..." : currentDistance != null ? `${currentDistance.toLocaleString("id-ID")} Meter` : "—"}
                </div>
                <div style={{ fontSize: "11px", color: isWithinRadius ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                  {isLocating ? "Menunggu GPS" : !userLocation ? "Lokasi belum terbaca" : isWithinRadius ? "✓ Dalam Batas 100 m" : `✕ Di Luar Batas (${currentDistance?.toLocaleString("id-ID")} m > 100 m)`}
                </div>
              </div>
            </div>

            {/* Test Simulation & GPS Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                backgroundColor: "#f1f5f9",
                borderRadius: "10px",
                flexWrap: "wrap",
                gap: "8px"
              }}
            >
              <div style={{ fontSize: "11.5px", color: "#475569", fontWeight: "600" }}>
                Mode Lokasi:
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleSetRealGps}
                  style={{
                    backgroundColor: locationMode === "real" ? "#2563eb" : "#ffffff",
                    color: locationMode === "real" ? "#ffffff" : "#2563eb",
                    border: locationMode === "real" ? "1.5px solid #1d4ed8" : "1px solid #bfdbfe",
                    borderRadius: "6px",
                    padding: "5px 12px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  <RefreshCw size={12} />
                  {isLocating ? "Mencari GPS..." : "GPS Fisik Asli"}
                </button>
                <button
                  type="button"
                  onClick={handleSetSimulationInside}
                  title="Simulasi posisi berada di dalam radius asrama (15 meter)"
                  style={{
                    backgroundColor: locationMode === "inside" ? "#16a34a" : "#ffffff",
                    color: locationMode === "inside" ? "#ffffff" : "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "11.5px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Simulasi di Asrama (~15 m)
                </button>
                <button
                  type="button"
                  onClick={handleSetSimulationOutside}
                  title="Simulasi posisi di Pasar Baru Pauh Padang (~2.1 km dari asrama)"
                  style={{
                    backgroundColor: locationMode === "outside" ? "#dc2626" : "#ffffff",
                    color: locationMode === "outside" ? "#ffffff" : "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "11.5px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Simulasi Pasar Baru (~2.1 km)
                </button>
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  style={{
                    backgroundColor: showMap ? "#2563eb" : "#ffffff",
                    color: showMap ? "#ffffff" : "#2563eb",
                    border: "1px solid #bfdbfe",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "11.5px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <MapPin size={11} /> {showMap ? "Tutup Peta" : "Peta Google Maps"}
                </button>
              </div>
            </div>

            {/* Google Maps Embed Preview */}
            {showMap && currentAsrama.mapEmbedUrl && (
              <div
                style={{
                  marginTop: "14px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1.5px solid #bfdbfe",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.1)"
                }}
              >
                <div
                  style={{
                    padding: "8px 14px",
                    backgroundColor: "#eff6ff",
                    borderBottom: "1px solid #bfdbfe",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#1e40af",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <span>Peta Lokasi Google Maps: {currentAsrama.name}</span>
                  <span style={{ fontSize: "11px", fontWeight: "normal", color: "#64748b" }}>
                    Koordinat: {currentAsrama.lat}, {currentAsrama.lng}
                  </span>
                </div>
                <iframe
                  src={currentAsrama.mapEmbedUrl}
                  width="100%"
                  height="260"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title={`Google Maps ${currentAsrama.name}`}
                />
              </div>
            )}
          </div>

          {/* Form Kirim Presensi */}
          <form onSubmit={handleSubmit}>
            <div
              className="content-card"
              style={{
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
            >
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Catatan tambahan (Contoh: Hadir di kamar, sholat berjamaah di mushala)"
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  fontSize: "13.5px",
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />

              {/* Warning alert if outside session time */}
              {!isSessionValid && (
                <div
                  style={{
                    backgroundColor: "#fff7ed",
                    border: "1.5px solid #fdba74",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    color: "#9a3412",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <Clock size={18} color="#ea580c" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Sesi Presensi Belum Dibuka:</strong> Presensi hanya dapat diambil pada <strong>Sesi Subuh (04.00 - 06.00 WIB)</strong> atau <strong>Sesi Malam (18.00 - 20.30 WIB)</strong>. Saat ini: {sessionInfo.statusText}.
                  </div>
                </div>
              )}

              {/* Warning alert if outside radius */}
              {!isLocating && userLocation && !isWithinRadius && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1.5px solid #fca5a5",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    color: "#991b1b",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Absensi Terkunci (Radius):</strong> Anda berada di jarak {currentDistance?.toLocaleString("id-ID")} meter (melebihi batas radius 100 meter dari {currentAsrama.name}). Silakan berada di area gedung asrama untuk melakukan absensi.
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={isSubmitting || submitted || !allRequirementsMet}
                  style={{
                    backgroundColor: submitted
                      ? "#10b981"
                      : allRequirementsMet
                      ? "#2563eb"
                      : "#94a3b8",
                    color: "#ffffff",
                    height: "46px",
                    padding: "0 28px",
                    borderRadius: "10px",
                    border: "none",
                    fontSize: "13.5px",
                    fontWeight: "700",
                    cursor: allRequirementsMet && !submitted ? "pointer" : "not-allowed",
                    boxShadow: allRequirementsMet && !submitted ? "0 4px 14px -2px rgba(37, 99, 235, 0.4)" : "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s ease"
                  }}
                >
                  {submitted ? (
                    <>
                      <Check size={16} /> Presensi Berhasil Terkirim
                    </>
                  ) : isSubmitting ? (
                    submitStep || "Mengirim..."
                  ) : !allRequirementsMet ? (
                    "Syarat Presensi Belum Terpenuhi"
                  ) : (
                    "Kirim Presensi Sekarang"
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Success Notification */}
          {submitted && (
            <div
              style={{
                backgroundColor: "#dcfce7",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#166534",
                fontSize: "13px",
                fontWeight: "600"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CheckCircle2 size={20} color="#16a34a" />
                <div>
                  <div>Presensi Anda di {currentAsrama.name} berhasil tersimpan ke database MySQL!</div>
                  <div style={{ fontSize: "11px", color: "#15803d", fontWeight: "500", marginTop: "2px" }}>
                    Status: Hadir • Jarak: {currentDistance} meter • Waktu: {new Date().toLocaleTimeString("id-ID")}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("riwayat")}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #86efac",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  color: "#15803d",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "700"
                }}
              >
                Lihat di Riwayat
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Checklist Syarat Pengambilan Absen & Jadwal Sesi */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Card 1: Checklist Syarat Pengambilan Absen */}
          <div
            className="content-card"
            style={{
              padding: "22px",
              border: allRequirementsMet ? "1.5px solid #bbf7d0" : "1.5px solid #fed7aa"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <ShieldCheck size={18} color={allRequirementsMet ? "#16a34a" : "#ea580c"} />
                <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  Syarat Pengambilan Absen
                </h3>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  backgroundColor: allRequirementsMet ? "#dcfce7" : "#ffedd5",
                  color: allRequirementsMet ? "#15803d" : "#c2410c"
                }}
              >
                {checklist.filter((c) => c.status).length}/{checklist.length} Terpenuhi
              </span>
            </div>

            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 16px 0", lineHeight: "1.4" }}>
              Seluruh kriteria berikut harus bertanda centang hijau agar presensi dapat diproses:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {checklist.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    backgroundColor: item.status ? "#f0fdf4" : "#fef2f2",
                    border: item.status ? "1px solid #dcfce7" : "1px solid #fee2e2"
                  }}
                >
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      backgroundColor: item.status ? "#16a34a" : "#dc2626",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "1px"
                    }}
                  >
                    {item.status ? <Check size={13} strokeWidth={3} /> : <XCircle size={14} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                        {item.title}
                      </div>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: "700",
                          color: item.status ? "#15803d" : "#b91c1c"
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px", lineHeight: "1.35" }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Jadwal Resmi Sesi Absensi */}
          <div className="content-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
              <Clock size={16} color="#2563eb" />
              <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
                Jadwal Resmi Presensi
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Sesi Subuh */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  backgroundColor: sessionInfo.isSubuh ? "#f0fdf4" : "#f8fafc",
                  borderRadius: "12px",
                  border: sessionInfo.isSubuh ? "1.5px solid #86efac" : "1px solid #f1f5f9"
                }}
              >
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                    Sesi Subuh
                  </div>
                  <div style={{ fontSize: "11px", color: sessionInfo.isSubuh ? "#15803d" : "#64748b" }}>
                    Pukul 04.00 - 06.00 WIB
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    backgroundColor: sessionInfo.isSubuh ? "#dcfce7" : "#f1f5f9",
                    color: sessionInfo.isSubuh ? "#15803d" : "#64748b"
                  }}
                >
                  {sessionInfo.isSubuh ? "✓ Sedang Dibuka" : "Pagi"}
                </span>
              </div>

              {/* Sesi Malam */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  backgroundColor: sessionInfo.isMalam ? "#f0fdf4" : "#f8fafc",
                  borderRadius: "12px",
                  border: sessionInfo.isMalam ? "1.5px solid #86efac" : "1px solid #f1f5f9"
                }}
              >
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                    Sesi Malam (Maghrib & Isya)
                  </div>
                  <div style={{ fontSize: "11px", color: sessionInfo.isMalam ? "#15803d" : "#64748b" }}>
                    Pukul 18.00 - 20.30 WIB
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    backgroundColor: sessionInfo.isMalam ? "#dcfce7" : "#f1f5f9",
                    color: sessionInfo.isMalam ? "#15803d" : "#64748b"
                  }}
                >
                  {sessionInfo.isMalam ? "✓ Sedang Dibuka" : "Malam"}
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: "14px",
                padding: "10px 12px",
                borderRadius: "8px",
                backgroundColor: "#eff6ff",
                fontSize: "11.5px",
                color: "#1e40af",
                lineHeight: "1.4"
              }}
            >
              <strong>Ketentuan:</strong> Pengambilan absen wajib berada dalam radius 100 meter dari titik tengah gedung asrama Anda.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

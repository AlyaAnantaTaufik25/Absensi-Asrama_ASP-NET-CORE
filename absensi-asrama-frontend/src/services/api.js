// API Service untuk menghubungkan Frontend (React) ke Backend (ASP.NET Core Minimal API)
export const API_BASE_URL =
  typeof window !== "undefined" && window.location.port === "5173"
    ? "http://localhost:5250"
    : "";

/**
 * Cek status apakah Backend dan Database MySQL aktif
 */
export async function checkBackendStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${API_BASE_URL}/api/db-check`, {
      method: "GET",
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { online: true, dbConnected: true, message: data.message || "Backend & Database Aktif" };
    } else {
      return { online: true, dbConnected: false, message: "Backend aktif, namun database MySQL belum terhubung." };
    }
  } catch (err) {
    return { online: false, dbConnected: false, message: "Backend offline (http://localhost:5250 belum aktif)." };
  }
}

/**
 * Login ke Backend ASP.NET Core
 */
export async function loginUser(email, password) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    // Kirim password dalam plain text (backend akan memverifikasi dengan berbagai format hash)
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      // Backend expects proper property names (Email, Password)
      body: JSON.stringify({ Email: email, Password: password }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return {
      status: 0,
      ok: false,
      data: { message: "Tidak dapat terhubung ke server backend (localhost:5250)." }
    };
  }
}


/**
 * Seed Akun Demo Otomatis ke Database MySQL
 */
export async function seedDemoAccounts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/seed`, {
      method: "POST"
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: "Gagal menghubungkan ke backend untuk seed data." };
  }
}

/**
 * Ambil data seluruh pengguna dari backend
 */
export async function getUsers() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users`);
    if (!res.ok) throw new Error("Gagal mengambil data user");
    return await res.json();
  } catch (err) {
    console.warn("Backend belum aktif atau error:", err);
    return null;
  }
}

/**
 * Kirim presensi ke backend
 */
export async function recordPresensi(presensiData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/presensi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(presensiData)
    });
    if (!res.ok) throw new Error("Gagal menyimpan presensi");
    return await res.json();
  } catch (err) {
    console.warn("Gagal simpan presensi ke backend:", err);
    return null;
  }
}

/**
 * Kirim perizinan ke backend
 */
export async function submitIzin(izinData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/perizinan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(izinData)
    });
    if (!res.ok) throw new Error("Gagal menyimpan perizinan");
    return await res.json();
  } catch (err) {
    console.warn("Gagal simpan izin ke backend:", err);
    return null;
  }
}

/**
 * Ambil data presensi dari backend
 */
export async function getPresensi() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/presensi`);
    if (!res.ok) throw new Error("Gagal mengambil data presensi");
    return await res.json();
  } catch (err) {
    console.warn("Backend presensi error:", err);
    return [];
  }
}

/**
 * Ambil data perizinan dari backend
 */
export async function getPerizinan() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/perizinan`);
    if (!res.ok) throw new Error("Gagal mengambil data perizinan");
    return await res.json();
  } catch (err) {
    console.warn("Backend perizinan error:", err);
    return [];
  }
}



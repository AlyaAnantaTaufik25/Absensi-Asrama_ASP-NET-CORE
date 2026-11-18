// API Service untuk menghubungkan Frontend (React) ke Backend (ASP.NET Core Minimal API)
// Di mode dev (port Vite apapun kecuali port backend 5250), arahkan ke backend 5250
export const API_BASE_URL =
  typeof window !== "undefined" && window.location.port !== "5250"
    ? "http://localhost:5250"
    : "";

/**
 * Cek status apakah Backend dan Database MySQL aktif
 */
export async function checkBackendStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${API_BASE_URL}/api/pingdb`, {
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
 * Ambil data penghuni saja (role=penghuni/mahasiswa)
 */
export async function getPenghuni() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/penghuni`);
    if (!res.ok) throw new Error("Gagal mengambil data penghuni");
    return await res.json();
  } catch (err) {
    console.warn("Backend penghuni error:", err);
    return [];
  }
}

/**
 * Ambil data fasil saja (role=fasil)
 */
export async function getFasil() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/fasil`);
    if (!res.ok) throw new Error("Gagal mengambil data fasil");
    return await res.json();
  } catch (err) {
    console.warn("Backend fasil error:", err);
    return [];
  }
}

/**
 * Tambah user baru (penghuni/fasil/admin)
 */
export async function createUser(userData) {
  const res = await fetch(`${API_BASE_URL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal membuat user");
  return data;
}

/**
 * Hapus user berdasarkan ID
 */
export async function deleteUser(id) {
  const res = await fetch(`${API_BASE_URL}/api/users/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Gagal menghapus user");
  }
  return await res.json();
}

/**
 * Update user berdasarkan ID
 */
export async function updateUser(id, userData) {
  const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal update user");
  return data;
}

/**
 * Ambil data gedung
 */
export async function getGedung() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/gedung`);
    if (!res.ok) throw new Error("Gagal mengambil data gedung");
    return await res.json();
  } catch (err) {
    console.warn("Backend gedung error:", err);
    return [];
  }
}

/**
 * Ambil data kamar
 */
export async function getKamar() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/kamar`);
    if (!res.ok) throw new Error("Gagal mengambil data kamar");
    return await res.json();
  } catch (err) {
    console.warn("Backend kamar error:", err);
    return [];
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
 * Unggah berkas bukti perizinan ke backend
 */
export async function uploadIzinFile(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/api/perizinan/upload`, {
      method: "POST",
      body: formData
    });
    if (!res.ok) throw new Error("Gagal mengunggah berkas");
    return await res.json();
  } catch (err) {
    console.warn("Gagal unggah berkas perizinan:", err);
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

/**
 * Tambah Pengguna Baru (Mahasiswa / Fasil / Admin)
 */
export async function createUser(userData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.warn("Gagal membuat user:", err);
    return { ok: false, data: { message: err.message } };
  }
}

/**
 * Perbarui Pengguna
 */
export async function updateUser(idUser, userData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/${idUser}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.warn("Gagal update user:", err);
    return { ok: false, data: { message: err.message } };
  }
}

/**
 * Hapus Pengguna
 */
export async function deleteUser(idUser) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/${idUser}`, {
      method: "DELETE"
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.warn("Gagal menghapus user:", err);
    return { ok: false, data: { message: err.message } };
  }
}

/**
 * Ambil data seluruh Gedung
 */
export async function getGedung() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/gedung`);
    if (!res.ok) throw new Error("Gagal mengambil data gedung");
    return await res.json();
  } catch (err) {
    console.warn("Backend gedung error:", err);
    return [];
  }
}

/**
 * Tambah Gedung Baru
 */
export async function createGedung(gedungData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/gedung`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gedungData)
    });
    return await res.json();
  } catch (err) {
    console.warn("Gagal simpan gedung:", err);
    return null;
  }
}

/**
 * Update Gedung
 */
export async function updateGedung(idGedung, gedungData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/gedung/${idGedung}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gedungData)
    });
    return await res.json();
  } catch (err) {
    console.warn("Gagal update gedung:", err);
    return null;
  }
}

/**
 * Hapus Gedung
 */
export async function deleteGedung(idGedung) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/gedung/${idGedung}`, {
      method: "DELETE"
    });
    return await res.json();
  } catch (err) {
    console.warn("Gagal menghapus gedung:", err);
    return null;
  }
}

/**
 * Ambil data seluruh Kamar
 */
export async function getKamar() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/kamar`);
    if (!res.ok) throw new Error("Gagal mengambil data kamar");
    return await res.json();
  } catch (err) {
    console.warn("Backend kamar error:", err);
    return [];
  }
}

/**
 * Tambah Kamar Baru
 */
export async function createKamar(kamarData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/kamar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kamarData)
    });
    return await res.json();
  } catch (err) {
    console.warn("Gagal simpan kamar:", err);
    return null;
  }
}

/**
 * Update Kamar
 */
export async function updateKamar(noKamar, kamarData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/kamar/${noKamar}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kamarData)
    });
    return await res.json();
  } catch (err) {
    console.warn("Gagal update kamar:", err);
    return null;
  }
}

/**
 * Hapus Kamar
 */
export async function deleteKamar(noKamar) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/kamar/${encodeURIComponent(noKamar)}`, {
      method: "DELETE"
    });
    return await res.json();
  } catch (err) {
    console.warn("Gagal menghapus kamar:", err);
    return null;
  }
}

/**
 * Statistik Dashboard
 */
export async function getStats() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/stats`);
    if (!res.ok) throw new Error("Gagal mengambil statistik");
    return await res.json();
  } catch (err) {
    console.warn("Gagal mengambil stats:", err);
    return null;
  }
}




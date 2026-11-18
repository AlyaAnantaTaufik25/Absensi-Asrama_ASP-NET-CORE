// API Service untuk menghubungkan Frontend (React) ke Backend (ASP.NET Core Minimal API)
// Jika diakses langsung dari server ASP.NET Core (port 5250, 7238, dll), gunakan relative path ""
// Hanya jika di mode dev Vite (port 5173/3000), arahkan ke host backend
export const API_BASE_URL =
  typeof window !== "undefined"
    ? (window.location.port.startsWith("517") || window.location.port === "3000"
        ? (window.location.protocol === "https:" ? "https://localhost:7238" : "http://localhost:5250")
        : "")
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

/**
 * Rekapitulasi Presensi Berdasarkan Role & Gedung
 * @param {object} params { role, gedungId, lantai, search, fromDate, toDate }
 */
export async function getRekapPresensi(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.role) query.append("role", params.role);
    if (params.gedungId) query.append("gedungId", params.gedungId);
    if (params.lantai) query.append("lantai", params.lantai);
    if (params.search) query.append("search", params.search);
    if (params.fromDate) query.append("fromDate", params.fromDate);
    if (params.toDate) query.append("toDate", params.toDate);

    const url = `${API_BASE_URL}/api/presensi/rekap${query.toString() ? "?" + query.toString() : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal mengambil data rekapitulasi presensi");
    return await res.json();
  } catch (err) {
    console.warn("Backend rekap presensi error:", err);
    return { success: false, summary: {}, data: [] };
  }
}

/**
 * Ambil data gedung binaan Fasil beserta daftar lantai & jumlah penghuni
 * @param {number} userId ID User milik Fasil
 */
export async function getGedungFasil(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/gedung/fasil/${userId}`);
    if (!res.ok) throw new Error("Gagal mengambil gedung binaan fasil");
    return await res.json();
  } catch (err) {
    console.warn("Backend gedung fasil error:", err);
    return null;
  }
}

/**
 * Pengaturan Jam Sesi Presensi (Subuh 04:00-06:00, Malam 18:00-20:30 default)
 */
export async function getSessionSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/settings/session`);
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("mynava_session_settings", JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn("Gagal mengambil setting sesi dari backend, gunakan cache lokal:", err);
  }
  const cached = localStorage.getItem("mynava_session_settings");
  if (cached) {
    try { return JSON.parse(cached); } catch {}
  }
  return {
    subuhStart: "04:00",
    subuhEnd: "06:00",
    malamStart: "18:00",
    malamEnd: "20:30",
    updatedBy: "Fasilitator"
  };
}

export async function updateSessionSettings(settingsData) {
  // Update local cache immediately
  const payload = {
    subuhStart: settingsData.subuhStart || "04:00",
    subuhEnd: settingsData.subuhEnd || "06:00",
    malamStart: settingsData.malamStart || "18:00",
    malamEnd: settingsData.malamEnd || "20:30",
    updatedBy: settingsData.updatedBy || "Fasilitator",
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem("mynava_session_settings", JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("mynava_session_updated", { detail: payload }));

  try {
    const res = await fetch(`${API_BASE_URL}/api/settings/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Tersimpan secara lokal (backend offline):", err);
  }
  return { success: true, message: "Pengaturan sesi tersimpan.", setting: payload };
}

/**
 * Update Status Perizinan (Disetujui / Ditolak oleh Fasil)
 */
export async function updatePerizinanStatus(idIzin, status) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/perizinan/${idIzin}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Gagal update status izin ke backend:", err);
  }
  return { success: true, message: `Status izin ${idIzin} diperbarui menjadi ${status}` };
}

/**
 * Buku Tamu (CRUD & Checkout)
 */
export async function getBukuTamu() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/buku-tamu`);
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("mynava_buku_tamu", JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn("Gagal ambil buku tamu dari backend:", err);
  }
  const cached = localStorage.getItem("mynava_buku_tamu");
  return cached ? JSON.parse(cached) : [];
}

export async function createBukuTamu(tamuData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/buku-tamu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tamuData)
    });
    if (res.ok) {
      const saved = await res.json();
      // Sync cache
      const cached = localStorage.getItem("mynava_buku_tamu");
      const list = cached ? JSON.parse(cached) : [];
      localStorage.setItem("mynava_buku_tamu", JSON.stringify([saved, ...list]));
      return saved;
    }
  } catch (err) {
    console.warn("Simpan buku tamu lokal:", err);
  }
  const fallback = {
    idTamu: Date.now(),
    ...tamuData,
    waktuKeluar: "—",
    status: "Sedang berkunjung",
    tanggal: new Date().toISOString().split("T")[0]
  };
  const cached = localStorage.getItem("mynava_buku_tamu");
  const list = cached ? JSON.parse(cached) : [];
  localStorage.setItem("mynava_buku_tamu", JSON.stringify([fallback, ...list]));
  return fallback;
}

export async function checkoutBukuTamu(idTamu) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/buku-tamu/${idTamu}/checkout`, {
      method: "PUT"
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Checkout buku tamu lokal:", err);
  }
  const cached = localStorage.getItem("mynava_buku_tamu");
  if (cached) {
    const list = JSON.parse(cached);
    const updated = list.map((item) =>
      item.idTamu === idTamu
        ? { ...item, status: "Selesai berkunjung", waktuKeluar: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB" }
        : item
    );
    localStorage.setItem("mynava_buku_tamu", JSON.stringify(updated));
  }
  return { success: true };
}

/**
 * Keluar-Masuk Malam (CRUD & Kembali)
 */
export async function getKeluarMasuk() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/keluar-masuk`);
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("mynava_keluar_masuk", JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn("Gagal ambil keluar-masuk dari backend:", err);
  }
  const cached = localStorage.getItem("mynava_keluar_masuk");
  return cached ? JSON.parse(cached) : [];
}

export async function createKeluarMasuk(logData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/keluar-masuk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData)
    });
    if (res.ok) {
      const saved = await res.json();
      const cached = localStorage.getItem("mynava_keluar_masuk");
      const list = cached ? JSON.parse(cached) : [];
      localStorage.setItem("mynava_keluar_masuk", JSON.stringify([saved, ...list]));
      return saved;
    }
  } catch (err) {
    console.warn("Simpan keluar-masuk lokal:", err);
  }
  const fallback = {
    idLog: Date.now(),
    ...logData,
    jamKembali: "—",
    status: "Belum kembali",
    tanggal: new Date().toISOString().split("T")[0]
  };
  const cached = localStorage.getItem("mynava_keluar_masuk");
  const list = cached ? JSON.parse(cached) : [];
  localStorage.setItem("mynava_keluar_masuk", JSON.stringify([fallback, ...list]));
  return fallback;
}

export async function returnKeluarMasuk(idLog) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/keluar-masuk/${idLog}/kembali`, {
      method: "PUT"
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Update status kembali lokal:", err);
  }
  const cached = localStorage.getItem("mynava_keluar_masuk");
  if (cached) {
    const list = JSON.parse(cached);
    const updated = list.map((item) =>
      item.idLog === idLog
        ? { ...item, status: "Sudah kembali", jamKembali: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB" }
        : item
    );
    localStorage.setItem("mynava_keluar_masuk", JSON.stringify(updated));
  }
  return { success: true };
}

/**
 * Laporan Kejadian (CRUD & Status)
 */
export async function getLaporanKejadian() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/laporan-kejadian`);
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("mynava_laporan_kejadian", JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn("Gagal ambil laporan kejadian dari backend:", err);
  }
  const cached = localStorage.getItem("mynava_laporan_kejadian");
  return cached ? JSON.parse(cached) : [];
}

export async function createLaporanKejadian(laporanData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/laporan-kejadian`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(laporanData)
    });
    if (res.ok) {
      const saved = await res.json();
      const cached = localStorage.getItem("mynava_laporan_kejadian");
      const list = cached ? JSON.parse(cached) : [];
      localStorage.setItem("mynava_laporan_kejadian", JSON.stringify([saved, ...list]));
      return saved;
    }
  } catch (err) {
    console.warn("Simpan laporan kejadian lokal:", err);
  }
  const fallback = {
    idLaporan: Date.now(),
    ...laporanData,
    status: "Menunggu tindak lanjut",
    dibuatPada: new Date().toISOString()
  };
  const cached = localStorage.getItem("mynava_laporan_kejadian");
  const list = cached ? JSON.parse(cached) : [];
  localStorage.setItem("mynava_laporan_kejadian", JSON.stringify([fallback, ...list]));
  return fallback;
}

export async function updateLaporanKejadianStatus(idLaporan, status) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/laporan-kejadian/${idLaporan}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Update status laporan lokal:", err);
  }
  const cached = localStorage.getItem("mynava_laporan_kejadian");
  if (cached) {
    const list = JSON.parse(cached);
    const updated = list.map((item) =>
      item.idLaporan === idLaporan ? { ...item, status } : item
    );
    localStorage.setItem("mynava_laporan_kejadian", JSON.stringify(updated));
  }
  return { success: true };
}

/**
 * Event / Acara Kegiatan Asrama (Disimpan ke Database)
 */
export async function getEvents() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events`);
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("mynava_events_cache", JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn("Gagal memuat events dari backend, pakai cache:", err);
  }
  const cached = localStorage.getItem("mynava_events_cache");
  return cached ? JSON.parse(cached) : [];
}

export async function createEvent(eventData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData)
    });
    if (res.ok) {
      const saved = await res.json();
      const cached = localStorage.getItem("mynava_events_cache");
      const list = cached ? JSON.parse(cached) : [];
      localStorage.setItem("mynava_events_cache", JSON.stringify([saved, ...list]));
      return saved;
    }
  } catch (err) {
    console.warn("Gagal simpan event ke backend, pakai fallback:", err);
  }
  const fallback = {
    idEvent: Date.now(),
    ...eventData,
    status: eventData.status || "Akan Datang",
    dibuatPada: new Date().toISOString()
  };
  const cached = localStorage.getItem("mynava_events_cache");
  const list = cached ? JSON.parse(cached) : [];
  localStorage.setItem("mynava_events_cache", JSON.stringify([fallback, ...list]));
  return fallback;
}

export async function updateEvent(idEvent, eventData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events/${idEvent}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Gagal update event di backend:", err);
  }
  const cached = localStorage.getItem("mynava_events_cache");
  if (cached) {
    const list = JSON.parse(cached);
    const updated = list.map((e) => (e.idEvent === idEvent ? { ...e, ...eventData } : e));
    localStorage.setItem("mynava_events_cache", JSON.stringify(updated));
  }
  return { success: true };
}

export async function deleteEvent(idEvent) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events/${idEvent}`, {
      method: "DELETE"
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Gagal delete event di backend:", err);
  }
  const cached = localStorage.getItem("mynava_events_cache");
  if (cached) {
    const list = JSON.parse(cached);
    const filtered = list.filter((e) => e.idEvent !== idEvent);
    localStorage.setItem("mynava_events_cache", JSON.stringify(filtered));
  }
  return { success: true };
}





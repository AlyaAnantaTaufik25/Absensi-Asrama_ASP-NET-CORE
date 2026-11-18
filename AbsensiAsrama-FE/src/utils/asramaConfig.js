// Konfigurasi Lokasi Asrama Universitas Andalas (Unand) & Jadwal Presensi Mahasiswa
// Titik koordinat tengah (latitude & longitude) dan radius geofence 100 meter
// Berdasarkan data resmi Google Maps Unand Limau Manis

export const ASRAMA_LIST = [
  // Asrama Laki-laki
  {
    id: "asrama-hijau",
    name: "Asrama Hijau",
    gender: "Laki-laki",
    lat: -0.9177091,
    lng: 100.4536153,
    radius: 100, // 100 meter
    description: "Asrama Mahasiswa Putra Unand",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.306564!2d100.4536153!3d-0.9177091!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4b7905fd2059b%3A0xc339e453404c65ed!2sAsrama%20Hijau%20Universitas%20Andalas!5e0!3m2!1sid!2sid"
  },
  {
    id: "asrama-orange",
    name: "Asrama Orange",
    gender: "Laki-laki",
    lat: -0.9176980,
    lng: 100.4531828,
    radius: 100, // 100 meter
    description: "Asrama Mahasiswa Putra Unand",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.306564!2d100.4531828!3d-0.9176980!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4b7b4ba078e1d%3A0xad7cf0f1198141a2!2sAsrama%20Orange%20Universitas%20Andalas!5e0!3m2!1sid!2sid"
  },

  // Asrama Perempuan
  {
    id: "asrama-roesma",
    name: "Asrama Roesma M. Sjaaf",
    gender: "Perempuan",
    lat: -0.9164632,
    lng: 100.4530367,
    radius: 100, // 100 meter
    description: "Asrama Mahasiswi Putri Unand",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.307940!2d100.4530367!3d-0.9164632!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4b79052ae87c5%3A0xc40fb1ff7b3f50c8!2sAsrama%20Roesma%20M.%20Sjaaf!5e0!3m2!1sid!2sid"
  },
  {
    id: "asrama-menpera",
    name: "Asrama Menpera",
    gender: "Perempuan",
    lat: -0.9168470,
    lng: 100.4533450,
    radius: 100, // 100 meter
    description: "Asrama Mahasiswi Putri Unand",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.307512!2d100.4533450!3d-0.9168470!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4b791ab47a623%3A0x7630c63a42c18c4b!2sAsrama%20Menpera!5e0!3m2!1sid!2sid"
  },
  {
    id: "asrama-pupera",
    name: "Asrama PUPERA 1",
    gender: "Perempuan",
    lat: -0.9163120,
    lng: 100.4537424,
    radius: 100, // 100 meter
    description: "Asrama Mahasiswi Putri Unand",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.308108!2d100.4537424!3d-0.9163120!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4b7a6844a81f5%3A0xffc50becfe0a15bb!2sAsrama%20PUPERA%201!5e0!3m2!1sid!2sid"
  },
  {
    id: "asrama-rusunawa",
    name: "Asrama Rusunawa",
    gender: "Perempuan",
    lat: -0.9164152,
    lng: 100.4541554,
    radius: 100, // 100 meter
    description: "Asrama Mahasiswi Putri Unand",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.307993!2d100.4541554!3d-0.9164152!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4b7ad02cf875b%3A0x2b5ee42ec7245f7e!2sAsrama%20Rusunawa!5e0!3m2!1sid!2sid"
  },
  {
    id: "asrama-rpx",
    name: "Asrama RPX",
    gender: "Perempuan",
    lat: -0.9164241,
    lng: 100.4544796,
    radius: 100, // 100 meter
    description: "Asrama Mahasiswi Putri Unand",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.307993!2d100.4544796!3d-0.9164241!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4b7911d5c1ff5%3A0xee2fdffaf904d1f0!2sAsrama%20RPX!5e0!3m2!1sid!2sid"
  }
];

/**
 * Menghitung jarak antara 2 koordinat GPS menggunakan formula Haversine (hasil dalam meter)
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 999999;
  const R = 6371000; // Radius bumi dalam meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const DEFAULT_SESSION_HOURS = {
  subuhStart: "04:00",
  subuhEnd: "06:00",
  malamStart: "18:00",
  malamEnd: "20:30"
};

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export function getActiveSessionConfig() {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("mynava_session_settings");
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          subuhStart: parsed.subuhStart || DEFAULT_SESSION_HOURS.subuhStart,
          subuhEnd: parsed.subuhEnd || DEFAULT_SESSION_HOURS.subuhEnd,
          malamStart: parsed.malamStart || DEFAULT_SESSION_HOURS.malamStart,
          malamEnd: parsed.malamEnd || DEFAULT_SESSION_HOURS.malamEnd
        };
      }
    } catch {}
  }
  return DEFAULT_SESSION_HOURS;
}

/**
 * Mengecek apakah waktu saat ini berada di dalam sesi presensi:
 * - Sesi Subuh / Pagi: 04:00 - 06:00 WIB (atau sesuai inputan fasil)
 * - Sesi Malam (Magrib & Isya): 18:00 - 20:30 WIB (atau sesuai inputan fasil)
 */
export function checkPresensiSession(customConfig = null) {
  const config = customConfig || getActiveSessionConfig();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const subuhStartMin = timeToMinutes(config.subuhStart);
  const subuhEndMin = timeToMinutes(config.subuhEnd);
  const malamStartMin = timeToMinutes(config.malamStart);
  const malamEndMin = timeToMinutes(config.malamEnd);

  const isSubuh = currentMinutes >= subuhStartMin && currentMinutes <= subuhEndMin;
  const isMalam = currentMinutes >= malamStartMin && currentMinutes <= malamEndMin;

  if (isSubuh) {
    const sisa = subuhEndMin - currentMinutes;
    return {
      session: "Subuh",
      sessionLabel: "Sesi Subuh / Pagi",
      isActive: true,
      timeRange: `${config.subuhStart} - ${config.subuhEnd} WIB`,
      statusText: `Sesi dibuka - sisa ${sisa} menit`,
      isSubuh: true,
      isMalam: false,
      config
    };
  }

  if (isMalam) {
    const sisa = malamEndMin - currentMinutes;
    return {
      session: "Malam",
      sessionLabel: "Sesi Malam (Magrib & Isya)",
      isActive: true,
      timeRange: `${config.malamStart} - ${config.malamEnd} WIB`,
      statusText: `Sesi dibuka - sisa ${sisa} menit`,
      isSubuh: false,
      isMalam: true,
      config
    };
  }

  // Di luar jam sesi
  let nextText = `Sesi Subuh dibuka pukul ${config.subuhStart} WIB`;
  if (currentMinutes > subuhEndMin && currentMinutes < malamStartMin) {
    nextText = `Sesi Malam (Magrib & Isya) dibuka pukul ${config.malamStart} WIB`;
  }

  return {
    session: "Di Luar Jam Sesi",
    sessionLabel: "Di Luar Jam Sesi",
    isActive: false,
    timeRange: `Subuh (${config.subuhStart} - ${config.subuhEnd}) · Malam (${config.malamStart} - ${config.malamEnd})`,
    statusText: nextText,
    isSubuh: false,
    isMalam: false,
    config
  };
}

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

/**
 * Mengecek apakah waktu saat ini berada di dalam sesi presensi:
 * - Sesi Subuh: 04.00 - 06.00 WIB
 * - Sesi Malam: 18.00 - 20.30 WIB
 */
export function checkPresensiSession() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Subuh: 04:00 (240 menit) sampai 06:00 (360 menit)
  const isSubuh = currentMinutes >= 240 && currentMinutes <= 360;

  // Malam: 18:00 (1080 menit) sampai 20:30 (1230 menit)
  const isMalam = currentMinutes >= 1080 && currentMinutes <= 1230;

  if (isSubuh) {
    const sisa = 360 - currentMinutes;
    return {
      session: "Subuh",
      isActive: true,
      timeRange: "04:00 - 06:00 WIB",
      statusText: `Sesi dibuka - sisa ${sisa} menit`,
      isSubuh: true,
      isMalam: false
    };
  }

  if (isMalam) {
    const sisa = 1230 - currentMinutes;
    return {
      session: "Malam (Maghrib & Isya)",
      isActive: true,
      timeRange: "18:00 - 20:30 WIB",
      statusText: `Sesi dibuka - sisa ${sisa} menit`,
      isSubuh: false,
      isMalam: true
    };
  }

  // Di luar jam sesi
  let nextText = "Sesi Subuh dibuka pukul 04:00 WIB";
  if (currentMinutes > 360 && currentMinutes < 1080) {
    nextText = "Sesi Malam dibuka pukul 18:00 WIB";
  }

  return {
    session: "Di Luar Jam Sesi",
    isActive: false,
    timeRange: "Subuh (04:00 - 06:00) · Malam (18:00 - 20:30)",
    statusText: nextText,
    isSubuh: false,
    isMalam: false
  };
}

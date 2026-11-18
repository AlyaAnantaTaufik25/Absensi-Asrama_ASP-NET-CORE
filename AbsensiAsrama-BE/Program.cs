using AbsensiAsrama.Data;
using AbsensiAsrama.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString!, new MySqlServerVersion(new Version(8, 0, 30))));

// CORS – allow React dev server
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors("AllowAll");
app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// -------------------------------------------------
// Debug endpoint – single definition
// -------------------------------------------------
app.MapGet("/api/pingdb", async (ApplicationDbContext db) =>
{
    try
    {
        return await db.Database.CanConnectAsync()
            ? Results.Ok(new { success = true, message = "Koneksi ke database berhasil" })
            : Results.Problem("Tidak dapat terhubung ke database", statusCode: 500);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Koneksi ke database gagal: {ex.Message}", statusCode: 500);
    }
});

app.MapGet("/api/status", () => "Backend Absensi Asrama berjalan!");

app.MapGet("/api/db-check", async (ApplicationDbContext db) =>
{
    var ok = await db.Database.CanConnectAsync();
    return ok
        ? Results.Ok(new { success = true, message = "Berhasil terhubung ke database MySQL!" })
        : Results.Problem("Koneksi database gagal.", statusCode: 503);
});

// -------------------------------------------------
// Authentication – login
// -------------------------------------------------
app.MapPost("/api/auth/login", async (LoginRequest request, ApplicationDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest(new { success = false, message = "Email dan password wajib diisi." });
    }

    var user = await db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
    if (user == null)
    {
        return Results.Json(new { success = false, message = "Email atau akun tidak terdaftar di database." }, statusCode: 401);
    }

    if (!VerifyUserPassword(user, request.Password))
    {
        return Results.Json(new { success = false, message = "Kata sandi yang Anda masukkan salah." }, statusCode: 401);
    }

    var nameParts = user.Nama.Split(' ', StringSplitOptions.RemoveEmptyEntries);
    var initials = nameParts.Length > 1
        ? $"{nameParts[0][0]}{nameParts[1][0]}".ToUpper()
        : (nameParts.Length == 1 ? $"{nameParts[0][0]}".ToUpper() : "AA");

    return Results.Ok(new
    {
        success = true,
        message = "Login berhasil!",
        user = new
        {
            id = user.IdUser,
            name = user.Nama,
            displayName = user.Nama.ToUpper(),
            initials,
            nim = user.Nim,
            room = user.NomorKamar ?? "Asrama Hijau, Kamar B-302",
            asrama = "Asrama Hijau",
            role = user.Role.ToLower(),
            email = user.Email
        }
    });
});

// -------------------------------------------------
// Users management
// -------------------------------------------------
app.MapGet("/api/users", async (ApplicationDbContext db) =>
{
    var users = await db.Users
        .Select(u => new
        {
            u.IdUser,
            u.Nama,
            u.Nim,
            u.Asal,
            u.NomorKamar,
            u.JenisKelamin,
            u.Email,
            Role = (u.Role != null && u.Role.ToLower() == "mahasiswa") ? "penghuni" : (u.Role ?? "penghuni")
        })
        .ToListAsync();
    return Results.Ok(users);
});

app.MapPost("/api/users", async (CreateUserRequest request, ApplicationDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Nama) ||
        string.IsNullOrWhiteSpace(request.Nim) ||
        string.IsNullOrWhiteSpace(request.Asal) ||
        string.IsNullOrWhiteSpace(request.JenisKelamin) ||
        string.IsNullOrWhiteSpace(request.Email) ||
        string.IsNullOrWhiteSpace(request.Password) ||
        string.IsNullOrWhiteSpace(request.Role))
    {
        return Results.BadRequest(new { message = "Semua field wajib harus diisi." });
    }

    if (request.Password.Length < 6)
    {
        return Results.BadRequest(new { message = "Password minimal 6 karakter." });
    }

    if (await db.Users.AnyAsync(u => u.Nim == request.Nim))
    {
        return Results.Conflict(new { message = "NIM sudah terdaftar." });
    }

    if (await db.Users.AnyAsync(u => u.Email == request.Email))
    {
        return Results.Conflict(new { message = "Email sudah terdaftar." });
    }

    if (!string.IsNullOrWhiteSpace(request.NomorKamar))
    {
        var kamarExists = await db.Kamars.AnyAsync(k => k.NoKamar == request.NomorKamar);
        if (!kamarExists)
        {
            var defaultGedung = await db.Gedungs.FirstOrDefaultAsync();
            if (defaultGedung == null)
            {
                defaultGedung = new Gedung { NamaGedung = "Asrama Hijau", IdUser = 1 };
                db.Gedungs.Add(defaultGedung);
                await db.SaveChangesAsync();
            }
            db.Kamars.Add(new Kamar { NoKamar = request.NomorKamar, Lantai = 1, IdGedung = defaultGedung.IdGedung });
            await db.SaveChangesAsync();
        }
    }

    var user = new User
    {
        Nama = request.Nama,
        Nim = request.Nim,
        Asal = request.Asal,
        NomorKamar = string.IsNullOrWhiteSpace(request.NomorKamar) ? null : request.NomorKamar,
        JenisKelamin = request.JenisKelamin,
        Email = request.Email,
        Role = (string.IsNullOrWhiteSpace(request.Role) || request.Role.Trim().ToLower() == "mahasiswa")
            ? "penghuni"
            : request.Role.Trim().ToLower()
    };
    var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
    user.Password = passwordHasher.HashPassword(user, request.Password);
    db.Users.Add(user);
    try
    {
        await db.SaveChangesAsync();
    }
    catch (Exception ex)
    {
        return Results.Problem($"Gagal menyimpan ke database: {ex.Message}", statusCode: 500);
    }

    return Results.Created("/api/users", new
    {
        message = "Pengguna berhasil ditambahkan.",
        user.IdUser,
        user.Nama,
        user.Nim,
        user.Asal,
        user.NomorKamar,
        user.JenisKelamin,
        user.Email,
        user.Role
    });
});

app.MapPut("/api/users/{id:int}", async (int id, UpdateUserRequest request, ApplicationDbContext db) =>
{
    var user = await db.Users.FindAsync(id);
    if (user == null) return Results.NotFound(new { message = "Pengguna tidak ditemukan." });

    if (!string.IsNullOrWhiteSpace(request.Nama)) user.Nama = request.Nama;
    if (!string.IsNullOrWhiteSpace(request.Nim)) user.Nim = request.Nim;
    if (!string.IsNullOrWhiteSpace(request.Asal)) user.Asal = request.Asal;
    if (request.NomorKamar != null) user.NomorKamar = request.NomorKamar;
    if (!string.IsNullOrWhiteSpace(request.JenisKelamin)) user.JenisKelamin = request.JenisKelamin;
    if (!string.IsNullOrWhiteSpace(request.Email)) user.Email = request.Email;
    if (!string.IsNullOrWhiteSpace(request.Role)) user.Role = request.Role.ToLower();
    if (!string.IsNullOrWhiteSpace(request.Password))
    {
        var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
        user.Password = passwordHasher.HashPassword(user, request.Password);
    }

    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Pengguna berhasil diperbarui.", user });
});

app.MapDelete("/api/users/{id:int}", async (int id, ApplicationDbContext db) =>
{
    var user = await db.Users.FindAsync(id);
    if (user == null) return Results.NotFound(new { message = "Pengguna tidak ditemukan." });

    var presensis = await db.Presensis.Where(p => p.IdUser == id).ToListAsync();
    db.Presensis.RemoveRange(presensis);

    var perizinans = await db.Perizinans.Where(p => p.Nim == user.Nim).ToListAsync();
    db.Perizinans.RemoveRange(perizinans);

    var managedGedungs = await db.Gedungs.Where(g => g.IdUser == id).ToListAsync();
    var fallbackAdmin = await db.Users.FirstOrDefaultAsync(u => u.Role == "admin" && u.IdUser != id);
    int fallbackId = fallbackAdmin?.IdUser ?? 1;
    foreach (var g in managedGedungs)
    {
        g.IdUser = fallbackId;
    }

    db.Users.Remove(user);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Pengguna berhasil dihapus." });
});

// -------------------------------------------------
// Presensi
// -------------------------------------------------
app.MapGet("/api/presensi", async (ApplicationDbContext db) =>
{
    var list = await db.Presensis
        .OrderByDescending(p => p.Waktu)
        .Take(50)
        .ToListAsync();
    return Results.Ok(list);
});

// -------------------------------------------------
// Endpoint Rekapitulasi Presensi Berdasarkan Role & Gedung
// Mendukung pemisahan role (penghuni, fasil, admin) & filter 1 gedung penuh untuk fasil
// -------------------------------------------------
app.MapGet("/api/presensi/rekap", async (
    string? role,
    int? gedungId,
    int? lantai,
    string? search,
    string? period,
    DateTime? fromDate,
    DateTime? toDate,
    ApplicationDbContext db) =>
{
    var query = from u in db.Users
                join k in db.Kamars on u.NomorKamar equals k.NoKamar into kamarGroup
                from k in kamarGroup.DefaultIfEmpty()
                join g in db.Gedungs on k.IdGedung equals g.IdGedung into gedungGroup
                from g in gedungGroup.DefaultIfEmpty()
                select new
                {
                    User = u,
                    Kamar = k,
                    Gedung = g
                };

    // Filter role pengguna jika diminta (misal: "penghuni", "fasil", "admin")
    if (!string.IsNullOrWhiteSpace(role) && role.ToLower() != "semua")
    {
        var normRole = role.Trim().ToLower();
        if (normRole == "mahasiswa") normRole = "penghuni";
        query = query.Where(x => x.User.Role.ToLower() == normRole);
    }

    // Filter gedung (untuk Fasil yang bertanggung jawab atas 1 Gedung Penuh)
    if (gedungId.HasValue && gedungId.Value > 0)
    {
        query = query.Where(x => x.Kamar != null && x.Kamar.IdGedung == gedungId.Value);
    }

    // Filter lantai (opsional jika difilter per lantai tertentu di gedung)
    if (lantai.HasValue && lantai.Value > 0)
    {
        query = query.Where(x => x.Kamar != null && x.Kamar.Lantai == lantai.Value);
    }

    // Filter pencarian nama / NIM
    if (!string.IsNullOrWhiteSpace(search))
    {
        var s = search.Trim().ToLower();
        query = query.Where(x => x.User.Nama.ToLower().Contains(s) || x.User.Nim.ToLower().Contains(s));
    }

    var userList = await query.ToListAsync();
    var userIds = userList.Select(x => x.User.IdUser).ToList();

    var presensiQuery = db.Presensis.Where(p => userIds.Contains(p.IdUser));

    if (fromDate.HasValue)
    {
        var fDate = fromDate.Value.Date;
        presensiQuery = presensiQuery.Where(p => p.Tanggal >= fDate);
    }
    if (toDate.HasValue)
    {
        var tDate = toDate.Value.Date;
        presensiQuery = presensiQuery.Where(p => p.Tanggal <= tDate);
    }

    var presensis = await presensiQuery.ToListAsync();
    var allGedungs = await db.Gedungs.ToListAsync();

    var result = userList.Select(x =>
    {
        var uPresensi = presensis.Where(p => p.IdUser == x.User.IdUser).ToList();
        var hadir = uPresensi.Count(p => p.Status.Equals("Hadir", StringComparison.OrdinalIgnoreCase));
        var izin = uPresensi.Count(p => p.Status.Equals("Izin", StringComparison.OrdinalIgnoreCase));
        var sakit = uPresensi.Count(p => p.Status.Equals("Sakit", StringComparison.OrdinalIgnoreCase) ||
                                         (p.Keterangan != null && p.Keterangan.ToLower().Contains("sakit")));
        var alpha = uPresensi.Count(p => p.Status.Equals("Alpha", StringComparison.OrdinalIgnoreCase));
        var terlambat = uPresensi.Count(p => p.Keterangan != null && p.Keterangan.ToLower().Contains("terlambat"));

        var total = hadir + izin + sakit + alpha;
        var percentage = total > 0 ? (int)Math.Round(((double)hadir / total) * 100) : (hadir > 0 ? 100 : 0);
        var latest = uPresensi.OrderByDescending(p => p.Waktu).FirstOrDefault();

        string namaGedung = "-";
        int nomorLantai = 1;

        if (x.User.Role.ToLower() == "penghuni" || x.User.Role.ToLower() == "mahasiswa")
        {
            namaGedung = x.Gedung?.NamaGedung ?? "Asrama Hijau";
            nomorLantai = x.Kamar?.Lantai ?? 1;
        }
        else if (x.User.Role.ToLower() == "fasil")
        {
            var managed = allGedungs.FirstOrDefault(g => g.IdUser == x.User.IdUser);
            namaGedung = managed != null ? $"{managed.NamaGedung} (Binaan)" : "Fasilitator Asrama";
            nomorLantai = 0;
        }
        else if (x.User.Role.ToLower() == "admin")
        {
            namaGedung = "Kantor UPT Asrama";
            nomorLantai = 0;
        }

        return new
        {
            idUser = x.User.IdUser,
            nama = x.User.Nama,
            nim = x.User.Nim,
            role = (x.User.Role.ToLower() == "mahasiswa") ? "penghuni" : x.User.Role.ToLower(),
            nomorKamar = x.User.NomorKamar ?? (x.User.Role.ToLower() == "penghuni" ? "HJ-101" : "-"),
            lantai = nomorLantai,
            idGedung = x.Kamar?.IdGedung ?? (x.User.Role.ToLower() == "penghuni" ? 1 : 0),
            namaGedung = namaGedung,
            hadir,
            terlambat,
            izin,
            sakit,
            alpha,
            total,
            percentage,
            terakhirWaktu = latest?.Waktu,
            terakhirStatus = latest?.Status ?? "Belum ada presensi",
            keterangan = latest?.Keterangan ?? "-"
        };
    }).OrderBy(r => r.lantai).ThenBy(r => r.nomorKamar).ThenBy(r => r.nama).ToList();

    return Results.Ok(new
    {
        success = true,
        summary = new
        {
            totalUser = result.Count,
            totalHadir = result.Sum(r => r.hadir),
            totalTerlambat = result.Sum(r => r.terlambat),
            totalIzin = result.Sum(r => r.izin),
            totalSakit = result.Sum(r => r.sakit),
            totalAlpha = result.Sum(r => r.alpha),
            rataRataPersentase = result.Count > 0 ? Math.Round(result.Average(r => r.percentage), 1) : 0
        },
        data = result
    });
});

// -------------------------------------------------
// Ambil Informasi Gedung Binaan Fasil (Satu Gedung Penuh)
// -------------------------------------------------
app.MapGet("/api/gedung/fasil/{userId:int}", async (int userId, ApplicationDbContext db) =>
{
    var gedung = await db.Gedungs.FirstOrDefaultAsync(g => g.IdUser == userId) 
                 ?? await db.Gedungs.FirstOrDefaultAsync();
    if (gedung == null) return Results.NotFound(new { message = "Gedung tidak ditemukan." });

    var kamars = await db.Kamars.Where(k => k.IdGedung == gedung.IdGedung).ToListAsync();
    var lantaiList = kamars.Select(k => k.Lantai).Distinct().OrderBy(l => l).ToList();

    var penghuniCount = await (from u in db.Users
                               join k in db.Kamars on u.NomorKamar equals k.NoKamar
                               where k.IdGedung == gedung.IdGedung && (u.Role == "penghuni" || u.Role == "mahasiswa")
                               select u).CountAsync();

    return Results.Ok(new
    {
        idGedung = gedung.IdGedung,
        namaGedung = gedung.NamaGedung,
        idUser = gedung.IdUser,
        totalKamar = kamars.Count,
        daftarLantai = lantaiList,
        totalPenghuni = penghuniCount
    });
});

app.MapPost("/api/presensi", async (CreatePresensiRequest req, ApplicationDbContext db) =>
{
    var presensi = new Presensi
    {
        IdUser = req.IdUser,
        Waktu = DateTime.Now,
        Tanggal = DateTime.Today,
        Status = req.Status ?? "Hadir",
        Latitude = req.Latitude,
        Longitude = req.Longitude,
        Keterangan = req.Keterangan,
        FotoWajah = req.FotoWajah
    };
    db.Presensis.Add(presensi);
    await db.SaveChangesAsync();
    return Results.Created($"/api/presensi/{presensi.IdPresensi}", presensi);
});

// -------------------------------------------------
// Gedung
// -------------------------------------------------
app.MapGet("/api/gedung", async (ApplicationDbContext db) =>
{
    var list = await (from g in db.Gedungs
                      join u in db.Users on g.IdUser equals u.IdUser into userGroup
                      from u in userGroup.DefaultIfEmpty()
                      select new
                      {
                          g.IdGedung,
                          g.NamaGedung,
                          g.IdUser,
                          NamaFasil = u != null ? u.Nama : "-"
                      }).ToListAsync();
    return Results.Ok(list);
});

app.MapPost("/api/gedung", async (CreateGedungRequest req, ApplicationDbContext db) =>
{
    int assignedUserId = req.IdUser.GetValueOrDefault();

    if (assignedUserId <= 0 && !string.IsNullOrWhiteSpace(req.NamaFasil))
    {
        var existingFasil = await db.Users.FirstOrDefaultAsync(u => u.Nama.ToLower() == req.NamaFasil.Trim().ToLower());
        if (existingFasil != null)
        {
            assignedUserId = existingFasil.IdUser;
        }
        else
        {
            var cleanEmail = req.NamaFasil.Trim().ToLower().Replace(" ", ".") + "@mynava.id";
            var newFasil = new User
            {
                Nama = req.NamaFasil.Trim(),
                Nim = $"FASIL-{Random.Shared.Next(1000, 9999)}",
                Asal = "Padang",
                JenisKelamin = "Laki-laki",
                Email = cleanEmail,
                Role = "fasil"
            };
            var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
            newFasil.Password = passwordHasher.HashPassword(newFasil, "asrama123");
            db.Users.Add(newFasil);
            await db.SaveChangesAsync();
            assignedUserId = newFasil.IdUser;
        }
    }

    if (assignedUserId <= 0)
    {
        var firstUser = await db.Users.FirstOrDefaultAsync();
        assignedUserId = firstUser?.IdUser ?? 1;
    }

    var gedung = new Gedung { NamaGedung = req.NamaGedung, IdUser = assignedUserId };
    db.Gedungs.Add(gedung);
    await db.SaveChangesAsync();

    int jumlahLantai = req.JumlahLantai.GetValueOrDefault(1);
    int kamarPerLantai = req.KamarPerLantai.GetValueOrDefault(0);
    if (jumlahLantai > 0 && kamarPerLantai > 0)
    {
        var prefix = req.NamaGedung.Trim();
        if (prefix.ToLower().StartsWith("gedung ")) prefix = prefix.Substring(7).Trim();
        if (string.IsNullOrEmpty(prefix)) prefix = "A";

        for (int l = 1; l <= jumlahLantai; l++)
        {
            for (int k = 1; k <= kamarPerLantai; k++)
            {
                var noKamar = $"{prefix}-{l}{k:D02}";
                if (!await db.Kamars.AnyAsync(km => km.NoKamar == noKamar))
                {
                    db.Kamars.Add(new Kamar { NoKamar = noKamar, Lantai = l, IdGedung = gedung.IdGedung });
                }
            }
        }
        await db.SaveChangesAsync();
    }

    return Results.Created($"/api/gedung/{gedung.IdGedung}", gedung);
});

app.MapPut("/api/gedung/{id:int}", async (int id, CreateGedungRequest req, ApplicationDbContext db) =>
{
    var gedung = await db.Gedungs.FindAsync(id);
    if (gedung == null) return Results.NotFound(new { message = "Gedung tidak ditemukan." });
    if (!string.IsNullOrWhiteSpace(req.NamaGedung)) gedung.NamaGedung = req.NamaGedung;
    if (req.IdUser.HasValue && req.IdUser.Value > 0)
    {
        gedung.IdUser = req.IdUser.Value;
    }
    else if (!string.IsNullOrWhiteSpace(req.NamaFasil))
    {
        var existingFasil = await db.Users.FirstOrDefaultAsync(u => u.Nama.ToLower() == req.NamaFasil.Trim().ToLower());
        if (existingFasil != null)
        {
            gedung.IdUser = existingFasil.IdUser;
        }
        else
        {
            var cleanEmail = req.NamaFasil.Trim().ToLower().Replace(" ", ".") + "@mynava.id";
            var newFasil = new User
            {
                Nama = req.NamaFasil.Trim(),
                Nim = $"FASIL-{Random.Shared.Next(1000, 9999)}",
                Asal = "Padang",
                JenisKelamin = "Laki-laki",
                Email = cleanEmail,
                Role = "fasil"
            };
            var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
            newFasil.Password = passwordHasher.HashPassword(newFasil, "asrama123");
            db.Users.Add(newFasil);
            await db.SaveChangesAsync();
            gedung.IdUser = newFasil.IdUser;
        }
    }

    if (req.JumlahLantai.HasValue && req.KamarPerLantai.HasValue && req.JumlahLantai.Value > 0 && req.KamarPerLantai.Value > 0)
    {
        var prefix = gedung.NamaGedung.Trim();
        if (prefix.ToLower().StartsWith("gedung ")) prefix = prefix.Substring(7).Trim();
        if (string.IsNullOrEmpty(prefix)) prefix = "A";

        for (int l = 1; l <= req.JumlahLantai.Value; l++)
        {
            for (int k = 1; k <= req.KamarPerLantai.Value; k++)
            {
                var noKamar = $"{prefix}-{l}{k:D02}";
                if (!await db.Kamars.AnyAsync(km => km.NoKamar == noKamar))
                {
                    db.Kamars.Add(new Kamar { NoKamar = noKamar, Lantai = l, IdGedung = gedung.IdGedung });
                }
            }
        }
    }

    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Gedung berhasil diperbarui.", gedung });
});

app.MapDelete("/api/gedung/{id:int}", async (int id, ApplicationDbContext db) =>
{
    var gedung = await db.Gedungs.FindAsync(id);
    if (gedung == null) return Results.NotFound(new { message = "Gedung tidak ditemukan." });

    var relatedKamars = await db.Kamars.Where(k => k.IdGedung == id).ToListAsync();
    db.Kamars.RemoveRange(relatedKamars);

    db.Gedungs.Remove(gedung);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Gedung dan kamar terkait berhasil dihapus." });
});

// -------------------------------------------------
// Kamar
// -------------------------------------------------
app.MapGet("/api/kamar", async (ApplicationDbContext db) =>
{
    var list = await (from k in db.Kamars
                      join g in db.Gedungs on k.IdGedung equals g.IdGedung into gedungGroup
                      from g in gedungGroup.DefaultIfEmpty()
                      select new
                      {
                          k.NoKamar,
                          k.Lantai,
                          k.IdGedung,
                          NamaGedung = g != null ? g.NamaGedung : "-"
                      }).ToListAsync();
    return Results.Ok(list);
});

app.MapPost("/api/kamar", async (CreateKamarRequest req, ApplicationDbContext db) =>
{
    if (await db.Kamars.AnyAsync(k => k.NoKamar == req.NoKamar))
        return Results.Conflict(new { message = "Nomor kamar sudah ada." });
    var kamar = new Kamar { NoKamar = req.NoKamar, Lantai = req.Lantai, IdGedung = req.IdGedung };
    db.Kamars.Add(kamar);
    await db.SaveChangesAsync();
    return Results.Created($"/api/kamar/{kamar.NoKamar}", kamar);
});

app.MapPut("/api/kamar/{noKamar}", async (string noKamar, CreateKamarRequest req, ApplicationDbContext db) =>
{
    var kamar = await db.Kamars.FindAsync(noKamar);
    if (kamar == null) return Results.NotFound(new { message = "Kamar tidak ditemukan." });
    if (req.Lantai > 0) kamar.Lantai = req.Lantai;
    if (req.IdGedung > 0) kamar.IdGedung = req.IdGedung;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Kamar berhasil diperbarui.", kamar });
});

app.MapDelete("/api/kamar/{noKamar}", async (string noKamar, ApplicationDbContext db) =>
{
    var kamar = await db.Kamars.FindAsync(noKamar);
    if (kamar == null) return Results.NotFound(new { message = "Kamar tidak ditemukan." });
    db.Kamars.Remove(kamar);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Kamar berhasil dihapus." });
});

// -------------------------------------------------
// Dashboard Stats
// -------------------------------------------------
app.MapGet("/api/stats", async (ApplicationDbContext db) =>
{
    var totalPenghuni = await db.Users.CountAsync(u => u.Role == "penghuni" || u.Role == "mahasiswa");
    var totalFasil = await db.Users.CountAsync(u => u.Role == "fasil");
    var totalGedung = await db.Gedungs.CountAsync();
    var totalKamar = await db.Kamars.CountAsync();

    var today = DateTime.Today;
    var presensiHariIni = await db.Presensis.CountAsync(p => p.Tanggal == today && p.Status == "Hadir");
    var totalPresensiHariIni = await db.Presensis.CountAsync(p => p.Tanggal == today);

    var attendanceRate = totalPenghuni > 0
        ? Math.Round(((double)presensiHariIni / totalPenghuni) * 100, 1)
        : (totalPresensiHariIni > 0 ? Math.Round(((double)presensiHariIni / totalPresensiHariIni) * 100, 1) : 0);

    return Results.Ok(new
    {
        totalPenghuni,
        totalFasil,
        totalGedung,
        totalKamar,
        presensiHariIni,
        attendanceRate
    });
});

// -------------------------------------------------
// Seed Initial Data (Gedung, Kamar, Demo Users)
// -------------------------------------------------
app.MapPost("/api/seed", async (ApplicationDbContext db) =>
{
    var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();

    if (!await db.Users.AnyAsync(u => u.Email == "admin@demo.com"))
    {
        var admin = new User
        {
            Nama = "Admin Pusat",
            Nim = "ADM-99",
            Asal = "Padang",
            JenisKelamin = "Laki-laki",
            Email = "admin@demo.com",
            Role = "admin"
        };
        admin.Password = passwordHasher.HashPassword(admin, "asrama");
        db.Users.Add(admin);
    }

    if (!await db.Users.AnyAsync(u => u.Email == "fasil@demo.com"))
    {
        var fasil = new User
        {
            Nama = "Kak Alif Rahman",
            Nim = "FASIL-01",
            Asal = "Bukittinggi",
            JenisKelamin = "Laki-laki",
            Email = "fasil@demo.com",
            Role = "fasil"
        };
        fasil.Password = passwordHasher.HashPassword(fasil, "asrama");
        db.Users.Add(fasil);
    }

    if (!await db.Users.AnyAsync(u => u.Email == "penghuni@demo.com"))
    {
        var penghuni = new User
        {
            Nama = "Alya Ananta",
            Nim = "2311523005",
            Asal = "Padang",
            JenisKelamin = "Perempuan",
            Email = "penghuni@demo.com",
            Role = "penghuni"
        };
        penghuni.Password = passwordHasher.HashPassword(penghuni, "asrama");
        db.Users.Add(penghuni);
    }
    await db.SaveChangesAsync();

    if (!await db.Gedungs.AnyAsync())
    {
        var fasilUser = await db.Users.FirstOrDefaultAsync(u => u.Role == "fasil") ?? await db.Users.FirstAsync();
        var g1 = new Gedung { NamaGedung = "Asrama Hijau", IdUser = fasilUser.IdUser };
        var g2 = new Gedung { NamaGedung = "Gedung Al-Farabi", IdUser = fasilUser.IdUser };
        db.Gedungs.AddRange(g1, g2);
        await db.SaveChangesAsync();

        var k1 = new Kamar { NoKamar = "A-101", Lantai = 1, IdGedung = g1.IdGedung };
        var k2 = new Kamar { NoKamar = "B-302", Lantai = 3, IdGedung = g1.IdGedung };
        var k3 = new Kamar { NoKamar = "AF-201", Lantai = 2, IdGedung = g2.IdGedung };
        db.Kamars.AddRange(k1, k2, k3);
        await db.SaveChangesAsync();
    }

    return Results.Ok(new { success = true, message = "Seed data awal berhasil dijalankan." });
});

// -------------------------------------------------
// Perizinan & File Upload
// -------------------------------------------------
app.MapGet("/api/perizinan", async (ApplicationDbContext db) =>
{
    var list = await db.Perizinans
        .OrderByDescending(p => p.Tanggal)
        .Take(50)
        .ToListAsync();
    return Results.Ok(list);
});

app.MapPost("/api/perizinan/upload", async (HttpRequest request, IWebHostEnvironment env) =>
{
    if (!request.HasFormContentType)
        return Results.BadRequest(new { success = false, message = "Tipe konten form diperlukan." });

    var form = await request.ReadFormAsync();
    var file = form.Files.GetFile("file") ?? form.Files.FirstOrDefault();
    if (file == null || file.Length == 0)
        return Results.BadRequest(new { success = false, message = "Tidak ada berkas yang diunggah." });

    var webRoot = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
    var uploadsFolder = Path.Combine(webRoot, "uploads");
    if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

    var ext = Path.GetExtension(file.FileName);
    var cleanBaseName = Path.GetFileNameWithoutExtension(file.FileName).Replace(" ", "_");
    var uniqueFileName = $"{DateTime.Now:yyyyMMdd_HHmmss}_{cleanBaseName}{ext}";
    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

    using (var stream = new FileStream(filePath, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }

    var fileUrl = $"/uploads/{uniqueFileName}";
    return Results.Ok(new { success = true, fileName = uniqueFileName, originalName = file.FileName, url = fileUrl });
});

app.MapPost("/api/perizinan", async (CreatePerizinanRequest req, ApplicationDbContext db) =>
{
    var nim = req.Nim;
    var userExists = await db.Users.AnyAsync(u => u.Nim == nim);
    if (!userExists)
    {
        var fallbackUser = await db.Users.FirstOrDefaultAsync(u => u.Role == "penghuni" || u.Role == "mahasiswa");
        if (fallbackUser != null)
        {
            nim = fallbackUser.Nim;
        }
    }

    var izin = new Perizinan
    {
        Nim = nim,
        Tanggal = req.Tanggal != default ? req.Tanggal : DateTime.Today,
        Alasan = req.Alasan,
        FileBukti = req.FileBukti
    };
    db.Perizinans.Add(izin);
    await db.SaveChangesAsync();
    return Results.Created($"/api/perizinan/{izin.IdIzin}", izin);
});



// -------------------------------------------------
// Hash helper (for testing)
// -------------------------------------------------
app.MapGet("/api/auth/hash", (string password) =>
{
    var dummyUser = new User();
    var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
    var identityHash = hasher.HashPassword(dummyUser, password);

    using var sha256 = System.Security.Cryptography.SHA256.Create();
    var sha256Hash = Convert.ToHexString(sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password))).ToLowerInvariant();

    using var md5 = System.Security.Cryptography.MD5.Create();
    var md5Hash = Convert.ToHexString(md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password))).ToLowerInvariant();

    return Results.Ok(new
    {
        plain = password,
        aspNetIdentityHash = identityHash,
        sha256 = sha256Hash,
        md5 = md5Hash,
        info = "Backend mendukung login menggunakan format hash ASP.NET Identity, SHA256 (MySQL SHA2), MD5 (MySQL MD5), maupun plain text."
    });
});

// Auto-normalize legacy roles ('mahasiswa' -> 'penghuni') & sync 7 Gedung Asrama on startup
try
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.ExecuteSqlRawAsync("UPDATE user SET role = 'penghuni' WHERE role = 'mahasiswa' OR role IS NULL OR role = ''");

    // Pastikan user demo ada
    var fasilUser = await dbContext.Users.FirstOrDefaultAsync(u => u.Role == "fasil") ?? await dbContext.Users.FirstOrDefaultAsync();
    int fasilId = fasilUser?.IdUser ?? 1;

    // 7 Asrama resmi (2 Laki-laki, 5 Perempuan)
    var asramaList = new (string Name, string Prefix)[]
    {
        ("Asrama Hijau", "HJ"),
        ("Asrama Orange", "OR"),
        ("Asrama Roesma M. Sjaaf", "RS"),
        ("Asrama Menpera", "MP"),
        ("Asrama PUPERA 1", "PP"),
        ("Asrama Rusunawa", "RW"),
        ("Asrama RPX", "RPX")
    };

    foreach (var (asramaName, prefix) in asramaList)
    {
        var existing = await dbContext.Gedungs.FirstOrDefaultAsync(g => g.NamaGedung == asramaName);
        if (existing == null)
        {
            var newGedung = new Gedung { NamaGedung = asramaName, IdUser = fasilId };
            dbContext.Gedungs.Add(newGedung);
            await dbContext.SaveChangesAsync();

            // Generate initial rooms for each asrama (3 floors, 4 rooms each)
            for (int fl = 1; fl <= 3; fl++)
            {
                for (int rm = 1; rm <= 4; rm++)
                {
                    var no = $"{prefix}-{fl}0{rm}";
                    if (!await dbContext.Kamars.AnyAsync(k => k.NoKamar == no))
                    {
                        dbContext.Kamars.Add(new Kamar { NoKamar = no, Lantai = fl, IdGedung = newGedung.IdGedung });
                    }
                }
            }
            await dbContext.SaveChangesAsync();
        }
    }

    // Seed Sample Penghuni Asrama Hijau lintas lantai (Lantai 1, 2, 3) & presensi
    var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
    var samplePenghuni = new (string Nama, string Nim, string Kamar, string Jk, string Email)[]
    {
        // Lantai 1
        ("Ahmad Fadhil", "2311521001", "HJ-101", "Laki-laki", "ahmad.fadhil@student.unand.ac.id"),
        ("Budi Santoso", "2311521002", "HJ-102", "Laki-laki", "budi.santoso@student.unand.ac.id"),
        ("Chandra Wijaya", "2311521003", "HJ-103", "Laki-laki", "chandra.w@student.unand.ac.id"),
        // Lantai 2
        ("Dimas Pratama", "2311522001", "HJ-201", "Laki-laki", "dimas.pratama@student.unand.ac.id"),
        ("Eko Prasetyo", "2311522002", "HJ-202", "Laki-laki", "eko.prasetyo@student.unand.ac.id"),
        ("Farhan Maulana", "2311522003", "HJ-203", "Laki-laki", "farhan.m@student.unand.ac.id"),
        // Lantai 3
        ("Genta Ramadhan", "2311523001", "HJ-301", "Laki-laki", "genta.r@student.unand.ac.id"),
        ("Haikal Akbar", "2311523002", "HJ-303", "Laki-laki", "haikal.akbar@student.unand.ac.id"),
        ("Ilham Saputra", "2311523004", "HJ-304", "Laki-laki", "ilham.saputra@student.unand.ac.id")
    };

    foreach (var sp in samplePenghuni)
    {
        var existing = await dbContext.Users.FirstOrDefaultAsync(u => u.Nim == sp.Nim || u.Email == sp.Email);
        if (existing == null)
        {
            var u = new User
            {
                Nama = sp.Nama,
                Nim = sp.Nim,
                NomorKamar = sp.Kamar,
                JenisKelamin = sp.Jk,
                Asal = "Sumatera Barat",
                Email = sp.Email,
                Role = "penghuni"
            };
            u.Password = hasher.HashPassword(u, "asrama123");
            dbContext.Users.Add(u);
            await dbContext.SaveChangesAsync();

            // Tambahkan data presensi sample untuk santri ini
            var today = DateTime.Today;
            dbContext.Presensis.AddRange(
                new Presensi { IdUser = u.IdUser, Tanggal = today, Waktu = today.AddHours(5).AddMinutes(15), Status = "Hadir", Keterangan = "Presensi Subuh tepat waktu" },
                new Presensi { IdUser = u.IdUser, Tanggal = today.AddDays(-1), Waktu = today.AddDays(-1).AddHours(19).AddMinutes(10), Status = "Hadir", Keterangan = "Presensi Malam mushala" },
                new Presensi { IdUser = u.IdUser, Tanggal = today.AddDays(-2), Waktu = today.AddDays(-2).AddHours(5).AddMinutes(20), Status = "Hadir", Keterangan = "Hadir Subuh berjamaah" },
                new Presensi { IdUser = u.IdUser, Tanggal = today.AddDays(-3), Waktu = today.AddDays(-3).AddHours(18).AddMinutes(45), Status = (sp.Nim.EndsWith("1") ? "Izin" : "Hadir"), Keterangan = (sp.Nim.EndsWith("1") ? "Izin kegiatan akademik kampus" : "Presensi tepat waktu") }
            );
            await dbContext.SaveChangesAsync();
        }
        else if (existing.NomorKamar == null || existing.NomorKamar != sp.Kamar)
        {
            existing.NomorKamar = sp.Kamar;
            await dbContext.SaveChangesAsync();
        }
    }

    // Pastikan Alya Ananta (penghuni@demo.com) memiliki kamar HJ-302 (Lantai 3 Asrama Hijau)
    var alya = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == "penghuni@demo.com");
    if (alya != null && (alya.NomorKamar == null || alya.NomorKamar == ""))
    {
        alya.NomorKamar = "HJ-302";
        await dbContext.SaveChangesAsync();
    }

    // Tambahkan sample presensi untuk Fasil & Admin jika belum ada
    if (fasilUser != null && !await dbContext.Presensis.AnyAsync(p => p.IdUser == fasilUser.IdUser))
    {
        var today = DateTime.Today;
        dbContext.Presensis.AddRange(
            new Presensi { IdUser = fasilUser.IdUser, Tanggal = today, Waktu = today.AddHours(4).AddMinutes(50), Status = "Hadir", Keterangan = "Monitoring presensi Subuh Asrama Hijau" },
            new Presensi { IdUser = fasilUser.IdUser, Tanggal = today.AddDays(-1), Waktu = today.AddDays(-1).AddHours(18).AddMinutes(20), Status = "Hadir", Keterangan = "Piket pengawasan sholat Maghrib & Isya" },
            new Presensi { IdUser = fasilUser.IdUser, Tanggal = today.AddDays(-2), Waktu = today.AddDays(-2).AddHours(5).AddMinutes(10), Status = "Hadir", Keterangan = "Piket pagi asrama" }
        );
        await dbContext.SaveChangesAsync();
    }

    var adminUser = await dbContext.Users.FirstOrDefaultAsync(u => u.Role == "admin");
    if (adminUser != null && !await dbContext.Presensis.AnyAsync(p => p.IdUser == adminUser.IdUser))
    {
        var today = DateTime.Today;
        dbContext.Presensis.AddRange(
            new Presensi { IdUser = adminUser.IdUser, Tanggal = today, Waktu = today.AddHours(7).AddMinutes(45), Status = "Hadir", Keterangan = "Presensi kehadiran kantor UPT Asrama" },
            new Presensi { IdUser = adminUser.IdUser, Tanggal = today.AddDays(-1), Waktu = today.AddDays(-1).AddHours(7).AddMinutes(50), Status = "Hadir", Keterangan = "Hadir kerja tepat waktu" },
            new Presensi { IdUser = adminUser.IdUser, Tanggal = today.AddDays(-2), Waktu = today.AddDays(-2).AddHours(8).AddMinutes(0), Status = "Hadir", Keterangan = "Hadir jam dinas" }
        );
        await dbContext.SaveChangesAsync();
    }
}
catch { }

app.MapFallbackToFile("index.html");
app.Run();

// -------------------------------------------------
// Helper: password verification (supports Identity, SHA256, MD5, plain)
// -------------------------------------------------
static bool VerifyUserPassword(User user, string inputPassword)
{
    if (string.IsNullOrEmpty(user.Password)) return false;

    // Identity hasher
    try
    {
        var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
        var result = hasher.VerifyHashedPassword(user, user.Password, inputPassword);
        if (result != Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed)
            return true;
    }
    catch { }

    // SHA-256
    using (var sha256 = System.Security.Cryptography.SHA256.Create())
    {
        var hash = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(inputPassword));
        var hex = Convert.ToHexString(hash);
        if (string.Equals(user.Password, hex, StringComparison.OrdinalIgnoreCase))
            return true;
    }

    // MD5
    using (var md5 = System.Security.Cryptography.MD5.Create())
    {
        var hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(inputPassword));
        var hex = Convert.ToHexString(hash);
        if (string.Equals(user.Password, hex, StringComparison.OrdinalIgnoreCase))
            return true;
    }

    // Plain text fallback
    return user.Password == inputPassword;
}

// DTO records
public record LoginRequest(string Email, string Password);
public record CreateUserRequest(
    string Nama,
    string Nim,
    string Asal,
    string? NomorKamar,
    string JenisKelamin,
    string Email,
    string Password,
    string Role);
public record CreateGedungRequest(
    string NamaGedung,
    int? IdUser,
    string? NamaFasil,
    int? JumlahLantai,
    int? KamarPerLantai,
    double? Latitude,
    double? Longitude,
    int? Radius);
public record CreateKamarRequest(string NoKamar, int Lantai, int IdGedung);
public record CreatePresensiRequest(int IdUser, string? Status, double? Latitude, double? Longitude, string? Keterangan, string? FotoWajah);
public record CreatePerizinanRequest(string Nim, DateTime Tanggal, string Alasan, string? FileBukti);
public record UpdateUserRequest(
    string? Nama,
    string? Nim,
    string? Asal,
    string? NomorKamar,
    string? JenisKelamin,
    string? Email,
    string? Password,
    string? Role);

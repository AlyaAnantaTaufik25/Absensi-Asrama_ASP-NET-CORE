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
            u.Role
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

    var user = new User
    {
        Nama = request.Nama,
        Nim = request.Nim,
        Asal = request.Asal,
        NomorKamar = request.NomorKamar,
        JenisKelamin = request.JenisKelamin,
        Email = request.Email,
        Role = request.Role
    };
    var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
    user.Password = passwordHasher.HashPassword(user, request.Password);
    db.Users.Add(user);
    await db.SaveChangesAsync();

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

// DELETE /api/users/{id}
app.MapDelete("/api/users/{id:int}", async (int id, ApplicationDbContext db) =>
{
    var user = await db.Users.FindAsync(id);
    if (user == null) return Results.NotFound(new { message = "User tidak ditemukan." });
    db.Users.Remove(user);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "User berhasil dihapus." });
});

// PUT /api/users/{id}
app.MapPut("/api/users/{id:int}", async (int id, UpdateUserRequest req, ApplicationDbContext db) =>
{
    var user = await db.Users.FindAsync(id);
    if (user == null) return Results.NotFound(new { message = "User tidak ditemukan." });
    user.Nama = req.Nama ?? user.Nama;
    user.Asal = req.Asal ?? user.Asal;
    user.NomorKamar = req.NomorKamar;
    user.JenisKelamin = req.JenisKelamin ?? user.JenisKelamin;
    user.Email = req.Email ?? user.Email;
    user.Role = req.Role ?? user.Role;
    if (!string.IsNullOrWhiteSpace(req.Password))
    {
        var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
        user.Password = hasher.HashPassword(user, req.Password);
    }
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "User berhasil diperbarui.", user.IdUser, user.Nama, user.Email, user.Role });
});

// GET /api/users/penghuni - hanya role penghuni
app.MapGet("/api/users/penghuni", async (ApplicationDbContext db) =>
{
    var list = await db.Users
        .Where(u => u.Role == "penghuni" || u.Role == "mahasiswa")
        .Select(u => new { u.IdUser, u.Nama, u.Nim, u.Asal, u.NomorKamar, u.JenisKelamin, u.Email, u.Role })
        .ToListAsync();
    return Results.Ok(list);
});

// GET /api/users/fasil - hanya role fasil
app.MapGet("/api/users/fasil", async (ApplicationDbContext db) =>
{
    var list = await db.Users
        .Where(u => u.Role == "fasil")
        .Select(u => new { u.IdUser, u.Nama, u.Nim, u.Asal, u.NomorKamar, u.JenisKelamin, u.Email, u.Role })
        .ToListAsync();
    return Results.Ok(list);
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
    var list = await db.Gedungs
        .Join(db.Users,
            g => g.IdUser,
            u => u.IdUser,
            (g, u) => new
            {
                g.IdGedung,
                g.NamaGedung,
                g.IdUser,
                NamaFasil = u.Nama
            })
        .ToListAsync();
    return Results.Ok(list);
});

app.MapPost("/api/gedung", async (CreateGedungRequest req, ApplicationDbContext db) =>
{
    var gedung = new Gedung { NamaGedung = req.NamaGedung, IdUser = req.IdUser };
    db.Gedungs.Add(gedung);
    await db.SaveChangesAsync();
    return Results.Created($"/api/gedung/{gedung.IdGedung}", gedung);
});

app.MapDelete("/api/gedung/{id:int}", async (int id, ApplicationDbContext db) =>
{
    var gedung = await db.Gedungs.FindAsync(id);
    if (gedung == null) return Results.NotFound(new { message = "Gedung tidak ditemukan." });
    db.Gedungs.Remove(gedung);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Gedung berhasil dihapus." });
});

app.MapPut("/api/gedung/{id:int}", async (int id, UpdateGedungRequest req, ApplicationDbContext db) =>
{
    var gedung = await db.Gedungs.FindAsync(id);
    if (gedung == null) return Results.NotFound(new { message = "Gedung tidak ditemukan." });
    if (req.NamaGedung != null) gedung.NamaGedung = req.NamaGedung;
    if (req.IdUser.HasValue) gedung.IdUser = req.IdUser.Value;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Gedung berhasil diperbarui.", gedung.IdGedung, gedung.NamaGedung, gedung.IdUser });
});

// -------------------------------------------------
// Kamar
// -------------------------------------------------
app.MapGet("/api/kamar", async (ApplicationDbContext db) =>
{
    var list = await db.Kamars
        .Join(db.Gedungs,
            k => k.IdGedung,
            g => g.IdGedung,
            (k, g) => new
            {
                k.NoKamar,
                k.Lantai,
                k.IdGedung,
                NamaGedung = g.NamaGedung
            })
        .ToListAsync();
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

app.MapDelete("/api/kamar/{noKamar}", async (string noKamar, ApplicationDbContext db) =>
{
    var kamar = await db.Kamars.FindAsync(noKamar);
    if (kamar == null) return Results.NotFound(new { message = "Kamar tidak ditemukan." });
    db.Kamars.Remove(kamar);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Kamar berhasil dihapus." });
});

app.MapPut("/api/kamar/{noKamar}", async (string noKamar, UpdateKamarRequest req, ApplicationDbContext db) =>
{
    var kamar = await db.Kamars.FindAsync(noKamar);
    if (kamar == null) return Results.NotFound(new { message = "Kamar tidak ditemukan." });
    if (req.Lantai.HasValue) kamar.Lantai = req.Lantai.Value;
    if (req.IdGedung.HasValue) kamar.IdGedung = req.IdGedung.Value;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Kamar berhasil diperbarui.", kamar.NoKamar, kamar.Lantai, kamar.IdGedung });
});

// -------------------------------------------------
// Perizinan
// -------------------------------------------------
app.MapGet("/api/perizinan", async (ApplicationDbContext db) =>
{
    var list = await db.Perizinans
        .OrderByDescending(p => p.Tanggal)
        .Take(50)
        .ToListAsync();
    return Results.Ok(list);
});

app.MapPost("/api/perizinan", async (CreatePerizinanRequest req, ApplicationDbContext db) =>
{
    var izin = new Perizinan
    {
        Nim = req.Nim,
        Tanggal = req.Tanggal,
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
public record CreateGedungRequest(string NamaGedung, int IdUser);
public record CreateKamarRequest(string NoKamar, int Lantai, int IdGedung);
public record CreatePresensiRequest(int IdUser, string? Status, double? Latitude, double? Longitude, string? Keterangan, string? FotoWajah);
public record CreatePerizinanRequest(string Nim, DateTime Tanggal, string Alasan, string? FileBukti);
public record UpdateUserRequest(string? Nama, string? Asal, string? NomorKamar, string? JenisKelamin, string? Email, string? Password, string? Role);
public record UpdateGedungRequest(string? NamaGedung, int? IdUser);
public record UpdateKamarRequest(int? Lantai, int? IdGedung);

using AbsensiAsrama.Data;
using AbsensiAsrama.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration
    .GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        connectionString!,
        new MySqlServerVersion(new Version(8, 0, 30))
    ));

// Aktifkan CORS agar Frontend React (http://localhost:5173) bisa terhubung ke Backend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Konfigurasi Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Terapkan CORS
app.UseCors("AllowAll");

// Sajikan file Frontend React dari folder wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

// Aktifkan Swagger saat development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/api/status", () => "Backend Absensi Asrama berjalan!");

// 1. Cek Koneksi Database
app.MapGet("/api/db-check", async (ApplicationDbContext db) =>
{
    try
    {
        var connected = await db.Database.CanConnectAsync();

        if (connected)
        {
            return Results.Ok(new
            {
                success = true,
                message = "Berhasil terhubung ke database MySQL!"
            });
        }

        return Results.Problem(
            "Koneksi database gagal.",
            statusCode: 503);
    }
    catch
    {
        return Results.Problem(
            "Koneksi database gagal. Periksa server dan konfigurasi MySQL.",
            statusCode: 503);
    }
});

// 2. Autentikasi / Login Endpoint
app.MapPost("/api/auth/login", async (LoginRequest request, ApplicationDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest(new { success = false, message = "Email dan password wajib diisi." });
    }

    try
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (user == null)
        {
            return Results.Json(new { success = false, message = "Email atau akun tidak terdaftar di database." }, statusCode: 401);
        }

        var isValid = VerifyUserPassword(user, request.Password);

        if (!isValid)
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
                initials = initials,
                nim = user.Nim,
                room = user.NomorKamar ?? "Asrama Hijau, Kamar B-302",
                asrama = "Asrama Hijau",
                role = user.Role.ToLower(),
                email = user.Email
            }
        });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Gagal memproses login: {ex.Message}", statusCode: 500);
    }
});

// 3. Ambil Daftar Pengguna
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

// 4. Tambah Pengguna Baru
app.MapPost("/api/users", async (
    CreateUserRequest request,
    ApplicationDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Nama) ||
        string.IsNullOrWhiteSpace(request.Nim) ||
        string.IsNullOrWhiteSpace(request.Asal) ||
        string.IsNullOrWhiteSpace(request.JenisKelamin) ||
        string.IsNullOrWhiteSpace(request.Email) ||
        string.IsNullOrWhiteSpace(request.Password) ||
        string.IsNullOrWhiteSpace(request.Role))
    {
        return Results.BadRequest(new
        {
            message = "Semua field wajib harus diisi."
        });
    }

    if (request.Password.Length < 6)
    {
        return Results.BadRequest(new
        {
            message = "Password minimal 6 karakter."
        });
    }

    if (await db.Users.AnyAsync(u => u.Nim == request.Nim))
    {
        return Results.Conflict(new
        {
            message = "NIM sudah terdaftar."
        });
    }

    if (await db.Users.AnyAsync(u => u.Email == request.Email))
    {
        return Results.Conflict(new
        {
            message = "Email sudah terdaftar."
        });
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

// 5. Presensi Endpoints
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

// 6. Perizinan Endpoints
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

// 7. Seed Akun Demo Otomatis jika database masih kosong
app.MapPost("/api/seed", async (ApplicationDbContext db) =>
{
    try
    {
        var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();

        // 1. Tambah atau perbarui Admin
        var admin = await db.Users.FirstOrDefaultAsync(u => u.Email == "admin@demo.com");
        if (admin == null)
        {
            admin = new User
            {
                Nama = "Admin Pusat",
                Nim = "ADM-99",
                Asal = "Padang",
                NomorKamar = null,
                JenisKelamin = "Laki-laki",
                Email = "admin@demo.com",
                Role = "admin"
            };
            admin.Password = "asrama";
            db.Users.Add(admin);
        }
        else
        {
            admin.Role = "admin";
            admin.Password = "asrama";
        }

        // 2. Tambah atau perbarui Fasil
        var fasil = await db.Users.FirstOrDefaultAsync(u => u.Email == "fasil@demo.com");
        if (fasil == null)
        {
            fasil = new User
            {
                Nama = "Kak Alif Rahman",
                Nim = "FASIL-01",
                Asal = "Bukittinggi",
                NomorKamar = null,
                JenisKelamin = "Laki-laki",
                Email = "fasil@demo.com",
                Role = "fasil"
            };
            fasil.Password = "asrama";
            db.Users.Add(fasil);
        }
        else
        {
            fasil.Role = "fasil";
            fasil.Password = "asrama";
        }

        // 3. Tambah atau perbarui Penghuni
        var penghuni = await db.Users.FirstOrDefaultAsync(u => u.Email == "penghuni@demo.com");
        if (penghuni == null)
        {
            penghuni = new User
            {
                Nama = "Alya Ananta",
                Nim = "2311523005",
                Asal = "Padang",
                NomorKamar = null,
                JenisKelamin = "Perempuan",
                Email = "penghuni@demo.com",
                Role = "penghuni"
            };
            penghuni.Password = "asrama";
            db.Users.Add(penghuni);
        }
        else
        {
            penghuni.Password = "asrama";
        }

        await db.SaveChangesAsync();

        return Results.Ok(new { success = true, message = "Berhasil membuat/memperbarui akun (Admin, Fasil, Penghuni) dengan kata sandi: asrama" });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Gagal melakukan seed data: {ex.Message}", statusCode: 500);
    }
});

// Endpoint bantuan untuk generate hash kata sandi (untuk testing atau manual input phpMyAdmin)
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

// Rute fallback untuk React SPA
app.MapFallbackToFile("index.html");

app.Run();

// Helper Verifikasi Password Fleksibel (Mendukung Hash ASP.NET PBKDF2, MySQL SHA-256, MySQL MD5, dan plain text)
static bool VerifyUserPassword(User user, string inputPassword)
{
    if (string.IsNullOrEmpty(user.Password)) return false;

    // 1. Coba ASP.NET Core Identity PasswordHasher (PBKDF2)
    try
    {
        var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
        var result = hasher.VerifyHashedPassword(user, user.Password, inputPassword);
        if (result != Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed)
        {
            return true;
        }
    }
    catch { }

    // 2. Coba SHA-256 (jika di phpMyAdmin menggunakan fungsi SHA2)
    using (var sha256 = System.Security.Cryptography.SHA256.Create())
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes(inputPassword);
        var hash = sha256.ComputeHash(bytes);
        var hex = Convert.ToHexString(hash);
        if (string.Equals(user.Password, hex, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }
    }

    // 3. Coba MD5 (jika di phpMyAdmin menggunakan fungsi MD5)
    using (var md5 = System.Security.Cryptography.MD5.Create())
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes(inputPassword);
        var hash = md5.ComputeHash(bytes);
        var hex = Convert.ToHexString(hash);
        if (string.Equals(user.Password, hex, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }
    }

    // 4. Fallback Plain Text
    if (user.Password == inputPassword)
    {
        return true;
    }

    return false;
}

// DTO Records
public record LoginRequest(string Email, string Password);
public record CreateUserRequest(
    string Nama,
    string Nim,
    string Asal,
    string? NomorKamar,
    string JenisKelamin,
    string Email,
    string Password,
    string Role
);
public record CreatePresensiRequest(int IdUser, string? Status, double? Latitude, double? Longitude, string? Keterangan, string? FotoWajah);
public record CreatePerizinanRequest(string Nim, DateTime Tanggal, string Alasan, string? FileBukti);

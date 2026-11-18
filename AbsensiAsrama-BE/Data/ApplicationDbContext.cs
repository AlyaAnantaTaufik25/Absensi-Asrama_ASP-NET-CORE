
using AbsensiAsrama.Models;
using Microsoft.EntityFrameworkCore;

namespace AbsensiAsrama.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Presensi> Presensis => Set<Presensi>();
    public DbSet<Gedung> Gedungs => Set<Gedung>();
    public DbSet<Kamar> Kamars => Set<Kamar>();
    public DbSet<Perizinan> Perizinans => Set<Perizinan>();
    public DbSet<SessionSetting> SessionSettings => Set<SessionSetting>();
    public DbSet<BukuTamu> BukuTamus => Set<BukuTamu>();
    public DbSet<KeluarMasuk> KeluarMasuks => Set<KeluarMasuk>();
    public DbSet<LaporanKejadian> LaporanKejadians => Set<LaporanKejadian>();
    public DbSet<EventKegiatan> EventKegiatans => Set<EventKegiatan>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Tabel User
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("user");
            entity.HasKey(u => u.IdUser);

            entity.Property(u => u.IdUser)
                .HasColumnName("id_user")
                .ValueGeneratedOnAdd();

            entity.Property(u => u.Nama)
                .HasColumnName("nama")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(u => u.Nim)
                .HasColumnName("nim")
                .HasMaxLength(30)
                .IsRequired();

            entity.HasAlternateKey(u => u.Nim);

            entity.Property(u => u.Asal)
                .HasColumnName("asal")
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(u => u.NomorKamar)
                .HasColumnName("nomor_kamar")
                .HasMaxLength(20)
                .IsRequired(false);

            entity.Property(u => u.JenisKelamin)
                .HasColumnName("jenis_kelamin")
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(u => u.Email)
                .HasColumnName("email")
                .HasMaxLength(150)
                .IsRequired();

            entity.HasIndex(u => u.Email)
                .IsUnique();

            entity.Property(u => u.Password)
                .HasColumnName("password")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(u => u.Role)
                .HasColumnName("role")
                .HasColumnType("enum('penghuni','mahasiswa','fasil','admin')")
                .IsRequired();

            entity.HasOne<Kamar>()
                .WithMany()
                .HasForeignKey(u => u.NomorKamar)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Tabel Presensi
        modelBuilder.Entity<Presensi>(entity =>
        {
            entity.ToTable("presensi");
            entity.HasKey(p => p.IdPresensi);

            entity.Property(p => p.IdPresensi)
                .HasColumnName("id_presensi")
                .ValueGeneratedOnAdd();

            entity.Property(p => p.Waktu)
                .HasColumnName("waktu")
                .HasColumnType("datetime");

            entity.Property(p => p.Latitude)
                .HasColumnName("latitude");

            entity.Property(p => p.Longitude)
                .HasColumnName("longitude");

            entity.Property(p => p.Status)
                .HasColumnName("status")
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(p => p.FotoWajah)
                .HasColumnName("foto_wajah")
                .HasMaxLength(255);

            entity.Property(p => p.Keterangan)
                .HasColumnName("keterangan")
                .HasMaxLength(500);

            entity.Property(p => p.Tanggal)
                .HasColumnName("tanggal")
                .HasColumnType("date");

            entity.Property(p => p.IdUser)
                .HasColumnName("id_user");

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(p => p.IdUser)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Tabel Gedung
        modelBuilder.Entity<Gedung>(entity =>
        {
            entity.ToTable("gedung");
            entity.HasKey(g => g.IdGedung);

            entity.Property(g => g.IdGedung)
                .HasColumnName("id_gedung")
                .ValueGeneratedOnAdd();

            entity.Property(g => g.NamaGedung)
                .HasColumnName("nama_gedung")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(g => g.IdUser)
                .HasColumnName("id_user");

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(g => g.IdUser)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Tabel Kamar
        modelBuilder.Entity<Kamar>(entity =>
        {
            entity.ToTable("kamar");
            entity.HasKey(k => k.NoKamar);

            entity.Property(k => k.NoKamar)
                .HasColumnName("no_kamar")
                .HasMaxLength(20);

            entity.Property(k => k.Lantai)
                .HasColumnName("lantai");

            entity.Property(k => k.IdGedung)
                .HasColumnName("id_gedung");

            entity.HasOne<Gedung>()
                .WithMany()
                .HasForeignKey(k => k.IdGedung)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Tabel Perizinan
        modelBuilder.Entity<Perizinan>(entity =>
        {
            entity.ToTable("perizinan");
            entity.HasKey(p => p.IdIzin);

            entity.Property(p => p.IdIzin)
                .HasColumnName("id_izin")
                .ValueGeneratedOnAdd();

            entity.Property(p => p.Nim)
                .HasColumnName("nim")
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(p => p.Tanggal)
                .HasColumnName("tanggal")
                .HasColumnType("date");

            entity.Property(p => p.Alasan)
                .HasColumnName("alasan")
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(p => p.FileBukti)
                .HasColumnName("file_bukti")
                .HasMaxLength(255);

            entity.Property(p => p.Status)
                .HasColumnName("status")
                .HasMaxLength(50)
                .HasDefaultValue("Menunggu");

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(p => p.Nim)
                .HasPrincipalKey(u => u.Nim)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Tabel SessionSetting (Pengaturan Jam Sesi Presensi)
        modelBuilder.Entity<SessionSetting>(entity =>
        {
            entity.ToTable("session_setting");
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(s => s.SubuhStart).HasColumnName("subuh_start").HasMaxLength(10).HasDefaultValue("04:00");
            entity.Property(s => s.SubuhEnd).HasColumnName("subuh_end").HasMaxLength(10).HasDefaultValue("06:00");
            entity.Property(s => s.MalamStart).HasColumnName("malam_start").HasMaxLength(10).HasDefaultValue("18:00");
            entity.Property(s => s.MalamEnd).HasColumnName("malam_end").HasMaxLength(10).HasDefaultValue("20:30");
            entity.Property(s => s.UpdatedBy).HasColumnName("updated_by").HasMaxLength(100).HasDefaultValue("Fasilitator");
            entity.Property(s => s.UpdatedAt).HasColumnName("updated_at").HasColumnType("datetime");
        });

        // Tabel BukuTamu
        modelBuilder.Entity<BukuTamu>(entity =>
        {
            entity.ToTable("buku_tamu");
            entity.HasKey(b => b.IdTamu);
            entity.Property(b => b.IdTamu).HasColumnName("id_tamu").ValueGeneratedOnAdd();
            entity.Property(b => b.NamaTamu).HasColumnName("nama_tamu").HasMaxLength(100).IsRequired();
            entity.Property(b => b.Relasi).HasColumnName("relasi").HasMaxLength(50);
            entity.Property(b => b.NamaPenghuni).HasColumnName("nama_penghuni").HasMaxLength(100);
            entity.Property(b => b.WaktuMasuk).HasColumnName("waktu_masuk").HasMaxLength(20);
            entity.Property(b => b.WaktuKeluar).HasColumnName("waktu_keluar").HasMaxLength(20);
            entity.Property(b => b.Status).HasColumnName("status").HasMaxLength(50);
            entity.Property(b => b.Catatan).HasColumnName("catatan").HasMaxLength(255);
            entity.Property(b => b.Tanggal).HasColumnName("tanggal").HasColumnType("date");
        });

        // Tabel KeluarMasuk
        modelBuilder.Entity<KeluarMasuk>(entity =>
        {
            entity.ToTable("keluar_masuk");
            entity.HasKey(k => k.IdLog);
            entity.Property(k => k.IdLog).HasColumnName("id_log").ValueGeneratedOnAdd();
            entity.Property(k => k.NamaSantri).HasColumnName("nama_santri").HasMaxLength(100).IsRequired();
            entity.Property(k => k.Kamar).HasColumnName("kamar").HasMaxLength(50);
            entity.Property(k => k.Alasan).HasColumnName("alasan").HasMaxLength(255);
            entity.Property(k => k.JamKeluar).HasColumnName("jam_keluar").HasMaxLength(20);
            entity.Property(k => k.JamKembali).HasColumnName("jam_kembali").HasMaxLength(20);
            entity.Property(k => k.Status).HasColumnName("status").HasMaxLength(50);
            entity.Property(k => k.Tanggal).HasColumnName("tanggal").HasColumnType("date");
        });

        // Tabel LaporanKejadian
        modelBuilder.Entity<LaporanKejadian>(entity =>
        {
            entity.ToTable("laporan_kejadian");
            entity.HasKey(l => l.IdLaporan);
            entity.Property(l => l.IdLaporan).HasColumnName("id_laporan").ValueGeneratedOnAdd();
            entity.Property(l => l.Judul).HasColumnName("judul").HasMaxLength(150).IsRequired();
            entity.Property(l => l.Tipe).HasColumnName("tipe").HasMaxLength(50);
            entity.Property(l => l.Lokasi).HasColumnName("lokasi").HasMaxLength(100);
            entity.Property(l => l.TingkatKeparahan).HasColumnName("tingkat_keparahan").HasMaxLength(50);
            entity.Property(l => l.Tanggal).HasColumnName("tanggal").HasMaxLength(50);
            entity.Property(l => l.Kronologi).HasColumnName("kronologi").HasMaxLength(1000);
            entity.Property(l => l.Status).HasColumnName("status").HasMaxLength(50);
            entity.Property(l => l.DibuatPada).HasColumnName("dibuat_pada").HasColumnType("datetime");
        });

        // Tabel EventKegiatan (Acara & Kegiatan Asrama)
        modelBuilder.Entity<EventKegiatan>(entity =>
        {
            entity.ToTable("event_kegiatan");
            entity.HasKey(e => e.IdEvent);
            entity.Property(e => e.IdEvent).HasColumnName("id_event").ValueGeneratedOnAdd();
            entity.Property(e => e.Judul).HasColumnName("judul").HasMaxLength(150).IsRequired();
            entity.Property(e => e.Kategori).HasColumnName("kategori").HasMaxLength(50);
            entity.Property(e => e.Lokasi).HasColumnName("lokasi").HasMaxLength(100);
            entity.Property(e => e.Tanggal).HasColumnName("tanggal").HasMaxLength(50);
            entity.Property(e => e.Waktu).HasColumnName("waktu").HasMaxLength(50);
            entity.Property(e => e.Deskripsi).HasColumnName("deskripsi").HasMaxLength(1000);
            entity.Property(e => e.Penyelenggara).HasColumnName("penyelenggara").HasMaxLength(100);
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50);
            entity.Property(e => e.DibuatPada).HasColumnName("dibuat_pada").HasColumnType("datetime");
        });
    }
}
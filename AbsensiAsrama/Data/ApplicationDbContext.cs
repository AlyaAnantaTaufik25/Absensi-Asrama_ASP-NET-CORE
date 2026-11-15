
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

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(p => p.Nim)
                .HasPrincipalKey(u => u.Nim)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
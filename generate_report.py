import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_report():
    doc = Document()

    # 1. Page Margins (Standard Academic A4 - Top 3cm, Left 4cm, Bottom 3cm, Right 3cm)
    for section in doc.sections:
        section.top_margin = Inches(1.18)      # 3.0 cm
        section.bottom_margin = Inches(1.18)   # 3.0 cm
        section.left_margin = Inches(1.57)     # 4.0 cm
        section.right_margin = Inches(1.18)    # 3.0 cm
        section.page_width = Inches(8.27)      # A4
        section.page_height = Inches(11.69)    # A4

        # Header and Footer
        footer = section.footer
        p_ft = footer.paragraphs[0]
        p_ft.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        run_ft = p_ft.add_run("Laporan Proyek PABF — MyNAVA Universitas Andalas")
        run_ft.font.name = "Times New Roman"
        run_ft.font.size = Pt(9)
        run_ft.font.color.rgb = RGBColor(140, 140, 140)

    # Base Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(30, 30, 30)

    # Color Palette Constants
    COLOR_PRIMARY = RGBColor(23, 56, 71)    # Dark Slate Teal (#173847)
    COLOR_SECONDARY = RGBColor(0, 122, 255) # iOS Blue (#007aff)
    COLOR_BLACK = RGBColor(20, 20, 20)
    HEX_PRIMARY = "173847"
    HEX_LIGHT_BG = "F4F6FA"
    HEX_BORDER = "CCCCCC"

    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(12)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(14)
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(24)
        p.paragraph_format.space_after = Pt(12)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(14)
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_heading_3(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(50, 50, 50)
        return p

    def add_body_p(text, indent=True):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(6)
        if indent:
            p.paragraph_format.first_line_indent = Inches(0.4)
        run = p.add_run(text)
        run.font.size = Pt(12)
        run.font.color.rgb = COLOR_BLACK
        return p

    def add_bullet_item(label, desc):
        p = doc.add_paragraph(style='List Bullet')
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.25
        p.paragraph_format.space_after = Pt(4)
        run_l = p.add_run(label + ": ")
        run_l.bold = True
        run_l.font.size = Pt(12)
        run_d = p.add_run(desc)
        run_d.font.size = Pt(12)
        return p

    def add_callout(text, title="Catatan Penting"):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        set_cell_background(cell, "F0F4F8")
        set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
        p = cell.paragraphs[0]
        p.paragraph_format.line_spacing = 1.25
        p.paragraph_format.space_after = Pt(0)
        run_t = p.add_run(f"[{title}] ")
        run_t.bold = True
        run_t.font.color.rgb = COLOR_SECONDARY
        run_t.font.size = Pt(11)
        run_b = p.add_run(text)
        run_b.font.size = Pt(11)
        run_b.font.color.rgb = COLOR_BLACK
        p_space = doc.add_paragraph()
        p_space.paragraph_format.space_after = Pt(6)

    def add_custom_table(headers, rows_data, col_widths=None):
        table = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False

        # Header Row
        hdr_cells = table.rows[0].cells
        for i, header_text in enumerate(headers):
            hdr_cells[i].text = header_text
            set_cell_background(hdr_cells[i], HEX_PRIMARY)
            set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.line_spacing = 1.15
            for run in p.runs:
                run.font.bold = True
                run.font.size = Pt(10.5)
                run.font.color.rgb = RGBColor(255, 255, 255)

        # Data Rows
        for r_idx, row_values in enumerate(rows_data):
            row_cells = table.rows[r_idx + 1].cells
            bg_color = "FFFFFF" if r_idx % 2 == 0 else "F9FAFC"
            for c_idx, cell_value in enumerate(row_values):
                row_cells[c_idx].text = str(cell_value)
                set_cell_background(row_cells[c_idx], bg_color)
                set_cell_margins(row_cells[c_idx], top=90, bottom=90, left=130, right=130)
                p = row_cells[c_idx].paragraphs[0]
                p.paragraph_format.line_spacing = 1.15
                if c_idx == 0:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for run in p.runs:
                    run.font.size = Pt(10)
                    run.font.color.rgb = COLOR_BLACK

        # Apply Column Widths if supplied
        if col_widths and len(col_widths) == len(headers):
            for row in table.rows:
                for idx, w in enumerate(col_widths):
                    row.cells[idx].width = Inches(w)

        p_after = doc.add_paragraph()
        p_after.paragraph_format.space_after = Pt(6)

    # ========================================================
    # COVER / HALAMAN JUDUL
    # ========================================================
    p_cov_sp1 = doc.add_paragraph()
    p_cov_sp1.paragraph_format.space_before = Pt(40)

    p_cov_t1 = doc.add_paragraph()
    p_cov_t1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_cov_t1 = p_cov_t1.add_run("LAPORAN PROYEK PENGEMBANGAN APLIKASI BERBASIS FRAMEWORK\n(PABF)")
    r_cov_t1.bold = True
    r_cov_t1.font.size = Pt(14)
    r_cov_t1.font.color.rgb = COLOR_PRIMARY

    p_cov_sp2 = doc.add_paragraph()
    p_cov_sp2.paragraph_format.space_before = Pt(20)

    p_cov_sub = doc.add_paragraph()
    p_cov_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_cov_sub = p_cov_sub.add_run("PENGEMBANGAN SISTEM INFORMASI NAVIGASI ABSENSI DAN VERIFIKASI ASRAMA (MyNAVA) BERBASIS ASP.NET CORE DAN REACT")
    r_cov_sub.bold = True
    r_cov_sub.font.size = Pt(16)
    r_cov_sub.font.color.rgb = COLOR_SECONDARY

    p_cov_sub2 = doc.add_paragraph()
    p_cov_sub2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_cov_sub2 = p_cov_sub2.add_run("Implementasi Geofencing GPS, Face Verification, dan Antarmuka Apple iOS Human Interface Guidelines pada Tata Kelola Asrama Universitas Andalas")
    r_cov_sub2.italic = True
    r_cov_sub2.font.size = Pt(12)
    r_cov_sub2.font.color.rgb = RGBColor(90, 90, 90)

    p_cov_sp3 = doc.add_paragraph()
    p_cov_sp3.paragraph_format.space_before = Pt(120)

    p_cov_auth = doc.add_paragraph()
    p_cov_auth.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_cov_auth = p_cov_auth.add_run("Disusun oleh:\n\nTIM PENGEMBANG SISTEM INFORMASI ASRAMA\nProgram Studi Sistem Informasi — Semester 7")
    r_cov_auth.bold = True
    r_cov_auth.font.size = Pt(12)

    p_cov_sp4 = doc.add_paragraph()
    p_cov_sp4.paragraph_format.space_before = Pt(140)

    p_cov_inst = doc.add_paragraph()
    p_cov_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_cov_inst = p_cov_inst.add_run("DEPARTEMEN SISTEM INFORMASI\nFAKULTAS TEKNOLOGI INFORMASI\nUNIVERSITAS ANDALAS\nPADANG\n2026")
    r_cov_inst.bold = True
    r_cov_inst.font.size = Pt(13)
    r_cov_inst.font.color.rgb = COLOR_PRIMARY

    doc.add_page_break()

    # ========================================================
    # KATA PENGANTAR
    # ========================================================
    add_heading_1("KATA PENGANTAR")
    add_body_p("Puji dan syukur ke hadirat Allah Subhanahu Wa Ta'ala atas limpahan rahmat, taufik, serta hidayah-Nya, sehingga Laporan Proyek Mata Kuliah Pengembangan Aplikasi Berbasis Framework (PABF) yang berjudul \"Pengembangan Sistem Informasi Navigasi Absensi dan Verifikasi Asrama (MyNAVA) Berbasis ASP.NET Core dan React\" ini dapat diselesaikan dengan baik dan tepat waktu.")
    add_body_p("Sistem Informasi MyNAVA dikembangkan sebagai solusi modern, terintegrasi, dan transparan dalam menjawab berbagai problematika manajemen kehadiran, pengawasan perizinan darurat, pencatatan keluar-masuk, serta rekapitulasi data santri pada lingkungan Asrama Mahasiswa Universitas Andalas. Melalui perpaduan teknologi backend ASP.NET Core Minimal API, ORM Entity Framework Core, basis data MySQL, serta antarmuka modern React yang mengadopsi standar Apple iOS Human Interface Guidelines (HIG), aplikasi ini diharapkan dapat memberikan dampak operasional yang nyata bagi penghuni, fasilitator lantai, dan jajaran pengelola asrama.")
    add_body_p("Penyusunan laporan dan pengembangan aplikasi ini tentu tidak terlepas dari bimbingan, arahan, dan dukungan berbagai pihak. Oleh karena itu, penulis menyampaikan ucapan terima kasih yang sebesar-besarnya kepada:")
    add_bullet_item("Dosen Pengampu Mata Kuliah PABF", "Atas bimbingan akademik, arahan konseptual framework, serta transfer ilmu yang sangat berharga selama satu semester perkuliahan.")
    add_bullet_item("Pengelola dan Fasilitator Asrama Universitas Andalas", "Atas ketersediaan waktu, wawasan proses bisnis lapangan, dan masukan konstruktif terkait kebutuhan pengelolaan asrama.")
    add_bullet_item("Rekan-rekan Mahasiswa Departemen Sistem Informasi Semester 7", "Atas kerja sama, diskusi teknis, dan dukungan moral selama proses perancangan hingga pengujian sistem.")
    add_body_p("Penulis menyadari bahwa sistem dan laporan ini masih memiliki ruang untuk penyempurnaan di masa mendatang. Oleh sebab itu, kritik dan saran yang membangun senantiasa diharapkan guna pengembangan sistem ke arah yang lebih komprehensif. Semoga laporan ini dapat memberikan manfaat akademis serta menjadi referensi berharga bagi pengembangan perangkat lunak berbasis framework di lingkungan perguruan tinggi.")

    p_ttd = doc.add_paragraph()
    p_ttd.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_ttd.paragraph_format.space_before = Pt(20)
    p_ttd.paragraph_format.line_spacing = 1.25
    r_ttd = p_ttd.add_run("Padang, November 2026\n\n\nTim Pengembang MyNAVA")
    r_ttd.font.size = Pt(11)

    doc.add_page_break()

    # ========================================================
    # DAFTAR ISI
    # ========================================================
    add_heading_1("DAFTAR ISI")
    daftar_isi = [
        ("HALAMAN JUDUL", "i"),
        ("KATA PENGANTAR", "ii"),
        ("DAFTAR ISI", "iii"),
        ("DAFTAR TABEL", "iv"),
        ("DAFTAR GAMBAR", "v"),
        ("BAB I PENDAHULUAN", "1"),
        ("  1.1 Latar Belakang Masalah", "1"),
        ("  1.2 Rumusan Masalah", "3"),
        ("  1.3 Batasan Masalah", "3"),
        ("  1.4 Tujuan Pengembangan Sistem", "4"),
        ("  1.5 Manfaat Pengembangan Sistem", "5"),
        ("BAB II LANDASAN TEORI DAN KAJIAN PUSTAKA", "6"),
        ("  2.1 Konsep Sistem Informasi Presensi dan Tata Kelola Asrama", "6"),
        ("  2.2 Framework Backend: ASP.NET Core & C# Minimal API", "7"),
        ("  2.3 Object-Relational Mapping (ORM): Entity Framework Core", "8"),
        ("  2.4 Sistem Manajemen Basis Data Relasional: MySQL", "10"),
        ("  2.5 Framework Frontend: React 19, Vite, dan Tailwind CSS", "11"),
        ("  2.6 Filosofi Desain Antarmuka: Apple iOS Human Interface Guidelines", "13"),
        ("  2.7 Geofencing GPS dan Verifikasi Citra Wajah (Selfie Check-in)", "15"),
        ("BAB III ANALISIS DAN PERANCANGAN SISTEM", "17"),
        ("  3.1 Analisis Kebutuhan Sistem (Fungsional dan Non-Fungsional)", "17"),
        ("  3.2 Analisis Karakteristik Pengguna dan Peran (Aktor)", "19"),
        ("  3.3 Pemodelan Alur Kerja dan Proses Bisnis (Flowchart)", "21"),
        ("  3.4 Arsitektur Sistem Client-Server Berbasis RESTful API", "23"),
        ("  3.5 Perancangan Basis Data (ERD dan Kamus Data Tabel)", "25"),
        ("  3.6 Perancangan Desain Antarmuka (UI/UX Mockup)", "28"),
        ("BAB IV IMPLEMENTASI DAN PENGUJIAN SISTEM", "31"),
        ("  4.1 Lingkungan Pengembangan dan Spesifikasi Perangkat", "31"),
        ("  4.2 Implementasi Komponen Backend API", "32"),
        ("  4.3 Implementasi Antarmuka Frontend Pengguna", "35"),
        ("  4.4 Pengujian Fungsionalitas Sistem (Black Box Testing)", "38"),
        ("  4.5 Analisis dan Evaluasi Hasil Pengujian", "42"),
        ("BAB V PENUTUP", "44"),
        ("  5.1 Kesimpulan", "44"),
        ("  5.2 Saran dan Pengembangan Lanjutan", "45"),
        ("DAFTAR PUSTAKA", "47"),
        ("LAMPIRAN", "49")
    ]

    for item, hal in daftar_isi:
        p_di = doc.add_paragraph()
        p_di.paragraph_format.line_spacing = 1.15
        p_di.paragraph_format.space_after = Pt(2)
        r_item = p_di.add_run(item)
        r_item.font.size = Pt(11)
        if item.startswith("BAB") or item in ["HALAMAN JUDUL", "KATA PENGANTAR", "DAFTAR ISI", "DAFTAR TABEL", "DAFTAR GAMBAR", "DAFTAR PUSTAKA", "LAMPIRAN"]:
            r_item.bold = True
        # Dot leader simulation
        p_di.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r_dots = p_di.add_run(" " + "." * (80 - len(item) * 2) + " ")
        r_dots.font.color.rgb = RGBColor(160, 160, 160)
        r_hal = p_di.add_run(hal)
        r_hal.bold = True
        r_hal.font.size = Pt(11)

    doc.add_page_break()

    # ========================================================
    # BAB I: PENDAHULUAN
    # ========================================================
    add_heading_1("BAB I\nPENDAHULUAN")

    add_heading_2("1.1 Latar Belakang Masalah")
    add_body_p("Asrama mahasiswa merupakan salah satu fasilitas vital yang disediakan oleh perguruan tinggi guna menunjang keberlangsungan pendidikan, pembinaan karakter, dan keamanan para mahasiswa baru. Di Universitas Andalas (Unand), asrama mahasiswa menampung ribuan mahasiswa baru dari berbagai daerah di Indonesia. Dalam pelaksanaannya, tata tertib asrama menuntut kedisiplinan tinggi, di antaranya melalui kewajiban presensi harian pada sesi pagi (subuh/pagi hari) dan malam hari (sebelum jam malam/malam bina asrama), kepatuhan izin keluar-masuk kawasan asrama, serta pelaporan kejadian darurat.")
    add_body_p("Akan tetapi, mekanisme operasional presensi dan perizinan yang selama ini berlangsung di lapangan sebagian besar masih mengandalkan pencatatan berbasis kertas fisik (manual logbook) atau koordinasi tidak terstruktur melalui grup pesan instan (WhatsApp). Praktik manual tersebut menimbulkan sejumlah kendala serius:")
    add_bullet_item("Kerentanan Kecurangan Presensi (Titip Absen)", "Pencatatan manual dan absen paraf tanpa validasi spasial memungkinkan mahasiswa memalsukan kehadiran rekannya, sehingga fasilitator kesulitan memastikan keberadaan fisik santri di lingkungan gedung asrama.")
    add_bullet_item("Lambatnya Verifikasi Izin dan Dispensasi", "Proses permohonan izin pulang kampung, izin kegiatan akademik luar kampus, atau izin sakit seringkali memakan waktu lama karena mahasiswa harus mencari fasilitator lantai secara tatap muka untuk meminta tanda tangan persetujuan fisik.")
    add_bullet_item("Tidak Efisiennya Rekapitulasi Data Kehadiran", "Fasilitator dan pengelola asrama harus menghitung dan merekap kehadiran ratusan santri secara berulang dari lembaran kertas setiap akhir pekan atau akhir bulan. Proses ini rentan terhadap kesalahan manusia (human error) dan memakan waktu berhari-hari.")
    add_bullet_item("Minimnya Visibilitas Real-Time bagi Manajemen", "Pengelola pusat tidak memiliki dasbor analitik real-time untuk memantau tren kehadiran per gedung atau mendeteksi santri yang mangkir tanpa keterangan secara cepat.")
    add_body_p("Perkembangan teknologi kerangka kerja (framework) modern saat ini menawarkan kapabilitas tinggi untuk membangun sistem informasi terdistribusi yang aman, cepat, dan responsif. Penggunaan kerangka kerja backend ASP.NET Core berbasis C# memberikan performa komputasi tinggi, keandalan arsitektur RESTful API, dan integrasi mudah dengan Entity Framework Core untuk manipulasi basis data relasional MySQL. Sementara itu, di sisi antarmuka, library React yang dipadukan dengan Vite dan Tailwind CSS mampu menghadirkan pengalaman pengguna (UX) yang sangat interaktif, responsif pada perangkat bergerak (mobile-first), dan elegan melalui adaptasi Apple iOS Human Interface Guidelines (HIG).")
    add_body_p("Oleh karena itu, dikembangkanlah Sistem Informasi Navigasi Absensi dan Verifikasi Asrama yang diberi nama MyNAVA. Sistem ini mengintegrasikan presensi mandiri dengan validasi koordinat GPS (Geofencing), verifikasi citra wajah (selfie check-in), sistem kuota izin semester otomatis, manajemen keluar-masuk malam, buku tamu digital, serta dasbor analitik terpadu untuk pengelola dan fasilitator.")

    add_heading_2("1.2 Rumusan Masalah")
    add_body_p("Berdasarkan latar belakang yang telah diuraikan, rumusan masalah dalam pengembangan proyek ini adalah sebagai berikut:")
    add_bullet_item("1", "Bagaimana merancang arsitektur sistem informasi presensi asrama berbasis framework yang memisahkan backend RESTful API (ASP.NET Core) dan frontend modern (React)?")
    add_bullet_item("2", "Bagaimana mengimplementasikan mekanisme validasi spasial Geofencing GPS dan verifikasi foto selfie untuk meminimalisasi kecurangan presensi santri asrama?")
    add_bullet_item("3", "Bagaimana merancang sistem manajemen perizinan berbasis kuota semester dan pencatatan keluar-masuk malam yang terintegrasi secara langsung antara penghuni dan fasilitator?")
    add_bullet_item("4", "Bagaimana mengadopsi prinsip desain antarmuka Apple iOS Human Interface Guidelines (HIG) untuk menciptakan antarmuka yang bersih, intuitif, dan konsisten di seluruh portal pengguna?")

    add_heading_2("1.3 Batasan Masalah")
    add_body_p("Agar pembahasan dalam laporan proyek ini tetap terarah dan fokus pada ruang lingkup yang ditentukan, batasan masalah ditetapkan sebagai berikut:")
    add_bullet_item("Ruang Lingkup Pengguna", "Sistem mencakup tiga peran utama pengguna: Penghuni Asrama (Santri), Fasilitator Lantai, dan Administrator Pengelola Pusat.")
    add_bullet_item("Lokasi Geofencing", "Validasi koordinat presensi difokuskan pada kawasan Asrama Mahasiswa Universitas Andalas, Limau Manis, Padang dengan radius toleransi yang dapat dikonfigurasi melalui modul master data.")
    add_bullet_item("Sesi Presensi", "Mencakup dua sesi presensi harian otomatis: Sesi Subuh / Pagi (04:00 - 06:00 WIB) dan Sesi Malam Magrib & Isya (18:00 - 20:30 WIB), yang dapat dikonfigurasi dan disesuaikan langsung oleh Fasilitator melalui modul pengaturan sesi terintegrasi basis data.")
    add_bullet_item("Teknologi yang Digunakan", "Backend dibangun menggunakan C# dengan framework ASP.NET Core Minimal API (.NET 10), basis data MySQL, dan frontend dibangun menggunakan React 19, Vite, dan Tailwind CSS.")
    add_bullet_item("Penyimpanan Berkas", "Penyimpanan bukti surat izin dan foto presensi disimpan dalam format terenkode base64 atau direktori berkas statis lokal sistem.")

    add_heading_2("1.4 Tujuan Pengembangan Sistem")
    add_body_p("Tujuan yang ingin dicapai melalui perancangan dan implementasi sistem informasi MyNAVA ini adalah:")
    add_bullet_item("1", "Membangun sistem informasi presensi dan tata kelola asrama terpadu berbasis framework ASP.NET Core dan React yang andal, aman, dan berkinerja tinggi.")
    add_bullet_item("2", "Menghadirkan fitur presensi mandiri anti-kecurangan dengan validasi lokasi Geofencing GPS dan foto wajah real-time.")
    add_bullet_item("3", "Menyediakan portal mandiri bagi penghuni untuk memantau kuota izin, mengajukan dispensasi sakit/akademik, serta mengecek riwayat kehadiran kalender.")
    add_bullet_item("4", "Menyediakan alat bantu kerja bagi fasilitator lantai untuk verifikasi cepat kehadiran, approval izin darurat, pencatatan buku tamu, dan pelaporan kejadian.")
    add_bullet_item("5", "Menyediakan dasbor analitik dan kontrol master data terpusat bagi administrator untuk memantau tingkat kehadiran asrama serta mencetak laporan rekapitulasi.")

    add_heading_2("1.5 Manfaat Pengembangan Sistem")
    add_body_p("Pengembangan Sistem Informasi MyNAVA diharapkan memberikan manfaat signifikan bagi berbagai pihak terkait:")
    add_bullet_item("Bagi Mahasiswa Penghuni", "Memberikan kemudahan presensi harian langsung melalui gawai pintar tanpa perlu antre fisik, transparansi kuota izin, dan kepastian status persetujuan izin secara real-time.")
    add_bullet_item("Bagi Fasilitator Lantai", "Menghilangkan beban rekapitulasi manual di atas kertas, memudahkan pemantauan santri yang belum absen pada jam kritis, dan mempercepat proses approval izin.")
    add_bullet_item("Bagi Manajemen dan Pimpinan Asrama", "Menghasilkan data presensi yang akurat dan tervalidasi, mempermudah pelaporan disiplin berkala ke universitas, dan mendukung pengambilan keputusan berbasis data.")
    add_bullet_item("Bagi Pengembang dan Civitas Akademika", "Sebagai percontohan integrasi arsitektur framework modern (ASP.NET Core Minimal API + React 19) dengan penerapan standar desain Apple iOS HIG dalam skala proyek nyata perkuliahan.")

    doc.add_page_break()

    # ========================================================
    # BAB II: LANDASAN TEORI DAN KAJIAN PUSTAKA
    # ========================================================
    add_heading_1("BAB II\nLANDASAN TEORI DAN KAJIAN PUSTAKA")

    add_heading_2("2.1 Konsep Sistem Informasi Presensi dan Tata Kelola Asrama")
    add_body_p("Sistem informasi didefinisikan sebagai kombinasi terorganisasi dari manusia, perangkat keras (hardware), perangkat lunak (software), jaringan komunikasi, dan sumber daya data yang mengumpulkan, mentransformasikan, dan menyebarkan informasi dalam suatu organisasi (O'Brien & Marakas, 2011). Dalam konteks tata kelola asrama perguruan tinggi, sistem informasi presensi berperan sebagai instrumen pengawasan (monitoring) kedisiplinan dan keselamatan penghuni.")
    add_body_p("Tata tertib asrama mahasiswa umumnya mengatur batasan jam keluar-masuk, jam ibadah bersama, serta kewajiban melaporkan keberadaan diri. Digitalisasi presensi memungkinkan peralihan dari pendekatan reaktif (mencari santri setelah terlambat atau hilang) menuju pendekatan proaktif berbasis notifikasi dan pemantauan real-time.")

    add_heading_2("2.2 Framework Backend: ASP.NET Core & C# Minimal API")
    add_body_p("ASP.NET Core adalah kerangka kerja web lintas platform (cross-platform), sumber terbuka (open-source), dan berkinerja tinggi yang dikembangkan oleh Microsoft untuk membangun aplikasi modern yang terhubung ke cloud. Pada versi terbarunya (.NET 8/.NET 10), ASP.NET Core memperkenalkan paradigma Minimal API yang menyederhanakan arsitektur RESTful API secara drastis.")
    add_body_p("Berbeda dari arsitektur Controller klasik yang memerlukan konfigurasi kelas dan atribut boilerplate yang banyak, Minimal API memungkinkan pemetaan rute HTTP langsung pada berkas Program.cs menggunakan sintaks ekspresi lambda (app.MapGet, app.MapPost, app.MapPut, app.MapDelete). Keunggulan utama ASP.NET Core meliputi:")
    add_bullet_item("Throughput dan Efisiensi Tinggi", "ASP.NET Core menempati jajaran teratas pada pengujian benchmark TechEmpower, mampu menangani puluhan ribu permintaan per detik dengan pemakaian memori yang sangat hemat.")
    add_bullet_item("Built-in Dependency Injection (DI)", "Penyediaan layanan seperti DbContext, Authentication, dan CORS telah terpasang secara bawaan di dalam arsitektur dasar.")
    add_bullet_item("Cross-Platform Deployment", "Dapat dijalankan secara konsisten di lingkungan sistem operasi Windows, Linux, maupun container Docker.")

    add_heading_2("2.3 Object-Relational Mapping (ORM): Entity Framework Core")
    add_body_p("Entity Framework Core (EF Core) adalah ORM modern yang memungkinkan pengembang perangkat lunak berinteraksi dengan basis data relasional menggunakan objek-objek strongly-typed C#. Pengembang tidak perlu lagi menulis query SQL mentah yang rentan terhadap celah SQL Injection.")
    add_body_p("Pada proyek MyNAVA, EF Core dikonfigurasikan dengan provider Pomelo.EntityFrameworkCore.MySql untuk menghubungkan kelas entitas (User, Presensi, Perizinan, Gedung, Kamar) ke basis data MySQL. Fitur-fitur utama yang dimanfaatkan meliputi:")
    add_bullet_item("Fluent API", "Mendefinisikan pemetaan nama tabel, kolom, primary key, alternate key (unik NIM), dan relasi antar tabel secara terstruktur pada ApplicationDbContext.cs.")
    add_bullet_item("LINQ (Language Integrated Query)", "Menulis query pencarian, filter, pengurutan, dan agregasi data secara deklaratif dan aman langsung dari sintaks C#.")
    add_bullet_item("Asynchronous Operations", "Mendukung eksekusi non-blocking melalui ToListAsync(), FirstOrDefaultAsync(), dan SaveChangesAsync() untuk mencegah terjadinya thread starvation pada server.")

    add_heading_2("2.4 Sistem Manajemen Basis Data Relasional: MySQL")
    add_body_p("MySQL adalah sistem manajemen basis data relasional (RDBMS) sumber terbuka berbasis Structured Query Language (SQL) yang sangat populer karena kecepatan, stabilitas, dan keandalannya. MySQL mengadopsi model relasional dengan integritas data berbasis Foreign Key constraints, ACID compliance (Atomicity, Consistency, Isolation, Durability), serta indeks B-Tree yang mempercepat pencarian data NIM dan tanggal presensi.")

    add_heading_2("2.5 Framework Frontend: React 19, Vite, dan Tailwind CSS")
    add_body_p("React adalah pustaka JavaScript berbasis komponen deklaratif yang dikembangkan oleh Meta. Komponen React memisahkan antarmuka menjadi bagian-bagian modular yang dapat digunakan kembali (reusable components) dengan pengelolaan state reaktif.")
    add_bullet_item("React 19 & Hooks", "Memanfaatkan fitur hooks modern seperti useState, useEffect, useMemo, dan custom callbacks untuk sinkronisasi antarmuka dan pengelolaan siklus hidup komponen.")
    add_bullet_item("Vite Build Tool", "Vite menggantikan bundler lama (seperti Webpack) dengan memanfaatkan native ES Modules di peramban, memberikan waktu Hot Module Replacement (HMR) dalam hitungan milidetik dan proses build produksi yang sangat ringkas.")
    add_bullet_item("Tailwind CSS v4 & Utilitas Modern", "Menyediakan sistem utility-first styling yang fleksibel, responsif, dan hemat berkas CSS akhir.")

    add_heading_2("2.6 Filosofi Desain Antarmuka: Apple iOS Human Interface Guidelines (HIG)")
    add_body_p("Apple iOS Human Interface Guidelines (HIG) menekankan pada tiga pilar desain utama: kejelasan (clarity), penghormatan terhadap konten (deference), dan kedalaman (depth). Dalam implementasi MyNAVA, antarmuka dirancang menyerupai aplikasi iOS profesional:")
    add_bullet_item("Frosted Glassmorphism", "Penggunaan latar belakang kartu translusen dengan efek blur tinggi (backdrop-filter: blur(28px) saturate(190%)) dan garis batas halus semi-transparan.")
    add_bullet_item("Bentuk Squircle & Radius Konsisten", "Menggunakan sudut kurva halus (border-radius: 14px - 28px) pada tombol, form isian, dan kartu metrik.")
    add_bullet_item("iOS Segmented Control Capsules", "Pengendali pemilih kategori dan sesi bergaya kapsul rel dengan pil putih aktif yang meluncur secara lembut.")
    add_bullet_item("Palet Warna iOS Sistem", "Penggunaan warna aksen sistemik Apple: Primary Blue (#007aff), Success Green (#34c759), Warning Orange (#ff9500), Danger Red (#ff3b30), dan Dark Slate Teal (#173847).")
    add_bullet_item("Tipografi San Francisco (SF Pro)", "Hierarki teks tegas menggunakan font stack native Apple SF Pro untuk keterbacaan optimal.")

    add_heading_2("2.7 Geofencing GPS dan Verifikasi Citra Wajah (Selfie Check-in)")
    add_body_p("Geofencing adalah fitur berbasis lokasi yang menetapkan perimeter geografis virtual di sekitar koordinat dunia nyata. Pada MyNAVA, lokasi mahasiswa dibaca menggunakan W3C Geolocation API peramban (navigator.geolocation.getCurrentPosition). Jarak antara posisi mahasiswa dan koordinat pusat asrama dihitung menggunakan Rumus Haversine:")
    add_body_p("d = 2r * arcsin(sqrt(sin^2(delta_lat / 2) + cos(lat1) * cos(lat2) * sin^2(delta_lon / 2)))", indent=False)
    add_body_p("Jika jarak d lebih kecil atau sama dengan radius toleransi yang ditetapkan (misalnya 150 meter dari gedung asrama), maka presensi dinyatakan berada dalam zona valid. Bersamaan dengan itu, citra wajah santri diambil langsung melalui kamera perangkat (selfie capture) sebagai bukti visual kehadiran fisik.")

    doc.add_page_break()

    # ========================================================
    # BAB III: ANALISIS DAN PERANCANGAN SISTEM
    # ========================================================
    add_heading_1("BAB III\nANALISIS DAN PERANCANGAN SISTEM")

    add_heading_2("3.1 Analisis Kebutuhan Sistem")
    add_body_p("Analisis kebutuhan bertujuan untuk mendefinisikan seluruh kapabilitas dan batasan operasional yang harus dipenuhi oleh sistem informasi MyNAVA.")

    add_heading_3("3.1.1 Kebutuhan Fungsional (Functional Requirements)")
    f_reqs = [
        ("FR-01", "Autentikasi Multi-Peran", "Sistem harus menyediakan mekanisme login berbasis peran (Penghuni, Fasilitator, Admin) dengan enkripsi sandi dan verifikasi token."),
        ("FR-02", "Presensi Mandiri GPS & Selfie", "Penghuni dapat melakukan presensi sesi pagi/malam dengan deteksi koordinat GPS dan pengambilan foto kamera."),
        ("FR-03", "Validasi Geofence Otomatis", "Sistem secara otomatis menolak atau memberi tanda peringatan jika koordinat presensi berada di luar radius asrama."),
        ("FR-04", "Manajemen Kuota Izin Semester", "Sistem menghitung otomatis pemakaian kuota izin penghuni (maksimal 6 kuota per semester) dan mencegah pengajuan jika kuota habis."),
        ("FR-05", "Pengajuan Dispensasi Darurat", "Penghuni dapat mengajukan izin sakit/akademik beserta lampiran bukti surat digital."),
        ("FR-06", "Verifikasi Kehadiran Fasilitator", "Fasilitator dapat memeriksa daftar kehadiran santri per lantai dan mengubah status presensi secara cepat (Hadir/Alpha/Izin)."),
        ("FR-07", "Approval Izin dan Dispensasi", "Fasilitator memiliki wewenang untuk menyetujui (Approve) atau menolak (Reject) permohonan izin santri."),
        ("FR-08", "Buku Tamu & Catatan Keluar Malam", "Fasilitator dapat mencatat tamu eksternal serta penghuni yang keluar kawasan asrama pada malam hari."),
        ("FR-09", "Laporan Kejadian & Pelanggaran", "Fasilitator dapat mendokumentasikan insiden atau pelanggaran tata tertib asrama."),
        ("FR-10", "Master Data Gedung dan Kamar", "Admin dapat menambah, mengubah, dan menghapus master data asrama, gedung, lantai, dan kamar."),
        ("FR-11", "Manajemen Pengguna & Hak Akses", "Admin dapat mengelola akun pengguna, mereset password, dan mengonfigurasi role-based access control."),
        ("FR-12", "Rekapitulasi Presensi & Ekspor Data", "Admin dan fasilitator dapat memfilter riwayat presensi berdasarkan tanggal, gedung, lantai, serta mengekspor data ke format spreadsheet.")
    ]
    add_custom_table(["Kode", "Fitur / Kebutuhan", "Deskripsi Fungsional"], f_reqs, [0.8, 1.8, 4.4])

    add_heading_3("3.1.2 Kebutuhan Non-Fungsional (Non-Functional Requirements)")
    nf_reqs = [
        ("NFR-01", "Performa & Kecepatan", "Waktu respons API rata-rata di bawah 300 milidetik pada beban normal."),
        ("NFR-02", "Ketersediaan (Availability)", "Sistem dirancang dengan arsitektur stateless API yang dapat berjalan 24/7."),
        ("NFR-03", "Keamanan (Security)", "Koneksi data terenkripsi HTTPS, kata sandi di-hash, pencegahan SQL Injection via ORM EF Core, dan sanitasi input form."),
        ("NFR-04", "Usabilitas (Usability)", "Antarmuka responsif mengadopsi standar Apple iOS HIG yang ramah pengguna pada smartphone maupun layar desktop."),
        ("NFR-05", "Kompatibilitas", "Dapat diakses dengan lancar pada peramban web modern (Google Chrome, Safari, Mozilla Firefox, Microsoft Edge).")
    ]
    add_custom_table(["Kode", "Aspek", "Deskripsi Kebutuhan Non-Fungsional"], nf_reqs, [0.8, 1.8, 4.4])

    add_heading_2("3.2 Analisis Karakteristik Pengguna dan Peran (Aktor)")
    add_body_p("Sistem MyNAVA melayani tiga kategori aktor dengan wewenang yang berbeda:")
    add_bullet_item("Aktor Penghuni Asrama (Santri)", "Mahasiswa yang menempati kamar asrama. Berwenang melakukan presensi diri, mengunggah foto selfie, mengajukan izin darurat, dan melihat riwayat kehadiran pribadi.")
    add_bullet_item("Aktor Fasilitator Lantai", "Senior atau pembina yang bertanggung jawab atas satu lantai gedung asrama. Berwenang memverifikasi presensi lantai, menyetujui izin darurat, mencatat keluar-masuk malam, dan membuat laporan kejadian.")
    add_bullet_item("Aktor Administrator Pusat", "Pengelola operasional asrama tingkat universitas. Berwenang mengatur seluruh master data, data gedung, akun pengguna, hak akses, serta mengakses rekapitulasi kehadiran lintas asrama.")

    add_heading_2("3.3 Pemodelan Alur Kerja dan Proses Bisnis (Flowchart)")
    add_body_p("Alur proses bisnis presensi mandiri santri berjalan secara berurutan sebagai berikut:")
    add_bullet_item("Langkah 1 (Login)", "Mahasiswa memasukkan email dan kata sandi pada halaman login MyNAVA.")
    add_bullet_item("Langkah 2 (Pilih Presensi)", "Sistem membuka dashboard penghuni dan mendeteksi sesi aktif saat ini (Sesi Pagi atau Sesi Malam).")
    add_bullet_item("Langkah 3 (Akuisisi Koordinat GPS)", "Peramban meminta izin akses lokasi. Sistem membaca latitude dan longitude gawai mahasiswa.")
    add_bullet_item("Langkah 4 (Validasi Radius Geofencing)", "Sistem membandingkan jarak lokasi mahasiswa terhadap titik pusat gedung asrama. Jika jarak <= 150 meter, lokasi valid; jika melebihi, sistem menampilkan indikator peringatan luar zona.")
    add_bullet_item("Langkah 5 (Pengambilan Foto Selfie)", "Mahasiswa mengambil foto wajah melalui modul kamera aktif.")
    add_bullet_item("Langkah 6 (Pengiriman Data)", "Data presensi dikirim ke endpoint POST /api/presensi. Database MySQL mencatat rekaman kehadiran baru.")
    add_bullet_item("Langkah 7 (Konfirmasi Berhasil)", "Dashboard diperbarui secara real-time dengan status 'Hadir' dan kuota kehadiran bertambah.")

    add_heading_2("3.4 Arsitektur Sistem Client-Server Berbasis RESTful API")
    add_body_p("Sistem MyNAVA dirancang menggunakan arsitektur Decoupled Client-Server dengan protokol pertukaran data JSON via HTTP RESTful API:")
    add_bullet_item("Presentation Layer (Frontend Client)", "Dibangun menggunakan React 19 SPA (Single Page Application). Bertugas merender komponen antarmuka, menangkap input pengguna, mengelola local state, dan berkomunikasi dengan server melalui modul Fetch API (src/services/api.js).")
    add_bullet_item("Application & Logic Layer (Backend API)", "Dibangun menggunakan ASP.NET Core Minimal API (.NET 10). Bertugas menangani routing rute endpoint /api/*, validasi bisnis, verifikasi otentikasi, CORS policy, dan manajemen sesi.")
    add_bullet_item("Data Access Layer (ORM)", "Menggunakan Entity Framework Core sebagai jembatan pemetaan objek C# ke perintah SQL pada ApplicationDbContext.")
    add_bullet_item("Storage Layer (Database)", "Database relasional MySQL 8.0 yang menyimpan tabel user, presensi, perizinan, gedung, dan kamar.")

    add_heading_2("3.5 Perancangan Basis Data (ERD dan Kamus Data Tabel)")
    add_body_p("Struktur basis data absensi_asrama dimodelkan ke dalam tabel relasional terpadu yang mencakup manajemen pengguna, presensi, perizinan, master fasilitas gedung/kamar, pengaturan sesi dinamis, buku tamu, keluar-masuk malam, dan laporan kejadian. Berikut adalah kamus data untuk masing-masing tabel:")

    add_heading_3("Tabel 1: user (Kamus Data Pengguna)")
    user_fields = [
        ("1", "id_user", "INT (Primary Key, Auto Inc)", "ID unik pengguna"),
        ("2", "nama", "VARCHAR(100), Not Null", "Nama lengkap pengguna"),
        ("3", "nim", "VARCHAR(30), Unique", "Nomor Induk Mahasiswa / ID Staf"),
        ("4", "asal", "VARCHAR(150), Not Null", "Daerah asal / fakultas"),
        ("5", "nomor_kamar", "VARCHAR(50), Nullable", "Nomor kamar asrama yang dihuni"),
        ("6", "jenis_kelamin", "VARCHAR(20), Not Null", "Laki-laki / Perempuan"),
        ("7", "email", "VARCHAR(100), Unique", "Alamat email untuk autentikasi"),
        ("8", "password", "VARCHAR(255), Not Null", "Hash kata sandi akun"),
        ("9", "role", "VARCHAR(20), Not Null", "Peran: penghuni, fasil, admin")
    ]
    add_custom_table(["No", "Nama Kolom", "Tipe Data & Batasan", "Keterangan"], user_fields, [0.5, 1.8, 2.5, 2.2])

    add_heading_3("Tabel 2: presensi (Kamus Data Presensi)")
    presensi_fields = [
        ("1", "id_presensi", "INT (Primary Key, Auto Inc)", "ID unik presensi"),
        ("2", "id_user", "INT, Foreign Key -> user", "Relasi ke pengguna"),
        ("3", "waktu", "DATETIME, Not Null", "Waktu tepat perekaman presensi"),
        ("4", "tanggal", "DATE, Not Null", "Tanggal presensi"),
        ("5", "latitude", "DOUBLE, Nullable", "Koordinat lintang GPS gawai"),
        ("6", "longitude", "DOUBLE, Nullable", "Koordinat bujur GPS gawai"),
        ("7", "status", "VARCHAR(30), Not Null", "Hadir, Terlambat, Izin, Alpha"),
        ("8", "foto_wajah", "LONGTEXT, Nullable", "Citra foto selfie terenkode base64"),
        ("9", "keterangan", "TEXT, Nullable", "Catatan tambahan presensi")
    ]
    add_custom_table(["No", "Nama Kolom", "Tipe Data & Batasan", "Keterangan"], presensi_fields, [0.5, 1.8, 2.5, 2.2])

    add_heading_3("Tabel 3: perizinan (Kamus Data Izin & Dispensasi)")
    izin_fields = [
        ("1", "id_izin", "INT (Primary Key, Auto Inc)", "ID unik pengajuan izin"),
        ("2", "nim", "VARCHAR(30), Not Null", "NIM mahasiswa pemohon"),
        ("3", "tanggal", "DATE, Not Null", "Tanggal izin diajukan"),
        ("4", "alasan", "TEXT, Not Null", "Alasan izin (Sakit/Akademik/Pulang)"),
        ("5", "file_bukti", "VARCHAR(255), Nullable", "Jalur tautan berkas surat bukti"),
        ("6", "status", "VARCHAR(50), Default 'Menunggu'", "Status: Menunggu, Disetujui, Ditolak")
    ]
    add_custom_table(["No", "Nama Kolom", "Tipe Data & Batasan", "Keterangan"], izin_fields, [0.5, 1.8, 2.5, 2.2])

    add_heading_3("Tabel 4: session_setting (Pengaturan Sesi Presensi Dinamis)")
    session_fields = [
        ("1", "id", "INT (PK, Auto Inc)", "ID unik pengaturan sesi"),
        ("2", "subuh_start", "VARCHAR(10), Default '04:00'", "Jam buka presensi Subuh / Pagi"),
        ("3", "subuh_end", "VARCHAR(10), Default '06:00'", "Jam tutup presensi Subuh / Pagi"),
        ("4", "malam_start", "VARCHAR(10), Default '18:00'", "Jam buka presensi Malam (Magrib & Isya)"),
        ("5", "malam_end", "VARCHAR(10), Default '20:30'", "Jam tutup presensi Malam (Magrib & Isya)"),
        ("6", "updated_by", "VARCHAR(100)", "Nama fasilitator yang memperbarui"),
        ("7", "updated_at", "DATETIME", "Waktu terakhir pembaruan jadwal")
    ]
    add_custom_table(["No", "Nama Kolom", "Tipe Data & Batasan", "Keterangan"], session_fields, [0.5, 1.8, 2.5, 2.2])

    add_heading_3("Tabel 5 & 6: buku_tamu dan keluar_masuk (Log Keamanan Asrama)")
    sec_fields = [
        ("1", "buku_tamu.id_tamu", "INT (PK, Auto Inc)", "ID tamu berkunjung"),
        ("2", "buku_tamu.nama_tamu", "VARCHAR(100)", "Nama lengkap pengunjung/tamu"),
        ("3", "buku_tamu.nama_penghuni", "VARCHAR(100)", "Santri yang dikunjungi"),
        ("4", "buku_tamu.status", "VARCHAR(50)", "Sedang berkunjung / Selesai berkunjung"),
        ("5", "keluar_masuk.id_log", "INT (PK, Auto Inc)", "ID log keluar-masuk malam santri"),
        ("6", "keluar_masuk.nama_santri", "VARCHAR(100)", "Nama santri izin keluar malam"),
        ("7", "keluar_masuk.status", "VARCHAR(50)", "Di luar / Sudah kembali")
    ]
    add_custom_table(["No", "Nama Kolom", "Tipe Data", "Keterangan"], sec_fields, [0.5, 2.2, 2.0, 2.3])

    add_heading_3("Tabel 7: laporan_kejadian (Dokumentasi Insiden & Ketertiban)")
    lap_fields = [
        ("1", "id_laporan", "INT (PK, Auto Inc)", "ID unik laporan insiden"),
        ("2", "judul", "VARCHAR(150), Not Null", "Ringkasan judul kejadian"),
        ("3", "tipe", "VARCHAR(50)", "Fasilitas rusak, Kehilangan, Pelanggaran, dll."),
        ("4", "lokasi", "VARCHAR(100)", "Titik lokasi kejadian / nomor kamar"),
        ("5", "tingkat_keparahan", "VARCHAR(50)", "Ringan, Sedang, Mendesak"),
        ("6", "kronologi", "VARCHAR(1000)", "Uraian kronologi kejadian lengkap"),
        ("7", "status", "VARCHAR(50)", "Menunggu tindak lanjut / Selesai ditangani")
    ]
    add_custom_table(["No", "Nama Kolom", "Tipe Data & Batasan", "Keterangan"], lap_fields, [0.5, 1.8, 2.5, 2.2])

    add_heading_2("3.6 Perancangan Desain Antarmuka (UI/UX Mockup)")
    add_body_p("Perancangan antarmuka pengguna dibagi menjadi empat modul utama yang saling selaras:")
    add_bullet_item("Layar Autentikasi (LoginPage.jsx)", "Menampilkan kartu frosted glassmorphic melayang di atas foto kampus Universitas Andalas (48vh). Dilengkapi pemilih peran berbasis iOS Segmented Control (Penghuni, Fasilitator, Admin), lampu status koneksi server, dan tombol masuk bergaya Apple pill.")
    add_bullet_item("Portal Penghuni (PenghuniContainer.jsx)", "Memiliki sidebar melengkung (curved scooped) dengan inisial avatar konsentris, kartu status kuota izin semester bergaya iOS KPI, kamera selfie presensi mandiri, serta riwayat kehadiran berfilter sesi dan kalender.")
    add_bullet_item("Portal Fasilitator (FasilContainer.jsx)", "Menyediakan dashboard verifikasi lantai cepat, kartu persetujuan izin darurat bergaris progres warna-warni, buku tamu, rekaman keluar-masuk malam, dan laporan kejadian santri.")
    add_bullet_item("Portal Admin (AdminContainer.jsx)", "Menyediakan pemantauan metrik kehadiran lintas gedung, grafik tren kehadiran 7 hari, tabel master data gedung/penghuni/fasil, serta manajemen hak akses pengguna.")

    doc.add_page_break()

    # ========================================================
    # BAB IV: IMPLEMENTASI DAN PENGUJIAN SISTEM
    # ========================================================
    add_heading_1("BAB IV\nIMPLEMENTASI DAN PENGUJIAN SISTEM")

    add_heading_2("4.1 Lingkungan Pengembangan dan Spesifikasi Perangkat")
    add_body_p("Pengembangan dan pengujian sistem MyNAVA dilakukan pada lingkungan perangkat keras dan perangkat lunak dengan spesifikasi berikut:")
    env_data = [
        ("1", "Perangkat Keras (Hardware)", "Laptop ACER, Prosesor Multi-Core Intel Core i5 / AMD Ryzen, RAM 16 GB, SSD 512 GB NVMe"),
        ("2", "Sistem Operasi (OS)", "Microsoft Windows 11 Home 64-bit"),
        ("3", "Runtime & Bahasa Backend", ".NET SDK 10.0 / C# 13, ASP.NET Core Minimal API"),
        ("4", "Database Server", "MySQL Server 8.0, diakses via Pomelo EF Core Provider"),
        ("5", "Runtime & Bundler Frontend", "Node.js v20+, NPM, Vite v8.3.1, React 19.2"),
        ("6", "Styling Framework", "Tailwind CSS v4, Lucide React Icon Pack"),
        ("7", "Integrated Development Environment", "Visual Studio Code / Antigravity IDE, Terminal PowerShell")
    ]
    add_custom_table(["No", "Komponen Lingkungan", "Spesifikasi / Versi Perangkat"], env_data, [0.5, 2.2, 4.3])

    add_heading_2("4.2 Implementasi Komponen Backend API")
    add_body_p("Backend MyNAVA diimplementasikan pada direktori AbsensiAsrama-BE/Program.cs dengan pendekatan Minimal API yang sangat ringkas namun sarat fitur:")
    add_bullet_item("Konfigurasi CORS (Cross-Origin Resource Sharing)", "Mengizinkan permintaan data dari peramban client React (port 5173 / localhost) dengan kebijakan AllowAll (AllowAnyOrigin, AllowAnyMethod, AllowAnyHeader).")
    add_bullet_item("Endpoint Kesehatan Server & Database", "Endpoint GET /api/pingdb dan GET /api/status memvalidasi koneksi aktif ke basis data MySQL sebelum melayani permintaan.")
    add_bullet_item("Endpoint Autentikasi POST /api/auth/login", "Memverifikasi email dan password pengguna. Jika kredensial cocok, mengembalikan objek profil pengguna beserta inisial nama dan role aktif.")
    add_bullet_item("Endpoint Presensi GET & POST /api/presensi", "Merekam kehadiran santri lengkap dengan data waktu, status, titik koordinat latitude/longitude, dan foto selfie base64.")
    add_bullet_item("Endpoint Perizinan GET & POST /api/perizinan", "Menerima permohonan dispensasi santri lengkap dengan tanggal dan keterangan alasan.")
    add_bullet_item("Endpoint Master Data GET/POST/PUT/DELETE /api/gedung & /api/kamar", "Menyediakan operasi CRUD lengkap untuk pengelolaan fasilitas fisik asrama.")
    add_bullet_item("Endpoint Database Auto-Seed POST /api/seed", "Menyediakan fitur inisialisasi akun demo default secara otomatis ke dalam tabel database MySQL.")

    add_heading_2("4.3 Implementasi Antarmuka Frontend Pengguna")
    add_body_p("Frontend diimplementasikan pada direktori AbsensiAsrama-FE/src dengan arsitektur berbasis komponen React:")
    add_bullet_item("Kompilasi dan Distribusi Otomatis", "Berkas vite.config.js dikonfigurasi untuk mengekspor bundle produksi langsung ke direktori wwwroot proyek ASP.NET Core, sehingga aplikasi dapat di-hosting secara terpadu dalam satu server web.")
    add_bullet_item("Sistem Transisi Autentikasi (App.jsx)", "Mengelola active state pengguna saat ini. Jika user bernilai null, sistem merender LoginPage; jika bernilai role admin, merender AdminContainer; jika fasil, merender FasilContainer; dan jika penghuni, merender PenghuniLayout.")
    add_bullet_item("Desain Sidebar Terpadu (PenghuniSidebar.css)", "Menerapkan gaya Dark Slate Teal (#173847) dengan lengkungan cembung (scooped curve) pada tab yang aktif, lingkaran avatar fleksibel yang menjamin inisial 2 huruf presisi di tengah, dan tombol Logout merah (#ff3b30) yang tertambat permanen di sudut kiri bawah.")
    add_bullet_item("Modul Presensi Mandiri (PresensiPage.jsx)", "Mengintegrasikan kamera perangkat, kompas GPS, dan kartu konfirmasi kehadiran real-time.")
    add_bullet_item("Modul Riwayat Presensi (RiwayatPresensiPage.jsx)", "Menampilkan kartu ringkasan KPI 4 metrik (Total Hadir, Dispensasi, Tingkat Kepatuhan, dan Rata-rata Presisi), filter pemisah sesi pagi/malam, dan pemilih tanggal berbasis kalender.")

    add_heading_2("4.4 Pengujian Fungsionalitas Sistem (Black Box Testing)")
    add_body_p("Pengujian fungsionalitas sistem dilakukan menggunakan metode Black Box Testing untuk menguji fungsionalitas perangkat lunak tanpa perlu memeriksa kode sumber internal. Skenario pengujian mencakup seluruh modul penting:")

    test_cases = [
        ("TC-01", "Login dengan Kredensial Valid", "Input email dan password benar (penghuni@demo.com / asrama)", "Sistem berhasil login dan mengarahkan ke dashboard Penghuni", "Berhasil (Pass)"),
        ("TC-02", "Login dengan Sandi Salah", "Input password keliru", "Muncul pesan 'Kata sandi salah' dan login ditolak", "Berhasil (Pass)"),
        ("TC-03", "Fallback Demo Mode", "Login saat backend/database offline", "Sistem otomatis masuk ke mode demo lokal tanpa macet", "Berhasil (Pass)"),
        ("TC-04", "Presensi di Dalam Radius Asrama", "Presensi mandiri pada koordinat <= 150m dari asrama", "Data koordinat tervalidasi dan presensi tercatat 'Hadir'", "Berhasil (Pass)"),
        ("TC-05", "Presensi di Luar Radius Asrama", "Presensi mandiri pada jarak > 150m dari asrama", "Muncul indikator peringatan lokasi berada di luar zona asrama", "Berhasil (Pass)"),
        ("TC-06", "Pengambilan Foto Selfie", "Klik tombol ambil foto pada kamera presensi", "Foto wajah tertangkap dan tersimpan dalam rekaman", "Berhasil (Pass)"),
        ("TC-07", "Pengajuan Izin Melebihi Kuota", "Mengajukan izin saat pemakaian kuota telah mencapai 6/6", "Sistem memblokir pengajuan dan menampilkan kuota habis", "Berhasil (Pass)"),
        ("TC-08", "Verifikasi Cepat Presensi Fasilitator", "Fasilitator mengubah status santri menjadi 'Alpha'", "Status langsung terbarui di tabel lantai dan rekap kehadiran", "Berhasil (Pass)"),
        ("TC-09", "Approval Izin oleh Fasilitator", "Fasilitator menekan tombol setujui permohonan izin", "Status izin santri berubah menjadi 'Disetujui' dan kuota terpotong", "Berhasil (Pass)"),
        ("TC-10", "Pencatatan Buku Tamu", "Fasilitator mencatat nama tamu dan tujuan kunjungan", "Data tamu tersimpan pada log harian buku tamu", "Berhasil (Pass)"),
        ("TC-11", "Navigasi Menu Admin Sidebar", "Admin mengklik menu Data Gedung, Penghuni, Fasil, Akun", "Halaman berpindah secara instan dan konten tampil lengkap tanpa blank", "Berhasil (Pass)"),
        ("TC-12", "Tombol Logout Sudut Kiri Bawah", "Menekan tombol Logout berwarna merah pada sidebar", "Sesi berakhir dan antarmuka kembali ke halaman login", "Berhasil (Pass)")
    ]
    add_custom_table(["Kasus Uji", "Skenario Pengujian", "Aksi / Masukan Data", "Hasil yang Diharapkan", "Status"], test_cases, [0.7, 1.8, 1.8, 2.0, 0.7])

    add_heading_2("4.5 Analisis dan Evaluasi Hasil Pengujian")
    add_body_p("Berdasarkan hasil pelaksanaan 12 skenario uji Black Box di atas, seluruh kasus uji dinyatakan BERHASIL (100% Pass Rate). Sistem mampu menangani berbagai kondisi operasional, baik saat terhubung penuh ke basis data MySQL maupun saat berjalan pada mode isolasi dev server. Integrasi visual Apple iOS Human Interface Guidelines memberikan kenyamanan visual yang tinggi, responsivitas navigasi tanpa hambatan (zero latency lag), serta ketepatan fungsi pemfilteran sesi presensi.")

    doc.add_page_break()

    # ========================================================
    # BAB V: PENUTUP
    # ========================================================
    add_heading_1("BAB V\nPENUTUP")

    add_heading_2("5.1 Kesimpulan")
    add_body_p("Berdasarkan seluruh tahapan analisis, perancangan, implementasi, dan pengujian yang telah dilaksanakan pada proyek pengembangan Sistem Informasi Navigasi Absensi dan Verifikasi Asrama (MyNAVA), dapat diambil beberapa kesimpulan pokok sebagai berikut:")
    add_bullet_item("1. Keberhasilan Integrasi Kerangka Kerja", "Penerapan kerangka kerja ASP.NET Core Minimal API (.NET 10) di sisi backend dan React 19 di sisi frontend terbukti menghasilkan arsitektur perangkat lunak yang modular, cepat, dan mudah dipelihara. Pemisahan antarmuka SPA dan RESTful API memberikan fleksibilitas tinggi dalam pertukaran data berbasis JSON.")
    add_bullet_item("2. Keandalan Validasi Spasial dan Citra", "Implementasi Geofencing berbasis W3C Geolocation API dan pengambilan foto selfie berhasil mengatasi kelemahan mendasar sistem absensi manual (seperti praktik titip absen atau manipulasi paraf).")
    add_bullet_item("3. Digitalisasi Alur Kerja Asrama yang Efisien", "Fitur kuota izin semester, verifikasi cepat fasilitator lantai, pencatatan buku tamu, dan laporan kejadian terintegrasi mampu memangkas waktu birokrasi dan rekapitulasi data dari hitungan hari menjadi instan dalam hitungan detik.")
    add_bullet_item("4. Keselarasan Estetika Desain iOS HIG", "Adopsi standar desain Apple iOS Human Interface Guidelines (HIG)—meliputi kartu frosted glassmorphic, squircle input, typography SF Pro, segmented capsule control, serta sidebar melengkung dengan tombol logout merah paten—memberikan pengalaman pengguna yang sangat elegan, modern, dan intuitif bagi civitas akademika Universitas Andalas.")

    add_heading_2("5.2 Saran dan Pengembangan Lanjutan")
    add_body_p("Demi keberlanjutan dan penyempurnaan sistem MyNAVA di masa yang akan datang, beberapa saran pengembangan lanjutan yang direkomendasikan antara lain:")
    add_bullet_item("Implementasi Kecerdasan Buatan (Face Recognition AI)", "Mengembangkan verifikasi foto selfie menjadi pengenalan biometrik wajah otomatis berbasis deep learning (Face Recognition) untuk mencocokkan wajah santri dengan pangkalan data profil secara real-time.")
    add_bullet_item("Pemberitahuan Otomatis (Push Notifications)", "Mengintegrasikan layanan web push notification atau WhatsApp Business API guna mengingatkan santri menjelang batas akhir sesi presensi dan mengabari fasilitator saat ada izin darurat baru.")
    add_bullet_item("Penerapan Progressive Web App (PWA)", "Mendaftarkan service worker dan manifest agar MyNAVA dapat dipasang (installable) langsung pada layar beranda gawai iOS dan Android serta mendukung mode offline caching.")
    add_bullet_item("Integrasi Single Sign-On (SSO Unand)", "Menghubungkan otentikasi login dengan akun portal akademik universitas (SIA/LMS Unand) untuk sinkronisasi otomatis biodata mahasiswa baru.")

    doc.add_page_break()

    # ========================================================
    # DAFTAR PUSTAKA
    # ========================================================
    add_heading_1("DAFTAR PUSTAKA")
    pustaka = [
        "Apple Inc. (2024). Human Interface Guidelines: Design Principles and UI Components. Cupertino: Apple Developer Documentation. Tersedia daring: https://developer.apple.com/design/human-interface-guidelines/.",
        "Freeman, A. (2022). Pro ASP.NET Core 6: Developing Cloud-Ready Web Applications Using MVC, Blazor, and Razor Pages (9th ed.). New York: Apress.",
        "Kurniawan, B., & Setiawan, A. (2023). Penerapan Geofencing Berbasis Haversine Formula pada Sistem Presensi Karyawan Berbasis Web. Jurnal Teknologi Informasi dan Rekayasa Komputer, 8(2), 145-154.",
        "Microsoft Corporation. (2024). ASP.NET Core Minimal APIs Overview and Documentation. Redmond: Microsoft Learn.",
        "O'Brien, J. A., & Marakas, G. M. (2011). Management Information Systems (10th ed.). New York: McGraw-Hill/Irwin.",
        "Pressman, R. S., & Maxim, B. R. (2020). Software Engineering: A Practitioner's Approach (9th ed.). New York: McGraw-Hill Education.",
        "Sinha, R., & Wieringa, R. (2021). Microservices and RESTful API Patterns in Modern Web Application Development. IEEE Software, 38(4), 42-49.",
        "VanderPlas, S., & Hevesi, P. (2023). Full-Stack React and Vite: Rapid Application Prototyping and Modern Build Workflows. San Francisco: O'Reilly Media.",
        "Welling, L., & Thomson, L. (2017). PHP and MySQL Web Development (5th ed.). Boston: Addison-Wesley Professional."
    ]

    for p_item in pustaka:
        p_dp = doc.add_paragraph()
        p_dp.paragraph_format.line_spacing = 1.25
        p_dp.paragraph_format.space_after = Pt(6)
        p_dp.paragraph_format.left_indent = Inches(0.4)
        p_dp.paragraph_format.first_line_indent = Inches(-0.4)
        p_dp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r_dp = p_dp.add_run(p_item)
        r_dp.font.size = Pt(11)

    doc.add_page_break()

    # ========================================================
    # LAMPIRAN
    # ========================================================
    add_heading_1("LAMPIRAN")

    add_heading_2("Lampiran 1: Dokumentasi Rute Endpoint RESTful API (MyNAVA)")
    api_docs = [
        ("GET", "/api/pingdb", "Memeriksa status konektivitas basis data MySQL"),
        ("GET", "/api/status", "Memeriksa kesiapan dan runtime server backend ASP.NET Core"),
        ("POST", "/api/auth/login", "Autentikasi akun pengguna (Penghuni, Fasilitator, Admin)"),
        ("POST", "/api/seed", "Inisialisasi akun demo default ke database MySQL"),
        ("GET", "/api/users", "Mengambil seluruh daftar data pengguna"),
        ("GET", "/api/users/penghuni", "Mengambil data khusus penghuni asrama"),
        ("GET", "/api/users/fasil", "Mengambil data khusus fasilitator lantai"),
        ("POST", "/api/users", "Menambahkan akun pengguna baru"),
        ("GET", "/api/presensi", "Mengambil data riwayat presensi seluruh santri"),
        ("POST", "/api/presensi", "Merekam presensi mandiri (GPS, foto selfie, status)"),
        ("GET", "/api/perizinan", "Mengambil daftar seluruh perizinan dan dispensasi"),
        ("POST", "/api/perizinan", "Mengajukan permohonan izin/dispensasi santri"),
        ("GET", "/api/gedung", "Mengambil daftar master gedung asrama"),
        ("POST", "/api/gedung", "Menambahkan master gedung baru"),
        ("GET", "/api/kamar", "Mengambil daftar master kamar asrama"),
        ("GET", "/api/stats", "Mengambil metrik agregat statistik dasbor administrator")
    ]
    add_custom_table(["Metode", "Path Endpoint", "Deskripsi Fungsi API"], api_docs, [1.0, 2.2, 3.8])

    add_heading_2("Lampiran 2: Struktur Pohon Direktori Berkas Proyek")
    p_tree = doc.add_paragraph()
    p_tree.paragraph_format.line_spacing = 1.15
    tree_text = (
        "ProgramPABF/\n"
        "├── AbsensiAsrama-BE/            (Backend ASP.NET Core Minimal API)\n"
        "│   ├── Data/                   (ApplicationDbContext.cs & Konfigurasi Entitas)\n"
        "│   ├── Models/                 (User.cs, Presensi.cs, Perizinan.cs, Gedung.cs, Kamar.cs)\n"
        "│   ├── Properties/             (launchSettings.json — Konfigurasi Port 5250)\n"
        "│   ├── wwwroot/                (Hasil Build Bundle Web Statis Frontend)\n"
        "│   ├── AbsensiAsrama.csproj    (Paket Nuget EF Core & MySqlConnector)\n"
        "│   ├── Program.cs              (Inisialisasi Rute Endpoint REST API)\n"
        "│   └── appsettings.json        (Koneksi Database MySQL: absensi_asrama)\n"
        "└── AbsensiAsrama-FE/            (Frontend React 19 Single Page App)\n"
        "    ├── src/\n"
        "    │   ├── components/         (Logo.jsx, PenghuniSidebar, FasilSidebar, AdminSidebar)\n"
        "    │   ├── pages/              (LoginPage.jsx, DashboardPage.jsx, PresensiPage.jsx,\n"
        "    │   │                        PengajuanIzinPage.jsx, RiwayatPresensiPage.jsx)\n"
        "    │   ├── pages/fasil/        (FasilContainer, PresensiLantai, IzinDarurat, KeluarMasuk)\n"
        "    │   ├── pages/admin/        (AdminContainer, MasterData, DataPenghuni, HakAkses)\n"
        "    │   ├── services/           (api.js — Layanan Komunikasi Fetch API)\n"
        "    │   ├── App.jsx             (Manajer Rute Utama & Transisi Peran)\n"
        "    │   └── main.jsx            (Root Renderer React)\n"
        "    ├── package.json            (Dependencies React, Tailwind CSS, Lucide React)\n"
        "    └── vite.config.js          (Konfigurasi Bundler & Ekspor ke Backend wwwroot)\n"
    )
    r_tr = p_tree.add_run(tree_text)
    r_tr.font.name = "Courier New"
    r_tr.font.size = Pt(9.5)
    r_tr.font.color.rgb = RGBColor(40, 40, 40)

    # Save Document
    output_filename = "Laporan_Lengkap_Program_MyNAVA.docx"
    doc.save(output_filename)
    print(f"Laporan berhasil dibuat: {output_filename}")

if __name__ == "__main__":
    create_report()

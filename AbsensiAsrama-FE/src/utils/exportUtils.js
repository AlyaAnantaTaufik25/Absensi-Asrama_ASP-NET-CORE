/**
 * Utilitas untuk Mengunduh Rekapitulasi Presensi & Perizinan Asrama
 * Mendukung ekspor ke format CSV / Excel (.csv & .xls) serta Cetak PDF Resmi
 */
import { showToast } from "./toast";

/**
 * Download data dalam format CSV yang kompatibel dengan Microsoft Excel (UTF-8 BOM)
 * @param {string} filename Nama file hasil download (misal: "Rekap_Presensi.csv")
 * @param {string[]} headers Array nama kolom
 * @param {Array<Array<string|number>>} rows Array of baris data
 */
export function downloadCSV(filename, headers, rows) {
  if (!rows || rows.length === 0) {
    showToast("Tidak ada data untuk diunduh.", "warning");
    return false;
  }

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCSV).join(",");
  const rowLines = rows.map((row) => row.map(escapeCSV).join(",")).join("\r\n");

  // \uFEFF adalah UTF-8 Byte Order Mark agar Microsoft Excel di Windows membaca encoding dengan benar
  const csvContent = "\uFEFF" + headerLine + "\r\n" + rowLines;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Download data dalam format Excel Spreadsheet (.xls) dengan styling tabel HTML
 * @param {string} filename Nama file (misal: "Rekap_Kehadiran.xls")
 * @param {string} sheetTitle Judul dokumen di dalam sheet
 * @param {string[]} headers Array kolom
 * @param {Array<Array<string|number>>} rows Data baris
 */
export function downloadExcelHtml(filename, sheetTitle, headers, rows) {
  if (!rows || rows.length === 0) {
    showToast("Tidak ada data untuk diunduh.", "warning");
    return false;
  }

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th { background-color: #1e40af; color: #ffffff; border: 1px solid #cbd5e1; padding: 10px; font-weight: bold; font-size: 12px; }
          td { border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; }
          .title { font-size: 16px; font-weight: bold; text-align: center; color: #0f172a; margin-bottom: 4px; }
          .subtitle { font-size: 11px; text-align: center; color: #64748b; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="title">${sheetTitle}</div>
        <div class="subtitle">UPT Asrama Mahasiswa Universitas Andalas · Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r, idx) => `
              <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"}">
                ${r.map((cell) => `<td>${cell !== null && cell !== undefined ? cell : "-"}</td>`).join("")}
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".xls") ? filename : `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Mencetak Dokumen PDF Resmi dengan Kop Surat Asrama Universitas Andalas
 * @param {object} param0 
 */
export function printOfficialDocument({
  title = "REKAPITULASI RESMI",
  subtitle = "Unit Pengelola Teknis Asrama Mahasiswa Universitas Andalas",
  metaInfo = [],
  headers = [],
  rows = [],
  signerName = "Fasilitator Asrama",
  signerRole = "Fasilitator Lantai / Pembina"
}) {
  if (!rows || rows.length === 0) {
    showToast("Tidak ada data untuk dicetak / diekspor ke PDF.", "warning");
    return false;
  }

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    showToast("Popup diblokir oleh browser. Harap izinkan pop-up untuk mencetak dokumen PDF.", "error");
    return false;
  }

  const dateStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${title} - Universitas Andalas</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body {
          font-family: 'Times New Roman', Times, serif;
          margin: 0;
          padding: 20px;
          color: #111827;
          line-height: 1.35;
        }
        .header {
          text-align: center;
          border-bottom: 3px double #000;
          padding-bottom: 10px;
          margin-bottom: 18px;
        }
        .header h3 {
          margin: 0;
          font-size: 15pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .header h4 {
          margin: 3px 0;
          font-size: 13pt;
          font-weight: bold;
          text-transform: uppercase;
        }
        .header p {
          margin: 2px 0 0;
          font-size: 9.5pt;
          font-style: italic;
          color: #374151;
        }
        .doc-title {
          text-align: center;
          margin: 16px 0 12px;
        }
        .doc-title h2 {
          margin: 0;
          font-size: 13pt;
          font-weight: bold;
          text-decoration: underline;
          text-transform: uppercase;
        }
        .doc-title span {
          font-size: 10pt;
          color: #4b5563;
        }
        .meta-table {
          width: 100%;
          margin-bottom: 14px;
          font-size: 10pt;
        }
        .meta-table td {
          padding: 3px 0;
          vertical-align: top;
        }
        .meta-label {
          width: 160px;
          font-weight: bold;
        }
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 9.5pt;
        }
        table.data-table th, table.data-table td {
          border: 1px solid #1f2937;
          padding: 6px 8px;
        }
        table.data-table th {
          background-color: #f3f4f6;
          font-weight: bold;
          text-align: center;
        }
        .status-badge {
          display: inline-block;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 8.5pt;
        }
        .footer-sign {
          margin-top: 35px;
          width: 100%;
          page-break-inside: avoid;
        }
        .sign-box {
          float: right;
          width: 250px;
          text-align: center;
          font-size: 10pt;
        }
        .sign-space {
          height: 65px;
        }
        .sign-name {
          font-weight: bold;
          text-decoration: underline;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h3>KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</h3>
        <h4>UNIVERSITAS ANDALAS</h4>
        <p>Unit Pelaksana Teknis (UPT) Asrama Mahasiswa · Kampus Limau Manis, Padang, Sumatera Barat</p>
      </div>

      <div class="doc-title">
        <h2>${title}</h2>
        <span>${subtitle}</span>
      </div>

      ${
        metaInfo.length > 0
          ? `
        <table class="meta-table">
          ${metaInfo
            .map(
              (m) => `
            <tr>
              <td class="meta-label">${m.label}</td>
              <td style="width: 15px;">:</td>
              <td><strong>${m.value}</strong></td>
            </tr>`
            )
            .join("")}
        </table>
      `
          : ""
      }

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 35px;">No.</th>
            ${headers.map((h) => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row, index) => `
            <tr>
              <td style="text-align: center;">${index + 1}</td>
              ${row.map((col) => `<td>${col !== null && col !== undefined ? col : "-"}</td>`).join("")}
            </tr>`
            )
            .join("")}
        </tbody>
      </table>

      <div class="footer-sign">
        <div class="sign-box">
          <div>Padang, ${dateStr}</div>
          <div style="margin-top: 4px;">${signerRole},</div>
          <div class="sign-space"></div>
          <div class="sign-name">${signerName}</div>
          <div>NIP / ID: 198503152010121004</div>
        </div>
        <div style="clear: both;"></div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  return true;
}

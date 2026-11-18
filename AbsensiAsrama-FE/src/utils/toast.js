// Global iOS-style Toast Notification Utility
// Pengganti alert() di seluruh aplikasi — tampil cantik, auto-hilang

let toastContainer = null;

function ensureContainer() {
  if (toastContainer && document.body.contains(toastContainer)) return toastContainer;
  toastContainer = document.createElement("div");
  toastContainer.id = "app-toast-container";
  Object.assign(toastContainer.style, {
    position: "fixed",
    top: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "99999",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    pointerEvents: "none",
    width: "100%",
    maxWidth: "420px",
    padding: "0 16px",
    boxSizing: "border-box"
  });
  document.body.appendChild(toastContainer);
  return toastContainer;
}

/**
 * Tampilkan toast notification iOS-style
 * @param {string} message - Pesan yang ditampilkan
 * @param {"success"|"error"|"info"|"warning"} type - Tipe toast
 * @param {number} duration - Durasi tampil (ms), default 3000
 */
export function showToast(message, type = "success", duration = 3000) {
  const container = ensureContainer();

  const icons = {
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff9500" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  };

  const bgColors = {
    success: "#f0fdf4",
    error: "#fef2f2",
    info: "#eff6ff",
    warning: "#fffbeb"
  };

  const borderColors = {
    success: "rgba(52, 199, 89, 0.25)",
    error: "rgba(255, 59, 48, 0.2)",
    info: "rgba(0, 122, 255, 0.2)",
    warning: "rgba(255, 149, 0, 0.2)"
  };

  const textColors = {
    success: "#15803d",
    error: "#dc2626",
    info: "#1d4ed8",
    warning: "#b45309"
  };

  const toast = document.createElement("div");
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      ${icons[type] || icons.info}
      <span style="font-size:13.5px;font-weight:600;color:${textColors[type]};line-height:1.4;">${message}</span>
    </div>
  `;

  Object.assign(toast.style, {
    backgroundColor: bgColors[type],
    border: `1px solid ${borderColors[type]}`,
    borderRadius: "16px",
    padding: "14px 20px",
    boxShadow: "0 8px 30px -6px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
    pointerEvents: "auto",
    opacity: "0",
    transform: "translateY(-16px) scale(0.96)",
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    cursor: "pointer",
    width: "100%",
    boxSizing: "border-box"
  });

  toast.addEventListener("click", () => removeToast(toast));

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0) scale(1)";
    });
  });

  // Auto remove
  setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
  toast.style.opacity = "0";
  toast.style.transform = "translateY(-16px) scale(0.96)";
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 300);
}

// Shortcut functions
export const toastSuccess = (msg) => showToast(msg, "success");
export const toastError = (msg) => showToast(msg, "error");
export const toastInfo = (msg) => showToast(msg, "info");
export const toastWarning = (msg) => showToast(msg, "warning");

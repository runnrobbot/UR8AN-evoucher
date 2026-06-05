/**
 * WhatsAppModal — kirim voucher ke WhatsApp customer.
 *
 * PC: auto-download gambar + buka WA (App / Web) secara bersamaan
 * Mobile: Web Share API dengan file gambar PNG (jika browser support)
 *         Fallback: download gambar + buka WA
 */

import { useState } from "react";
import { Smartphone, Monitor, Phone, Send, Download } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import bannerDefault from "../../assets/banner.png";
import { downloadVoucher } from "../../lib/downloadVoucher";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return null;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}
function formatDiscount(discount, type) {
  if (!discount) return "";
  if (type === "percent") return `${discount}%`;
  return `Rp. ${Number(discount).toLocaleString("id-ID")}`;
}
function cleanPhone(raw) {
  let p = raw.replace(/[\s\-().+]/g, "");
  if (p.startsWith("0")) p = "62" + p.slice(1);
  if (!p.startsWith("62")) p = "62" + p;
  return p;
}
function buildMessage(voucher) {
  const discount    = formatDiscount(voucher.discount, voucher.discountType);
  const expires     = formatDate(voucher.expiresAt);
  const minPurchase = voucher.minPurchase
    ? `Rp. ${Number(voucher.minPurchase).toLocaleString("id-ID")}` : null;

  return [
    `Selamat${voucher.customerName ? ` ${voucher.customerName}` : ""},`,
    ``,
    `Berikut voucher diskon eksklusif dari *UR8AN LIVING* untuk Anda:`,
    ``,
    `*Nilai Diskon:* ${discount}`,
    `*Kode Voucher:* ${voucher.code}`,
    minPurchase ? `*Min. Pembelian:* ${minPurchase}` : null,
    expires     ? `*Berlaku s.d.:* ${expires}`        : null,
    voucher.notes ? `*Catatan:* ${voucher.notes}`      : null,
    ``,
    `Tunjukkan voucher ini saat berbelanja di UR8AN LIVING.`,
    ``,
    `Terima kasih telah berbelanja bersama kami.`,
  ].filter(Boolean).join("\n");
}
function renderPreview(text) {
  return text
    .replace(/\*(.*?)\*/g, "<b>$1</b>")
    .replace(/\n/g, "<br/>");
}

// ── Render voucher ke PNG blob (sama persis dengan downloadVoucher) ────────────
async function renderVoucherBlob(voucher) {
  const W = 1492, H = 1054;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;

  return new Promise((resolve) => {
    const origToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(cb, ...args) {
      origToBlob.call(this, (blob) => {
        HTMLCanvasElement.prototype.toBlob = origToBlob;
        resolve(blob);
      }, ...args);
    };
    downloadVoucher(voucher, `voucher-${voucher.code}.png`);
  });
}

// Trigger file download from blob
function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const canShareFiles = () =>
  typeof navigator.share === "function" &&
  typeof navigator.canShare === "function";

// ── Component ──────────────────────────────────────────────────────────────────

export default function WhatsAppModal({ open, onClose, voucher }) {
  const [phone, setPhone]     = useState(voucher?.customerPhone || "");
  const [phoneErr, setPhoneErr] = useState("");
  const [status, setStatus]   = useState("idle"); // idle | loading | done

  if (!voucher) return null;

  const validate = () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) { setPhoneErr("Nomor HP tidak valid (min. 9 digit)"); return false; }
    return true;
  };

  const message = buildMessage(voucher);
  const mobile  = isMobile();

  // ── PC: auto-download gambar + buka WA ─────────────────────────────────────
  async function handleDesktop(web = false) {
    if (!validate()) return;
    setStatus("loading");
    try {
      // 1. Render + download gambar otomatis
      const blob = await renderVoucherBlob(voucher);
      triggerBlobDownload(blob, `voucher-${voucher.code}.png`);

      // 2. Buka WA dengan teks (slight delay agar download browser tidak tertimpa tab baru)
      setTimeout(() => {
        const cleaned = cleanPhone(phone);
        const url = web
          ? `https://web.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(message)}`
          : `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank", "noopener");
      }, 400);

      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus("idle");
      alert("Terjadi kesalahan. Silakan coba lagi.");
    }
  }

  // ── Mobile: Web Share API dengan file gambar ────────────────────────────────
  async function handleMobile() {
    if (!validate()) return;
    setStatus("loading");
    try {
      const blob = await renderVoucherBlob(voucher);
      const file = new File([blob], `voucher-${voucher.code}.png`, { type: "image/png" });

      if (canShareFiles() && navigator.canShare({ files: [file] })) {
        // Share gambar + teks sekaligus
        await navigator.share({ text: message, files: [file] });
      } else if (typeof navigator.share === "function") {
        // Fallback text-only share
        await navigator.share({ text: message });
        // Juga download gambar
        triggerBlobDownload(blob, `voucher-${voucher.code}.png`);
      } else {
        // Final fallback: download + buka wa.me
        triggerBlobDownload(blob, `voucher-${voucher.code}.png`);
        const cleaned = cleanPhone(phone);
        window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`, "_blank");
      }
      setStatus("done");
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error(err);
        setStatus("idle");
      } else {
        setStatus("idle"); // user cancel
      }
    }
  }

  return (
    <Modal open={open} onClose={() => { setStatus("idle"); onClose(); }} title="Kirim Voucher via WhatsApp" size="md">
      <div className="space-y-4">

        {/* Nomor HP */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#2D3A3A] flex items-center gap-1.5">
            <Phone size={14} className="text-[#6B8F71]" />
            Nomor WhatsApp Customer
          </label>
          <input
            type="tel"
            placeholder="08xx-xxxx-xxxx"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setPhoneErr(""); }}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6B8F71]/40
              ${phoneErr ? "border-red-400 bg-red-50" : "border-[#DDE2DD] bg-white"}`}
          />
          {phoneErr && <p className="text-xs text-red-500">{phoneErr}</p>}
          {voucher.customerPhone && phone !== voucher.customerPhone && (
            <button type="button"
              onClick={() => { setPhone(voucher.customerPhone); setPhoneErr(""); }}
              className="text-xs text-[#6B8F71] hover:underline text-left">
              Pakai nomor tersimpan: {voucher.customerPhone}
            </button>
          )}
        </div>

        {/* Preview pesan */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1.5">Preview pesan</p>
          <div
            className="bg-[#ECE5DD] rounded-2xl px-4 py-3 text-sm text-[#1a1a1a] max-h-40 overflow-y-auto leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderPreview(message) }}
          />
        </div>

        {/* ── MOBILE ── */}
        {mobile ? (
          <div className="space-y-3">
            <Button
              className="w-full bg-[#25D366] hover:bg-[#1ebe5e]"
              loading={status === "loading"}
              onClick={handleMobile}
            >
              <Send size={15} />
              {status === "loading" ? "Menyiapkan..." : "Bagikan ke WhatsApp"}
            </Button>
            {status === "done" && (
              <p className="text-xs text-center text-[#6B8F71]">
                Gambar dan pesan siap dikirim
              </p>
            )}
            <p className="text-xs text-center text-slate-400">
              Gambar voucher otomatis ikut terkirim bersama pesan
            </p>
          </div>

        ) : (
          /* ── DESKTOP ── */
          <div className="space-y-3">
            <div className="bg-[#F7F8F6] border border-[#DDE2DD] rounded-xl p-3 text-xs text-slate-600">
              Gambar voucher akan <strong>otomatis terdownload</strong>, lalu WhatsApp akan terbuka.
              Lampirkan gambar yang sudah terdownload ke chat.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={status === "loading"}
                onClick={() => handleDesktop(false)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-[#DDE2DD] hover:border-[#25D366] hover:bg-green-50 transition-all disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center shadow-sm">
                  <Smartphone size={20} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#2D3A3A]">WA App</p>
                  <p className="text-xs text-slate-400 mt-0.5">Download + buka WA app</p>
                </div>
              </button>

              <button
                disabled={status === "loading"}
                onClick={() => handleDesktop(true)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-[#DDE2DD] hover:border-[#25D366] hover:bg-green-50 transition-all disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-[#2D3A3A] rounded-full flex items-center justify-center shadow-sm">
                  <Monitor size={20} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#2D3A3A]">WA Web</p>
                  <p className="text-xs text-slate-400 mt-0.5">Download + buka WA web</p>
                </div>
              </button>
            </div>

            {status === "loading" && (
              <p className="text-xs text-center text-slate-500 animate-pulse">
                Menyiapkan gambar voucher...
              </p>
            )}
            {status === "done" && (
              <p className="text-xs text-center text-[#6B8F71]">
                Gambar terdownload. Lampirkan ke chat WhatsApp yang terbuka.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

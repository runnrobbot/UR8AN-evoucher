/**
 * VoucherVisual
 *
 * banner.png adalah template 1492×1054px yang sudah berisi semua elemen desain.
 * Komponen ini hanya overlay teks dinamis di posisi yang tepat:
 *  1. Tiket emas → VOUCHER DISKON + nilai + kode
 *  2. Baris "Berlaku sampai:" → menimpa titik-titik dengan tanggal asli
 *  3. Baris min pembelian    → menimpa teks statis jika ada nilai custom
 *
 * Font size menggunakan container query (cqw) agar selalu proporsional
 * terhadap lebar card, bukan viewport.
 */

import { useRef, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import bannerDefault from "../../assets/banner.png";

function formatDate(ts) {
  if (!ts) return null;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}
function formatDiscount(discount, type) {
  if (!discount && discount !== 0) return type === "percent" ? "0%" : "Rp. 0";
  if (type === "percent") return `${discount}%`;
  return `Rp. ${Number(discount).toLocaleString("id-ID")}`;
}

export default function VoucherVisual({ voucher, compact = false }) {
  const isExpired = voucher.expiresAt
    ? (voucher.expiresAt.toDate ? voucher.expiresAt.toDate() : new Date(voucher.expiresAt)) < new Date()
    : false;
  const isUsed   = voucher.isRedeemed;
  const inactive = !voucher.isActive || isExpired;
  const bgSrc    = voucher.bgImageUrl || bannerDefault;

  const discountLabel = formatDiscount(voucher.discount, voucher.discountType);
  const expiresLabel  = formatDate(voucher.expiresAt);
  const voucherCode   = voucher.code || "";

  const discountRef = useRef(null);

  // Auto-scale discount text horizontally to fit within ticket width
  useEffect(() => {
    const el = discountRef.current;
    if (!el) return;
    el.style.transform = "scaleX(1)";
    const parent = el.parentElement;
    if (!parent) return;
    const maxW = parent.clientWidth * 0.92;
    const elW  = el.scrollWidth;
    if (elW > maxW) {
      el.style.transform = `scaleX(${maxW / elW})`;
    }
  }, [discountLabel]);

  // Template aspect ratio: 1492/1054
  const ratio = 1492 / 1054;
  // Ticket: top~17%, bottom~61%, left~14%, right~87%
  const TK_TOP = 25, TK_BOT = 61, TK_L = 14, TK_R = 87;
  const TK_H   = TK_BOT - TK_TOP;  // ~44%
  const TK_W   = TK_R   - TK_L;    // ~73%

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl shadow-xl select-none
        ${inactive && !isUsed ? "opacity-60" : ""}`}
      style={{
        aspectRatio: `${ratio}`,
        containerType: "inline-size",   // enable cqw units
      }}
    >
      {/* Template background — fill exact 1492×1054, no crop */}
      <img
        src={bgSrc}
        alt="voucher"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "fill" }}
      />

      {/* ─── OVERLAY 1: Teks di dalam tiket emas ─────────────────────────── */}
      <div
        className="absolute flex flex-col items-center justify-center pointer-events-none"
        style={{
          top:    `${TK_TOP}%`,
          height: `${TK_H}%`,
          left:   `${TK_L}%`,
          width:  `${TK_W}%`,
          gap:    "2%",
        }}
      >
        {/* VOUCHER DISKON */}
        <span style={{
          fontSize:      "2.2cqw",
          fontWeight:    600,
          color:         "#2D1A00",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          textAlign:     "center",
          lineHeight:    1.2,
          fontFamily:    "Arial, Helvetica, sans-serif",
        }}>
          VOUCHER DISKON
        </span>

        {/* Nilai diskon — letter spacing, auto-scale agar tidak overflow */}
        <span
          ref={discountRef}
          style={{
            fontSize:        "5.8cqw",
            fontWeight:      900,
            color:           "#0D0D0D",
            fontFamily:      "'Arial Black', Impact, Arial, sans-serif",
            textShadow:      "0 2px 6px rgba(0,0,0,0.18)",
            textAlign:       "center",
            lineHeight:      1,
            letterSpacing:   "0.04em",
            whiteSpace:      "nowrap",
            display:         "block",
            transformOrigin: "center center",
          }}
        >
          {discountLabel}
        </span>

        {/* Kode voucher — di dalam tiket, bukan di bawah tiket */}
        {voucherCode && (
          <span style={{
            fontSize:      "1.5cqw",
            fontWeight:    700,
            color:         "#3D2200",
            fontFamily:    "'Courier New', monospace",
            letterSpacing: "0.14em",
            textAlign:     "center",
            marginTop:     "1%",
          }}>
            {voucherCode}
          </span>
        )}
      </div>

      {/* ─── OVERLAY 2: Tanggal "Berlaku sampai" ─────────────────────────── */}
      {/*
        Di template: baris "Berlaku sampai: ............"
        Titik-titik mulai setelah "Berlaku sampai: " ~ left 26%, top ~76%
        Kita taruh teks tepat di atas titik-titik, tanpa background.
      */}
      {expiresLabel && (
        <span
          className="absolute pointer-events-none"
          style={{
            top:        "87.5%",
            left:       "26.0%",
            fontSize:   "1.6cqw",
            fontWeight: 700,
            color:      "#2D1A00",
            whiteSpace: "nowrap",
            fontFamily: "Times New Roman, sans-serif",
            lineHeight: 1,
          }}
        >
          {expiresLabel}
        </span>
      )}

      {/* ── Used stamp ── */}
      {isUsed && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 rounded-2xl">
          <div style={{
            border: "4px solid rgba(255,255,255,0.75)", borderRadius: 12,
            padding: compact ? "8px 18px" : "14px 32px",
            transform: "rotate(-15deg)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <CheckCircle size={compact ? 18 : 28} color="rgba(255,255,255,0.88)"/>
            <span style={{ fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.92)", fontSize: compact ? 14 : 22 }}>
              Sudah Dipakai
            </span>
          </div>
        </div>
      )}

      {/* ── Expired stamp ── */}
      {!isUsed && isExpired && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 rounded-2xl">
          <div style={{
            border: "4px solid rgba(255,255,255,0.65)", borderRadius: 12,
            padding: compact ? "8px 18px" : "14px 32px",
            transform: "rotate(-15deg)",
          }}>
            <span style={{ fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.82)", fontSize: compact ? 14 : 22 }}>
              Expired
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

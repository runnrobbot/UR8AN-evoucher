/**
 * downloadVoucher — 1:1 mirror of VoucherVisual.jsx
 *
 * Semua posisi, ukuran font, dan style diambil PERSIS dari VoucherVisual.
 * Konversi: % → px, cqw → px (cqw = % dari lebar canvas W)
 *
 * Source of truth: VoucherVisual.jsx
 * ─────────────────────────────────────────────────────────────
 * Tiket:    TK_TOP=25%H, TK_BOT=61%H, TK_L=14%W, TK_R=87%W
 * Overlay container: flex-col, align-center, justify-center, gap 2%
 * Label:    2.2cqw, w600, letterSpacing 0.18em, Arial
 * Diskon:   5.8cqw, w900, letterSpacing 0.04em, Arial Black, auto-scale 92% TK_W
 * Kode:     1.5cqw, w700, letterSpacing 0.14em, Courier New, marginTop 1%
 * Expires:  top 87.5%H, left 26.0%W, 1.6cqw, w700, Times New Roman
 */

import bannerDefault from "../assets/banner.png";

const W = 1492;
const H = 1054;

// ── cqw → px (cqw = % dari lebar W) ─────────────────────────────────────────
const px = (cqw) => W * cqw / 100;

// ── Tiket area (dari VoucherVisual: TK_TOP=25, TK_BOT=61, TK_L=14, TK_R=87) ─
const TK_TOP = H * 0.25;
const TK_H   = H * (0.61 - 0.25);   // 36% of H
const TK_L   = W * 0.14;
const TK_W   = W * (0.87 - 0.14);   // 73% of W
const TK_CX  = TK_L + TK_W / 2;
const TK_CY  = TK_TOP + TK_H / 2;

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
function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// Simulate flexbox column center with gap
// Items: [labelH, gap, discH, gap, codeH] centered vertically in TK_H
function getFlexPositions(ctx, discountLabel, voucherCode) {
  const GAP = TK_H * 0.02;  // gap: 2% of ticket height

  const labelFont = `600 ${px(2.2)}px Arial, sans-serif`;
  const discFont  = `900 ${px(5.8)}px 'Arial Black', Impact, Arial, sans-serif`;
  const codeFont  = `700 ${px(1.5)}px 'Courier New', monospace`;

  // Measure heights (approximate as fontSize * lineHeight)
  const labelH = px(2.2) * 1.2;
  const discH  = px(5.8) * 1.0;
  const codeH  = voucherCode ? px(1.5) * 1.2 : 0;
  const codeGap = voucherCode ? px(1.5) * 0.01 : 0;  // marginTop 1%

  const totalH = labelH + GAP + discH + (voucherCode ? GAP + codeGap + codeH : 0);
  const startY = TK_CY - totalH / 2;

  return {
    labelY: startY + labelH,                           // baseline
    discY:  startY + labelH + GAP + discH,             // baseline
    codeY:  voucherCode ? startY + labelH + GAP + discH + GAP + codeGap + codeH : null,
  };
}

export async function downloadVoucher(voucher, filename) {
  const canvas  = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx     = canvas.getContext("2d");

  // ── 1. Template ──────────────────────────────────────────────────────────
  try {
    const bg = await loadImage(voucher.bgImageUrl || bannerDefault);
    ctx.drawImage(bg, 0, 0, W, H);
  } catch {
    ctx.fillStyle = "#D4C5A9";
    ctx.fillRect(0, 0, W, H);
  }

  const discountLabel = formatDiscount(voucher.discount, voucher.discountType);
  const voucherCode   = voucher.code || "";
  const expiresLabel  = formatDate(voucher.expiresAt);

  // Calculate vertical positions mirroring flex layout
  const pos = getFlexPositions(ctx, discountLabel, voucherCode);

  // ── 2. VOUCHER DISKON — 2.2cqw, w600, letterSpacing 0.18em, Arial ────────
  ctx.save();
  const labelFs = px(2.2);
  ctx.font          = `600 ${labelFs}px Arial, Helvetica, sans-serif`;
  ctx.fillStyle     = "#2D1A00";
  ctx.textAlign     = "center";
  ctx.letterSpacing = `${labelFs * 0.18}px`;
  ctx.fillText("VOUCHER DISKON", TK_CX, pos.labelY);
  ctx.restore();

  // ── 3. Nilai diskon — 5.8cqw, w900, letterSpacing 0.04em, auto-scale ─────
  let discFs = px(5.8);
  const maxDiscW = TK_W * 0.92;
  ctx.save();
  ctx.font          = `900 ${discFs}px 'Arial Black', Impact, Arial, sans-serif`;
  ctx.letterSpacing = `${discFs * 0.04}px`;
  // Auto-shrink exactly like VoucherVisual useEffect
  while (ctx.measureText(discountLabel).width > maxDiscW && discFs > 40) {
    discFs -= 2;
    ctx.font          = `900 ${discFs}px 'Arial Black', Impact, Arial, sans-serif`;
    ctx.letterSpacing = `${discFs * 0.04}px`;
  }
  ctx.fillStyle     = "#0D0D0D";
  ctx.textAlign     = "center";
  ctx.shadowColor   = "rgba(0,0,0,0.18)";
  ctx.shadowBlur    = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillText(discountLabel, TK_CX, pos.discY);
  ctx.restore();

  // ── 4. Kode voucher — 1.5cqw, w700, letterSpacing 0.14em, Courier New ────
  if (voucherCode && pos.codeY !== null) {
    ctx.save();
    const codeFs = px(1.5);
    ctx.font          = `700 ${codeFs}px 'Courier New', monospace`;
    ctx.fillStyle     = "#3D2200";
    ctx.textAlign     = "center";
    ctx.letterSpacing = `${codeFs * 0.14}px`;
    ctx.fillText(voucherCode, TK_CX, pos.codeY);
    ctx.restore();
  }

  // ── 5. Berlaku sampai — top 87.5%H, left 26.0%W, 1.6cqw, Times New Roman ─
  if (expiresLabel) {
    ctx.save();
    const expFs = px(1.6);
    // top 87.5% = CSS "top" property → y baseline = top% * H + fontSize
    const expY = H * 0.875 + expFs;
    const expX = W * 0.260;
    ctx.font          = `bold ${expFs}px 'Times New Roman', serif`;
    ctx.fillStyle     = "#2D1A00";
    ctx.textAlign     = "left";
    ctx.letterSpacing = "0px";
    ctx.fillText(expiresLabel, expX, expY);
    ctx.restore();
  }

  // ── 6. Download PNG ───────────────────────────────────────────────────────
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href:     url,
      download: filename || `voucher-${voucher.code || "ur8an"}.png`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
}

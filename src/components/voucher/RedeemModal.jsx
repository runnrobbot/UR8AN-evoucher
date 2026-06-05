import { useState } from "react";
import { CheckCircle2, Ticket, User, ShieldOff } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import VoucherVisual from "./VoucherVisual";
import { redeemVoucherByCode, redeemVoucherById } from "../../hooks/useVouchers";
import { useAuth } from "../../contexts/AuthContext";
import { REDEEM_DIVISION } from "../../lib/constants";

/**
 * Hanya admin divisi UR8AN Division yang dapat redeem.
 * Role lain / divisi lain → ditolak dengan pesan jelas.
 */
function canRedeem(profile) {
  if (!profile) return false;
  if (profile.role === "super_admin") return true;
  return profile.role === "admin" && profile.divisionName === REDEEM_DIVISION;
}

export default function RedeemModal({ open, onClose, voucher = null }) {
  const { user, profile } = useAuth();
  const [code, setCode]       = useState("");
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const isDirectMode = !!voucher;
  const staffName    = profile?.displayName || user?.email || "Staff";
  const allowed      = canRedeem(profile);

  const reset      = () => { setCode(""); setCodeError(""); setSuccess(null); };
  const handleClose = () => { reset(); onClose(); };

  const handleRedeem = async () => {
    if (!allowed) return;
    setLoading(true);
    setCodeError("");
    try {
      let result;
      if (isDirectMode) {
        result = await redeemVoucherById(voucher.id, user.uid, staffName);
      } else {
        if (!code.trim()) { setCodeError("Masukkan kode voucher"); setLoading(false); return; }
        result = await redeemVoucherByCode(code, user.uid, staffName);
      }
      setSuccess(result);
    } catch (err) {
      setCodeError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const title = success
    ? "Voucher Berhasil Digunakan"
    : isDirectMode ? "Konfirmasi Penggunaan Voucher" : "Input Kode Voucher";

  return (
    <Modal open={open} onClose={handleClose} title={title} size="md">

      {/* ── Akses ditolak ── */}
      {!allowed && !success ? (
        <div className="space-y-4 text-center py-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <ShieldOff size={30} className="text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-[#2D3A3A]">Akses Ditolak</p>
            <p className="text-sm text-slate-500 mt-1">
              Hanya <strong>Admin {REDEEM_DIVISION}</strong> yang dapat melakukan validasi voucher.
            </p>
            {profile?.divisionName && (
              <p className="text-xs text-slate-400 mt-1">
                Divisi kamu: <strong>{profile.divisionName}</strong>
              </p>
            )}
          </div>
          <Button variant="secondary" className="w-full" onClick={handleClose}>Tutup</Button>
        </div>

      ) : success ? (
        /* ── Success state ── */
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#EAF0EA] rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} className="text-[#6B8F71]" />
            </div>
          </div>
          <div className="bg-[#F7F8F6] border border-[#DDE2DD] rounded-2xl p-4 space-y-2 text-sm">
            <p className="font-semibold text-[#2D3A3A] text-center mb-3">Detail Penggunaan</p>
            <Row label="Voucher"   value={success.title} />
            <Row label="Kode">
              <code className="font-mono font-bold text-[#6B8F71]">{success.code}</code>
            </Row>
            <Row label="Nilai">
              <span className="font-bold text-[#2D3A3A]">
                {success.discountType === "percent"
                  ? `${success.discount}%`
                  : `Rp. ${Number(success.discount).toLocaleString("id-ID")}`}
              </span>
            </Row>
            {success.customerName && <Row label="Customer" value={success.customerName} />}
            {success.usageLimit && (
              <Row label="Penggunaan">
                <span className="font-bold text-[#2D3A3A]">
                  {(success.usageCount ?? 0) + 1} / {success.usageLimit}x
                </span>
              </Row>
            )}
            <div className="border-t border-[#DDE2DD] my-1" />
            <Row label="Diredeemkan oleh">
              <span className="flex items-center gap-1 font-medium text-[#2D3A3A]">
                <User size={12} className="text-[#6B8F71]" />
                {staffName}
              </span>
            </Row>
            <Row label="Waktu" value={new Date().toLocaleString("id-ID")} />
          </div>
          <Button className="w-full" onClick={handleClose}>Selesai</Button>
        </div>

      ) : isDirectMode ? (
        /* ── Direct confirm ── */
        <div className="space-y-4">
          <VoucherVisual voucher={voucher} compact />
          <div className="bg-[#F7F8F6] border border-[#DDE2DD] rounded-xl p-4 space-y-2 text-sm">
            <Row label="Customer" value={voucher.customerName || "-"} />
            <Row label="Kode">
              <code className="font-mono font-bold text-[#6B8F71]">{voucher.code}</code>
            </Row>
            <Row label="Nilai">
              <span className="font-bold text-[#2D3A3A]">
                {voucher.discountType === "percent"
                  ? `${voucher.discount}%`
                  : `Rp. ${Number(voucher.discount).toLocaleString("id-ID")}`}
              </span>
            </Row>
            {voucher.usageLimit && (
              <Row label="Penggunaan">
                <span className="font-bold text-[#2D3A3A]">
                  {voucher.usageCount ?? 0} / {voucher.usageLimit}x terpakai
                </span>
              </Row>
            )}
            <div className="border-t border-[#DDE2DD] my-1" />
            <Row label="Staff">
              <span className="flex items-center gap-1 text-[#6B8F71] font-medium">
                <User size={12} />
                {staffName}
              </span>
            </Row>
          </div>
          {codeError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{codeError}</div>
          )}
          <p className="text-sm text-slate-500">
            Pastikan voucher ini digunakan oleh customer yang benar. Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={handleClose}>Batal</Button>
            <Button className="flex-1" loading={loading} onClick={handleRedeem}>
              <CheckCircle2 size={15} />Konfirmasi Penggunaan
            </Button>
          </div>
        </div>

      ) : (
        /* ── Scan mode ── */
        <div className="space-y-4">
          <div className="bg-[#EAF0EA] border border-[#B8CFBA] rounded-xl p-4 text-center">
            <Ticket size={28} className="text-[#6B8F71] mx-auto mb-2" />
            <p className="text-sm text-[#2D3A3A] font-medium">Input Kode Voucher Customer</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Voucher akan dicatat atas nama: <strong>{staffName}</strong>
            </p>
          </div>
          <Input
            label="Kode Voucher"
            placeholder="e.g. UR8-ABC123"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeError(""); }}
            error={codeError}
            className="font-mono text-center text-lg tracking-widest"
          />
          <Button className="w-full" loading={loading} onClick={handleRedeem}>
            <CheckCircle2 size={15} />Gunakan Voucher
          </Button>
        </div>
      )}
    </Modal>
  );
}

function Row({ label, value, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-[#2D3A3A] font-medium text-right">{children ?? value}</span>
    </div>
  );
}

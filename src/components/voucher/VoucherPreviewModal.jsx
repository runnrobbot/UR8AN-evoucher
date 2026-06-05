import { useState } from "react";
import { Download } from "lucide-react";
import Modal from "../ui/Modal";
import VoucherVisual from "./VoucherVisual";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { downloadVoucher } from "../../lib/downloadVoucher";

function formatDate(ts) {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

export default function VoucherPreviewModal({ open, onClose, voucher }) {
  const [downloading, setDownloading] = useState(false);

  if (!voucher) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadVoucher(
        voucher,
        `voucher-${voucher.code || "ur8an"}.png`
      );
    } catch (err) {
      alert("Gagal download: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Detail Voucher" size="lg">
      <div className="space-y-4">
        {/* Visual */}
        <VoucherVisual voucher={voucher} />

        {/* Download button */}
        <Button
          className="w-full"
          variant="accent"
          onClick={handleDownload}
          loading={downloading}
        >
          <Download size={16} />
          Download Voucher (PNG 1600×800)
        </Button>

        {/* Detail info */}
        <div className="bg-[#F7F8F6] border border-[#DDE2DD] rounded-xl p-4 space-y-2 text-sm">
          <Row label="Judul"   value={voucher.title} />
          <Row label="Kode">
            <code className="font-mono font-bold text-[#6B8F71]">{voucher.code}</code>
          </Row>
          <Row label="Nilai Diskon">
            <span className="font-bold text-[#2D3A3A]">
              {voucher.discountType === "percent"
                ? `${voucher.discount}%`
                : `Rp. ${Number(voucher.discount).toLocaleString("id-ID")}`}
            </span>
          </Row>
          {voucher.customerName && <Row label="Customer"       value={voucher.customerName} />}
          {voucher.customerPhone && <Row label="No. HP"        value={voucher.customerPhone} />}
          {voucher.minPurchase   && <Row label="Min. Pembelian" value={`Rp. ${Number(voucher.minPurchase).toLocaleString("id-ID")}`} />}
          {voucher.expiresAt     && <Row label="Berlaku Hingga" value={formatDate(voucher.expiresAt)} />}
          {voucher.notes         && <Row label="Catatan"        value={voucher.notes} />}

          <div className="border-t border-[#DDE2DD] pt-2 mt-2 space-y-2">
            <Row label="Status">
              {voucher.isRedeemed ? (
                <Badge variant="slate">Sudah Digunakan</Badge>
              ) : !voucher.isActive ? (
                <Badge variant="red">Nonaktif</Badge>
              ) : (
                <Badge variant="green">Aktif</Badge>
              )}
            </Row>
            {voucher.isRedeemed && voucher.redeemedByName && (
              <Row label="Diredeemkan oleh" value={voucher.redeemedByName} />
            )}
            {voucher.isRedeemed && voucher.redeemedAt && (
              <Row label="Tanggal Digunakan" value={formatDate(voucher.redeemedAt)} />
            )}
            <Row label="Dibuat oleh" value={voucher.createdByName || "-"} />
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-[#2D3A3A] font-medium text-right">{children ?? value}</span>
    </div>
  );
}

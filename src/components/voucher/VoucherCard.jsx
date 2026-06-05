import { motion } from "motion/react";
import { CheckCircle2, QrCode } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import VoucherVisual from "./VoucherVisual";

function statusInfo(voucher) {
  const isExpired = voucher.expiresAt
    ? (voucher.expiresAt.toDate ? voucher.expiresAt.toDate() : new Date(voucher.expiresAt)) < new Date()
    : false;
  if (voucher.isRedeemed) return { label: "Digunakan", variant: "slate" };
  if (!voucher.isActive)  return { label: "Nonaktif",  variant: "red" };
  if (isExpired)          return { label: "Expired",   variant: "red" };
  return                         { label: "Aktif",     variant: "green" };
}

export default function VoucherCard({ voucher, onRedeem, onPreview, canManage }) {
  const status = statusInfo(voucher);

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
    >
      <div className="p-3">
        <VoucherVisual voucher={voucher} compact />
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-[#2D3A3A] text-sm truncate">{voucher.title}</p>
            {voucher.customerName && (
              <p className="text-xs text-slate-400 truncate">untuk {voucher.customerName}</p>
            )}
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        {canManage ? (
          <div className="flex gap-2">
            {!voucher.isRedeemed && voucher.isActive && (
              <Button variant="primary" size="sm" className="flex-1 bg-[#2D3A3A] hover:bg-[#1E2828]"
                onClick={() => onRedeem?.(voucher)}>
                <CheckCircle2 size={13} /> Redeem
              </Button>
            )}
            <Button variant="secondary" size="sm"
              className={voucher.isRedeemed || !voucher.isActive ? "flex-1" : ""}
              onClick={() => onPreview?.(voucher)}>
              <QrCode size={13} />
            </Button>
          </div>
        ) : (
          !voucher.isRedeemed && voucher.isActive && (
            <Button variant="primary" size="sm" className="w-full bg-[#2D3A3A] hover:bg-[#1E2828]"
              onClick={() => onRedeem?.(voucher)}>
              <CheckCircle2 size={13} /> Gunakan Voucher
            </Button>
          )
        )}
      </div>
    </motion.div>
  );
}

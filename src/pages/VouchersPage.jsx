import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, SlidersHorizontal, Ticket, ScanLine } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useVouchers } from "../hooks/useVouchers";
import VoucherCard from "../components/voucher/VoucherCard";
import RedeemModal from "../components/voucher/RedeemModal";
import VoucherPreviewModal from "../components/voucher/VoucherPreviewModal";
import WhatsAppModal from "../components/voucher/WhatsAppModal";
import Spinner from "../components/ui/Spinner";
import Button from "../components/ui/Button";
import { staggerContainer, staggerItem, dropDown } from "../lib/animations";

export default function VouchersPage() {
  const { user, profile } = useAuth();
  const role = profile?.role || "user";
  const { vouchers, loading } = useVouchers(user?.uid);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [redeemVoucher, setRedeemVoucher] = useState(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [previewVoucher, setPreviewVoucher] = useState(null);
  const [shareVoucher, setShareVoucher] = useState(null);

  const canManage = role === "admin" || role === "super_admin";

  const filtered = useMemo(() => {
    return vouchers.filter((v) => {
      const matchSearch =
        v.title?.toLowerCase().includes(search.toLowerCase()) ||
        v.code?.toLowerCase().includes(search.toLowerCase()) ||
        v.customerName?.toLowerCase().includes(search.toLowerCase());

      const isExpired = v.expiresAt
        ? (v.expiresAt.toDate ? v.expiresAt.toDate() : new Date(v.expiresAt)) < new Date()
        : false;

      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "active"  && v.isActive && !v.isRedeemed && !isExpired) ||
        (filterStatus === "used"    && v.isRedeemed) ||
        (filterStatus === "expired" && (isExpired || !v.isActive));

      return matchSearch && matchStatus;
    });
  }, [vouchers, search, filterStatus]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div
        variants={dropDown}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold text-[#2D3A3A]">Voucher</h1>
          <p className="text-slate-500 text-sm mt-1">
            {vouchers.filter((v) => v.isActive && !v.isRedeemed).length} aktif · {vouchers.length} total
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button variant="secondary" onClick={() => setScanOpen(true)}>
            <ScanLine size={15} />
            Scan Kode Voucher
          </Button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari voucher, kode, atau nama customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-slate-400 shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-400 bg-white"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="used">Sudah Digunakan</option>
            <option value="expired">Expired / Nonaktif</option>
          </select>
        </div>
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 text-slate-400"
        >
          <Ticket size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Tidak ada voucher ditemukan</p>
          <p className="text-sm mt-1">Coba ubah filter pencarian</p>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filtered.map((v) => (
            <motion.div key={v.id} variants={staggerItem}>
              <VoucherCard
                voucher={v}
                canManage={canManage}
                onRedeem={setRedeemVoucher}
                onPreview={setPreviewVoucher}
                onShare={setShareVoucher}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <RedeemModal open={scanOpen} onClose={() => setScanOpen(false)} />
      <RedeemModal open={!!redeemVoucher} onClose={() => setRedeemVoucher(null)} voucher={redeemVoucher} />
      <VoucherPreviewModal open={!!previewVoucher} onClose={() => setPreviewVoucher(null)} voucher={previewVoucher} />
      <WhatsAppModal open={!!shareVoucher} onClose={() => setShareVoucher(null)} voucher={shareVoucher} />
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Ticket, CheckCircle, TrendingUp, Users, ArrowRight, ScanLine } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useVouchers } from "../hooks/useVouchers";
import { useRedemptions } from "../hooks/useRedemptions";
import { useUsers } from "../hooks/useUsers";
import { staggerContainer, staggerItem, statCard, dropDown, slideInLeft } from "../lib/animations";
import Spinner from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";
import RedeemModal from "../components/voucher/RedeemModal";

function formatDate(ts) {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function StatCard({ icon: Icon, label, value, accent, loading, delay = 0 }) {
  return (
    <motion.div
      variants={statCard}
      className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        {loading ? (
          <Spinner size="sm" className="mt-1" />
        ) : (
          <motion.p
            className="text-2xl font-bold text-[#2D3A3A]"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          >
            {value}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const role = profile?.role || "user";

  const { vouchers, loading: vLoading } = useVouchers(user?.uid);
  const { redemptions, loading: rLoading } = useRedemptions(user?.uid);
  const { users } = useUsers(role);

  const [redeemOpen, setRedeemOpen] = useState(false);

  const stats = useMemo(() => ({
    totalVouchers:   vouchers.length,
    activeVouchers:  vouchers.filter((v) => v.isActive && !v.isRedeemed).length,
    redeemedVouchers: vouchers.filter((v) => v.isRedeemed).length,
    totalUsers:      users.length,
  }), [vouchers, users]);

  const recentRedemptions = useMemo(() => redemptions.slice(0, 5), [redemptions]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Selamat Pagi";
    if (h < 17) return "Selamat Siang";
    return "Selamat Malam";
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div
        variants={dropDown}
        initial="hidden"
        animate="visible"
        className="flex items-start justify-between flex-wrap gap-3"
      >
        <div>
          <p className="text-slate-500 text-sm">{greeting()},</p>
          <h1 className="text-2xl font-bold text-[#2D3A3A]">
            {profile?.displayName || user?.email?.split("@")[0] || "Staff"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={role === "super_admin" ? "blue" : role === "admin" ? "green" : "slate"}>
            {role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : "Staff"}
          </Badge>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setRedeemOpen(true)}
            className="flex items-center gap-2 bg-[#2D3A3A] hover:bg-[#1E2828] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <ScanLine size={15} />
            Scan Voucher
          </motion.button>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard icon={Ticket}      label="Total Voucher"    value={stats.totalVouchers}    accent="bg-slate-700" loading={vLoading} />
        <StatCard icon={CheckCircle} label="Voucher Aktif"    value={stats.activeVouchers}   accent="bg-[#6B8F71]" loading={vLoading} />
        <StatCard icon={TrendingUp}  label="Sudah Digunakan" value={stats.redeemedVouchers} accent="bg-slate-500" loading={vLoading} />
        {(role === "admin" || role === "super_admin") && (
          <StatCard icon={Users} label="Total Staff" value={stats.totalUsers} accent="bg-slate-600" loading={false} />
        )}
      </motion.div>

      {/* Quick nav */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {[
          { to: "/vouchers",        icon: Ticket,      title: "Lihat Semua Voucher", sub: `${stats.totalVouchers} voucher` },
          { to: "/redemptions",     icon: CheckCircle, title: "Riwayat Penggunaan",  sub: `${redemptions.length} klaim` },
          ...(role === "admin" || role === "super_admin"
            ? [{ to: "/manage-vouchers", icon: TrendingUp, title: "Generate Voucher", sub: "Buat & kelola voucher" }]
            : []),
        ].map((item) => (
          <motion.div key={item.to} variants={staggerItem}>
            <Link
              to={item.to}
              className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between hover:border-slate-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                  <item.icon size={18} className="text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-[#2D3A3A] text-sm">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.sub}</p>
                </div>
              </div>
              <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 400 }}>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent redemptions */}
      <motion.div
        variants={slideInLeft}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-2xl border border-slate-100"
      >
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-[#2D3A3A]">Penggunaan Terakhir</h2>
          <Link to="/redemptions" className="text-xs text-[#6B8F71] hover:underline">
            Lihat semua
          </Link>
        </div>

        {rLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : recentRedemptions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            Belum ada penggunaan voucher
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="divide-y divide-slate-50"
          >
            {recentRedemptions.map((r) => (
              <motion.div
                key={r.id}
                variants={staggerItem}
                className="px-6 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                    <Ticket size={14} className="text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#2D3A3A] truncate">{r.voucherTitle}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {r.customerName ?? r.voucherCode}
                      {r.staffName ? ` · ${r.staffName}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[#506A56]">
                    {r.discountType === "percent"
                      ? `${r.discount}%`
                      : `Rp${Number(r.discount).toLocaleString("id-ID")}`}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(r.redeemedAt)}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <RedeemModal open={redeemOpen} onClose={() => setRedeemOpen(false)} />
    </div>
  );
}

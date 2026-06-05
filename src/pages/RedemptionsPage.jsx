import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ClipboardList, Search, Ticket, Download, FileText,
  FileSpreadsheet, Calendar, TrendingUp, CheckCircle,
  ChevronDown, User, Phone, Tag, Clock, Percent,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useRedemptions } from "../hooks/useRedemptions";
import { staggerContainer, staggerItem, dropDown, statCard, tableRow } from "../lib/animations";
import Spinner from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDate(ts) {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
}
function formatDate(ts, withTime = true) {
  const d = toDate(ts);
  if (!d) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
function formatDateLong(ts) {
  const d = toDate(ts);
  if (!d) return "-";
  return d.toLocaleDateString("id-ID", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}
function formatDiscount(r) {
  if (!r.discount) return "-";
  return r.discountType === "percent"
    ? `${r.discount}%`
    : `Rp${Number(r.discount).toLocaleString("id-ID")}`;
}
function escapeCSV(val) {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n"))
    return `"${str.replace(/"/g, '""')}"`;
  return str;
}
function exportCSV(data, filename) {
  const headers = ["No","Tanggal","Judul Voucher","Kode","Nama Customer","No HP","Tipe Diskon","Nilai","Staff"];
  const rows = data.map((r, i) => [
    i + 1, formatDate(r.redeemedAt), r.voucherTitle||"", r.voucherCode||"",
    r.customerName||"", r.customerPhone||"",
    r.discountType === "percent" ? "Persen" : "Nominal",
    r.discountType === "percent" ? `${r.discount}%` : `Rp${Number(r.discount).toLocaleString("id-ID")}`,
    r.staffName||"",
  ]);
  const csv = [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n");
  triggerDownload(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), filename + ".csv");
}
function exportXLSX(data, filename) {
  const headers = ["No","Tanggal","Judul Voucher","Kode","Nama Customer","No HP","Tipe Diskon","Nilai","Staff"];
  const esc = (v) => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const th = headers.map((h) => `<th style="background:#1e293b;color:white;font-weight:bold;padding:8px 12px;border:1px solid #ccc;">${esc(h)}</th>`).join("");
  const body = data.map((r, i) => {
    const cells = [
      i+1, formatDate(r.redeemedAt), r.voucherTitle||"", r.voucherCode||"",
      r.customerName||"", r.customerPhone||"",
      r.discountType === "percent" ? "Persen" : "Nominal",
      r.discountType === "percent" ? `${r.discount}%` : `Rp${Number(r.discount).toLocaleString("id-ID")}`,
      r.staffName||"",
    ];
    return `<tr>${cells.map((c) => `<td style="padding:6px 12px;border:1px solid #e2e8f0;">${esc(c)}</td>`).join("")}</tr>`;
  }).join("");
  const now = new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" });
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8"></head><body><table>
    <tr><td colspan="${headers.length}" style="font-size:15px;font-weight:bold;padding:8px 12px;">Laporan Voucher UR8AN Living</td></tr>
    <tr><td colspan="${headers.length}" style="padding:4px 12px;color:#64748b;">Diekspor ${now} · ${data.length} data</td></tr>
    <tr></tr><tr>${th}</tr>${body}
    </table></body></html>`;
  triggerDownload(new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" }), filename + ".xls");
}
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
function buildFilename(df, dt) {
  const now = new Date().toISOString().split("T")[0];
  return df && dt ? `laporan_voucher_${df}_sd_${dt}` : `laporan_voucher_${now}`;
}

// ── Detail panel untuk satu redemption ────────────────────────────────────────
function DetailPanel({ r }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div className="px-6 py-4 bg-[#F7F8F6] border-t border-[#DDE2DD]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Voucher info */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Info Voucher</p>
            <DetailRow icon={<Ticket size={13} />}   label="Judul"    value={r.voucherTitle || "-"} />
            <DetailRow icon={<Tag size={13} />}      label="Kode"
              value={<code className="font-mono font-bold text-[#6B8F71]">{r.voucherCode}</code>}
            />
            <DetailRow icon={<Percent size={13} />}  label="Nilai Diskon"
              value={<Badge variant="green">{formatDiscount(r)}</Badge>}
            />
          </div>

          {/* Customer info */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Info Customer</p>
            <DetailRow icon={<User size={13} />}     label="Nama"    value={r.customerName  || "-"} />
            <DetailRow icon={<Phone size={13} />}    label="No. HP"  value={r.customerPhone || "-"} />
          </div>

          {/* Transaksi info */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Detail Transaksi</p>
            <DetailRow icon={<User size={13} />}     label="Staff Peredeem" value={r.staffName || "-"} />
            <DetailRow icon={<Clock size={13} />}    label="Waktu Tepat"    value={formatDateLong(r.redeemedAt)} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <div className="text-sm text-[#2D3A3A] font-medium">{value}</div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function RedemptionsPage() {
  const { user } = useAuth();
  const { redemptions, loading } = useRedemptions(user?.uid);

  const [search, setSearch]     = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [exportMenu, setExportMenu] = useState(false);
  const [expandedId, setExpandedId] = useState(null); // row yang di-expand

  const filtered = useMemo(() => {
    return redemptions.filter((r) => {
      if (search) {
        const s = search.toLowerCase();
        if (!(
          r.voucherTitle?.toLowerCase().includes(s) ||
          r.voucherCode?.toLowerCase().includes(s)  ||
          r.customerName?.toLowerCase().includes(s) ||
          r.staffName?.toLowerCase().includes(s)
        )) return false;
      }
      const d = toDate(r.redeemedAt);
      if (dateFrom && d && d < new Date(dateFrom + "T00:00:00")) return false;
      if (dateTo   && d && d > new Date(dateTo   + "T23:59:59")) return false;
      return true;
    });
  }, [redemptions, search, dateFrom, dateTo]);

  const summary = useMemo(() => ({
    count:      filtered.length,
    totalFixed: filtered.filter((r) => r.discountType === "fixed")
                        .reduce((s, r) => s + Number(r.discount || 0), 0),
  }), [filtered]);

  const doExportCSV  = useCallback(() => { exportCSV(filtered,  buildFilename(dateFrom, dateTo)); setExportMenu(false); }, [filtered, dateFrom, dateTo]);
  const doExportXLSX = useCallback(() => { exportXLSX(filtered, buildFilename(dateFrom, dateTo)); setExportMenu(false); }, [filtered, dateFrom, dateTo]);
  const hasFilters   = search || dateFrom || dateTo;
  const clearFilters = () => { setSearch(""); setDateFrom(""); setDateTo(""); };

  const toggleExpand = (id) => setExpandedId((p) => p === id ? null : id);

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div variants={dropDown} initial="hidden" animate="visible"
        className="flex items-start justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold text-[#2D3A3A]">Riwayat Penggunaan</h1>
          <p className="text-slate-500 text-sm mt-1">{redemptions.length} voucher telah digunakan</p>
        </div>
        <div className="relative">
          <Button variant="secondary" onClick={() => setExportMenu((p) => !p)} disabled={filtered.length === 0}>
            <Download size={15} />Export Laporan
          </Button>
          {exportMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setExportMenu(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 mt-2 w-52 bg-white border border-[#DDE2DD] rounded-2xl shadow-xl py-2 z-20"
              >
                <p className="px-4 py-1.5 text-xs text-slate-400 font-medium uppercase tracking-wide">
                  {filtered.length} data
                </p>
                <button onClick={doExportCSV} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3A3A] hover:bg-[#F7F8F6]">
                  <FileText size={16} className="text-[#6B8F71]" /> Export CSV
                </button>
                <button onClick={doExportXLSX} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3A3A] hover:bg-[#F7F8F6]">
                  <FileSpreadsheet size={16} className="text-[#506A56]" /> Export Excel
                </button>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>

      {/* Summary */}
      {!loading && redemptions.length > 0 && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          {[
            { icon: CheckCircle, label: "Total Diredeem",       value: summary.count,  accent: "bg-[#6B8F71]" },
            { icon: TrendingUp,  label: "Total Diskon Nominal",
              value: summary.totalFixed > 0 ? `Rp${summary.totalFixed.toLocaleString("id-ID")}` : "-",
              accent: "bg-slate-700", small: true },
            { icon: Calendar,    label: "Terakhir Diredeem",
              value: redemptions[0] ? formatDate(redemptions[0].redeemedAt, false) : "-",
              accent: "bg-slate-500", small: true },
          ].map((s) => (
            <motion.div key={s.label} variants={statCard}
              className="bg-white rounded-2xl border border-[#DDE2DD] p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
            >
              <div className={`w-10 h-10 ${s.accent} rounded-xl flex items-center justify-center shrink-0`}>
                <s.icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`font-bold text-[#2D3A3A] ${s.small ? "text-sm leading-tight mt-0.5" : "text-xl"}`}>{s.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.3 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Cari voucher, kode, customer, atau staff..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#DDE2DD] pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={15} className="text-slate-400 shrink-0" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-[#DDE2DD] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6B8F71]/40 bg-white" />
          <span className="text-slate-400 text-sm">–</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-[#DDE2DD] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6B8F71]/40 bg-white" />
          {hasFilters && (
            <button onClick={clearFilters} className="text-sm text-slate-400 hover:text-slate-600">Reset</button>
          )}
        </div>
      </motion.div>

      {hasFilters && !loading && (
        <p className="text-sm text-slate-500">
          Menampilkan <span className="font-semibold text-[#2D3A3A]">{filtered.length}</span> dari {redemptions.length} data
        </p>
      )}

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.35 }}
        className="bg-white rounded-2xl border border-[#DDE2DD] overflow-hidden"
      >
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">{hasFilters ? "Tidak ada data sesuai filter" : "Belum ada riwayat penggunaan"}</p>
            {hasFilters && <button onClick={clearFilters} className="text-sm text-[#6B8F71] hover:underline mt-2">Reset filter</button>}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F7F8F6] text-xs text-slate-500 uppercase tracking-wide border-b border-[#DDE2DD]">
                  <tr>
                    <th className="px-4 py-3 text-left w-8">#</th>
                    <th className="px-4 py-3 text-left">Voucher</th>
                    <th className="px-4 py-3 text-left">Kode</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Nilai</th>
                    <th className="px-4 py-3 text-left">Staff</th>
                    <th className="px-4 py-3 text-left">Tanggal</th>
                    <th className="px-4 py-3 text-left w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F7F8F6]">
                  {filtered.map((r, i) => (
                    <>
                      <tr
                        key={r.id}
                        className="hover:bg-[#F7F8F6]/60 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(r.id)}
                      >
                        <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-[#F7F8F6] rounded-lg flex items-center justify-center shrink-0">
                              <Ticket size={13} className="text-slate-500" />
                            </div>
                            <span className="text-sm font-medium text-[#2D3A3A] truncate max-w-[160px]">
                              {r.voucherTitle}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-xs font-mono bg-[#F7F8F6] px-2 py-1 rounded text-slate-700">
                            {r.voucherCode}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-[#2D3A3A]">{r.customerName || "-"}</p>
                          {r.customerPhone && (
                            <p className="text-xs text-slate-400">{r.customerPhone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="green">{formatDiscount(r)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{r.staffName || "-"}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{formatDate(r.redeemedAt)}</td>
                        <td className="px-4 py-3">
                          <motion.div
                            animate={{ rotate: expandedId === r.id ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown size={15} className="text-slate-400" />
                          </motion.div>
                        </td>
                      </tr>

                      {/* Detail panel */}
                      <tr key={`${r.id}-detail`}>
                        <td colSpan={8} className="p-0">
                          <AnimatePresence>
                            {expandedId === r.id && <DetailPanel r={r} />}
                          </AnimatePresence>
                        </td>
                      </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile — card dengan expand */}
            <div className="md:hidden divide-y divide-[#F7F8F6]">
              {filtered.map((r) => (
                <div key={r.id}>
                  <button
                    className="w-full px-4 py-4 flex items-center justify-between gap-3 hover:bg-[#F7F8F6]/50 transition-colors text-left"
                    onClick={() => toggleExpand(r.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-[#F7F8F6] rounded-xl flex items-center justify-center shrink-0">
                        <Ticket size={16} className="text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#2D3A3A] truncate">{r.voucherTitle}</p>
                        <p className="text-xs text-slate-500 truncate">{r.customerName || "-"}</p>
                        <code className="text-xs text-slate-500 font-mono">{r.voucherCode}</code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <Badge variant="green">{formatDiscount(r)}</Badge>
                        <p className="text-xs text-slate-400 mt-1">{formatDate(r.redeemedAt, false)}</p>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedId === r.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={15} className="text-slate-400" />
                      </motion.div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedId === r.id && <DetailPanel r={r} />}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-[#DDE2DD] bg-[#F7F8F6]/50">
              <p className="text-xs text-slate-400">
                {filtered.length} data{hasFilters ? " (filter aktif)" : ""} · Klik baris untuk detail
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

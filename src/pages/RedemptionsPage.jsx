import { useMemo, useState, useCallback } from "react";
import { motion } from "motion/react";
import {
  ClipboardList, Search, Ticket, Download, FileText,
  FileSpreadsheet, Calendar, TrendingUp, CheckCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useRedemptions } from "../hooks/useRedemptions";
import { staggerContainer, staggerItem, dropDown, statCard, tableRow } from "../lib/animations";
import Spinner from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

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

export default function RedemptionsPage() {
  const { user } = useAuth();
  const { redemptions, loading } = useRedemptions(user?.uid);

  const [search, setSearch]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]   = useState("");
  const [exportMenu, setExportMenu] = useState(false);

  const filtered = useMemo(() => {
    return redemptions.filter((r) => {
      if (search) {
        const s = search.toLowerCase();
        if (!(r.voucherTitle?.toLowerCase().includes(s) || r.voucherCode?.toLowerCase().includes(s) ||
              r.customerName?.toLowerCase().includes(s) || r.staffName?.toLowerCase().includes(s)))
          return false;
      }
      const d = toDate(r.redeemedAt);
      if (dateFrom && d && d < new Date(dateFrom + "T00:00:00")) return false;
      if (dateTo   && d && d > new Date(dateTo   + "T23:59:59")) return false;
      return true;
    });
  }, [redemptions, search, dateFrom, dateTo]);

  const summary = useMemo(() => ({
    count: filtered.length,
    totalFixed: filtered.filter((r) => r.discountType === "fixed").reduce((s, r) => s + Number(r.discount||0), 0),
  }), [filtered]);

  const doExportCSV  = useCallback(() => { exportCSV(filtered,  buildFilename(dateFrom, dateTo)); setExportMenu(false); }, [filtered, dateFrom, dateTo]);
  const doExportXLSX = useCallback(() => { exportXLSX(filtered, buildFilename(dateFrom, dateTo)); setExportMenu(false); }, [filtered, dateFrom, dateTo]);
  const hasFilters   = search || dateFrom || dateTo;
  const clearFilters = () => { setSearch(""); setDateFrom(""); setDateTo(""); };

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
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="secondary" onClick={() => setExportMenu((p) => !p)} disabled={filtered.length === 0}>
              <Download size={15} />
              Export Laporan
            </Button>
          </motion.div>
          {exportMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setExportMenu(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: -8 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-20"
              >
                <p className="px-4 py-1.5 text-xs text-slate-400 font-medium uppercase tracking-wide">
                  {filtered.length} data akan diekspor
                </p>
                <button onClick={doExportCSV} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  <FileText size={16} className="text-[#6B8F71]" /> Export CSV
                </button>
                <button onClick={doExportXLSX} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  <FileSpreadsheet size={16} className="text-[#506A56]" /> Export Excel (.xls)
                </button>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>

      {/* Summary cards */}
      {!loading && redemptions.length > 0 && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          {[
            { icon: CheckCircle, label: "Total Diredeem", value: summary.count,      accent: "bg-[#6B8F71]" },
            { icon: TrendingUp,  label: "Total Diskon Nominal",
              value: summary.totalFixed > 0 ? `Rp${summary.totalFixed.toLocaleString("id-ID")}` : "-",
              accent: "bg-slate-700", small: true },
            { icon: Calendar, label: "Terakhir Diredeem",
              value: redemptions[0] ? formatDate(redemptions[0].redeemedAt, false) : "-",
              accent: "bg-slate-500", small: true },
          ].map((s) => (
            <motion.div key={s.label} variants={statCard}
              className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.3 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" placeholder="Cari voucher, kode, customer, atau staff..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={15} className="text-slate-400 shrink-0" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-400 bg-white" title="Dari tanggal" />
          <span className="text-slate-400 text-sm">–</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-400 bg-white" title="Sampai tanggal" />
          {hasFilters && (
            <button onClick={clearFilters} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
              Reset
            </button>
          )}
        </div>
      </motion.div>

      {hasFilters && !loading && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-500">
          Menampilkan <span className="font-semibold text-[#2D3A3A]">{filtered.length}</span> dari {redemptions.length} data
        </motion.p>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.35 }}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
      >
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 text-slate-400">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">{hasFilters ? "Tidak ada data sesuai filter" : "Belum ada riwayat penggunaan"}</p>
            {hasFilters && <button onClick={clearFilters} className="text-sm text-[#6B8F71] hover:underline mt-2">Reset filter</button>}
          </motion.div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left w-8">#</th>
                    <th className="px-6 py-3 text-left">Voucher</th>
                    <th className="px-6 py-3 text-left">Kode</th>
                    <th className="px-6 py-3 text-left">Customer</th>
                    <th className="px-6 py-3 text-left">Nilai</th>
                    <th className="px-6 py-3 text-left">Staff</th>
                    <th className="px-6 py-3 text-left">Tanggal</th>
                  </tr>
                </thead>
                <motion.tbody variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-slate-50">
                  {filtered.map((r, i) => (
                    <motion.tr key={r.id} variants={tableRow} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-400">{i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                            <Ticket size={14} className="text-slate-500" />
                          </div>
                          <span className="text-sm font-medium text-[#2D3A3A]">{r.voucherTitle}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">{r.voucherCode}</code>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">{r.customerName || "-"}</p>
                        {r.customerPhone && <p className="text-xs text-slate-400">{r.customerPhone}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="green">{formatDiscount(r)}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{r.staffName || "-"}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">{formatDate(r.redeemedAt)}</td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>

            {/* Mobile */}
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="md:hidden divide-y divide-slate-50">
              {filtered.map((r) => (
                <motion.div key={r.id} variants={staggerItem} className="px-4 py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                      <Ticket size={16} className="text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#2D3A3A] truncate">{r.voucherTitle}</p>
                      <p className="text-xs text-slate-500 truncate">{r.customerName || "-"}</p>
                      <code className="text-xs text-slate-600 font-mono">{r.voucherCode}</code>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="green">{formatDiscount(r)}</Badge>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(r.redeemedAt, false)}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/50">
              <p className="text-xs text-slate-400">{filtered.length} data{hasFilters ? " (filter aktif)" : ""}</p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

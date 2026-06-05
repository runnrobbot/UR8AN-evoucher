import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Plus, Search, Ticket, Pencil, Trash2, QrCode, CheckCircle2, Layers } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useVouchers, deleteVoucher } from "../hooks/useVouchers";
import VoucherForm from "../components/voucher/VoucherForm";
import BulkVoucherForm from "../components/voucher/BulkVoucherForm";
import RedeemModal from "../components/voucher/RedeemModal";
import VoucherPreviewModal from "../components/voucher/VoucherPreviewModal";
import VoucherVisual from "../components/voucher/VoucherVisual";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";
import { staggerContainer, staggerItem, dropDown, tableRow } from "../lib/animations";

function statusInfo(voucher) {
  const isExpired = voucher.expiresAt
    ? (voucher.expiresAt.toDate ? voucher.expiresAt.toDate() : new Date(voucher.expiresAt)) < new Date()
    : false;
  if (voucher.isRedeemed)  return { label: "Digunakan", variant: "slate" };
  if (!voucher.isActive)   return { label: "Nonaktif",  variant: "red" };
  if (isExpired)           return { label: "Expired",   variant: "red" };
  return                          { label: "Aktif",     variant: "green" };
}

export default function ManageVouchersPage() {
  const { user } = useAuth();
  const { vouchers, loading } = useVouchers(user?.uid);

  const [search, setSearch]         = useState("");
  const [filterStatus, setFilter]   = useState("all");
  const [viewMode, setViewMode]     = useState("grid");
  const [formOpen, setFormOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDelete]   = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [redeemTarget, setRedeem]   = useState(null);
  const [previewTarget, setPreview] = useState(null);
  const [bulkOpen, setBulkOpen]     = useState(false);

  const filtered = useMemo(() => vouchers.filter((v) => {
    const matchSearch =
      !search ||
      v.title?.toLowerCase().includes(search.toLowerCase()) ||
      v.code?.toLowerCase().includes(search.toLowerCase()) ||
      v.customerName?.toLowerCase().includes(search.toLowerCase());
    const isExpired = v.expiresAt
      ? (v.expiresAt.toDate ? v.expiresAt.toDate() : new Date(v.expiresAt)) < new Date()
      : false;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active"   && v.isActive && !v.isRedeemed && !isExpired) ||
      (filterStatus === "used"     && v.isRedeemed) ||
      (filterStatus === "inactive" && (!v.isActive || isExpired));
    return matchSearch && matchStatus;
  }), [vouchers, search, filterStatus]);

  const openEdit  = (v) => { setEditTarget(v); setFormOpen(true); };
  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const closeForm  = () => { setFormOpen(false); setEditTarget(null); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try   { await deleteVoucher(deleteTarget.id); setDelete(null); }
    catch (err) { alert("Gagal menghapus: " + err.message); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div variants={dropDown} initial="hidden" animate="visible"
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold text-[#2D3A3A]">Generate Voucher</h1>
          <p className="text-slate-500 text-sm mt-1">{vouchers.length} voucher total</p>
        </div>
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Button variant="secondary" onClick={() => setBulkOpen(true)}>
              <Layers size={15} />Bulk Generate
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Button onClick={openCreate}><Plus size={16} />Buat Voucher</Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Cari voucher, kode, customer..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterStatus} onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-400 bg-white">
            <option value="all">Semua</option>
            <option value="active">Aktif</option>
            <option value="used">Digunakan</option>
            <option value="inactive">Nonaktif</option>
          </select>
          {["grid","list"].map((m) => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`px-3 py-2 rounded-xl text-sm border capitalize transition-colors ${
                viewMode === m ? "bg-[#2D3A3A] border-slate-800 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >{m}</button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 text-slate-400">
          <Ticket size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Belum ada voucher</p>
          <Button className="mt-4" onClick={openCreate}><Plus size={16} />Buat Voucher Pertama</Button>
        </motion.div>
      ) : viewMode === "grid" ? (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filtered.map((v) => {
            const st = statusInfo(v);
            return (
              <motion.div key={v.id} variants={staggerItem}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-3"><VoucherVisual voucher={v} compact /></div>
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#2D3A3A] text-sm truncate">{v.title}</p>
                      {v.customerName && <p className="text-xs text-slate-400 truncate">untuk {v.customerName}</p>}
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  <div className="flex gap-1.5">
                    {!v.isRedeemed && v.isActive && (
                      <Button variant="primary" size="sm" className="flex-1 bg-[#2D3A3A] hover:bg-[#1E2828]" onClick={() => setRedeem(v)}>
                        <CheckCircle2 size={13} />Redeem
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setPreview(v)}><QrCode size={13} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(v)}><Pencil size={13} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDelete(v)}><Trash2 size={13} className="text-red-400" /></Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* List view */
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
        >
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
            <div className="col-span-3">Voucher</div>
            <div className="col-span-2">Kode</div>
            <div className="col-span-2">Customer</div>
            <div className="col-span-2">Nilai</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Aksi</div>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-slate-50">
            {filtered.map((v) => {
              const st = statusInfo(v);
              return (
                <motion.div key={v.id} variants={tableRow} className="px-6 py-4">
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                        <Ticket size={16} className="text-slate-500" />
                      </div>
                      <p className="text-sm font-medium text-[#2D3A3A] truncate">{v.title}</p>
                    </div>
                    <div className="col-span-2">
                      <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">{v.code}</code>
                    </div>
                    <div className="col-span-2 text-sm text-slate-600 truncate">{v.customerName || "-"}</div>
                    <div className="col-span-2 text-sm font-semibold text-[#506A56]">
                      {v.discountType === "percent" ? `${v.discount}%` : `Rp${Number(v.discount).toLocaleString("id-ID")}`}
                    </div>
                    <div className="col-span-1"><Badge variant={st.variant}>{st.label}</Badge></div>
                    <div className="col-span-2 flex gap-1.5">
                      {!v.isRedeemed && v.isActive && (
                        <button onClick={() => setRedeem(v)} className="p-2 rounded-lg text-[#6B8F71] hover:bg-[#EAF0EA] transition-colors"><CheckCircle2 size={14} /></button>
                      )}
                      <button onClick={() => setPreview(v)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"><QrCode size={14} /></button>
                      <button onClick={() => openEdit(v)} className="p-2 rounded-lg text-slate-500 hover:text-[#2D3A3A] hover:bg-slate-100 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setDelete(v)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {/* Mobile */}
                  <div className="md:hidden flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#2D3A3A] truncate">{v.title}</p>
                      <p className="text-xs text-slate-400">{v.customerName || "-"}</p>
                      <code className="text-xs font-mono text-slate-600">{v.code}</code>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {!v.isRedeemed && v.isActive && (
                        <button onClick={() => setRedeem(v)} className="p-2 rounded-lg hover:bg-[#EAF0EA] text-[#6B8F71]"><CheckCircle2 size={14} /></button>
                      )}
                      <button onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-slate-50 text-slate-500"><Pencil size={14} /></button>
                      <button onClick={() => setDelete(v)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      )}

      {/* Modals */}
      <Modal open={formOpen} onClose={closeForm} title={editTarget ? "Edit Voucher" : "Buat Voucher Baru"} size="xl">
        {/* key prop memaksa VoucherForm re-mount saat editTarget berubah,
            sehingga useState initializer selalu berjalan dengan data terbaru */}
        <VoucherForm
          key={editTarget?.id ?? "new"}
          initial={editTarget}
          onSuccess={closeForm}
          onCancel={closeForm}
        />
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDelete(null)} title="Hapus Voucher" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Yakin menghapus <span className="font-semibold text-[#2D3A3A]">{deleteTarget?.title}</span>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDelete(null)}>Batal</Button>
            <Button variant="danger" className="flex-1" loading={deleting} onClick={handleDelete}>Hapus</Button>
          </div>
        </div>
      </Modal>

      <RedeemModal open={!!redeemTarget} onClose={() => setRedeem(null)} voucher={redeemTarget} />
      <VoucherPreviewModal open={!!previewTarget} onClose={() => setPreview(null)} voucher={previewTarget} />

      {/* Bulk Generate Modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Generate Voucher" size="lg">
        <BulkVoucherForm onSuccess={() => setBulkOpen(false)} onCancel={() => setBulkOpen(false)} />
      </Modal>
    </div>
  );
}

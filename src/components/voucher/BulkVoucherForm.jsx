/**
 * BulkVoucherForm — generate banyak voucher sekaligus dengan template yang sama.
 * Fields yang sama untuk semua voucher: discount, discountType, minPurchase,
 *   usageLimit, expiresAt, isActive, bgImageUrl, notes.
 * Fields per-voucher: customerName, customerPhone (dari daftar yang diinput).
 */
import { useState, useCallback } from "react";
import { Plus, Trash2, ImagePlus, Loader, RefreshCw, X } from "lucide-react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Select from "../ui/Select";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { createVoucher } from "../../hooks/useVouchers";
import { useAuth } from "../../contexts/AuthContext";
import bannerDefault from "../../assets/banner.png";

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "UR8-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const emptyShared = {
  discount: "", discountType: "fixed", minPurchase: "",
  usageLimit: "", expiresAt: "", isActive: true,
  bgImageUrl: "", notes: "",
};

const emptyCustomer = () => ({ id: Date.now(), customerName: "", customerPhone: "" });

export default function BulkVoucherForm({ onSuccess, onCancel }) {
  const { user, profile } = useAuth();
  const [shared, setShared] = useState(emptyShared);
  const [customers, setCustomers] = useState([emptyCustomer()]);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null); // "x/y"

  const setS = useCallback((field, value) => {
    setShared((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  }, []);

  const updateCustomer = (id, field, value) => {
    setCustomers((p) => p.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };
  const addCustomer    = () => setCustomers((p) => [...p, emptyCustomer()]);
  const removeCustomer = (id) => setCustomers((p) => p.filter((c) => c.id !== id));

  const handleBgImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const url = await uploadToCloudinary(file); setS("bgImageUrl", url); }
    catch (err) { alert("Upload gagal: " + err.message); }
    finally { setUploading(false); }
  };

  const validate = () => {
    const e = {};
    if (!shared.discount || isNaN(Number(shared.discount)) || Number(shared.discount) <= 0)
      e.discount = "Diskon wajib diisi";
    if (customers.some((c) => !c.customerName.trim()))
      e.customers = "Semua nama customer wajib diisi";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    let done = 0;
    setProgress(`0/${customers.length}`);
    try {
      for (const c of customers) {
        await createVoucher({
          title:        `Voucher ${c.customerName.trim()}`,
          code:         generateCode(),
          customerName: c.customerName.trim(),
          customerPhone: c.customerPhone.trim(),
          notes:        shared.notes.trim(),
          discount:     Number(shared.discount),
          discountType: shared.discountType,
          minPurchase:  shared.minPurchase !== "" ? Number(shared.minPurchase) : null,
          usageLimit:   shared.usageLimit  !== "" ? Number(shared.usageLimit)  : null,
          expiresAt:    shared.expiresAt ? new Date(shared.expiresAt + "T23:59:59") : null,
          isActive:     shared.isActive,
          bgImageUrl:   shared.bgImageUrl || null,
          createdBy:    user?.uid,
          createdByName: profile?.displayName || user?.email,
        });
        done++;
        setProgress(`${done}/${customers.length}`);
      }
      onSuccess?.();
    } catch (err) {
      alert(`Gagal pada voucher ke-${done + 1}: ${err.message}`);
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  const previewBg = shared.bgImageUrl || bannerDefault;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Template shared ── */}
      <div className="bg-[#F7F8F6] rounded-xl p-4 space-y-4">
        <p className="text-sm font-semibold text-[#2D3A3A]">Template (berlaku untuk semua voucher)</p>

        {/* Background */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-[#2D3A3A]">
              Foto Background <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            {shared.bgImageUrl && (
              <button type="button" onClick={() => setS("bgImageUrl", "")}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500">
                <X size={11} /> Hapus
              </button>
            )}
          </div>
          <div className="relative h-20 rounded-xl border-2 border-dashed border-[#DDE2DD] overflow-hidden group cursor-pointer hover:border-[#6B8F71]">
            <img src={previewBg} className="w-full h-full object-cover opacity-50" alt="" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/15 group-hover:bg-black/25">
              {uploading
                ? <Loader size={18} className="text-white animate-spin" />
                : <ImagePlus size={18} className="text-white" />}
            </div>
            <input type="file" accept="image/*" onChange={handleBgImage}
              className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Tipe Diskon" value={shared.discountType}
            onChange={(e) => setS("discountType", e.target.value)}
            options={[{ value:"fixed",label:"Nominal (Rp)" },{ value:"percent",label:"Persen (%)" }]}
          />
          <Input
            label={shared.discountType === "percent" ? "Diskon (%)" : "Nominal (Rp)"}
            type="number" min={0}
            placeholder={shared.discountType === "percent" ? "20" : "100000"}
            value={shared.discount}
            onChange={(e) => setS("discount", e.target.value)}
            error={errors.discount}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Min. Pembelian (opsional)" type="number" min={0} placeholder="1000000"
            value={shared.minPurchase} onChange={(e) => setS("minPurchase", e.target.value)} />
          <Input label="Batas Pakai (opsional)" type="number" min={1} placeholder="Tidak terbatas"
            value={shared.usageLimit} onChange={(e) => setS("usageLimit", e.target.value)} />
        </div>

        <Input label="Berlaku Hingga (opsional)" type="date"
          value={shared.expiresAt} onChange={(e) => setS("expiresAt", e.target.value)} />

        <Input label="Catatan S&K (opsional)" placeholder="e.g. 1 bulan setelah diterima"
          value={shared.notes} onChange={(e) => setS("notes", e.target.value)} />

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={() => setShared((p) => ({ ...p, isActive: !p.isActive }))}
            className={`relative inline-flex w-10 h-6 shrink-0 rounded-full transition-colors ${shared.isActive ? "bg-[#6B8F71]" : "bg-slate-200"}`}
          >
            <span className={`inline-block w-4 h-4 mt-1 bg-white rounded-full shadow transition-transform ${shared.isActive ? "translate-x-5" : "translate-x-1"}`}/>
          </button>
          <span className="text-sm text-[#2D3A3A]">
            Voucher <span className={shared.isActive ? "text-[#6B8F71] font-medium" : "text-slate-400"}>
              {shared.isActive ? "Aktif" : "Nonaktif"}
            </span>
          </span>
        </div>
      </div>

      {/* ── Customer list ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#2D3A3A]">
            Daftar Customer ({customers.length} voucher akan dibuat)
          </p>
          <button type="button" onClick={addCustomer}
            className="flex items-center gap-1 text-xs text-[#6B8F71] hover:underline font-medium">
            <Plus size={13} /> Tambah
          </button>
        </div>

        {errors.customers && (
          <p className="text-xs text-red-500 mb-2">{errors.customers}</p>
        )}

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {customers.map((c, i) => (
            <div key={c.id} className="flex gap-2 items-start">
              <span className="text-xs text-slate-400 w-5 pt-2.5 shrink-0">{i + 1}.</span>
              <Input
                placeholder="Nama customer *"
                value={c.customerName}
                onChange={(e) => updateCustomer(c.id, "customerName", e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="No. HP (opsional)"
                value={c.customerPhone}
                onChange={(e) => updateCustomer(c.id, "customerPhone", e.target.value)}
                className="flex-1"
              />
              {customers.length > 1 && (
                <button type="button" onClick={() => removeCustomer(c.id)}
                  className="p-2 mt-0.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 shrink-0">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Batal</Button>
        <Button type="submit" className="flex-1" loading={saving}>
          {saving ? `Membuat... ${progress}` : `Buat ${customers.length} Voucher`}
        </Button>
      </div>
    </form>
  );
}

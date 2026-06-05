import { useState, useCallback } from "react";
import { ImagePlus, Loader, RefreshCw, X } from "lucide-react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Select from "../ui/Select";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { createVoucher, updateVoucher } from "../../hooks/useVouchers";
import { useAuth } from "../../contexts/AuthContext";
import VoucherVisual from "./VoucherVisual";
import bannerDefault from "../../assets/banner.png";

const empty = {
  title: "",
  code: "",
  customerName: "",
  customerPhone: "",
  notes: "",
  discount: "",
  discountType: "fixed",
  minPurchase: "",
  expiresAt: "",
  isActive: true,
  bgImageUrl: "",   // "" = use default banner
};

function toInputDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().split("T")[0];
}

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "UR8-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function VoucherForm({ initial, onSuccess, onCancel }) {
  const { user, profile } = useAuth();
  const isEdit = !!initial?.id;

  const [form, setForm] = useState(() =>
    initial
      ? {
          ...empty,
          ...initial,
          discount: String(initial.discount || ""),
          minPurchase: String(initial.minPurchase || ""),
          expiresAt: toInputDate(initial.expiresAt),
        }
      : { ...empty, code: generateCode() }
  );

  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Judul wajib diisi";
    if (!form.code.trim()) e.code = "Kode wajib diisi";
    if (!form.discount || isNaN(Number(form.discount)) || Number(form.discount) <= 0)
      e.discount = "Diskon harus angka lebih dari 0";
    if (!form.customerName.trim()) e.customerName = "Nama customer wajib diisi";
    return e;
  };

  const handleBgImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      set("bgImageUrl", url);
    } catch (err) {
      alert("Upload gagal: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        title:        form.title.trim(),
        code:         form.code.trim().toUpperCase(),
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        notes:        form.notes.trim(),
        discount:     Number(form.discount),
        discountType: form.discountType,
        // Bug fix: form.minPurchase bisa "0" (string) yang falsy — pakai !== ""
        minPurchase:  form.minPurchase !== "" ? Number(form.minPurchase) : null,
        // Bug fix: tambah T23:59:59 agar tidak off-by-one di timezone UTC+7
        expiresAt:    form.expiresAt ? new Date(form.expiresAt + "T23:59:59") : null,
        isActive:     form.isActive,
        bgImageUrl:   form.bgImageUrl || null,
      };

      if (isEdit) {
        // Bug fix: jangan timpa createdBy/createdByName saat edit
        await updateVoucher(initial.id, payload);
      } else {
        // Hanya set createdBy saat membuat voucher baru
        await createVoucher({
          ...payload,
          createdBy:     user?.uid,
          createdByName: profile?.displayName || user?.email,
        });
      }
      onSuccess?.();
    } catch (err) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Preview — if no custom bg, show default banner for preview
  const previewVoucher = {
    ...form,
    discount:   Number(form.discount) || 0,
    isRedeemed: false,
    isActive:   form.isActive,
    expiresAt:  form.expiresAt ? new Date(form.expiresAt + "T23:59:59") : null,
    bgImageUrl: form.bgImageUrl || bannerDefault,
  };

  // What to show in the upload zone
  const previewBg = form.bgImageUrl || bannerDefault;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Background image — optional, default = banner.png */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-[#2D3A3A]">
              Foto Background Voucher
              <span className="ml-1.5 text-xs font-normal text-slate-400">(opsional — default: foto ruangan)</span>
            </label>
            {form.bgImageUrl && (
              <button
                type="button"
                onClick={() => set("bgImageUrl", "")}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={12} /> Hapus, pakai default
              </button>
            )}
          </div>

          <div className="relative w-full h-28 rounded-xl border-2 border-dashed border-[#DDE2DD] overflow-hidden bg-[#F7F8F6] group cursor-pointer hover:border-[#6B8F71] transition-colors">
            <img src={previewBg} className="w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity" alt="" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/15 group-hover:bg-black/25 transition-colors">
              {uploading ? (
                <Loader size={20} className="text-white animate-spin" />
              ) : (
                <>
                  <ImagePlus size={18} className="text-white mb-1" />
                  <p className="text-xs text-white font-medium">
                    {form.bgImageUrl ? "Ganti template background" : "Upload template custom"}
                  </p>
                  {!form.bgImageUrl && (
                    <p className="text-xs text-white/70 mt-0.5">Default: template UR8AN Living</p>
                  )}
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleBgImage}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploading}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hanya foto background yang bisa diubah. Layout, logo, dan S&amp;K otomatis mengikuti template UR8AN Living.
          </p>
        </div>

        {/* Title */}
        <Input
          label="Judul Voucher"
          placeholder="e.g. Voucher Diskon Spesial"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          error={errors.title}
        />

        {/* Code + regenerate */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#2D3A3A]">Kode Voucher</label>
          <div className="flex gap-2">
            <input
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="UR8-XXXXXX"
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-mono outline-none
                focus:ring-2 focus:ring-[#6B8F71]/40 focus:border-[#6B8F71]
                ${errors.code ? "border-red-400 bg-red-50" : "border-[#DDE2DD] bg-white hover:border-[#B8CFBA]"}`}
            />
            <button
              type="button"
              onClick={() => set("code", generateCode())}
              className="px-3 py-2.5 rounded-xl border border-[#DDE2DD] text-slate-500 hover:bg-[#EAF0EA] hover:border-[#B8CFBA] transition-colors"
              title="Generate ulang kode"
            >
              <RefreshCw size={15} />
            </button>
          </div>
          {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
        </div>

        {/* Customer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Nama Customer"
            placeholder="Nama penerima voucher"
            value={form.customerName}
            onChange={(e) => set("customerName", e.target.value)}
            error={errors.customerName}
          />
          <Input
            label="No. HP Customer (opsional)"
            placeholder="08xx-xxxx-xxxx"
            value={form.customerPhone}
            onChange={(e) => set("customerPhone", e.target.value)}
          />
        </div>

        {/* Discount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Tipe Diskon"
            value={form.discountType}
            onChange={(e) => set("discountType", e.target.value)}
            options={[
              { value: "fixed",   label: "Nominal (Rp)" },
              { value: "percent", label: "Persen (%)" },
            ]}
          />
          <Input
            label={form.discountType === "percent" ? "Besar Diskon (%)" : "Nominal Potongan (Rp)"}
            type="number"
            placeholder={form.discountType === "percent" ? "e.g. 20" : "e.g. 100000"}
            value={form.discount}
            onChange={(e) => set("discount", e.target.value)}
            error={errors.discount}
            min={0}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Min. Pembelian (Rp, opsional)"
            type="number"
            placeholder="e.g. 1000000"
            value={form.minPurchase}
            onChange={(e) => set("minPurchase", e.target.value)}
            min={0}
          />
          <Input
            label="Berlaku Hingga (opsional)"
            type="date"
            value={form.expiresAt}
            onChange={(e) => set("expiresAt", e.target.value)}
          />
        </div>

        <Input
          label="Catatan / Syarat & Ketentuan (opsional)"
          placeholder="e.g. Berlaku 1 bulan setelah diterima"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
            className={`relative inline-flex w-10 h-6 shrink-0 rounded-full transition-colors duration-200 ${
              form.isActive ? "bg-[#6B8F71]" : "bg-slate-200"
            }`}
            role="switch"
            aria-checked={form.isActive}
          >
            <span
              className={`pointer-events-none inline-block w-4 h-4 mt-1 bg-white rounded-full shadow transform transition-transform duration-200 ${
                form.isActive ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-[#2D3A3A] select-none">
            Voucher{" "}
            <span className={form.isActive ? "text-[#6B8F71] font-medium" : "text-slate-400"}>
              {form.isActive ? "Aktif" : "Nonaktif"}
            </span>
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" className="flex-1" loading={saving || uploading}>
            {isEdit ? "Simpan Perubahan" : "Buat Voucher"}
          </Button>
        </div>
      </form>

      {/* ── Live Preview ── */}
      <div>
        <p className="text-sm font-medium text-[#2D3A3A] mb-2">Preview Voucher</p>
        <VoucherVisual voucher={previewVoucher} />
        <p className="text-xs text-slate-400 text-center mt-2">
          Preview otomatis terupdate saat mengisi form
        </p>
      </div>
    </div>
  );
}

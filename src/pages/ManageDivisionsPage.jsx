import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Pencil, Trash2, Building2, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useDivisions, createDivision, updateDivision, deleteDivision } from "../hooks/useDivisions";
import { dropDown, staggerContainer, staggerItem } from "../lib/animations";
import Spinner from "../components/ui/Spinner";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

export default function ManageDivisionsPage() {
  const { profile } = useAuth();
  const { divisions, loading } = useDivisions();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);   // { id, name }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (profile?.role !== "super_admin") {
    return (
      <div className="text-center py-20 text-slate-400">
        <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
        <p>Akses ditolak. Hanya Super Admin.</p>
      </div>
    );
  }

  const openCreate = () => { setNameInput(""); setNameError(""); setCreateOpen(true); };
  const openEdit   = (d) => { setEditTarget(d); setNameInput(d.name); setNameError(""); };
  const closeAll   = ()  => { setCreateOpen(false); setEditTarget(null); setDeleteTarget(null); };

  const handleSave = async () => {
    if (!nameInput.trim()) { setNameError("Nama divisi wajib diisi"); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await updateDivision(editTarget.id, nameInput);
      } else {
        await createDivision(nameInput);
      }
      closeAll();
    } catch (err) {
      setNameError("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await deleteDivision(deleteTarget.id); setDeleteTarget(null); }
    catch (err) { alert("Gagal menghapus: " + err.message); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <motion.div variants={dropDown} initial="hidden" animate="visible"
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold text-[#2D3A3A]">Kelola Divisi</h1>
          <p className="text-slate-500 text-sm mt-1">{divisions.length} divisi terdaftar</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={openCreate}><Plus size={16} />Tambah Divisi</Button>
        </motion.div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : divisions.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 text-slate-400"
        >
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Belum ada divisi</p>
          <Button className="mt-4" onClick={openCreate}><Plus size={16} />Buat Divisi Pertama</Button>
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {divisions.map((d) => (
            <motion.div key={d.id} variants={staggerItem}
              className="bg-white rounded-2xl border border-[#DDE2DD] p-5 flex items-center justify-between gap-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-[#EAF0EA] rounded-xl flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-[#6B8F71]" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#2D3A3A] truncate">{d.name}</p>
                  <p className="text-xs text-slate-400">
                    {d.createdAt?.toDate
                      ? d.createdAt.toDate().toLocaleDateString("id-ID")
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => openEdit(d)}
                  className="p-2 rounded-lg text-slate-500 hover:text-[#2D3A3A] hover:bg-slate-100 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(d)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={createOpen || !!editTarget}
        onClose={closeAll}
        title={editTarget ? "Edit Divisi" : "Tambah Divisi"}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nama Divisi"
            placeholder="e.g. UR8AN Division"
            value={nameInput}
            onChange={(e) => { setNameInput(e.target.value); setNameError(""); }}
            error={nameError}
            autoFocus
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={closeAll}>Batal</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              {editTarget ? "Simpan" : "Buat Divisi"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Divisi" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Yakin menghapus divisi{" "}
            <span className="font-semibold text-[#2D3A3A]">{deleteTarget?.name}</span>?
            Pengguna yang terdaftar di divisi ini perlu di-update manual.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" className="flex-1" loading={deleting} onClick={handleDelete}>Hapus</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

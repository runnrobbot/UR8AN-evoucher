import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Users, Search, ShieldCheck, Shield, User, Plus, Eye, EyeOff, Building2, Trash2 } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { secondaryAuth, db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useUsers, updateUserRole, updateUserDivision } from "../hooks/useUsers";
import { useDivisions } from "../hooks/useDivisions";
import { staggerContainer, staggerItem, dropDown, statCard, tableRow } from "../lib/animations";
import Spinner from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const roleOptions = [
  { value: "user",        label: "Staff" },
  { value: "admin",       label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];
const roleMap = {
  super_admin: { label: "Super Admin", variant: "blue",  icon: ShieldCheck },
  admin:       { label: "Admin",       variant: "green", icon: Shield },
  user:        { label: "Staff",       variant: "slate", icon: User },
};
function formatDate(ts) {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
const emptyCreate = { displayName: "", email: "", password: "", role: "user", divisionId: "", divisionName: "" };

export default function ManageUsersPage() {
  const { user: currentUser, profile } = useAuth();
  const role = profile?.role;
  const { users, loading } = useUsers(role);
  const { divisions } = useDivisions();

  const [search, setSearch]           = useState("");
  const [roleModal, setRoleModal]     = useState(null);
  const [divModal, setDivModal]       = useState(null);
  const [selectedRole, setSelRole]    = useState("");
  const [selectedDiv, setSelDiv]      = useState("");
  const [saving, setSaving]           = useState(false);
  const [createOpen, setCreateOpen]   = useState(false);
  const [createForm, setCreateForm]   = useState(emptyCreate);
  const [createErrors, setCreateErrs] = useState({});
  const [creating, setCreating]       = useState(false);
  const [showPass, setShowPass]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const divisionOptions = [
    { value: "", label: "— Tidak ada divisi —" },
    ...divisions.map((d) => ({ value: d.id, label: d.name })),
  ];

  const filtered = useMemo(() => {
    if (!search) return users;
    const s = search.toLowerCase();
    return users.filter((u) =>
      u.displayName?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s)
    );
  }, [users, search]);

  const setCreate = (field, value) => {
    setCreateForm((p) => ({ ...p, [field]: value }));
    setCreateErrs((p) => ({ ...p, [field]: undefined }));
  };

  const handleDivisionChange = (val) => {
    const div = divisions.find((d) => d.id === val);
    setCreate("divisionId", val);
    setCreate("divisionName", div?.name || "");
  };

  const validateCreate = () => {
    const e = {};
    if (!createForm.displayName.trim()) e.displayName = "Nama wajib diisi";
    if (!createForm.email)              e.email       = "Email wajib diisi";
    if (createForm.password.length < 6) e.password    = "Password minimal 6 karakter";
    return e;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errs = validateCreate();
    if (Object.keys(errs).length) { setCreateErrs(errs); return; }
    setCreating(true);
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, createForm.email, createForm.password);
      await updateProfile(cred.user, { displayName: createForm.displayName.trim() });
      await setDoc(doc(db, "users", cred.user.uid), {
        uid:          cred.user.uid,
        email:        createForm.email,
        displayName:  createForm.displayName.trim(),
        role:         createForm.role,
        divisionId:   createForm.divisionId   || null,
        divisionName: createForm.divisionName || null,
        photoURL:     null,
        createdAt:    serverTimestamp(),
        createdBy:    currentUser?.uid,
      });
      await secondaryAuth.signOut();
      setCreateOpen(false);
      setCreateForm(emptyCreate);
    } catch (err) {
      setCreateErrs({ general: err.message });
      try { await secondaryAuth.signOut(); } catch { /* ignore */ }
    } finally {
      setCreating(false);
    }
  };

  const openRoleModal = (u) => { setRoleModal({ uid: u.id, name: u.displayName || u.email }); setSelRole(u.role || "user"); };
  const openDivModal  = (u) => { setDivModal({ uid: u.id, name: u.displayName || u.email });  setSelDiv(u.divisionId || ""); };

  const handleSaveRole = async () => {
    if (!roleModal) return;
    setSaving(true);
    try { await updateUserRole(roleModal.uid, selectedRole); setRoleModal(null); }
    catch (err) { alert("Gagal update role: " + err.message); }
    finally { setSaving(false); }
  };

  const handleSaveDiv = async () => {
    if (!divModal) return;
    setSaving(true);
    try {
      const div = divisions.find((d) => d.id === selectedDiv);
      await updateUserDivision(divModal.uid, selectedDiv || null, div?.name || null);
      setDivModal(null);
    } catch (err) { alert("Gagal update divisi: " + err.message); }
    finally { setSaving(false); }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "users", deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert("Gagal hapus user: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (role !== "super_admin") {
    return (
      <div className="text-center py-20 text-slate-400">
        <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
        <p>Akses ditolak. Hanya Super Admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div variants={dropDown} initial="hidden" animate="visible"
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold text-[#2D3A3A]">Kelola Staff</h1>
          <p className="text-slate-500 text-sm mt-1">{users.length} akun terdaftar</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={() => setCreateOpen(true)}><Plus size={16} />Tambah Staff</Button>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-3 gap-4">
        {["user","admin","super_admin"].map((r) => {
          const count = users.filter((u) => u.role === r).length;
          const { label, variant, icon: Icon } = roleMap[r];
          return (
            <motion.div key={r} variants={statCard}
              className="bg-white rounded-2xl border border-[#DDE2DD] p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
            >
              <div className="w-9 h-9 bg-[#F7F8F6] rounded-xl flex items-center justify-center">
                <Icon size={16} className="text-slate-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#2D3A3A]">{count}</p>
                <Badge variant={variant}>{label}</Badge>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.3 }} className="relative max-w-md"
      >
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Cari nama atau email..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[#DDE2DD] pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6B8F71]/40"
        />
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.35 }}
        className="bg-white rounded-2xl border border-[#DDE2DD] overflow-hidden"
      >
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>Tidak ada akun ditemukan</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F7F8F6] text-xs text-slate-500 uppercase tracking-wide border-b border-[#DDE2DD]">
                  <tr>
                    <th className="px-6 py-3 text-left">Nama</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Divisi</th>
                    <th className="px-6 py-3 text-left">Role</th>
                    <th className="px-6 py-3 text-left">Bergabung</th>
                    <th className="px-6 py-3 text-left">Aksi</th>
                  </tr>
                </thead>
                <motion.tbody variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-[#F7F8F6]">
                  {filtered.map((u) => {
                    const rm = roleMap[u.role || "user"];
                    const isSelf = u.id === currentUser?.uid;
                    return (
                      <motion.tr key={u.id} variants={tableRow} className="hover:bg-[#F7F8F6]/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#EAF0EA] rounded-full flex items-center justify-center shrink-0">
                              <User size={14} className="text-[#6B8F71]" />
                            </div>
                            <p className="text-sm font-medium text-[#2D3A3A]">
                              {u.displayName || "-"}
                              {isSelf && <span className="ml-1 text-xs text-slate-400">(kamu)</span>}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                        <td className="px-6 py-4">
                          {u.divisionName ? (
                            <span className="flex items-center gap-1 text-sm text-[#2D3A3A]">
                              <Building2 size={12} className="text-[#6B8F71]" />
                              {u.divisionName}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4"><Badge variant={rm?.variant}>{rm?.label}</Badge></td>
                        <td className="px-6 py-4 text-xs text-slate-400">{formatDate(u.createdAt)}</td>
                        <td className="px-6 py-4">
                          {!isSelf && (
                            <div className="flex gap-3">
                              <button onClick={() => openRoleModal(u)}
                                className="text-xs text-[#6B8F71] hover:underline font-medium">
                                Ubah Role
                              </button>
                              <button onClick={() => openDivModal(u)}
                                className="text-xs text-[#6B8F71] hover:underline font-medium">
                                Divisi
                              </button>
                              <button onClick={() => setDeleteTarget(u)}
                                className="text-xs text-red-500 hover:underline font-medium">
                                Hapus
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>

            {/* Mobile */}
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="md:hidden divide-y divide-[#F7F8F6]">
              {filtered.map((u) => {
                const rm = roleMap[u.role || "user"];
                const isSelf = u.id === currentUser?.uid;
                return (
                  <motion.div key={u.id} variants={staggerItem} className="px-4 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-[#EAF0EA] rounded-full flex items-center justify-center shrink-0">
                        <User size={16} className="text-[#6B8F71]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#2D3A3A] truncate">{u.displayName || u.email}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                        {u.divisionName && (
                          <p className="text-xs text-[#6B8F71] flex items-center gap-1">
                            <Building2 size={10} />{u.divisionName}
                          </p>
                        )}
                        <Badge variant={rm?.variant} className="mt-1">{rm?.label}</Badge>
                      </div>
                    </div>
                    {!isSelf && (
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button onClick={() => openRoleModal(u)} className="text-xs text-[#6B8F71] hover:underline">Role</button>
                        <button onClick={() => openDivModal(u)}  className="text-xs text-[#6B8F71] hover:underline">Divisi</button>
                        <button onClick={() => setDeleteTarget(u)} className="text-xs text-red-500 hover:underline">Hapus</button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Create Staff Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setCreateForm(emptyCreate); setCreateErrs({}); }} title="Tambah Akun Staff" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          {createErrors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{createErrors.general}</div>
          )}
          <Input label="Nama Lengkap" placeholder="Nama staff" value={createForm.displayName}
            onChange={(e) => setCreate("displayName", e.target.value)} error={createErrors.displayName} />
          <Input label="Email" type="email" placeholder="email@ur8an.com" value={createForm.email}
            onChange={(e) => setCreate("email", e.target.value)} error={createErrors.email} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#2D3A3A]">Password</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} placeholder="Min. 6 karakter"
                value={createForm.password} onChange={(e) => setCreate("password", e.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none pr-10 focus:ring-2 focus:ring-[#6B8F71]/40
                  ${createErrors.password ? "border-red-400 bg-red-50" : "border-[#DDE2DD]"}`}
              />
              <button type="button" onClick={() => setShowPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {createErrors.password && <p className="text-xs text-red-500">{createErrors.password}</p>}
          </div>
          <Select label="Role" value={createForm.role} onChange={(e) => setCreate("role", e.target.value)} options={roleOptions} />
          <Select label="Divisi (opsional)" value={createForm.divisionId}
            onChange={(e) => handleDivisionChange(e.target.value)} options={divisionOptions} />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button type="submit" className="flex-1" loading={creating}>Buat Akun</Button>
          </div>
        </form>
      </Modal>

      {/* Role Modal */}
      <Modal open={!!roleModal} onClose={() => setRoleModal(null)} title="Ubah Role" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Role untuk <span className="font-semibold text-[#2D3A3A]">{roleModal?.name}</span>
          </p>
          <Select label="Role Baru" value={selectedRole} onChange={(e) => setSelRole(e.target.value)} options={roleOptions} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setRoleModal(null)}>Batal</Button>
            <Button className="flex-1" loading={saving} onClick={handleSaveRole}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Division Modal */}
      <Modal open={!!divModal} onClose={() => setDivModal(null)} title="Ubah Divisi" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Divisi untuk <span className="font-semibold text-[#2D3A3A]">{divModal?.name}</span>
          </p>
          <Select label="Divisi" value={selectedDiv} onChange={(e) => setSelDiv(e.target.value)} options={divisionOptions} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDivModal(null)}>Batal</Button>
            <Button className="flex-1" loading={saving} onClick={handleSaveDiv}>Simpan</Button>
          </div>
        </div>
      </Modal>
      {/* Delete User Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Akun" size="sm">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            ⚠️ Akun akan dihapus dari database. Login tetap aktif di Firebase Auth hingga logout manual.
          </div>
          <p className="text-sm text-slate-600">
            Yakin hapus akun{" "}
            <span className="font-semibold text-[#2D3A3A]">{deleteTarget?.displayName || deleteTarget?.email}</span>?
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" className="flex-1" loading={deleting} onClick={handleDeleteUser}>
              <Trash2 size={14} /> Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import { useState } from "react";
import { motion } from "motion/react";
import { User, Camera, Loader, Mail, Shield } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { auth, db } from "../lib/firebase";
import { uploadToCloudinary } from "../lib/cloudinary";
import { dropDown, staggerContainer, staggerItem } from "../lib/animations";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

const roleMap = {
  super_admin: { label: "Super Admin", variant: "blue" },
  admin:       { label: "Admin",       variant: "green" },
  user:        { label: "Staff",       variant: "slate" },
};

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const role = profile?.role || "user";

  const [name, setName]         = useState(profile?.displayName || "");
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess]   = useState(false);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      await updateProfile(auth.currentUser, { photoURL: url });
      await updateDoc(doc(db, "users", user.uid), { photoURL: url, updatedAt: serverTimestamp() });
    } catch (err) {
      alert("Gagal upload foto: " + err.message);
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      await updateDoc(doc(db, "users", user.uid), { displayName: name.trim(), updatedAt: serverTimestamp() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Gagal menyimpan: " + err.message);
    } finally { setSaving(false); }
  };

  const photoURL = auth.currentUser?.photoURL || profile?.photoURL;

  return (
    <div className="max-w-lg mx-auto space-y-6">

      <motion.div variants={dropDown} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-[#2D3A3A]">Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola informasi akun kamu</p>
      </motion.div>

      <motion.div
        variants={staggerContainer} initial="hidden" animate="visible"
        className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6"
      >
        {/* Avatar */}
        <motion.div variants={staggerItem} className="flex flex-col items-center gap-3">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
              {photoURL ? (
                <img src={photoURL} className="w-full h-full object-cover" alt="" />
              ) : (
                <User size={32} className="text-slate-400" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <Loader size={18} className="text-white animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-[#2D3A3A] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#1E2828] transition-colors shadow">
              <Camera size={13} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </motion.div>
          <div className="text-center">
            <p className="font-semibold text-[#2D3A3A]">{profile?.displayName || user?.email?.split("@")[0]}</p>
            <Badge variant={roleMap[role]?.variant} className="mt-1">{roleMap[role]?.label}</Badge>
          </div>
        </motion.div>

        <hr className="border-slate-100" />

        <motion.div variants={staggerItem} className="space-y-3">
          {[
            { icon: Mail,   text: user?.email },
            { icon: Shield, text: roleMap[role]?.label },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-slate-600">
              <Icon size={15} className="text-slate-400 shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </motion.div>

        <hr className="border-slate-100" />

        <motion.div variants={staggerItem} className="space-y-4">
          <Input label="Nama Tampilan" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" />

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="bg-[#EAF0EA] border border-[#B8CFBA] text-[#506A56] rounded-xl px-4 py-3 text-sm"
            >
              Profile berhasil diperbarui
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button onClick={handleSave} loading={saving} className="w-full">
              Simpan Perubahan
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

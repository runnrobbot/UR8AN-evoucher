import { useState, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Ticket, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

const initial = { email: "", password: "" };
function formReducer(state, action) {
  return { ...state, [action.field]: action.value };
}

export default function LoginPage() {
  const [form, dispatch] = useReducer(formReducer, initial);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email wajib diisi";
    if (!form.password) e.password = "Password wajib diisi";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch {
      setErrors({ general: "Email atau password salah" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D3A3A] via-[#1E2828] to-[#2D3A3A] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6B8F71]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#6B8F71]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="w-16 h-16 bg-[#2D3A3A] border border-[#506A56] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
            initial={{ scale: 0.5, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.1 }}
          >
            <Ticket size={30} className="text-[#6B8F71]" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">
            UR8AN <span className="text-[#6B8F71]">E-Voucher</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Internal Voucher Management</p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-8"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <h2 className="text-lg font-semibold text-white mb-6">Masuk ke akun Anda</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm"
              >
                {errors.general}
              </motion.div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                placeholder="nama@email.com"
                value={form.email}
                onChange={(e) => dispatch({ field: "email", value: e.target.value })}
                autoComplete="email"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none bg-white/5 transition-all
                  focus:ring-2 focus:ring-[#6B8F71]-500/50 focus:border-emerald-500/50
                  ${errors.email ? "border-red-500/50" : "border-white/10 hover:border-white/20"}`}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => dispatch({ field: "password", value: e.target.value })}
                  autoComplete="current-password"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none bg-white/5 pr-10 transition-all
                    focus:ring-2 focus:ring-[#6B8F71]-500/50 focus:border-emerald-500/50
                    ${errors.password ? "border-red-500/50" : "border-white/10 hover:border-white/20"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>

            <motion.div whileTap={{ scale: 0.98 }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#6B8F71] hover:bg-[#EAF0EA]0 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Masuk
              </button>
            </motion.div>
          </form>
        </motion.div>

        <motion.p
          className="text-center text-xs text-slate-600 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          UR8AN Living · Internal System
        </motion.p>
      </div>
    </div>
  );
}

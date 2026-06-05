import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Ticket } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
      >
        <Ticket size={30} className="text-slate-500" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-6xl font-bold text-slate-200"
      >
        404
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        className="text-slate-600 font-medium mt-2"
      >
        Halaman tidak ditemukan
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-slate-400 text-sm mt-1"
      >
        Halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="mt-6"
      >
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-[#2D3A3A] hover:bg-[#1E2828] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          Kembali ke Dashboard
        </Link>
      </motion.div>
    </div>
  );
}

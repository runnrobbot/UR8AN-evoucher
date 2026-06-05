import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Navbar from "./Navbar";

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0, y: -12, scale: 0.98,
    transition: { duration: 0.2 },
  },
};

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F7F8F6]">
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Ticket, LayoutDashboard, Users, ClipboardList,
  LogOut, Menu, X, ChevronDown, User,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Badge from "../ui/Badge";

const roleLabel = {
  super_admin: { label: "Super Admin", variant: "blue" },
  admin:       { label: "Admin",       variant: "green" },
  user:        { label: "Staff",       variant: "slate" },
};

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const role = profile?.role || "user";

  const navLinks = [
    { to: "/dashboard",       label: "Dashboard",   icon: LayoutDashboard, roles: ["user","admin","super_admin"] },
    { to: "/vouchers",        label: "Voucher",      icon: Ticket,          roles: ["user","admin","super_admin"] },
    { to: "/redemptions",     label: "Riwayat",      icon: ClipboardList,   roles: ["user","admin","super_admin"] },
    { to: "/manage-vouchers", label: "Generate",     icon: Ticket,          roles: ["admin","super_admin"] },
    { to: "/manage-users",    label: "Kelola Staff", icon: Users,           roles: ["super_admin"] },
  ].filter((l) => l.roles.includes(role));

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (to) => location.pathname === to;

  return (
    <nav className="bg-white border-b border-[#DDE2DD] sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.4 }}
              className="w-8 h-8 bg-[#2D3A3A] rounded-lg flex items-center justify-center"
            >
              <Ticket size={18} className="text-white" />
            </motion.div>
            <span className="font-bold text-[#2D3A3A] text-sm sm:text-base">
              UR8AN <span className="text-[#6B8F71]">E-Voucher</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive(link.to)
                    ? "text-[#2D3A3A]"
                    : "text-slate-500 hover:text-[#2D3A3A] hover:bg-[#F7F8F6]"
                  }`}
              >
                <link.icon size={15} />
                {link.label}
                {isActive(link.to) && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-[#EAF0EA] rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <button
                onClick={() => setDropOpen((p) => !p)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F7F8F6] transition-colors"
              >
                <div className="w-7 h-7 bg-[#EAF0EA] rounded-full flex items-center justify-center overflow-hidden">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} className="w-7 h-7 object-cover" alt="" />
                  ) : (
                    <User size={14} className="text-[#6B8F71]" />
                  )}
                </div>
                <p className="text-xs font-semibold text-[#2D3A3A] leading-none">
                  {profile?.displayName || user?.email?.split("@")[0] || "User"}
                </p>
                <motion.span animate={{ rotate: dropOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={14} className="text-slate-400" />
                </motion.span>
              </button>

              <AnimatePresence>
                {dropOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 mt-1 w-52 bg-white border border-[#DDE2DD] rounded-xl shadow-lg py-1 z-50"
                    >
                      <div className="px-4 py-2 border-b border-[#F7F8F6]">
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <Badge variant={roleLabel[role]?.variant} className="mt-1">
                          {roleLabel[role]?.label}
                        </Badge>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[#2D3A3A] hover:bg-[#F7F8F6]"
                        onClick={() => setDropOpen(false)}
                      >
                        <User size={14} /> Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                      >
                        <LogOut size={14} /> Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-[#2D3A3A] hover:bg-[#EAF0EA]"
              onClick={() => setMobileOpen((p) => !p)}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-[#DDE2DD] bg-white"
          >
            <div className="px-4 py-3 space-y-1 pb-4">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                >
                  <Link
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                      ${isActive(link.to)
                        ? "bg-[#EAF0EA] text-[#2D3A3A]"
                        : "text-slate-500 hover:bg-[#F7F8F6] hover:text-[#2D3A3A]"
                      }`}
                  >
                    <link.icon size={16} />
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <hr className="border-[#DDE2DD] my-2" />
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-[#2D3A3A] hover:bg-[#F7F8F6]"
              >
                <User size={16} /> Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

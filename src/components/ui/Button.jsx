import Spinner from "./Spinner";

// Palette: slate-teal primary, sage-green accent, white surface
const variants = {
  primary:
    "bg-[#2D3A3A] hover:bg-[#1E2828] active:bg-[#161E1E] text-white shadow-sm",
  secondary:
    "bg-white hover:bg-[#F7F8F6] active:bg-[#EAF0EA] text-[#2D3A3A] border border-[#DDE2DD] shadow-sm",
  accent:
    "bg-[#6B8F71] hover:bg-[#506A56] active:bg-[#3D5342] text-white shadow-sm",
  danger:
    "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm",
  ghost:
    "bg-transparent hover:bg-[#EAF0EA] active:bg-[#DDE2DD] text-[#2D3A3A]",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

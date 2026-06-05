// Consistent palette: sage-green + slate tones only
const variants = {
  green:  "bg-[#EAF0EA] text-[#3D5342] border border-[#B8CFBA]",   // sage tint
  red:    "bg-red-50   text-red-700   border border-red-200",
  slate:  "bg-slate-100 text-slate-600 border border-slate-200",
  yellow: "bg-amber-50  text-amber-700  border border-amber-200",
  blue:   "bg-slate-200 text-slate-700  border border-slate-300",
};

export default function Badge({ children, variant = "slate", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

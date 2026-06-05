export default function Input({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-[#2D3A3A]">{label}</label>
      )}
      <input
        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#2D3A3A] placeholder-slate-400 outline-none transition-all
          focus:ring-2 focus:ring-[#6B8F71]/40 focus:border-[#6B8F71]
          ${error ? "border-red-400 bg-red-50" : "border-[#DDE2DD] bg-white hover:border-[#B8CFBA]"}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

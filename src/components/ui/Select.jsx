export default function Select({ label, error, options = [], className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-[#2D3A3A]">{label}</label>
      )}
      <select
        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#2D3A3A] outline-none transition-all bg-white
          focus:ring-2 focus:ring-[#6B8F71]/40 focus:border-[#6B8F71]
          ${error ? "border-red-400 bg-red-50" : "border-[#DDE2DD] hover:border-[#B8CFBA]"}
          ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

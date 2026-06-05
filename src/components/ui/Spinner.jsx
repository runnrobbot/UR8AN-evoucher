export default function Spinner({ size = "md", className = "" }) {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div
      className={`animate-spin rounded-full border-2 border-[#DDE2DD] border-t-[#6B8F71] ${sizes[size]} ${className}`}
    />
  );
}

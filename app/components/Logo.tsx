/** DealVault mark — the favicon vault glyph, rendered inline so it scales crisply. */
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="4" width="24" height="24" rx="3" stroke="#4F9BBE" strokeWidth="2" fill="none" />
      <circle cx="10" cy="10" r="1.5" fill="#4F9BBE" />
      <circle cx="22" cy="10" r="1.5" fill="#4F9BBE" />
      <circle cx="10" cy="22" r="1.5" fill="#4F9BBE" />
      <circle cx="22" cy="22" r="1.5" fill="#4F9BBE" />
      <line x1="10.7" y1="10.7" x2="13.5" y2="13.5" stroke="#4F9BBE" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18.5" y1="13.5" x2="21.3" y2="10.7" stroke="#4F9BBE" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10.7" y1="21.3" x2="13.5" y2="18.5" stroke="#4F9BBE" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18.5" y1="18.5" x2="21.3" y2="21.3" stroke="#4F9BBE" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3" stroke="#4F9BBE" strokeWidth="2" fill="none" />
    </svg>
  );
}

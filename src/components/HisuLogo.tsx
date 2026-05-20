/** Hisu Solutions marka logosu — SVG rozet + isim */
export function HisuLogo({ size = 36, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 680 680"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <rect x="90" y="90" width="500" height="500" rx="110" fill="#0A1628" />
        <rect x="185" y="195" width="110" height="290" rx="20" fill="#FFFFFF" />
        <rect x="385" y="195" width="110" height="290" rx="20" fill="#FFFFFF" />
        <rect x="185" y="303" width="310" height="74" rx="14" fill="#00C2FF" />
        <circle cx="556" cy="124" r="38" fill="#00C2FF" />
      </svg>
      {showText && (
        <span className="font-display text-lg font-bold tracking-tight">Hisu Solutions</span>
      )}
    </span>
  );
}

type Props = {
  variant?: "color" | "white" | "ink";
  showWordmark?: boolean;
  className?: string;
  size?: number;
};

/** Símbolo da Autodoc (anel/pie aberto + bloco) usando currentColor. */
export function AutodocMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle
        cx="24"
        cy="24"
        r="16"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray="74 200"
        transform="rotate(-46 24 24)"
      />
      <rect x="30.5" y="5.5" width="9" height="9" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export function AutodocLogo({ variant = "color", showWordmark = true, className, size = 28 }: Props) {
  const markColor =
    variant === "white" ? "text-white" : variant === "ink" ? "text-ink" : "text-brand";
  const wordColor = variant === "white" ? "text-white" : "text-ink";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <AutodocMark size={size} className={markColor} />
      {showWordmark && (
        <span className={`font-display font-extrabold leading-none tracking-tight ${wordColor}`} style={{ fontSize: size * 0.78 }}>
          AUTODOC
          <sup className="ml-0.5 align-super text-[0.5em] font-semibold">®</sup>
        </span>
      )}
    </span>
  );
}

/** Assinatura "uma empresa Ambar" (discreta, conforme manual). */
export function AmbarSignature({ variant = "ink" }: { variant?: "ink" | "white" }) {
  const c = variant === "white" ? "text-white/80" : "text-ink-mute";
  return (
    <span className={`inline-flex items-baseline gap-1.5 text-xs ${c}`}>
      <span>uma empresa</span>
      <span className="font-display font-bold lowercase tracking-tight">ambar</span>
    </span>
  );
}

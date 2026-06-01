import Image from "next/image";

type Props = {
  variant?: "color" | "white" | "ink";
  showWordmark?: boolean;
  className?: string;
  size?: number;
};

/** Símbolo oficial da Autodoc (imagem PNG com transparência). */
export function AutodocMark({
  size = 28,
  variant = "color",
  className,
}: {
  size?: number;
  variant?: "color" | "white";
  className?: string;
}) {
  const src = variant === "white" ? "/autodoc-symbol-white.png" : "/autodoc-symbol.png";
  return (
    <Image
      src={src}
      alt="Autodoc"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
      priority
    />
  );
}

/** Logo Autodoc: símbolo oficial + wordmark tipográfico. */
export function AutodocLogo({ variant = "color", showWordmark = true, className, size = 28 }: Props) {
  const markVariant = variant === "white" ? "white" : "color";
  const wordColor = variant === "white" ? "text-white" : "text-ink";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <AutodocMark size={size} variant={markVariant} />
      {showWordmark && (
        <span
          className={`font-display font-extrabold leading-none tracking-tight ${wordColor}`}
          style={{ fontSize: size * 0.78 }}
        >
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
